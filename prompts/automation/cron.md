# Cron Job Prompt 模板

> Hermes Agent / 自家脚本挂在 cron 定时任务时的 prompt。

---

## 基础 cron job prompt

```text
# 任务
[清晰地说明这个 cron 跑什么、什么时候跑]

# 输入
[脚本路径] [可选参数]
[外部状态文件：~/.local/log/xxx.state]

# 输出
最终结果作为 final message 发到用户。

# 调度
[scheudle，例如：*/30 9-11,13-14 * * 1-5]
[schedule 解释：在交易日 9-11 / 13-14 段，每 30 分钟跑一次]

# 交付
deliver="[weixin/qqbot/local/all]"
[weixin = 微信 home channel]
[qqbot = QQ bot home channel]
[local = 仅存到 ~/.hermes/cron/output/]
[all = 多渠道 fan-out]

# 加载技能（可选）
skills=["[skill_name_1]", "[skill_name_2]"]

# 失败行为
- 脚本崩溃：stderr 写日志，不推用户
- 数据源不可达：静默或写 warn，不推用户
- 输出为空：可能是无变化，正常静默
- 输出有内容：完整发用户，不要总结

# 不要做
- 不要调 LLM 去"总结"脚本输出（脚本已生成完整 markdown）
- 不要加 emoji 装饰（脚本已经处理）
- 不要用 iLink 微信（限流）默认用 qqbot
```

---

## 实战案例：A 股实时推送

```text
Run ~/.local/bin/stock_push.py to generate the periodic A-share report for 6 stocks
(招商银行/紫金矿业/新和成/三花智控/海峡创新/工业富联) and deliver it via QQ bot.

Just execute: python3 /Users/gordon/.local/bin/stock_push.py
and return its output verbatim. Do not summarize, do not add commentary —
the push script renders a complete formatted report (table + triggered signal
details + watermark). Send the script output as the final message.

No other action needed.

schedule: */30 9-11,13-14 * * 1-5
deliver: qqbot
```

## 实战案例：广东高考投档线监控

```text
Run ~/.local/bin/gk_monitor.py to monitor the Guangdong Education Examination
Authority for new 投档线 announcements and deliver them via QQ bot.

Just execute: python3 /Users/gordon/.local/bin/gk_monitor.py
and return its output verbatim. When no new posts are published, the script
produces no output (silent). When a new post is detected, it produces a
formatted report. Send whatever output the script produces.

schedule: */30 * * * *
deliver: qqbot
```

## 实战案例：A 股集合竞价（开盘前）

```text
Run ~/.local/bin/stock_premarket.py MODE=pre to generate the 9:25 call auction
report and deliver via QQ bot.

Just execute: MODE=pre python3 /Users/gordon/.local/bin/stock_premarket.py
and return output verbatim.

schedule: 25 9 * * 1-5
deliver: qqbot
```

## 实战案例：A 股收盘日报

```text
Run ~/.local/bin/stock_eod.py MODE=eod to generate the closing report.

schedule: 30 15 * * 1-5
deliver: qqbot
```

---

## 创建 cron 的命令

```bash
# Hermes 提供的工具（create / list / remove）
hermes cron create \
  --name "A 股监控" \
  --schedule "*/30 9-11,13-14 * * 1-5" \
  --deliver qqbot \
  --prompt "[你的 prompt]"

# 看现有
hermes cron list

# 删
hermes cron remove <job_id>
```

---

## 节奏设计原则

| 类型 | 节奏 | 原因 |
|------|------|------|
| 实时数据 | 15-30 分钟 | 价格变动至少要 15 分钟才有意义 |
| 集合竞价 | 1 天 1 次 | 9:25 一次性撮合 |
| 收盘日报 | 1 天 1 次 | 15:30 一次性 |
| **数据监控** | 30 分钟 - 1 小时 | 数据源更新不快 |
| **手动触发** | 一次性 | 用户发起 |

**避免**：
- < 5 分钟的 cron（噪声）
- 24x7 cron（除非有真实事件源）
- iLink 微信推送（限流）→ 默认 qqbot