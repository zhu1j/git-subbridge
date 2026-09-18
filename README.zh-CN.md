# Git Subbridge

[English](README.md) | **简体中文**

这是一个为 Obsidian 定制的 Git 插件，主要解决“上传子仓库”时，父仓库遇到子 `.git` 目录而产生嵌套仓库错误的问题。

## 功能

-   在源代码管理工具栏中增加 **子 Git 扫描** 按钮，位置就在 **Commit-and-sync** 左侧。
-   扫描仓库中包含 `.git` 的子文件夹。
-   通过通知显示实时 `.git`、已有 `.git_metadata` 和冲突数量。
-   执行 **Commit all** 或 **Commit-and-sync** 前，临时将子 `.git` 改名为 `.git_metadata`。
-   Git 操作结束后，在 `finally` 中恢复所有子 `.git` 文件夹。
-   使用 `skip-worktree`，保证恢复后的工作区保持干净。
-   写入恢复日志，插件启动时可以恢复中断的桥接操作。
-   如果同一项目根目录同时存在 `.git` 和 `.git_metadata`，插件不会自动覆盖，而是报告冲突。

## 工作流程

```text
扫描子 .git
    -> 将 .git 改名为 .git_metadata
    -> 使用 Obsidian Git 暂存并提交
    -> 将 .git_metadata 恢复为 .git
    -> 设置 skip-worktree 标记
```

当前自动桥接覆盖 `Commit all` 路径，也就是 **Commit all** 和默认的 **Commit-and-sync** 操作。仅提交已暂存内容的 `Commit staged` 暂不自动桥接。

## 构建与安装

```powershell
pnpm install --frozen-lockfile
pnpm run build
```

将 `main.js`、`manifest.json` 和 `styles.css` 复制到：

```text
.obsidian/plugins/git-subbridge/
```

然后在 Obsidian 中启用 **Git Subbridge**。使用时请禁用原版 **Git** 插件，避免两个插件同时操作同一个仓库。

## 使用方法

1. 打开源代码管理视图。
2. 点击 **子 Git 扫描** 按钮，检查子仓库。
3. 执行 **Commit all** 或 **Commit-and-sync**。
4. 插件会自动桥接子 `.git`，提交父仓库，然后恢复原目录名。

## 安全说明

-   本插件仅支持桌面端，目前主要面向 Windows。
-   子仓库处于桥接状态时，不要在其中执行 Git 命令。
-   请为 Git 索引元数据和恢复操作保留足够的磁盘空间。
-   如果同一个项目根目录下同时存在 `.git` 和 `.git_metadata`，请先手动处理冲突再提交。

## 作者

-   显示名：一只朱
-   GitHub：[zhu1j](https://github.com/zhu1j)
-   邮箱：[zhujiejava1@gmail.com](mailto:zhujiejava1@gmail.com)

## 许可证

本项目使用 MIT 许可证，详见 [LICENSE](LICENSE)。
