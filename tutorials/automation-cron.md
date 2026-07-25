# 教程：cron（Hermes 定时任务）

> 适用：把脚本挂到 Hermes cron，定时跑 + 推送给用户

## 何时用

- ✅ A 股 / 监控 / 日报类定时任务
- ✅ "每天早上提醒我吃药"
- ✅ "每周日整理本周的 Notion"
- ❌ 一次性任务
- ❌ < 5 分钟的频率（噪声）

## 30 秒上手

```bash
hermes cron create \
  --name "任务名" \
  --schedule "[cron 表达式]" \
  --deliver qqbot \
  --prompt "[任务描述]"
```

## cron 表达式速查

| 表达式 | 含义 |
|--------|------|
| `*/30 9-11,13-14 * * 1-5` | 工作日 9-11 / 13-14 段，每 30 分钟 |
| `25 9 * * 1-5` | 工作日 9:25 一次 |
| `30 15 * * 1-5` | 工作日 15:30 一次 |
| `0 23 * * *` | 每天 23:00 |
| `*/30 * * * *` | 每 30 分钟（24x7） |

**字段顺序**：`分 时 日 月 周`

## deliver 选项

| 值 | 行为 |
|----|------|
| `weixin` | 微信 iLink home channel |
| `qqbot` | QQ bot home channel（推荐） |
| `local` | 只存 `~/.hermes/cron/output/`，不推 |
| `all` | 多渠道 fan-out |

⚠️ **`weixin` 限流严**（30s cooldown），cron 任务会丢消息。**默认用 `qqbot`**。

## 实战：5 个常见模板

### 模板 1：A 股实时推送
```bash
hermes cron create \
  --name "A 股监控" \
  --schedule "*/30 9-11,13-14 * * 1-5" \
  --deliver qqbot \
  --prompt "Run ~/.local/bin/stock_push.py and return output verbatim. The script renders a complete formatted report."
```

### 模板 2：日报
```bash
hermes cron create \
  --name "日报" \
  --schedule "30 15 * * 1-5" \
  --deliver qqbot \
  --prompt "Run ~/.local/bin/stock_eod.py and return output verbatim."
```

### 模板 3：监控（24x7）
```bash
hermes cron create \
  --name "考试院监控" \
  --schedule "*/30 * * * *" \
  --deliver qqbot \
  --prompt "Run ~/.local/bin/gk_monitor.py and return output verbatim. Silent when no new posts."
```

### 模板 4：定时提醒
```bash
hermes cron create \
  --name "晚 11 点提醒" \
  --schedule "0 23 * * *" \
  --deliver qqbot \
  --prompt "推送一条消息：'⏰ 该吃药了！'"
```

### 模板 5：本地清理（不推）
```bash
hermes cron create \
  --name "清理 Downloads" \
  --schedule "0 3 * * *" \
  --deliver local \
  --prompt "删除 ~/Downloads 里 30 天前 > 10MB 的文件，输出到 ~/.hermes/cron/output/。"
```

## prompt 设计的 3 条铁律

1. **告诉模型怎么跑脚本** — "Just execute: X" 不要用 LLM 二次发挥
2. **告诉模型怎么处理输出** — "return output verbatim" / "summarize" / "JSON"
3. **告诉模型什么时候静默** — "Silent when no new posts"

## 反例

```text
# ❌ 错
每天早上 9 点看看 A 股怎么样。

# ✅ 对
Run ~/.local/bin/stock_push.py and return output verbatim.
```

```text
# ❌ 错
如果 6 只股票有 BUY 信号就提醒我。

# ✅ 对
Run ~/.local/bin/stock_push.py and return output verbatim. 
The script handles BUY/SELL signal detection.
```

## 管理 cron

```bash
# 列出所有
hermes cron list

# 改节奏
hermes cron update <job_id> --schedule "新表达式"

# 改 deliver
hermes cron update <job_id> --deliver qqbot

# 立即触发（不等到 schedule）
hermes cron run <job_id>

# 删除
hermes cron remove <job_id>
```

## 流程图

```
┌─────────────────┐
│  hermes cron     │
│  create          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cron 调度器      │
│  按 schedule 触发 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  执行 prompt      │
│  (LLM agent turn) │
└────────┬────────┘
         │
         ├──────────────────────────┐
         ▼                          ▼
┌─────────────────┐        ┌─────────────────┐
│  跑脚本          │        │  LLM 总结       │
│  return output  │        │  推送给用户      │
└────────┬────────┘        └────────┬────────┘
         │                          │
         └────────┬─────────────────┘
                  ▼
         ┌─────────────────┐
         │  deliver 到      │
         │  qqbot/weixin/..│
         └─────────────────┘
```

## 你当前活跃的 cron（参考）

| Job ID | 名称 | 节奏 |
|--------|------|------|
| 1dac92cc45d0 | A 股集合竞价日报(9:25) | `25 9 * * 1-5` |
| 193cc5057728 | A 股监控推送(交易时段) | `*/30 9-11,13-14 * * 1-5` |
| 434fca36b08a | A 股收盘日报(每日15:30) | `30 15 * * 1-5` |
| 7cec7fee3db5 | 广东高考投档线监控 | `*/30 * * * *` |

## 相关

- 模板: [`prompts/automation/cron.md`](../prompts/automation/cron.md)
- 案例: [`prompts/automation/examples.md`](../prompts/automation/examples.md)