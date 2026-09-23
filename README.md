# Git Subbridge

[English](README.md) | [简体中文](README.zh-CN.md)

A customized Git plugin for Obsidian that solves the problem of uploading or committing nested sub-repositories.

## Features

-   Adds a **Sub-git scan** button to the Source Control toolbar, immediately to the left of **Commit-and-sync**.
-   Scans the repository for child folders containing `.git`.
-   Supports **Exclusive rename** mode, which keeps only `.git` or `.git_metadata`.
-   Supports **Sidecar copy** mode, which keeps both directories and avoids Windows directory-lock errors.
-   Adds a **Nested repositories** settings section with bridge, metadata-mode, and language options.
-   **Language: 中文** translates the settings page and adds Chinese translations to button tooltips.
-   Writes a recovery journal so interrupted operations can be restored on the next startup.

## How it works

In **Exclusive rename** mode, `.git` is renamed to `.git_metadata` before the commit and renamed back afterward. In **Sidecar copy** mode, only `.git/HEAD` is temporarily renamed, the metadata is copied to `.git_metadata`, and both directories remain.

```text
Scan child .git
    -> rename .git/HEAD to HEAD__subbridge
    -> copy .git to .git_metadata
    -> stage and commit with Obsidian Git
    -> restore .git/HEAD
```

The bridge currently covers the `Commit all` path used by **Commit all** and the default **Commit-and-sync** action. Staged-only commits are not automatically bridged.

For a detailed comparison, see [Metadata modes](docs/metadata-modes.md#english).

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
