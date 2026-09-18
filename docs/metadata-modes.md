# Metadata Modes

[English](#english) | [简体中文](#简体中文)

Git Subbridge provides two ways to handle nested `.git` repositories when the parent vault is committed.

## English

### Exclusive rename

```text
At rest:
project/.git

During Commit-and-sync:
1. project/.git -> project/.git_metadata
2. commit the parent repository
3. project/.git_metadata -> project/.git

After the commit:
project/.git
```

Characteristics:

-   Only one directory exists at rest: `.git`.
-   No long-term metadata copy is kept.
-   The whole `.git` directory must be renamed during the transaction.
-   ChatGPT or Codex cannot safely use that repository during the transaction.
-   Windows may return `EPERM` if another process has an open handle inside `.git`.
-   The usual safe workflow is to pause or close ChatGPT/Codex before Commit-and-sync.

Advantages:

-   The project directory stays clean.
-   No permanent `.git_metadata` copy is stored.
-   Matches the intuitive one-directory model.

Disadvantages:

-   Sensitive to Windows file locks.
-   ChatGPT/Codex must not use the child repository during the commit.
-   The child repository is unavailable for the entire bridge transaction.

### Sidecar copy

```text
At rest:
project/.git
project/.git_metadata

During Commit-and-sync:
1. temporarily rename project/.git/HEAD
2. copy project/.git to project/.git_metadata
3. commit the parent repository
4. restore project/.git/HEAD

After the commit:
project/.git
project/.git_metadata
```

Characteristics:

-   `.git` remains present and usable.
-   The whole `.git` directory is never renamed.
-   `.git_metadata` is a normal tracked sidecar directory used by the parent repository.
-   The child repository ignores `.git_metadata` through `.git/info/exclude`.
-   ChatGPT/Codex can generally remain open.

Advantages:

-   Most reliable mode on Windows.
-   Avoids the directory-handle `EPERM` error.
-   Suitable for the common ChatGPT/Codex workspace workflow.

Disadvantages:

-   `.git` and `.git_metadata` coexist.
-   The metadata sidecar uses additional disk space.
-   Metadata is copied during each commit transaction.

### Which mode should I use?

Use **Exclusive rename** when:

-   You want only one directory at rest.
-   You can pause or close ChatGPT/Codex before committing.
-   You are performing an occasional cleanup or metadata commit.

Use **Sidecar copy** when:

-   ChatGPT/Codex should remain open.
-   You want the most reliable Windows behavior.
-   The extra `.git_metadata` directory is acceptable.

### Can ChatGPT remain open?

-   **Exclusive rename:** Not recommended. The entire `.git` directory must be temporarily renamed, and an open handle normally causes a permissions error.
-   **Sidecar copy:** Yes, with one short caveat. The plugin briefly renames `.git/HEAD`; avoid starting a Git operation in the child repository during that short transaction.

## 简体中文

Git Subbridge 提供两种方式，在提交父仓库时处理嵌套的 `.git` 仓库。

### 独占改名

```text
平时：
项目/.git

执行 Commit-and-sync：
1. 项目/.git -> 项目/.git_metadata
2. 提交父仓库
3. 项目/.git_metadata -> 项目/.git

提交结束后：
项目/.git
```

特点：

-   平时只存在一个目录：`.git`。
-   不长期保存元数据副本。
-   提交事务期间必须重命名整个 `.git` 目录。
-   事务执行期间，ChatGPT/Codex 不能安全使用该子仓库。
-   如果有其他进程占用 `.git` 内部文件，Windows 可能返回 `EPERM`。
-   稳定做法是在 Commit-and-sync 前暂停或关闭 ChatGPT/Codex。

优点：

-   项目目录最干净。
-   不长期保留 `.git_metadata` 副本。
-   符合最直观的“单目录”逻辑。

缺点：

-   对 Windows 文件占用非常敏感。
-   提交期间 ChatGPT/Codex 不能操作该子仓库。
-   整个桥接事务期间，该子仓库不可用。

### 旁路副本

```text
平时：
项目/.git
项目/.git_metadata

执行 Commit-and-sync：
1. 临时改名 项目/.git/HEAD
2. 将 项目/.git 复制为 项目/.git_metadata
3. 提交父仓库
4. 恢复 项目/.git/HEAD

提交结束后：
项目/.git
项目/.git_metadata
```

特点：

-   `.git` 始终保留并可用。
-   从不重命名整个 `.git` 目录。
-   `.git_metadata` 是父仓库跟踪的普通旁路目录。
-   子仓库通过 `.git/info/exclude` 忽略 `.git_metadata`。
-   ChatGPT/Codex 通常可以保持开启。

优点：

-   Windows 下最稳定。
-   避免目录占用导致的 `EPERM`。
-   适合 ChatGPT/Codex 工作区长期运行的场景。

缺点：

-   `.git` 和 `.git_metadata` 会同时存在。
-   元数据副本会占用额外磁盘空间。
-   每次提交事务都需要复制元数据。

### 应该选择哪个模式

使用 **独占改名**：

-   希望平时只保留一个目录。
-   提交前可以暂停或关闭 ChatGPT/Codex。
-   只是偶尔进行清理或元数据提交。

使用 **旁路副本**：

-   希望 ChatGPT/Codex 一直保持开启。
-   更看重 Windows 下的稳定性。
-   可以接受额外的 `.git_metadata` 目录。

### ChatGPT 能一直开着吗

-   **独占改名：** 不建议。整个 `.git` 需要临时改名，只要存在打开的文件句柄，通常就会触发权限错误。
-   **旁路副本：** 可以。唯一需要注意的是，插件会短暂改名 `.git/HEAD`；在这很短的瞬间，不要同时在子仓库中执行 Git 操作。
