# claude-windows-toast

Windows Toast notifications plugin for [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

Get notified when Claude completes a response, encounters an error, or needs your permission.

## Features

- **回复完成** - Claude 完成回复时弹出通知，附带回复摘要
- **API 错误** - 请求失败时提醒
- **权限确认** - 工具需要授权时通知
- **会话结束** - Claude Code 会话关闭时提醒
- **工具执行失败** - 工具调用出错时通知

## Requirements

- Windows 10/11
- Node.js
- Claude Code

## Install

```bash
claude plugin add --marketplace git https://github.com/TZDXF/claude-windows-toast.git
```

## Uninstall

```bash
claude plugin remove claude-windows-toast
```

## How it works

The plugin registers Claude Code hooks for various events and displays Windows Toast notifications using the `Windows.UI.Notifications` API via PowerShell.

## License

MIT
