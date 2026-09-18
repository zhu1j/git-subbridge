import { mkdirSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import simpleGit from "simple-git";
import { FileSystemAdapter } from "obsidian";
import { describe, expect, test, vi } from "vitest";
import type ObsidianGit from "../../src/main";
import { SubGitBridge } from "../../src/subbridge/subbridge";

function createPlugin(
    repoPath: string,
    git: ReturnType<typeof simpleGit>,
    settings: Record<string, unknown> = {}
) {
    return {
        gitReady: true,
        gitManager: {
            absoluteRepoPath: repoPath,
            git,
        },
        manifest: { id: "git-subbridge" },
        settings,
        app: {
            vault: {
                configDir: ".obsidian",
                adapter: Object.assign(new FileSystemAdapter(), {
                    getBasePath: () => repoPath,
                }),
            },
            workspace: {
                trigger: vi.fn(),
            },
        },
        displayError: vi.fn(),
    } as unknown as ObsidianGit;
}

describe("SubGitBridge", () => {
    test("bridges a child repository for commit and restores it", async () => {
        const dir = mkdtempSync(path.join(tmpdir(), "subbridge-test-"));
        const parent = path.join(dir, "vault");
        const child = path.join(parent, "project");
        mkdirSync(child, { recursive: true });

        try {
            const parentGit = simpleGit({ baseDir: parent });
            await parentGit.raw(["init", "--initial-branch=main"]);
            await parentGit.addConfig("user.email", "test@example.com");
            await parentGit.addConfig("user.name", "Test User");

            const childGit = simpleGit({ baseDir: child });
            await childGit.raw(["init", "--initial-branch=main"]);
            await childGit.addConfig("user.email", "test@example.com");
            await childGit.addConfig("user.name", "Test User");
            await childGit.raw(["commit", "--allow-empty", "-m", "child init"]);

            const bridge = new SubGitBridge(createPlugin(parent, parentGit));
            const entries = await bridge.scan();
            expect(entries).toHaveLength(1);
            expect(entries[0]?.state).toBe("git");

            await bridge.run(async () => {
                await parentGit.add("-A");
                await parentGit.commit("bridge commit");
            });

            expect(
                await parentGit.raw(["ls-tree", "-r", "--name-only", "HEAD"])
            ).toContain("project/.git_metadata/config");
            expect((await parentGit.status()).isClean()).toBe(true);
            expect((await childGit.status()).isClean()).toBe(true);
            expect((await bridge.scan())[0]?.state).toBe("both");

            const exclusiveBridge = new SubGitBridge(
                createPlugin(parent, parentGit, {
                    subGitBridgeEnabled: true,
                    subGitBridgeMetadataMode: "exclusive",
                })
            );
            await exclusiveBridge.run(async () => {
                await parentGit.add("-A");
                await parentGit.commit("switch to exclusive mode");
            });
            expect(await exclusiveBridge.scan()).toHaveLength(1);
            expect((await exclusiveBridge.scan())[0]?.state).toBe("git");
            expect((await parentGit.status()).isClean()).toBe(true);
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    test("exclusive mode leaves only the live .git directory after commit", async () => {
        const dir = mkdtempSync(
            path.join(tmpdir(), "subbridge-exclusive-test-")
        );
        const parent = path.join(dir, "vault");
        const child = path.join(parent, "project");
        mkdirSync(child, { recursive: true });

        try {
            const parentGit = simpleGit({ baseDir: parent });
            await parentGit.raw(["init", "--initial-branch=main"]);
            await parentGit.addConfig("user.email", "test@example.com");
            await parentGit.addConfig("user.name", "Test User");

            const childGit = simpleGit({ baseDir: child });
            await childGit.raw(["init", "--initial-branch=main"]);
            await childGit.addConfig("user.email", "test@example.com");
            await childGit.addConfig("user.name", "Test User");
            await childGit.raw(["commit", "--allow-empty", "-m", "child init"]);

            const bridge = new SubGitBridge(
                createPlugin(parent, parentGit, {
                    subGitBridgeEnabled: true,
                    subGitBridgeMetadataMode: "exclusive",
                })
            );

            await bridge.run(async () => {
                await parentGit.add("-A");
                await parentGit.commit("exclusive bridge commit");
            });

            expect(
                await parentGit.raw(["ls-tree", "-r", "--name-only", "HEAD"])
            ).toContain("project/.git_metadata/config");
            expect((await parentGit.status()).isClean()).toBe(true);
            expect((await childGit.status()).isClean()).toBe(true);
            expect((await bridge.scan())[0]?.state).toBe("git");
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });
});
