# 教程：watchdog（守护进程设计）

> 适用：常驻后台进程，需要定期检查 + 失败时自动恢复

## 何时用

- ✅ 你跑了关键服务（Hermes 网关 / 数据库 / 队列）
- ✅ launchd KeepAlive 不够（不能救 OOM / JS hang）
- ✅ 你想要"静默优先"（失败才推用户）
- ❌ 普通 cron（用 `cron.md` 模板）
- ❌ 一次性任务

## 30 秒上手

### 步骤 1：写 watchdog 脚本

参考 [`prompts/monitoring/watchdog.md`](../prompts/monitoring/watchdog.md) 的 Python 模板。

### 步骤 2：注册 launchd

```bash
# 1. 写 plist（参考 ~/Library/LaunchAgents/com.gordon.buddywatch.plist）
cat > ~/Library/LaunchAgents/com.example.mywatch.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.example.mywatch</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/env</string>
    <string>python3</string>
    <string>/Users/you/.local/bin/mywatch.py</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key>
  <dict>
    <key>SuccessfulExit</key><false/>
    <key>Crashed</key><true/>
  </dict>
  <key>ThrottleInterval</key><integer>10</integer>
</dict>
</plist>
EOF

# 2. 加载
launchctl load -w ~/Library/LaunchAgents/com.example.mywatch.plist
```

### 步骤 3：验证

```bash
# 看 watchdog 日志
tail -f ~/.local/log/mywatch.log

# 看进程
launchctl list | grep mywatch
```

## 实战：Hermes ↔ OpenClaw 互救

我们已有的 `~/.local/bin/buddywatch.py` 就是这个模板的实例。

### 设计要点

```python
INTERVAL = 60        # 每 60 秒探针
THRESHOLD = 5        # 累计 5 次失败
COOLDOWN = 300       # 重启后冷却 5 分钟
```

### 实际跑过的场景

**Hermes 网关挂了**（之前实时）：
```
13:09:48  Hermes failed probe (4/5)
13:10:18  Hermes failed probe (5/5)
13:10:18  Hermes triggering force restart
13:10:18  Hermes kickstart dispatched
```

launchd 没救回来，watchdog 救了。

## 关键陷阱

| 陷阱 | 解决 |
|------|------|
| 在 launchd 进程里 PATH 缺 venv | 用**绝对路径** |
| 探针正常时也推送 | **完全静默**（stderr 写 JSON） |
| 探针失败立即重启 | 累计阈值（5 次）+ 冷却 |
| 多个 watchdog 互相监视 | 单 watchdog + launchd |
| 用 cron 跑 watchdog | watchdog 是常驻进程 |

## 故障排查

| 症状 | 原因 |
|------|------|
| watchdog 启动后没日志 | launchd 重定向 stdout 卡 buffer |
| 探针总是失败 | 探针命令路径错或环境变量缺 |
| 频繁触发重启 | THRESHOLD 太低或 COOLDOWN 太短 |
| watchdog 自己挂了 | launchd KeepAlive 应该救 |

## 流程图

```
         launchd 启动 watchdog
                 │
                 ▼
    ┌──────────────────────┐
    │   while True:         │
    │   ├─ sleep(60)        │
    │   ├─ probe(peer)      │
    │   └─ decide(alive)    │
    └────────┬─────────────┘
             │
     ┌───────┴────────┐
     ▼                ▼
  alive           fail
  │                  │
  reset fails       fails++
  │                  │
  (静默)        reaches 5?
                      │
                      ▼
                ┌──────────┐
                │ kickstart │
                │  + cooldown│
                └──────────┘
```

## 状态机

```
IDLE ─probe→ HEALTHY ─probe→ HEALTHY
                │
                ↓ probe fail
                HEALTHY → DEGRADED (fails=1)
                              │
                              ↓ probe fail
                              DEGRADED (fails=2)
                              ...
                              DEGRADED (fails=5)
                                              │
                                              ↓
                                              TRIGGERED (cooldown 5min)
                                                              │
                                                              ↓ cooldown end
                                                              HEALTHY
```

## 相关

- 模板: [`prompts/monitoring/watchdog.md`](../prompts/monitoring/watchdog.md)
- 案例: [`prompts/monitoring/examples.md`](../prompts/monitoring/examples.md)
- 实际脚本: `~/.local/bin/buddywatch.py`
- launchd 教程: [Apple 官方](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html)