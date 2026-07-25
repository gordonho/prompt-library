# 教程：delegation（委派任务给子 agent）

> 适用：Hermes Agent 调度 OpenClaw / Claude Code / Codex / OpenCode

## 何时用

- ✅ 你需要另一个 agent 干"脏活"（长跑 cron、大文件扫描、复杂代码生成）
- ✅ 你想保持主对话简洁，让子 agent 在后台跑
- ✅ 你要并行多个子任务
- ❌ 任务 < 30 秒能搞定（直接做）
- ❌ 信息严重依赖上下文（直接做，否则要复制粘贴整个上下文）

## 30 秒上手

### 模式 1：Hermes → OpenClaw（通过 `claw` wrapper）

```bash
~/.local/bin/claw --agent main --message "你的具体任务"
```

完整字段：
- `--agent`：agent 名（main / coding-assistant / stock-assistant）
- `--message`：纯文本（OpenClaw 不擅长长 context）
- `--json`：返回 JSON（程序消费时用）
- `--deliver`：让 OpenClaw 直接推到 channel（默认 false）

### 模式 2：Hermes → Claude Code / Codex（通过 `delegate_task`）

```python
delegate_task(
    goal="写一个 Python 脚本...",
    context="我的项目是...，要遵守...",
    model="sonnet"  # 可选
)
```

## 实战：3 个真实场景

### 场景 1：让 OpenClaw 拿一句话事实

```bash
~/.local/bin/claw --agent main --message "用一句话中文回答：你是谁？不要调任何工具"
```

**期望**：1 秒返回文本，不需要 token 浪费。

### 场景 2：让 Claude Code 重构 Python

**用户**: "我的 `stock_push.py` 太长，帮我拆出 `stock_lib.py`"

**Hermes 内部**:
```python
delegate_task(
    goal="""
    把 ~/.local/bin/stock_push.py 拆出：
    - fetch_quote() → stock_lib.py
    - fetch_eod() → stock_lib.py
    - ma/ema/macd/rsi/boll → stock_lib.py
    - main() 和 render() 留在 stock_push.py
    
    要求：
    - 行为完全不变（cron 跑出来结果相同）
    - 加 type hints
    - 加 docstring
    
    输出：列改了哪些函数、新文件路径
    """,
    context="""
    Hermes Agent 项目，跑 cron job。
    stock_eod.py 和 stock_premarket.py 也要复用 stock_lib.py。
    不要动 cron 配置、不要动 schedule。
    """,
    model="sonnet"
)
```

### 场景 3：让 Codex 一行写完

```python
delegate_task(
    goal="""
    写一个 Python 函数 parse_chinese_address(s: str) -> dict。
    
    输入: "广东省广州市天河区珠江新城"
    输出: {"province": "广东", "city": "广州", "district": "天河", "rest": "珠江新城"}
    
    不要外部库，只用 stdlib。
    返回完整函数 + 3 个 doctest。
    """,
    model="gpt-4"
)
```

## 委派失败的常见原因

| 失败 | 你做错了 |
|------|---------|
| 返回 "已检查" 没用 | 你没说要查什么 |
| 返回错的内容 | 你没贴必要 context |
| 跑超时 | 任务太大，应该拆分 |
| 走了不同路径 | 你没说要保持什么风格 |

## 设计原则

1. **明确角色** — "你是 X agent"
2. **明确上下文** — 子 agent **不知道之前聊过**
3. **明确目标** — 含糊会失败
4. **明确约束** — "不要碰 git / 不要超时"
5. **明确输出格式** — "返回 JSON / 简短 / 完整"
6. **明确完成度** — "完成后自检：a, b, c"

## 流程图

```
┌──────────────────┐
│  你（主对话）       │
│  "让 OpenClaw 跑 X" │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Hermes 内部       │
│  delegate_task()  │
│  填入 goal/context│
└────────┬─────────┘
         │
         ├────────────────────────┐
         ▼                        ▼
┌──────────────────┐    ┌──────────────────┐
│  OpenClaw (claw)  │    │ Claude Code (delegate)│
│  agent --message  │    │  generate code        │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  返回文本/JSON     │    │  返回修改文件      │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         └───────┬───────────────┘
                 ▼
         ┌──────────────┐
         │  Hermes 总结   │
         │  给你         │
         └──────────────┘
```

## 相关

- 模板: [`prompts/hermes/delegation.md`](../prompts/hermes/delegation.md)
- 案例: [`prompts/hermes/examples.md`](../prompts/hermes/examples.md)
- OpenClaw wrapper: `~/.local/bin/claw`
- Hermes 自家工具: `delegate_task(goal, context, model)`