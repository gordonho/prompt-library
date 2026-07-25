# Prompt Library

> 通用 prompt 模板集合，由 Hermes Agent 在实战中沉淀。
>
> 🌐 **GitHub Pages 站点**：[**gordonho.github.io/prompt-library**](https://gordonho.github.io/prompt-library/)
>
> 📦 **GitHub 仓库**：[gordonho/prompt-library](https://github.com/gordonho/prompt-library)
>
> 📚 **awesome 资源导航**：[awesome-prompts.md](./awesome-prompts.md) — 2026 GitHub 万级 + 千级 prompt 资源合集

---

## 👀 在浏览器看更舒服

> **🌐 [https://gordonho.github.io/prompt-library/](https://gordonho.github.io/prompt-library/)**
>
> 深色主题、模块卡片、决策树速查表、ASCII 流程图 — 浏览友好。

每个 prompt 模块都有对应的网页版（从首页点卡片即可）：

- 🧠 [self-reflect](https://gordonho.github.io/prompt-library/prompts/general/self-reflect.html)
- 🤝 [delegation](https://gordonho.github.io/prompt-library/prompts/hermes/delegation.html)
- 🐕 [watchdog](https://gordonho.github.io/prompt-library/prompts/monitoring/watchdog.html)
- 🕸️ [web-article](https://gordonho.github.io/prompt-library/prompts/extraction/web-article.html)
- ⏰ [cron](https://gordonho.github.io/prompt-library/prompts/automation/cron.html)
- 🔄 [sync-notion-obsidian](https://gordonho.github.io/prompt-library/prompts/automation/sync-notion-obsidian.html)
- 💬 [chat-platforms](https://gordonho.github.io/prompt-library/prompts/automation/chat-platforms.html)
- 📚 [awesome-prompts](https://gordonho.github.io/prompt-library/awesome-prompts.html)

---

## 目录结构

```
prompt-library/
├── README.md                      ← 仓库首页
├── awesome-prompts.md             ← 外部 prompt 资源导航
├── prompts/
│   ├── general/                    # 通用 LLM prompt
│   │   ├── self-reflect.md         # 结构化 + 反思（87% 准确率）
│   │   └── examples.md             # 4 个实战
│   ├── hermes/                     # Hermes Agent / 子 agent 跨调
│   │   ├── delegation.md
│   │   └── examples.md
│   ├── monitoring/                 # 监控 / 守护进程
│   │   ├── watchdog.md
│   │   └── examples.md
│   ├── extraction/                 # 数据提取
│   │   ├── web-article.md
│   │   └── examples.md
│   └── automation/                 # 自动化
│       ├── cron.md
│       ├── sync-notion-obsidian.md
│       ├── chat-platforms.md
│       └── examples.md × 3
└── tutorials/                      # step-by-step 教程
    ├── README.md
    ├── general-self-reflect.md
    ├── hermes-delegation.md
    ├── monitoring-watchdog.md
    ├── extraction-web-article.md
    ├── automation-cron.md
    ├── automation-sync.md
    └── automation-chat.md
```

---

## 📦 仓库一览

| | |
|---|---|
| **文件数** | 23（markdown）+ 16（html site）|
| **总大小** | ~100 KB |
| **commit** | 11+ |
| **协议** | MIT |
| **Pages** | 自动部署（push → main → 30s 上线）|

---

## 🚀 30 秒速查：找到合适的 prompt

```
我想问 LLM 一个问题
  ├─ 是技术决策 / 法律 / 投资   → self-reflect 主模板
  ├─ 是快问快答                  → self-reflect 极简版
  └─ 是给本地 7B 模型            → self-reflect 主模板

我要让另一个 agent 干子任务     → delegation
我要监控 / 自动重启 / 健康检查  → watchdog
我要抓网页 / PDF / 表格        → web-article
我要定时跑脚本 + 推送           → cron
我要把内容存 Notion / Obsidian  → sync-notion-obsidian
我要推送到飞书 / 企微 / Slack   → chat-platforms

我想找更多 prompt 资源         → awesome-prompts
```

---

## 📂 每个目录的内容

### [prompts/general/](./prompts/general/) — 通用 LLM
- **[self-reflect.md](./prompts/general/self-reflect.md)** — 结构化拆解 + 自我反思（87% 准确率 / 2.8x Token）
- **[examples.md](./prompts/general/examples.md)** — 4 个实战案例

### [prompts/hermes/](./prompts/hermes/) — Hermes / 子 agent 跨调
- **[delegation.md](./prompts/hermes/delegation.md)** — 委派任务给 OpenClaw / Claude Code / Codex
- **[examples.md](./prompts/hermes/examples.md)** — 5 个实战（含反例）

### [prompts/monitoring/](./prompts/monitoring/) — 监控 / 守护进程
- **[watchdog.md](./prompts/monitoring/watchdog.md)** — 健康检查 / 互救 watchdog 设计
- **[examples.md](./prompts/monitoring/examples.md)** — 4 个实战案例

### [prompts/extraction/](./prompts/extraction/) — 数据提取
- **[web-article.md](./prompts/extraction/web-article.md)** — 微信文章 / PDF / A股 / 关键词监控
- **[examples.md](./prompts/extraction/examples.md)** — 4 个实战案例

### [prompts/automation/](./prompts/automation/) — 自动化
- **[cron.md](./prompts/automation/cron.md)** — Hermes cron job 设计
- **[sync-notion-obsidian.md](./prompts/automation/sync-notion-obsidian.md)** — Notion / Obsidian 同步
- **[chat-platforms.md](./prompts/automation/chat-platforms.md)** — 飞书 / 企微 / Slack / Telegram
- **[examples.md](./prompts/automation/examples.md)** / **[sync-examples.md](./prompts/automation/sync-examples.md)** / **[chat-examples.md](./prompts/automation/chat-examples.md)** — 实战案例

---

## 🌐 外部资源导航

📚 **[awesome-prompts.md](./awesome-prompts.md)** — 2026 GitHub 万级 + 千级 prompt 资源合集。

**收录 11 个仓库**，3 个 Tier：
- **Tier 1 (10K+ stars)**：f/prompts.chat, PlexPt-zh, anthropics/prompt-eng-interactive-tutorial
- **Tier 2 (1K-10K stars)**：NirDiamant, thinkingjimmy, wesammustafa, EgoAlpha, EmbraceAGI
- **Tier 3 (中文宝藏)**：L1Xu4n, jianzhnie

**包含**：决策树、按场景推荐、"先学这 3 个"。

---

## 📖 教程（step-by-step）

📚 **[tutorials/](./tutorials/)** 目录里有 8 个 step-by-step 教程，每个都包含：
- 何时用 / 何时不用
- 30 秒上手
- 3-5 个实战场景
- 常见错误 + 反例
- ASCII 流程图
- 相关模板引用

- [`general-self-reflect.md`](./tutorials/general-self-reflect.md)
- [`hermes-delegation.md`](./tutorials/hermes-delegation.md)
- [`monitoring-watchdog.md`](./tutorials/monitoring-watchdog.md)
- [`extraction-web-article.md`](./tutorials/extraction-web-article.md)
- [`automation-cron.md`](./tutorials/automation-cron.md)
- [`automation-sync.md`](./tutorials/automation-sync.md)
- [`automation-chat.md`](./tutorials/automation-chat.md)

---

## 🛠 使用方法

```bash
# 1. clone
git clone https://github.com/gordonho/prompt-library.git

# 2. 复制想要的 prompt
cat prompts/general/self-reflect.md

# 3. 替换 [在此填入你的问题]，粘贴到任何 LLM
```

或直接在浏览器看：**https://gordonho.github.io/prompt-library/**

---

## 📈 实战效果

| 场景 | 效果 |
|------|------|
| A 股监控（6 只）| 交易日每 30 分钟推到 QQ bot，技术面综合判定 |
| 广东高考投档线 | 24×7 监控 PTGK，新文章自动推 |
| Hermes ↔ OpenClaw watchdog | 5 次连续失败触发 kickstart，已实战救活 |
| 微信公众号抓取 | 解析 og:title / nickname / publish_time，关键词高亮 |

---

## 🧬 设计原则

1. **实战验证** — 每个模板都来自真实 Hermes Agent 使用场景
2. **可复用** — 不依赖特定工具，复制即可用
3. **结构化** — 都有 输入 / 输出 / 限制 三个明确段
4. **反例丰富** — 标出"不要做什么"，避免踩坑
5. **MIT 协议** — 自由使用、修改、再发布

---

## 来源

由 Hermes Agent 在实际工作流中沉淀。

- `general/self-reflect.md` — 灵感来自 Micro-Agent / Anthropic Self-Consistency / Llama 3.1 反思
- `hermes/delegation.md` — Hermes ↔ OpenClaw 跨调实战
- `monitoring/watchdog.md` — 我们写的 `buddywatch.py`
- `extraction/web-article.md` — 微信公众号 + Sina A股数据抓取
- `automation/*` — Hermes cron / Obsidian / 多 IM 平台
- `awesome-prompts.md` — GitHub API 实时搜索整理

---

## License

MIT