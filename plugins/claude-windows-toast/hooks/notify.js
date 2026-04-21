#!/usr/bin/env node
'use strict';

const { exec } = require('child_process');
const { Buffer } = require('buffer');

const event = process.argv[2] || 'notification';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (input += chunk));

process.stdin.on('end', () => {
  let data = {};
  try { data = JSON.parse(input); } catch (e) { data = {}; }

  let title = 'Claude Code';
  let message = '';

  switch (event) {
    case 'stop': {
      const lastMsg = data.last_assistant_message || '';
      if (lastMsg) {
        title = '回复完成';
        message = lastMsg
          .replace(/```[\s\S]*?```/g, ' [代码] ')
          .replace(/`[^`\n]+`/g, (m) => m.slice(1, -1))
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/\[([^\]]*)\]\([^)]+\)/g, '$1')
          .replace(/#{1,6}\s+/g, '')
          .replace(/[-*]\s+/g, '')
          .replace(/\n{2,}/g, '\n')
          .replace(/\n/g, ' ')
          .trim();
        if (message.length > 150) message = message.substring(0, 150) + '...';
      } else {
        title = '等待输入';
        message = 'Claude 已停止';
      }
      break;
    }

    case 'stop_failure':
      title = 'API 错误';
      message = data.error || data.message || '请求失败，请重试';
      break;

    case 'session_end':
      title = '会话结束';
      message = 'Claude Code 会话已关闭';
      break;

    case 'notification': {
      const type = data.notification_type || '';
      if (type === 'permission_prompt') {
        title = '权限请求';
      } else if (type === 'idle_prompt') {
        title = '等待输入';
      }
      message = data.message || '';
      break;
    }

    case 'permission_request':
      title = '权限确认';
      message = data.tool_name
        ? `${data.tool_name} 需要您的授权`
        : '有工具请求需要确认';
      break;

    case 'permission_denied':
      title = '权限被拒绝';
      message = data.tool_name
        ? `${data.tool_name} 被自动拒绝`
        : '工具调用被拒绝';
      break;

    case 'elicitation':
      title = '用户输入请求';
      message = 'MCP 服务需要您的输入';
      break;

    case 'post_tool_use_failure':
      title = '工具执行失败';
      message = data.tool_name
        ? `${data.tool_name}: ${data.tool_response || '未知错误'}`
        : '工具调用失败';
      break;
  }

  if (!message) process.exit(0);

  const escXml = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/\r?\n/g, ' ')
      .substring(0, 200);

  const t = escXml(title);
  const m = escXml(message);

  const ps = [
    '[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null',
    '[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom, ContentType = WindowsRuntime] | Out-Null',
    '$xml = New-Object Windows.Data.Xml.Dom.XmlDocument',
    `$xml.LoadXml('<toast><visual><binding template="ToastText02"><text id="1">${t}</text><text id="2">${m}</text></binding></visual></toast>')`,
    "$regPath = 'HKCU:\\Software\\Classes\\AppUserModelId\\ClaudeCode'",
    "if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null; Set-ItemProperty -Path $regPath -Name 'DisplayName' -Value 'Claude Code' }",
    "$notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('ClaudeCode')",
    '$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)',
    '$notifier.Show($toast)',
  ].join('\r\n');

  const encoded = Buffer.from(ps, 'utf16le').toString('base64');

  exec(
    `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand ${encoded}`,
    { windowsHide: true, timeout: 10000 },
    () => process.exit(0)
  );
});
