# Git Subbridge

[English](README.md) | [简体中文](README.zh-CN.md)

A customized Git plugin for Obsidian that solves the problem of uploading or committing nested sub-repositories.

## Features

-   Adds a **Sub-git scan** button to the Source Control toolbar, immediately to the left of **Commit-and-sync**.
-   Scans the repository for child folders containing `.git`.
-   Reports live `.git`, metadata-only `.git_metadata`, and synchronized repositories in a notice.
-   Temporarily renames only `.git/HEAD` before **Commit all** and **Commit-and-sync**.
-   Copies the complete `.git` directory to a normal `.git_metadata` sidecar directory.
-   Restores `.git/HEAD` in a `finally` block after the Git operation.
-   Keeps `.git_metadata` as a normal tracked sidecar so parent-repository status remains clean.
-   Writes a recovery journal so interrupted operations can be restored on the next startup.

## How it works

```text
Scan child .git
    -> rename .git/HEAD to HEAD__subbridge
    -> copy .git to .git_metadata
    -> stage and commit with Obsidian Git
    -> restore .git/HEAD
```

The bridge currently covers the `Commit all` path used by **Commit all** and the default **Commit-and-sync** action. Staged-only commits are not automatically bridged.

## Build and install

```powershell
pnpm install --frozen-lockfile
pnpm run build
```

Copy `main.js`, `manifest.json`, and `styles.css` into:

```text
.obsidian/plugins/git-subbridge/
```

Then enable **Git Subbridge** in Obsidian. Disable the original **Git** plugin while using this plugin so both plugins do not operate on the same repository at the same time.

## Usage

1. Open the Source Control view.
2. Click the **Sub-git scan** button to check for child Git repositories.
3. Run **Commit all** or **Commit-and-sync**.
4. The plugin bridges child `.git` folders, commits the parent repository, and restores the original folder names.

## Safety notes

-   This plugin is desktop-only and currently intended for Windows.
-   Do not run Git commands inside a child repository while it is being bridged.
-   Keep enough free disk space for Git index metadata and recovery operations.
-   Do not run Git commands inside a child repository while Commit-and-sync is preparing or restoring it.

## Author

-   Name: 一只朱
-   GitHub: [zhu1j](https://github.com/zhu1j)
-   Email: [zhujiejava1@gmail.com](mailto:zhujiejava1@gmail.com)

## License

This project is distributed under the MIT License. See [LICENSE](LICENSE).
