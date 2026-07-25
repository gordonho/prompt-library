# chat-platforms 实战案例

---

## 案例 1：飞书机器人推送 A 股监控

### 输入
```bash
REPORT=$(python3 ~/.local/bin/stock_push.py)

curl -X POST "$FEISHU_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg c "$REPORT" '{
    msg_type: "interactive",
    card: {
      header: {
        title: {tag: "plain_text", content: "A 股监控"},
        template: "blue"
      },
      elements: [
        {tag: "div", text: {tag: "lark_md", content: $c}},
        {tag: "hr"},
        {tag: "note", elements: [{tag: "plain_text", content: "Hermes Agent · 实时推送"}]}
      ]
    }
  }')"
```

### 期望效果
- 飞书群收到一张蓝色卡片
- 顶部标题"A 股监控"
- 正文是 A 股实时报告
- 底部备注"来源：Hermes Agent"

---

## 案例 2：企业微信机器人（无 markdown 表格）

### 难题
企微 markdown 不支持表格，但 A 股报告里有表格。

### 解决
转成列表：
```python
def table_to_list(table_md):
    """把 markdown 表格转成企微兼容的列表"""
    lines = table_md.split("\n")
    rows = [l for l in lines if l.startswith("|") and "---" not in l]
    headers = [h.strip() for h in rows[0].split("|") if h.strip()]
    items = []
    for r in rows[1:]:
        cells = [c.strip() for c in r.split("|") if c.strip()]
        item = ""
        for h, c in zip(headers, cells):
            item += f"**{h}**: {c}\n"
        items.append(item)
    return "\n".join(items)
```

### 推送
```bash
WECOM_CONTENT=$(echo "$REPORT" | table_to_list)

curl -X POST "$WECOM_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg c "$WECOM_CONTENT" '{msgtype:"markdown",markdown:{content:$c}}')"
```

---

## 案例 3：Slack Block Kit（多渠道并行）

### 输入
```python
import json
import urllib.request

def slack_post(report):
    payload = {
        "blocks": [
            {"type": "header", "text": {"type": "plain_text", "text": "A 股监控"}},
            {"type": "section", "text": {"type": "mrkdwn", "text": report}},
            {"type": "divider"},
            {"type": "context", "elements": [
                {"type": "mrkdwn", "text": f"Hermes Agent · {time.strftime('%H:%M')}"}
            ]},
            {"type": "actions", "elements": [
                {"type": "button", "text": {"type": "plain_text", "text": "查看完整"},
                 "url": "https://finance.sina.com.cn"}
            ]}
        ]
    }
    req = urllib.request.Request(
        SLACK_WEBHOOK,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"}
    )
    urllib.request.urlopen(req, timeout=10)
```

### 注意
- Slack mrkdwn 用 `*text*` 不是 `**text**`
- italic 用 `_text_`
- 代码用 `` `text` `` 或 ```text```

---

## 案例 4：Telegram 机器人（简单）

```bash
# Telegram Bot API
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_CHAT_ID="..."

curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg c "$REPORT" '{
    chat_id: env.TELEGRAM_CHAT_ID,
    text: $c,
    parse_mode: "MarkdownV2"
  }')"

# 注意：MarkdownV2 需要转义：_*[]()~`>#+-=|{}.!
```

---

## 案例 5：多渠道 fan-out

```bash
#!/usr/bin/env bash
REPORT=$(python3 ~/.local/bin/stock_push.py)

# 飞书
curl -X POST "$FEISHU_WEBHOOK" -H "Content-Type: application/json" \
  -d "$(jq -n --arg c "$REPORT" '{msg_type:"interactive",card:{header:{title:{tag:"plain_text",content:"A 股"}},elements:[{tag:"div",text:{tag:"lark_md",content:$c}}]}}')"

sleep 2

# 企微（用 list 形式）
WECOM=$(echo "$REPORT" | table_to_list)
curl -X POST "$WECOM_WEBHOOK" -H "Content-Type: application/json" \
  -d "$(jq -n --arg c "$WECOM" '{msgtype:"markdown",markdown:{content:$c}}')"

sleep 2

# Slack
curl -X POST "$SLACK_WEBHOOK" -H "Content-Type: application/json" \
  -d "$(jq -n --arg c "$REPORT" '{blocks:[{type:"section",text:{type:"mrkdwn",text:$c}}]}')"
```

---

## 反例

### 反例 1：WebHook URL 写死在脚本里

```bash
# ❌ 错
curl -X POST "https://hooks.slack.com/services/T00000000/B00000000/XXX" ...
```

**改**：用 `.env` 或环境变量

### 反例 2：每个事件都全渠道

```python
# ❌ 错
for platform in [feishu, wecom, slack, qqbot, wechat]:
    send(platform, msg)
# 用户收到 5 条一样的
```

**改**：单渠道 + 用户偏好

### 反例 3：消息大小超限

```python
# ❌ 错
message = "...100KB..."
send(message)
# 飞书会 400
```

**改**：
- 飞书：30KB 限
- Slack：40KB 限
- 企微：4KB 限
- 超长消息分块或截断

---

## 错误处理模板

```python
def safe_send(platform, msg, retries=3):
    for i in range(retries):
        try:
            send(platform, msg)
            return True
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(60 * (i + 1))  # rate limit 退避
            elif e.code in (401, 403):
                notify_admin(f"{platform} token 失效")
                return False
            else:
                time.sleep(5)
    notify_admin(f"{platform} 推送 {retries} 次仍失败")
    return False
```