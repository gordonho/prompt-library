# Tutorials

每个 prompt 的 step-by-step 使用教程。

## 列表

| Prompt | 教程 | 难度 | 适用场景 |
|--------|------|------|---------|
| [`self-reflect`](../prompts/general/self-reflect.md) | [`general-self-reflect.md`](./general-self-reflect.md) | ⭐ | 任何 LLM / 本地 7B |
| [`delegation`](../prompts/hermes/delegation.md) | [`hermes-delegation.md`](./hermes-delegation.md) | ⭐⭐ | Hermes ↔ 子 agent |
| [`watchdog`](../prompts/monitoring/watchdog.md) | [`monitoring-watchdog.md`](./monitoring-watchdog.md) | ⭐⭐ | 长跑守护进程 |
| [`web-article`](../prompts/extraction/web-article.md) | [`extraction-web-article.md`](./extraction-web-article.md) | ⭐⭐ | 抓取 / 提取 |
| [`cron`](../prompts/automation/cron.md) | [`automation-cron.md`](./automation-cron.md) | ⭐ | 定时任务 |
| [`sync-notion-obsidian`](../prompts/automation/sync-notion-obsidian.md) | [`automation-sync.md`](./automation-sync.md) | ⭐⭐ | 知识管理同步 |
| [`chat-platforms`](../prompts/automation/chat-platforms.md) | [`automation-chat.md`](./automation-chat.md) | ⭐⭐ | 多渠道 IM 推送 |

## 速查：30 秒找到合适的 prompt

```
我想问 LLM 一个问题
  ├─ 是技术决策 / 法律 / 投资 → self-reflect 主模板
  ├─ 是快问快答              → self-reflect 极简版
  └─ 是给本地 7B 模型         → self-reflect 主模板

我要让另一个 agent 干子任务
  └─ delegation（OpenClaw / Claude Code / Codex 都适用）

我要监控 / 自动重启 / 健康检查
  └─ watchdog

我要抓网页 / PDF / 表格
  └─ web-article

我要定时跑脚本 + 推送给用户
  └─ cron

我要把内容存 Notion / Obsidian
  └─ sync-notion-obsidian

我要推送到飞书 / 企微 / Slack
  └─ chat-platforms
```