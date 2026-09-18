import { Notice, Platform } from "obsidian";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import type { SimpleGit } from "../gitManager/simpleGit";
import type ObsidianGit from "../main";

const GIT_MARKER = ".git";
const METADATA_MARKER = ".git_metadata";
const DISABLED_HEAD = "HEAD__subbridge";
const TEMP_METADATA_SUFFIX = ".tmp";
const JOURNAL_FILE = "subbridge-state.json";
const RENAME_RETRIES = 20;
const RENAME_RETRY_BASE_DELAY_MS = 150;
const METADATA_IGNORE_LINE = ".git_metadata/";

export type SubGitMarkerState = "git" | "metadata" | "both";

export interface SubGitEntry {
    root: string;
    gitPath: string;
    metadataPath: string;
    relativeRoot: string;
    state: SubGitMarkerState;
}

interface SubGitJournal {
    startedAt: string;
    entries: Array<{ relativeRoot: string }>;
}

/**
 * Windows cannot reliably rename a `.git` directory while ChatGPT or another
 * process has open handles inside it. Instead, this bridge temporarily
 * invalidates the repository by renaming only `.git/HEAD`, then copies the
 * complete `.git` directory to a normal `.git_metadata` sidecar directory.
 * The parent repository can therefore track both project files and metadata
 * without ever renaming the live `.git` directory itself.
 */
export class SubGitBridge {
    private transactionDepth = 0;
    private disabledEntries: SubGitEntry[] = [];
    private scanInFlight: Promise<SubGitEntry[]> | undefined;

    constructor(public readonly plugin: ObsidianGit) {}

    get active(): boolean {
        return this.transactionDepth > 0;
    }

    async scan(): Promise<SubGitEntry[]> {
        if (!Platform.isDesktopApp) return [];
        if (this.scanInFlight) return this.scanInFlight;

        this.scanInFlight = this.scanInternal().finally(() => {
            this.scanInFlight = undefined;
        });
        return this.scanInFlight;
    }

    async recover(): Promise<void> {
        if (!Platform.isDesktopApp) return;

        const journal = await this.readJournal();
        if (journal) {
            for (const item of journal.entries) {
                const root = path.join(this.repoRoot, item.relativeRoot);
                await this.restoreDisabledRepository(root);
            }
            await this.deleteJournal();
        }

        const entries = await this.scan();
        let recovered = 0;
        for (const entry of entries) {
            if (entry.state === "metadata") {
                await this.materializeMetadata(entry);
                recovered++;
            } else if (entry.state === "both") {
                await this.restoreDisabledRepository(entry.root);
            }
        }

        if (recovered > 0) {
            this.plugin.app.workspace.trigger("obsidian-git:refresh");
        }
    }

    async run<T>(operation: () => Promise<T>): Promise<T> {
        if (!Platform.isDesktopApp) return operation();
        if (this.transactionDepth > 0) return operation();

        this.transactionDepth = 1;
        try {
            await this.prepare();
            return await operation();
        } finally {
            try {
                await this.restore();
            } finally {
                this.transactionDepth = 0;
            }
        }
    }

    private async prepare(): Promise<void> {
        await this.recoverMetadataOnlyEntries();

        const entries = await this.scan();
        this.disabledEntries = [];

        try {
            for (const entry of entries) {
                if (entry.state === "metadata") continue;

                await this.assertNoGitLocks(entry);
                await this.ensureMetadataIgnored(entry);
                await this.disableRepository(entry);
                this.disabledEntries.push(entry);
                await this.rebuildMetadataSidecar(entry);
            }

            if (this.disabledEntries.length > 0) {
                await this.writeJournal({
                    startedAt: new Date().toISOString(),
                    entries: this.disabledEntries.map((entry) => ({
                        relativeRoot: entry.relativeRoot,
                    })),
                });
                new Notice(
                    `Sub-git bridge prepared ${this.disabledEntries.length} child Git ${
                        this.disabledEntries.length === 1
                            ? "repository"
                            : "repositories"
                    }.`,
                    4000
                );
            }
        } catch (error) {
            await this.restore();
            throw new Error(
                `Sub-git bridge could not prepare child repositories. Close ChatGPT/Codex or any Git process using the child .git folder, then retry. ${String(
                    error
                )}`
            );
        }
    }

    private async restore(): Promise<void> {
        for (const entry of this.disabledEntries) {
            await this.restoreDisabledRepository(entry.root);
        }

        if (this.disabledEntries.length > 0) {
            await this.deleteJournal();
            new Notice(
                `Sub-git bridge restored ${this.disabledEntries.length} child Git ${
                    this.disabledEntries.length === 1
                        ? "repository"
                        : "repositories"
                }.`,
                3000
            );
            this.disabledEntries = [];
            this.plugin.app.workspace.trigger("obsidian-git:refresh");
        } else {
            await this.deleteJournal();
        }
    }

    private async recoverMetadataOnlyEntries(): Promise<void> {
        const entries = await this.scan();
        for (const entry of entries) {
            if (entry.state === "metadata") {
                await this.materializeMetadata(entry);
            }
        }
    }

    private async disableRepository(entry: SubGitEntry): Promise<void> {
        const headPath = path.join(entry.gitPath, "HEAD");
        const disabledHeadPath = path.join(entry.gitPath, DISABLED_HEAD);
        const hasHead = await this.exists(headPath);
        const hasDisabledHead = await this.exists(disabledHeadPath);

        if (hasDisabledHead && !hasHead) return;
        if (hasDisabledHead && hasHead) {
            throw new Error(
                `Both HEAD and ${DISABLED_HEAD} exist in ${entry.relativeRoot}`
            );
        }
        if (!hasHead) {
            throw new Error(`HEAD is missing in ${entry.relativeRoot}`);
        }

        await this.renameWithRetry(headPath, disabledHeadPath);
    }

    private async restoreDisabledRepository(root: string): Promise<void> {
        const gitPath = path.join(root, GIT_MARKER);
        const headPath = path.join(gitPath, "HEAD");
        const disabledHeadPath = path.join(gitPath, DISABLED_HEAD);
        const hasHead = await this.exists(headPath);
        const hasDisabledHead = await this.exists(disabledHeadPath);

        if (hasDisabledHead && !hasHead) {
            await this.renameWithRetry(disabledHeadPath, headPath);
        } else if (hasDisabledHead && hasHead) {
            throw new Error(`Both HEAD and ${DISABLED_HEAD} exist in ${root}`);
        }
    }

    private async rebuildMetadataSidecar(entry: SubGitEntry): Promise<void> {
        const tempPath = `${entry.metadataPath}${TEMP_METADATA_SUFFIX}`;
        await fs.rm(tempPath, { recursive: true, force: true });

        await fs.cp(entry.gitPath, tempPath, {
            recursive: true,
            force: true,
            errorOnExist: false,
            filter: (source) => {
                const name = path.basename(source);
                return name !== "index.lock" && name !== "HEAD.lock";
            },
        });

        const copiedDisabledHead = path.join(tempPath, DISABLED_HEAD);
        const copiedHead = path.join(tempPath, "HEAD");
        if (await this.exists(copiedDisabledHead)) {
            await this.renameWithRetry(copiedDisabledHead, copiedHead);
        }

        await fs.rm(entry.metadataPath, { recursive: true, force: true });
        await this.renameWithRetry(tempPath, entry.metadataPath);
    }

    private async materializeMetadata(entry: SubGitEntry): Promise<void> {
        if (await this.isDirectory(entry.gitPath)) return;

        const tempPath = `${entry.gitPath}${TEMP_METADATA_SUFFIX}`;
        await fs.rm(tempPath, { recursive: true, force: true });
        await fs.cp(entry.metadataPath, tempPath, {
            recursive: true,
            force: true,
            errorOnExist: false,
        });
        await this.renameWithRetry(tempPath, entry.gitPath);
        await this.ensureMetadataIgnored(entry);
    }

    private async ensureMetadataIgnored(entry: SubGitEntry): Promise<void> {
        const infoPath = path.join(entry.gitPath, "info");
        const excludePath = path.join(infoPath, "exclude");
        await fs.mkdir(infoPath, { recursive: true });

        let content = "";
        try {
            content = await fs.readFile(excludePath, "utf8");
        } catch {
            // Create a new exclude file below.
        }

        const lines = content.split(/\r?\n/);
        if (!lines.includes(METADATA_IGNORE_LINE)) {
            const separator =
                content.length > 0 && !content.endsWith("\n") ? "\n" : "";
            await fs.writeFile(
                excludePath,
                `${content}${separator}${METADATA_IGNORE_LINE}\n`,
                "utf8"
            );
        }
    }

    private async scanInternal(): Promise<SubGitEntry[]> {
        if (!this.plugin.gitManager) return [];

        const root = this.repoRoot;
        const visited = new Set<string>();
        const entries: SubGitEntry[] = [];

        const walk = async (directory: string): Promise<void> => {
            let realDirectory: string;
            try {
                realDirectory = await fs.realpath(directory);
            } catch {
                return;
            }
            if (visited.has(realDirectory)) return;
            visited.add(realDirectory);

            let dirents;
            try {
                dirents = await fs.readdir(directory, { withFileTypes: true });
            } catch {
                return;
            }

            const gitPath = path.join(directory, GIT_MARKER);
            const metadataPath = path.join(directory, METADATA_MARKER);
            const hasGit = await this.isDirectory(gitPath);
            const hasMetadata = await this.isDirectory(metadataPath);
            if (hasGit || hasMetadata) {
                entries.push({
                    root: directory,
                    gitPath,
                    metadataPath,
                    relativeRoot: this.toGitPath(
                        path.relative(root, directory)
                    ),
                    state:
                        hasGit && hasMetadata
                            ? "both"
                            : hasGit
                              ? "git"
                              : "metadata",
                });
            }

            for (const dirent of dirents) {
                if (
                    dirent.name === GIT_MARKER ||
                    dirent.name === METADATA_MARKER ||
                    dirent.name === "node_modules"
                ) {
                    continue;
                }

                const childPath = path.join(directory, dirent.name);
                if (dirent.isDirectory() || dirent.isSymbolicLink()) {
                    try {
                        const stat = await fs.stat(childPath);
                        if (stat.isDirectory()) {
                            await walk(childPath);
                        }
                    } catch {
                        // Ignore inaccessible or dangling links.
                    }
                }
            }
        };

        const rootEntries = await fs.readdir(root, { withFileTypes: true });
        for (const dirent of rootEntries) {
            if (
                dirent.name === GIT_MARKER ||
                dirent.name === METADATA_MARKER ||
                dirent.name === "node_modules"
            ) {
                continue;
            }
            const childPath = path.join(root, dirent.name);
            if (dirent.isDirectory() || dirent.isSymbolicLink()) {
                try {
                    const stat = await fs.stat(childPath);
                    if (stat.isDirectory()) {
                        await walk(childPath);
                    }
                } catch {
                    // Ignore inaccessible or dangling links.
                }
            }
        }

        return entries.sort((a, b) =>
            a.relativeRoot.localeCompare(b.relativeRoot)
        );
    }

    private get repoRoot(): string {
        return (this.plugin.gitManager as SimpleGit).absoluteRepoPath;
    }

    private toGitPath(value: string): string {
        return value.split(path.sep).join("/");
    }

    private async exists(value: string): Promise<boolean> {
        try {
            await fs.access(value);
            return true;
        } catch {
            return false;
        }
    }

    private async isDirectory(value: string): Promise<boolean> {
        try {
            return (await fs.stat(value)).isDirectory();
        } catch {
            return false;
        }
    }

    private async assertNoGitLocks(entry: SubGitEntry): Promise<void> {
        const lockPaths = [
            path.join(entry.gitPath, "index.lock"),
            path.join(entry.gitPath, "HEAD.lock"),
        ];
        for (const lockPath of lockPaths) {
            if (await this.exists(lockPath)) {
                throw new Error(
                    `Cannot bridge ${entry.relativeRoot}: Git lock exists at ${lockPath}`
                );
            }
        }
    }

    private async renameWithRetry(
        source: string,
        destination: string
    ): Promise<void> {
        let lastError: unknown;
        for (let attempt = 0; attempt < RENAME_RETRIES; attempt++) {
            try {
                await fs.rename(source, destination);
                return;
            } catch (error) {
                lastError = error;
                const delay = Math.min(
                    RENAME_RETRY_BASE_DELAY_MS * 2 ** attempt,
                    2000
                );
                await new Promise((resolve) =>
                    window.setTimeout(resolve, delay)
                );
            }
        }

        throw new Error(
            `Failed to rename ${source} to ${destination}: ${String(lastError)}`
        );
    }

    private hashRepoRoot(value: string): string {
        let first = 0x811c9dc5;
        let second = 0x9e3779b9;
        for (let index = 0; index < value.length; index++) {
            const code = value.charCodeAt(index);
            first = Math.imul(first ^ code, 16777619);
            second = Math.imul(second ^ code, 2246822519);
        }
        return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0)
            .toString(16)
            .padStart(8, "0")}`;
    }

    private get journalPath(): string {
        const repoHash = this.hashRepoRoot(this.repoRoot);
        return path.join(
            os.tmpdir(),
            "git-subbridge",
            `${repoHash}-${JOURNAL_FILE}`
        );
    }

    private async readJournal(): Promise<SubGitJournal | undefined> {
        const journalPath = this.journalPath;
        if (!(await this.exists(journalPath))) return undefined;
        try {
            return JSON.parse(
                await fs.readFile(journalPath, "utf8")
            ) as SubGitJournal;
        } catch {
            return undefined;
        }
    }

    private async writeJournal(journal: SubGitJournal): Promise<void> {
        const journalPath = this.journalPath;
        await fs.mkdir(path.dirname(journalPath), { recursive: true });
        await fs.writeFile(
            journalPath,
            JSON.stringify(journal, null, 2),
            "utf8"
        );
    }

    private async deleteJournal(): Promise<void> {
        const journalPath = this.journalPath;
        try {
            await fs.unlink(journalPath);
        } catch {
            // Nothing to clean up.
        }
    }
}
