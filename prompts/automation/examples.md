# cron 实战案例

---

## 案例 1：A 股实时推送（已稳定跑）

### 创建
```bash
hermes cron create \
  --name "A 股监控推送(交易时段)" \
  --schedule "*/30 9-11,13-14 * * 1-5" \
  --deliver qqbot \
  --prompt "Run ~/.local/bin/stock_push.py to generate the periodic A-share report for 6 stocks (招商银行/紫金矿业/新和成/三花智控/海峡创新/工业富联) and deliver it via QQ bot.

Just execute: python3 /Users/gordon/.local/bin/stock_push.py and return its output verbatim. Do not summarize, do not add commentary — the push script renders a complete formatted report (table + triggered signal details + watermark). Send the script output as the final message.

No other action needed."
```

### 节奏
- 交易日 9:00-11:45 + 13:00-14:45，每 30 分钟
- 周末/深夜静默
- 走 QQ bot（iLink 微信限流）

### 失败
最初用 `deliver="weixin"`，iLink 30 秒 cooldown，全部丢失。
改 `deliver="qqbot"` 后稳定。

---

## 案例 2：广东高考投档线监控

### 创建
```bash
hermes cron create \
  --name "广东高考投档线监控(每30分钟)" \
  --schedule "*/30 * * * *" \
  --deliver qqbot \
  --prompt "Run ~/.local/bin/gk_monitor.py to monitor the Guangdong Education Examination Authority (eea.gd.gov.cn/ptgk/) for new college admission admission-line (投档线) announcements and deliver them via QQ bot.

Just execute: python3 /Users/gordon/.local/bin/gk_monitor.py and return its output verbatim. The script is fully self-contained — when no new posts are published, it produces no output (silent). When a new post is detected, it produces a formatted report with title, publish time, body summary, and PDF attachment links. Send whatever output the script produces as the final message.

No other action needed."
```

### 节奏
- 24x7，每 30 分钟
- 静默优先（无新文章 = 无输出）
- 不堆积老文章（state 持久化）

---

## 案例 3：A 股集合竞价（开盘前一次性）

### 创建
```bash
hermes cron create \
  --name "A 股集合竞价日报(9:25)" \
  --schedule "25 9 * * 1-5" \
  --deliver qqbot \
  --prompt "Run ~/.local/bin/stock_premarket.py to generate the 9:25 pre-market call auction report. Just execute: MODE=pre python3 /Users/gordon/.local/bin/stock_premarket.py and return output verbatim."
```

### 节奏
- 工作日 9:25 一次
- 不重复（9:30 之后进入实时推送）

---

## 案例 4：A 股收盘日报

### 创建
```bash
hermes cron create \
  --name "A 股收盘日报(每日15:30)" \
  --schedule "30 15 * * 1-5" \
  --deliver qqbot \
  --prompt "Run ~/.local/bin/stock_eod.py to generate the closing report."
```

---

## 案例 5：定时提醒（24/7 全天）

```bash
hermes cron create \
  --name "晚 11 点提醒吃药" \
  --schedule "0 23 * * *" \
  --deliver qqbot \
  --prompt "推送一条消息：'⏰ 该吃药了！'"
```

---

## 案例 6：本地脚本（不交付用户）

```bash
hermes cron create \
  --name "每天清理 Downloads 大于 30 天的文件" \
  --schedule "0 3 * * *" \
  --deliver local \
  --prompt "运行 cleanup 脚本，输出结果存 ~/.hermes/cron/output/。"
```

---

## 失败案例

### 反例 1：iLink 微信限流

```bash
hermes cron create --deliver "weixin" ...
```

**问题**：iLink 对同一用户 30 秒冷却，cron 每 30 分钟跑，**全部丢失**。

**改**：默认 `deliver="qqbot"` 或 `all`。

### 反例 2：脚本崩了还在推

```bash
# ❌ 错：脚本返回非 0 也照样发
python3 script.py || echo "failed" | cron_send
```

**改**：
- 脚本崩溃 → stderr 写日志，不推
- 有内容 → 完整发用户

### 反例 3：节奏太密

```bash
schedule: */1 * * * *    # 每分钟
```

**问题**：噪声、API 限流、电池耗电。

**改**：
- 价格数据：15-30 分钟
- 监控：30 分钟 - 1 小时
- 日报：1 天 1 次

---

## Hermes cron 命令全集

| 命令 | 说明 |
|------|------|
| `hermes cron create` | 创建 |
| `hermes cron list` | 列出所有 |
| `hermes cron update --schedule X` | 改 schedule |
| `hermes cron update --deliver X` | 改 deliver |
| `hermes cron remove <job_id>` | 删除 |
| `hermes cron run <job_id>` | 立即触发一次 |

---

## 当前活跃的 cron（你的）

```
1dac92cc45d0  A 股集合竞价日报(9:25)        25 9 * * 1-5        qqbot
193cc5057728  A 股监控推送(交易时段)         */30 9-11,13-14    qqbot
434fca36b08a  A 股收盘日报(每日15:30)       30 15 * * 1-5      qqbot
7cec7fee3db5  广东高考投档线监控(每30分钟)    */30 * * * *       qqbot
```