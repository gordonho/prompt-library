# Prompt Library

通用 prompt 模板集合，由 Hermes Agent 自动整理。

## 目录

### [general/](./prompts/general/)
通用 LLM prompt 模板。

- [`self-reflect.md`](./prompts/general/self-reflect.md) — 结构化拆解 + 自我反思通用模板
  - 主模板（结构化拆解 + 自我反思，二合一）
  - 高级版（多解投票 + 反思，三合一）
  - 极简版（1 句话）
  - 适用场景对照表
  - 验证依据（87% 准确率 + 2.8x Token 成本）

### [hermes/](./prompts/hermes/)
Hermes Agent / OpenClaw / Claude Code / Codex 跨调用模板。

- [`delegation.md`](./prompts/hermes/delegation.md) — 委派子 agent 任务的标准模板

### [monitoring/](./prompts/monitoring/)
监控 / 守护进程 / 健康检查模板。

- [`watchdog.md`](./prompts/monitoring/watchdog.md) — 智能监控进程设计

### [extraction/](./prompts/extraction/)
数据提取 / 文章分析 / 结构化抽取模板。

- [`web-article.md`](./prompts/extraction/web-article.md)
  - 微信公众号文章提取
  - PDF 表格抽取
  - A 股行情综合判定
  - 关键词监控 + 推送

## 使用

```bash
git clone https://github.com/gordonho/prompt-library.git
```

每个 prompt 都是 markdown 格式，直接复制使用即可。

## 来源

由 Hermes Agent 在实际使用场景中验证后整理。

- self-reflect: 灵感来自 Micro-Agent / Anthropic Self-Consistency / Llama 3.1 反思技巧
- 其余：在 [Hermes Agent 实际使用中](https://github.com/NousResearch/hermes-agent) 沉淀

## License

MIT