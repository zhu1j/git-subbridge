const translations: Record<string, string> = {
    "Git Subbridge": "Git Subbridge",
    Automatic: "自动",
    "Split timers for automatic commit and sync": "拆分自动提交与同步计时器",
    "Auto commit after latest commit": "最近一次提交后的自动提交",
    "Auto commit-and-sync after latest commit":
        "最近一次提交后的自动提交并同步",
    "Auto commit after stopping file edits": "停止编辑文件后的自动提交",
    "Auto commit-and-sync after stopping file edits":
        "停止编辑文件后的自动提交并同步",
    "Auto commit interval (minutes)": "自动提交间隔（分钟）",
    "Auto commit-and-sync interval (minutes)": "自动提交并同步间隔（分钟）",
    "Auto commit only staged files": "自动提交仅提交已暂存文件",
    "Auto commit-and-sync only staged files": "自动提交并同步仅处理已暂存文件",
    "Auto pull interval (minutes)": "自动拉取间隔（分钟）",
    "Auto push interval (minutes)": "自动推送间隔（分钟）",
    "Commit message on auto commit": "自动提交时的提交信息",
    "Commit message on auto commit-and-sync": "自动提交并同步时的提交信息",
    "Specify custom commit message on auto commit":
        "指定自动提交的自定义提交信息",
    "Specify custom commit message on auto commit-and-sync":
        "指定自动提交并同步的自定义提交信息",
    "Commit message on manual commit": "手动提交时的提交信息",
    "Commit message script": "提交信息脚本",
    "Preview commit message": "预览提交信息",
    "List filenames affected by commit in the commit body":
        "在提交正文中列出受影响的文件名",
    Pull: "拉取",
    "Merge strategy": "合并策略",
    "Merge strategy on conflicts": "冲突合并策略",
    "Auto-stash changes when rebasing": "变基时自动暂存更改",
    "Pull on startup": "启动时拉取",
    "Commit-and-sync": "提交并同步",
    "Push on commit-and-sync": "提交并同步时推送",
    "Pull on commit-and-sync": "提交并同步时拉取",
    "Squash commits before push": "推送前压缩提交",
    "Hunk management": "代码块管理",
    "Hunk commands": "代码块命令",
    Signs: "行标记",
    "Line author information": "行作者信息",
    "Show commit authoring information next to each line":
        "在每行旁显示提交创作信息",
    "Follow movement and copies across files and commits":
        "跨文件和提交跟踪移动与复制",
    "Ignore whitespace and newlines in changes": "忽略更改中的空白和换行",
    "Author name display": "作者名称显示",
    "Authoring date display": "创作日期显示",
    "Authoring date display timezone": "创作日期显示时区",
    "Custom authoring date format": "自定义创作日期格式",
    "Oldest age in coloring": "着色中最老的提交时间",
    "Text color": "文本颜色",
    "Status bar with summary of line changes": "状态栏显示行变更摘要",
    "Show commit hash": "显示提交哈希",
    "Show Author": "显示作者",
    "Show Date": "显示日期",
    "History view": "历史视图",
    "Source control view": "源代码管理视图",
    "Split diff view timeout": "分栏差异视图超时",
    "Diff view style": "差异视图样式",
    "File menu integration": "文件菜单集成",
    "Show status bar": "显示状态栏",
    "Show branch status bar": "显示分支状态栏",
    "Show the count of modified files in the status bar":
        "在状态栏显示修改文件数量",
    "Automatically refresh source control view on file changes":
        "文件变更时自动刷新源代码管理视图",
    "Source control view refresh interval": "源代码管理视图刷新间隔",
    "Hide notifications for no changes": "无变更时隐藏通知",
    "Disable error notifications": "禁用错误通知",
    "Disable informative notifications": "禁用信息通知",
    Advanced: "高级",
    "Authentication/commit author": "身份认证/提交作者",
    "Username on your git server. E.g. your username on GitHub":
        "Git 服务器用户名，例如 GitHub 用户名",
    "Password/Personal access token": "密码/个人访问令牌",
    "Commit author": "提交作者",
    "Author name for commit": "提交作者名称",
    "Author email for commit": "提交作者邮箱",
    "Custom Git binary path": "自定义 Git 可执行文件路径",
    "Custom Git directory path (Instead of '.git')":
        "自定义 Git 目录路径（替代 '.git'）",
    "Custom base path (Git repository path)": "自定义基础路径（Git 仓库路径）",
    "Additional environment variables": "额外环境变量",
    "Additional PATH environment variable paths": "额外 PATH 环境变量路径",
    "Reload with new environment variables": "使用新环境变量重新加载",
    "{{date}} placeholder format": "{{date}} 占位符格式",
    "{{hostname}} placeholder replacement": "{{hostname}} 占位符替换值",
    Miscellaneous: "其他",
    "Update submodules": "更新子模块",
    "Submodule recurse checkout/switch": "子模块递归检出/切换",
    "Disable on this device": "在此设备禁用",
    "Stage all changes when nothing is staged": "暂存区为空时暂存全部更改",
    "Enable Sub-git bridge": "启用子 Git 桥接",
    "Metadata mode": "元数据模式",
    Language: "语言",
    "Bilingual button tooltips": "按钮中英双语提示",
    Support: "支持",
    Donate: "赞助",
    "Copy Debug Information": "复制调试信息",
    "Exclusive rename (one folder)": "独占改名（只保留一个目录）",
    "Sidecar copy (two folders)": "旁路副本（保留两个目录）",
};
const descriptions: Record<string, string> = {
    "Enable to use one interval for commit and another for sync.":
        "开启后，可分别为提交和同步设置不同的时间间隔。",
    "Commit-and-sync with default settings means staging everything -> committing -> pulling -> pushing. Ideally this is a single action that you do regularly to keep your local and remote repository in sync.":
        "默认的提交并同步会依次执行：暂存全部、提交、拉取、推送。通常建议定期执行，以保持本地和远程仓库同步。",
    "Most of the time you want to push after committing. Turning this off turns a commit-and-sync action into commit and pull only. It will still be called commit-and-sync.":
        "大多数情况下，提交后需要推送。关闭后，提交并同步只会提交和拉取。",
    "On commit-and-sync, pull commits as well. Turning this off turns a commit-and-sync action into commit and push only.":
        "提交并同步时同时拉取远程提交。关闭后，只会提交和推送。",
    "On commit-and-sync, squash all local unpushed commits into a single commit right before pushing. Keeps the remote history clean when committing often. Only unpushed commits are rewritten, so no force-push is needed.":
        "推送前将所有尚未推送的本地提交压缩为一个提交，使远程历史更整洁。只重写未推送历史，不需要强制推送。",
    "Temporarily stash local changes before rebasing and restore them afterward. Restoring changes may produce conflicts.":
        "变基前临时暂存本地更改，变基后恢复。恢复时可能产生冲突。",
    "Decide how to integrate commits from your remote branch into your local branch.":
        "决定如何将远程分支的提交合并到本地分支。",
    "Decide how to solve conflicts when pulling remote changes. This can be used to favor your local changes or the remote changes automatically.":
        "决定拉取远程更改时如何解决冲突，可自动优先本地或远程更改。",
    "Automatically pull commits when Obsidian starts.":
        "Obsidian 启动时自动拉取提交。",
    "Hunks are sections of grouped line changes right in your editor.":
        "代码块是编辑器中一组连续的行变更。",
    "Adds commands to stage/reset individual Git diff hunks and navigate between them via 'Go to next/prev hunk' commands.":
        "增加暂存、重置 Git 差异代码块以及前后导航命令。",
    "This allows you to see your changes right in your editor via colored markers and stage/reset/preview individual hunks.":
        "通过彩色标记在编辑器中查看更改，并可暂存、重置或预览单个代码块。",
    "If and how the author is displayed": "设置是否以及如何显示作者",
    "If and how the date and time of authoring the line is displayed":
        "设置是否以及如何显示该行的创作日期和时间",
    "Show the author of the commit in the history view.":
        "在历史视图中显示提交作者。",
    "Show the date of the commit in the history view. The {{date}} placeholder format is used to display the date.":
        "在历史视图中显示提交日期，并使用 {{date}} 占位符格式。",
    'Set the style for the diff view. Note that the actual diff in "Split" mode is not generated by Git, but the editor itself instead so it may differ from the diff generated by Git. One advantage of this is that you can edit the text in that view.':
        "设置差异视图样式。分栏模式由编辑器生成，可能与 Git 原生差异略有不同，但可以直接编辑文本。",
    "Maximum time in milliseconds to compute a detailed split diff. Higher values improve accuracy for large files with many changes but may reduce responsiveness. Read-only diffs use ten times this value.":
        "计算详细分栏差异的最长时间（毫秒）。数值越高，大文件差异越准确，但响应可能变慢。只读差异会使用该值的十倍。",
    'Add "Stage", "Unstage" and "Add to .gitignore" actions to the file menu.':
        "在文件菜单中添加“暂存”“取消暂存”和“加入 .gitignore”操作。",
    "Milliseconds to wait after file change before refreshing the Source Control View.":
        "文件变更后等待多少毫秒再刷新源代码管理视图。",
    "On slower machines this may cause lags. If so, just disable this option.":
        "较慢的设备可能会卡顿，如有问题可关闭此选项。",
    "Disable error notifications of any kind to minimize distraction (refer to status bar for updates).":
        "禁用所有错误通知以减少干扰，可查看状态栏了解状态。",
    "Disable informative notifications for git operations to minimize distraction (refer to status bar for updates).":
        "禁用 Git 操作的信息通知以减少干扰，可查看状态栏了解状态。",
    "Don't show notifications when there are no changes to commit or push.":
        "没有需要提交或推送的更改时，不显示通知。",
    "Disables the plugin on this device. This setting is not synced.":
        "在当前设备禁用插件，此设置不会同步。",
    "When using Commit with nothing staged, stage and commit all changes. When disabled, changes must be staged first. Commit all changes and Commit-and-sync are unaffected.":
        "使用“提交”且暂存区为空时，是否暂存并提交全部更改。关闭后必须先手动暂存。“提交全部”和“提交并同步”不受影响。",
    "Specify the path to the Git binary/executable. Git should already be in your PATH. Should only be necessary for a custom Git installation.":
        "指定 Git 可执行文件路径。通常 Git 应已在 PATH 中，仅自定义安装时需要。",
    "Use each line for a new environment variable in the format KEY=VALUE .":
        "每行一个环境变量，格式为 KEY=VALUE。",
    "Removing previously added environment variables will not take effect until Obsidian is restarted.":
        "删除已添加的环境变量后，需要重启 Obsidian 才会生效。",
    "Specify custom hostname for every device. Defaults to the OS hostname if not set on desktop.":
        "为每台设备指定自定义主机名。桌面端未设置时默认使用系统主机名。",
    "Type in your password. You won't be able to see it again.":
        "输入密码后无法再次查看。",
    "Only available on desktop currently.": "目前仅桌面端可用。",
    "Obsidian must be restarted for the changes to take affect.":
        "修改后需要重启 Obsidian 才能生效。",
    "These settings usually don't need to be changed, but may be required for special setups.":
        "这些设置通常无需修改，仅在特殊环境中需要调整。",
    "If you like this Plugin, consider donating to support continued development.":
        "如果你喜欢这个插件，可以赞助作者以支持后续开发。",
    "If you like this Plugin, consider supporting the author on GitHub.":
        "如果你喜欢这个插件，可以在 GitHub 上支持作者。",
    "Allow the plugin to prepare nested repositories before committing them with the parent vault.":
        "允许插件在父仓库提交前准备嵌套子仓库。",
    "Exclusive rename keeps only one of .git or .git_metadata, but requires ChatGPT/Codex to release the .git directory. Sidecar copy keeps both directories and is more reliable on Windows.":
        "独占改名只保留 .git 或 .git_metadata 中的一个，但要求 ChatGPT/Codex 释放 .git 目录。旁路副本会保留两个目录，在 Windows 上更稳定。",
    "English keeps the settings in English. 中文 translates the settings and adds Chinese translations to button tooltips.":
        "English 保持英文设置；中文会翻译设置页，并在按钮提示中附加中文。",
    '"Commit-and-sync" and "pull" takes care of submodules. Missing features: Conflicted files, count of pulled/pushed/committed files. Tracking branch needs to be set for each submodule.':
        "“提交并同步”和“拉取”会处理子模块。目前尚不支持冲突文件、拉取/推送/提交数量统计。每个子模块需要设置跟踪分支。",
};
const dynamicRules: Array<[RegExp, string]> = [
    [
        /^Pull changes every X minutes\. Set to 0 \(default\) to disable\.$/,
        "每隔 X 分钟拉取一次。设置为 0（默认）可禁用。",
    ],
    [
        /^Push commits every X minutes\. Set to 0 \(default\) to disable\.$/,
        "每隔 X 分钟推送一次。设置为 0（默认）可禁用。",
    ],
    [
        /^(Commit|Commit and sync) changes every X minutes\. Set to 0 \(default\) to disable\. \(See below setting for further configuration!\)$/,
        "每隔 X 分钟执行一次$1。设置为 0（默认）可禁用。详细配置请参考下方设置。",
    ],
    [
        /^If turned on, only staged files are committed on (commit|commit-and-sync)\. If turned off, all changed files are committed\.$/,
        "开启后，$1 仅提交已暂存文件；关闭后提交所有更改。",
    ],
    [
        /^If turned on, sets last auto (commit|commit-and-sync) timestamp to the latest commit timestamp\..*$/,
        "开启后，将最近一次自动操作时间更新为最新提交时间，从而减少手动提交后的自动操作频率。",
    ],
    [
        /^Requires the (commit|commit-and-sync) interval not to be 0\..*$/s,
        "要求自动操作间隔不为 0。开启后，在停止编辑文件一段时间后自动执行。",
    ],
    [/^Use each line for one path.*$/s, "每行填写一个路径。"],
    [
        /^You will get a pop up to specify your message\.$/,
        "提交时会弹出窗口输入提交信息。",
    ],
    [/^Set to default: ".*"$/, "恢复默认值"],
];
export function translateSettingsText(value: string): string | undefined {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (translations[normalized]) return translations[normalized];
    if (descriptions[normalized]) return descriptions[normalized];
    for (const [pattern, replacement] of dynamicRules) {
        if (pattern.test(normalized))
            return normalized.replace(pattern, replacement);
    }
    return undefined;
}
export function translateSettingsDom(root: HTMLElement): void {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
    for (const node of textNodes) {
        const original = node.nodeValue ?? "";
        const translated = translateSettingsText(original);
        if (translated && translated !== original.trim()) {
            node.nodeValue = original.replace(original.trim(), translated);
        }
    }
    root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea"
    ).forEach((element) => {
        const placeholder = element.placeholder;
        const translated = placeholder
            ? translateSettingsText(placeholder)
            : undefined;
        if (translated) element.placeholder = translated;
    });
}
