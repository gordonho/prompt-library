# watchdog 实战案例

---

## 案例 1：Hermes ↔ OpenClaw 互救 watchdog

### 背景
两个本地网关（Hermes、OpenClaw）都需要持续运行。
launchd KeepAlive 救不回来时（OOMC、JS hang），需要一个 watchdog 兜底。

### 关键设计
```python
INTERVAL = 60       # 秒
THRESHOLD = 5       # 连续失败
COOLDOWN = 300      # 重启后冷却

PEERS = {
    "hermes":    {"url": None, "cli": ["<abs path>", "status"], ...},
    "openclaw":  {"url": "http://127.0.0.1:18789/health", ...},
}
```

### 关键陷阱
- ❌ 用 `which hermes` 在 launchd 进程里会失败（PATH 不含 venv） → 用绝对路径
- ❌ 探针正常时也推送 → 完全静默
- ❌ 探针失败立即重启 → 累计 5 次 + 5 分钟冷却
- ❌ 多个 watchdog 互相监视 → 用 launchd 单实例 + 单 watchdog
- ❌ 跑 watchdog 用 cron 邮件 → watchdog 是常驻进程，知道连续失败

### 启动
```bash
# 注册到 launchd
launchctl load ~/Library/LaunchAgents/com.gordon.buddywatch.plist

# 看日志
tail -f ~/.local/log/buddywatch.log
```

---

## 案例 2：A 股价格触发报警

### 任务
当某只 A 股日内涨跌幅超过 ±5% 时推微信。

```python
import time
import urllib.request
import re

def quote():
    url = "https://hq.sinajs.cn/list=sh600519"
    req = urllib.request.Request(url, headers={"Referer": "https://finance.sina.com.cn"})
    text = urllib.request.urlopen(req, timeout=5).read().decode("gbk")
    p = re.search(r'"([^"]+)"', text).group(1).split(",")
    return {
        "open": float(p[1]),
        "prev_close": float(p[2]),
        "price": float(p[3]),
    }

while True:
    q = quote()
    change = (q["price"] - q["prev_close"]) / q["prev_close"] * 100
    if abs(change) >= 5:
        send_wechat(f"🚨 茅台 {change:+.2f}% 当前 {q['price']}")
        time.sleep(300)   # 冷却 5 分钟
    time.sleep(10)
```

### 改进（用 cron 而不是常驻进程）

```bash
schedule: */1 9-11,13-14 * * 1-5   # 每 1 分钟
# 因为没有 cooldown 概念，改为：
# 1 分钟跑一次，检查 change>=5% → 推
# 推送时记 state（最近推送时间），< 5 分钟不再推
```

---

## 案例 3：监控 + 升级通知

### 任务
监听某进程新版本，新版发布时推送。

```python
import urllib.request, json

def latest_version():
    req = urllib.request.Request("https://api.github.com/repos/foo/bar/releases/latest")
    return json.loads(urllib.request.urlopen(req, timeout=10).read())["tag_name"]

state = {"last_version": latest_version()}
while True:
    time.sleep(3600)   # 每小时
    cur = latest_version()
    if cur != state["last_version"]:
        send_wechat(f"🆕 新版本：{cur}")
        state["last_version"] = cur
```

### 同样更适合 cron
- 1 小时 1 次 cron
- 比常驻更稳定（OS 重启后自动恢复）
- 不需要自己维持 state 文件

---

## 反例：错的设计

### 反例 1：发邮件 + 短信 + Slack 多渠道

```python
# ❌ 错
def alert(msg):
    send_email(msg)
    send_sms(msg)
    send_slack(msg)
    send_wechat(msg)
    send_qq(msg)
```

**问题**：
- 重复推送
- 不同渠道时延
- 难以去重

**改**：单一渠道 + 在渠道内做 retry

### 反例 2：用 cron 跑 watchdog

```bash
# ❌ 错：每分钟跑 cron 检查
*/1 * * * * check_health.sh
```

**问题**：
- 每次跑是独立进程，state 难维护
- "连续失败" 概念无法实现
- 频繁启动进程开销

**改**：常驻进程 + launchd

### 反例 3：watchdog 监听 watchdog

```python
# ❌ 错
watchdog1 watches watchdog2
watchdog2 watches watchdog3
watchdog3 watches watchdog1
```

**问题**：
- 死锁
- 哪个 watchdog 来启动 launchd？

**改**：单一 watchdog + launchd 拉起 watchdog 本身