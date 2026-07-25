# Prompt Library

通用 prompt 模板集合，由 Hermes Agent 自动整理。

## 目录结构

```
prompts/
├── general/           # 通用 LLM prompt
│   ├── self-reflect.md
│   └── examples.md
├── hermes/            # Hermes Agent / 子 agent 跨调
│   ├── delegation.md
│   └── examples.md
├── monitoring/        # 监控 / 守护进程
│   ├── watchdog.md
│   └── examples.md
├── extraction/        # 数据提取 / 文章分析
│   ├── web-article.md
│   └── examples.md
└── automation/        # 自动化
    ├── cron.md
    ├── sync-notion-obsidian.md
    ├── chat-platforms.md
    └── examples.md  (+ sync-examples.md, chat-examples.md)
```

## 每个目录的模板

### [general/](./prompts/general/) — 通用 LLM prompt
- **`self-reflect.md`** — 结构化拆解 + 自我反思通用模板（87% 准确率）
- **`examples.md`** — 4 个实战案例（技术决策 / 投资 / 法律 / 极简版）

### [hermes/](./prompts/hermes/) — Hermes / 子 agent 跨调
- **`delegation.md`** — 委派任务给 OpenClaw / Claude Code / Codex 的模板
- **`examples.md`** — 5 个实战案例（含反例）

### [monitoring/](./prompts/monitoring/) — 监控 / 守护进程
- **`watchdog.md`** — 健康检查 / 互救 watchdog 设计
- **`examples.md`** — 4 个实战案例（含错的设计反例）

### [extraction/](./prompts/extraction/) — 数据提取
- **`web-article.md`** — 微信文章 / PDF / A股 / 关键词监控
- **`examples.md`** — 4 个实战案例（含抓取陷阱）

### [automation/](./prompts/automation/) — 自动化
- **`cron.md`** — Hermes cron job 设计
- **`sync-notion-obsidian.md`** — Notion / Obsidian 同步
- **`chat-platforms.md`** — 飞书 / 企微 / Slack / Telegram 推送
- **`examples.md`** / **`sync-examples.md`** / **`chat-examples.md`** — 实战案例

## 使用

```bash
git clone https://github.com/gordonho/prompt-library.git
```

每个 prompt 都是 markdown 格式，直接复制使用。

## 设计原则

1. **实战验证** — 每个模板都来自真实 Hermes Agent 使用场景
2. **可复用** — 不依赖特定工具，复制即可用
3. **结构化** — 都有 输入 / 输出 / 限制 三个明确段
4. **反例丰富** — 标出"不要做什么"，避免踩坑

## 来源

由 Hermes Agent 在实际工作流中沉淀：

- `general/self-reflect.md` — 灵感来自 Micro-Agent / Anthropic Self-Consistency / Llama 3.1 反思
- `hermes/delegation.md` — Hermes ↔ OpenClaw 跨调实战
- `monitoring/watchdog.md` — 我们写的 `buddywatch.py`
- `extraction/web-article.md` — 微信公众号 + Sina A股数据抓取
- `automation/*` — Hermes cron / Obsidian / 多 IM 平台

## License

MIT
## 教程

按 prompt 分门别类的 step-by-step 教程：

📖 [`tutorials/`](./tutorials/)
- [`general-self-reflect.md`](./tutorials/general-self-reflect.md)
- [`hermes-delegation.md`](./tutorials/hermes-delegation.md)
- [`monitoring-watchdog.md`](./tutorials/monitoring-watchdog.md)
- [`extraction-web-article.md`](./tutorials/extraction-web-article.md)
- [`automation-cron.md`](./tutorials/automation-cron.md)
- [`automation-sync.md`](./tutorials/automation-sync.md)
- [`automation-chat.md`](./tutorials/automation-chat.md)

每个教程包含：
- 何时用 / 何时不用
- 30 秒上手（copy-paste ready）
- 3-5 个实战场景
- 常见错误 + 反例
- ASCII 流程图 + 状态机
- 相关模板引用
