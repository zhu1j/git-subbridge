import { Notice, Platform } from "obsidian";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import type { SimpleGit } from "../gitManager/simpleGit";
import type ObsidianGit from "../main";

const GIT_MARKER = ".git";
const METADATA_MARKER = ".git_metadata";
const JOURNAL_FILE = "subbridge-state.json";
const RENAME_RETRIES = 5;
const RENAME_RETRY_DELAY_MS = 120;
const INDEX_BATCH_SIZE = 100;

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

export class SubGitBridge {
    private transactionDepth = 0;
    private movedEntries: SubGitEntry[] = [];
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
        if (!Platform.isDesktopApp || !this.plugin.gitReady) return;

        const journal = await this.readJournal();
        if (journal) {
            for (const item of journal.entries) {
                const root = path.join(this.repoRoot, item.relativeRoot);
                const gitPath = path.join(root, GIT_MARKER);
                const metadataPath = path.join(root, METADATA_MARKER);
                const hasGit = await this.exists(gitPath);
                const hasMetadata = await this.exists(metadataPath);

                if (hasMetadata && !hasGit) {
                    await this.renameWithRetry(metadataPath, gitPath);
                } else if (hasMetadata && hasGit) {
                    throw new Error(
                        `Cannot recover sub-git bridge because both .git and .git_metadata exist at ${root}`
                    );
                }
            }
            await this.deleteJournal();
        }

        const entries = await this.scan();
        const metadataOnly = entries.filter(
            (entry) => entry.state === "metadata"
        );
        for (const entry of metadataOnly) {
            await this.renameWithRetry(entry.metadataPath, entry.gitPath);
            await this.setSkipWorktree(entry);
        }

        if (metadataOnly.length > 0) {
            this.plugin.app.workspace.trigger("obsidian-git:refresh");
        }
    }

    async run<T>(operation: () => Promise<T>): Promise<T> {
        if (!Platform.isDesktopApp) return operation();

        if (this.transactionDepth > 0) {
            return operation();
        }

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
        await this.restoreMetadataOnlyEntries();

        const entries = await this.scan();
        const conflicts = entries.filter((entry) => entry.state === "both");
        if (conflicts.length > 0) {
            throw new Error(
                `Both .git and .git_metadata exist in: ${conflicts
                    .map((entry) => entry.relativeRoot)
                    .join(", ")}`
            );
        }

        this.movedEntries = [];
        try {
            for (const entry of entries) {
                if (entry.state !== "git") continue;

                await this.assertNoGitLocks(entry);
                await this.renameWithRetry(entry.gitPath, entry.metadataPath);
                this.movedEntries.push(entry);
                await this.clearSkipWorktree(entry);
            }

            if (this.movedEntries.length > 0) {
                await this.writeJournal({
                    startedAt: new Date().toISOString(),
                    entries: this.movedEntries.map((entry) => ({
                        relativeRoot: entry.relativeRoot,
                    })),
                });
                new Notice(
                    `Sub-git bridge prepared ${this.movedEntries.length} child Git ${
                        this.movedEntries.length === 1
                            ? "repository"
                            : "repositories"
                    }.`,
                    4000
                );
            }
        } catch (error) {
            await this.restore();
            throw error;
        }
    }

    private async restore(): Promise<void> {
        if (this.movedEntries.length === 0) {
            await this.deleteJournal();
            return;
        }

        for (const entry of this.movedEntries) {
            const hasGit = await this.exists(entry.gitPath);
            const hasMetadata = await this.exists(entry.metadataPath);

            if (hasMetadata && !hasGit) {
                await this.renameWithRetry(entry.metadataPath, entry.gitPath);
            } else if (hasMetadata && hasGit) {
                throw new Error(
                    `Cannot restore sub-git bridge because both .git and .git_metadata exist at ${entry.root}`
                );
            }
        }

        for (const entry of this.movedEntries) {
            await this.setSkipWorktree(entry);
        }

        await this.deleteJournal();
        new Notice(
            `Sub-git bridge restored ${this.movedEntries.length} child Git ${
                this.movedEntries.length === 1 ? "repository" : "repositories"
            }.`,
            3000
        );
        this.movedEntries = [];
        this.plugin.app.workspace.trigger("obsidian-git:refresh");
    }

    private async restoreMetadataOnlyEntries(): Promise<void> {
        const entries = await this.scan();
        for (const entry of entries) {
            if (entry.state !== "metadata") continue;
            await this.renameWithRetry(entry.metadataPath, entry.gitPath);
            await this.setSkipWorktree(entry);
        }
    }

    private async scanInternal(): Promise<SubGitEntry[]> {
        if (!this.plugin.gitReady && !this.plugin.gitManager) return [];

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
            const hasGit = await this.exists(gitPath);
            const hasMetadata = await this.exists(metadataPath);
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
                await new Promise((resolve) =>
                    window.setTimeout(resolve, RENAME_RETRY_DELAY_MS)
                );
            }
        }

        throw new Error(
            `Failed to rename ${source} to ${destination}: ${String(lastError)}`
        );
    }

    private async listTrackedMetadataPaths(
        entry: SubGitEntry
    ): Promise<string[]> {
        const manager = this.plugin.gitManager as SimpleGit;
        const pattern = `${entry.relativeRoot}/${METADATA_MARKER}`;
        const output = await manager.git.raw(["ls-files", "-z", "--", pattern]);
        return output.split("\0").filter((item) => item.length > 0);
    }

    private async clearSkipWorktree(entry: SubGitEntry): Promise<void> {
        await this.updateIndexFlags("--no-skip-worktree", entry);
    }

    private async setSkipWorktree(entry: SubGitEntry): Promise<void> {
        await this.updateIndexFlags("--skip-worktree", entry);
    }

    private async updateIndexFlags(
        flag: "--skip-worktree" | "--no-skip-worktree",
        entry: SubGitEntry
    ): Promise<void> {
        const paths = await this.listTrackedMetadataPaths(entry);
        const manager = this.plugin.gitManager as SimpleGit;

        for (let index = 0; index < paths.length; index += INDEX_BATCH_SIZE) {
            const batch = paths.slice(index, index + INDEX_BATCH_SIZE);
            await manager.git.raw(["update-index", flag, "--", ...batch]);
        }
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
        if (!journalPath) return;
        await fs.mkdir(path.dirname(journalPath), { recursive: true });
        await fs.writeFile(
            journalPath,
            JSON.stringify(journal, null, 2),
            "utf8"
        );
    }

    private async deleteJournal(): Promise<void> {
        const journalPath = this.journalPath;
        if (!journalPath) return;
        try {
            await fs.unlink(journalPath);
        } catch {
            // Nothing to clean up.
        }
    }
}
