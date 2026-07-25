# 智能监控 / 守护进程 Prompt 模板

> 给 watchdog / 健康检查 / 自动化脚本用的 prompt 模板。

---

## Watchdog 探针 Prompt

给一个 agent 或脚本去"定期检查某服务是否健康"时用：

```text
# 目标
每 [N] 分钟检查 [服务名] 的健康状态，如果连续 [M] 次失败则触发恢复动作。

# 探针方式
- HTTP: curl http://[host]:[port]/health，检查 body 含 [pattern]
- CLI: [cmd] --check，检查 stdout 含 [pattern]
- 进程: ps aux | grep [pattern]，检查 PID 存在

# 失败判定
- HTTP 非 200 → fail
- HTTP body 缺失预期 pattern → fail
- CLI 退出码非 0 → fail
- 进程 PID 缺失 → fail

# 恢复动作
- 触发 launchctl kickstart -k gui/[uid]/[label]
- 等待 [T] 秒冷却，期间不再探针
- 记录到 [log file]

# 静默
- 探针成功时**完全静默**（stderr 写一行 JSON 给 log 就行）
- 探针失败但未达阈值时**写 warn 日志**
- 恢复动作触发时**写 info 日志**

# 不要做
- 不要发邮件 / 推微信（用户没要）
- 不要修改服务配置
- 不要修改 launchd plist
- 不要做 OS-level 重启
```

---

## 实际案例：Hermes ↔ OpenClaw 互救 watchdog

```python
# 等价伪代码
INTERVAL = 60       # 秒
THRESHOLD = 5       # 连续失败次数
COOLDOWN = 300      # 触发恢复后冷却

while True:
    sleep(INTERVAL)
    for peer in [HERMES, OPENCLAW]:
        if peer.in_cooldown():
            continue
        if not probe(peer):
            peer.fail_count += 1
            log_warn(f"{peer.name}: fail {peer.fail_count}/{THRESHOLD}")
            if peer.fail_count >= THRESHOLD:
                kickstart(peer)
                peer.cooldown_until = now + COOLDOWN
                peer.fail_count = 0
        else:
            if peer.fail_count > 0:
                log_info(f"{peer.name}: recovered")
            peer.fail_count = 0
```

---

## 推送到用户的通知格式

如果 watchdog 决定要告诉用户（极少情况），用这个格式：

```text
⏰ [timestamp] · [event type]

🔴 / 🟢 / ⚠️ [简短标题]

📌 [是什么服务]
📊 [发生了什么]
🔧 [做了什么动作]
✅ [当前状态]

━━━━━━━━━━━━━━━━━━━━
📡 [数据源]
```

---

## 不要的常见错误

| 错误 | 应该 |
|------|------|
| 探针正常时也发推送 | 完全静默 |
| 探针失败就立即重启 | 累计阈值（5 次 / 5 分钟） |
| 重启后立刻再探针 | 冷却 5-10 分钟 |
| 多个 watchdog 互相监视（互相拉） | 用 launchd 单实例 + 单 watchdog |
| 用 cron + 邮件而非 watchdog | watchdog 是常驻进程，能精确知道连续失败 |