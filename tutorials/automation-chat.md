# 教程：chat-platforms（多渠道 IM 推送）

> 适用：把消息推到飞书 / 企微 / Slack / Telegram / Discord

## 何时用

- ✅ 你需要把脚本输出推送到多个平台
- ✅ 你要给企业团队建机器人
- ✅ 你要做 CI/CD 通知
- ❌ 给个人微信推（用 QQ bot 或 iLink）
- ❌ 不需要通知（用 cron local）

## 30 秒上手

### 飞书（最常用）

```bash
curl -X POST "$FEISHU_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg c "$MSG" '{
    msg_type: "interactive",
    card: {
      header: {title: {tag: "plain_text", content: "标题"}, template: "blue"},
      elements: [{tag: "div", text: {tag: "lark_md", content: $c}}]
    }
  }')"
```

### 企微

```bash
curl -X POST "$WECOM_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg c "$MSG" '{msgtype:"markdown",markdown:{content:$c}}')"
```

### Slack

```bash
curl -X POST "$SLACK_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg c "$MSG" '{blocks:[{type:"section",text:{type:"mrkdwn",text:$c}}]}')"
```

## 平台速查

| 平台 | URL 格式 | Markdown | 限制 |
|------|---------|----------|------|
| **飞书** | `https://open.feishu.cn/open-apis/bot/v2/hook/<token>` | lark_md（最丰富） | 30KB / 条 |
| **企微** | `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=<key>` | 有限（不支持表格） | 4KB / 条 |
| **Slack** | `https://hooks.slack.com/services/...` | mrkdwn（`*bold*`） | 40KB / 条 |
| **Telegram** | `https://api.telegram.org/bot<token>/sendMessage` | MarkdownV2（需转义） | 4096 char |
| **Discord** | `https://discord.com/api/webhooks/...` | markdown | 2000 char |

## 实战：5 个场景

### 场景 1：A 股监控推飞书（带卡片）

```bash
REPORT=$(python3 ~/.local/bin/stock_push.py)

# 转成飞书卡片
PAYLOAD=$(jq -n --arg c "$REPORT" '{
  msg_type: "interactive",
  card: {
    header: {
      title: {tag: "plain_text", content: "A 股监控"},
      template: "blue"
    },
    elements: [
      {tag: "div", text: {tag: "lark_md", content: $c}},
      {tag: "hr"},
      {tag: "note", elements: [{tag: "plain_text", content: "Hermes Agent"}]}
    ]
  }
}')

curl -X POST "$FEISHU_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
```

效果：
- 蓝色卡片，标题"A 股监控"
- 内容是 A 股报告
- 底部"Hermes Agent"备注

### 场景 2：企微（无表格）— 转列表

企微 markdown 不支持表格。A 股报告里有表格，需要转换：

```python
def table_to_list(table_md):
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
    return "\n---\n".join(items)
```

### 场景 3：Slack（mrkdwn 不是 markdown）

```text
Slack 用 *bold*（不是 **bold**）
Slack 用 _italic_
Slack 用 `code` 或 ```code```
Slack 不支持表格
```

### 场景 4：Telegram（需要转义）

Telegram MarkdownV2 需要转义：
```python
import re
def escape_md2(s):
    return re.sub(r'([_*\[\]()~`>#+\-=|{}.!])', r'\\\1', s)
```

### 场景 5：多渠道 fan-out

```bash
#!/usr/bin/env bash
REPORT=$(python3 ~/.local/bin/stock_push.py)

# 飞书
curl -X POST "$FEISHU_WEBHOOK" -H "Content-Type: application/json" \
  -d "$(jq -n --arg c "$REPORT" '{msg_type:"interactive",card:{header:{title:{tag:"plain_text",content:"A 股"}},elements:[{tag:"div",text:{tag:"lark_md",content:$c}}]}}')"

sleep 2

# 企微（列表形式）
WECOM=$(echo "$REPORT" | table_to_list)
curl -X POST "$WECOM_WEBHOOK" -H "Content-Type: application/json" \
  -d "$(jq -n --arg c "$WECOM" '{msgtype:"markdown",markdown:{content:$c}}')"

sleep 2

# Slack
curl -X POST "$SLACK_WEBHOOK" -H "Content-Type: application/json" \
  -d "$(jq -n --arg c "$REPORT" '{blocks:[{type:"section",text:{type:"mrkdwn",text:$c}}]}')"
```

## 错误处理

```python
def safe_send(webhook, payload, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(
                webhook,
                data=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"}
            )
            urllib.request.urlopen(req, timeout=10)
            return True
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(60 * (i + 1))   # 退避
            elif e.code in (401, 403):
                notify_admin(f"webhook token 失效")
                return False
            elif e.code == 400:
                # 消息格式错，简化内容
                payload["text"] = payload.get("text", "")[:1000]
                time.sleep(2)
            else:
                time.sleep(5)
    return False
```

## 安全提示

⚠️ **Webhook URL 不要提交到 git** — 用 `.env`
```bash
# .env
FEISHU_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/abc...
WECOM_WEBHOOK=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx
SLACK_WEBHOOK=https://hooks.slack.com/services/T000/B000/XXX
```

```bash
# .gitignore
.env
```

## 流程图

```
   source content
        │
        ▼
   ┌─────────┐
   │  格式化  │  按平台 markdown 转
   └────┬────┘
        │ formatted payload
        ▼
   ┌─────────┐
   │  safe_send  │  retry + backoff
   └────┬────┘
        │
   ┌────┴──────────────┐
   ▼       ▼       ▼     ▼
飞书   企微   Slack   Telegram
```

## 反例

### 反例 1：webhook 写死在脚本

```bash
# ❌ 错
WEBHOOK="https://hooks.slack.com/services/T000/B000/XXX"
curl -X POST "$WEBHOOK" ...

# 提交到 git 就泄露了
```

**改**：用环境变量或 `.env`

### 反例 2：每个事件推所有平台

```python
# ❌ 错
for platform in [feishu, wecom, slack, qqbot]:
    send(platform, msg)
# 用户收到 5 条
```

**改**：单渠道 + 用户偏好

### 反例 3：消息超限

```python
# ❌ 错
send(webhook, very_long_text)
# 飞书 30KB 限
```

**改**：检测长度 → 截断或分块

## 相关

- 模板: [`prompts/automation/chat-platforms.md`](../prompts/automation/chat-platforms.md)
- 案例: [`prompts/automation/chat-examples.md`](../prompts/automation/chat-examples.md)
- 飞书机器人: https://open.feishu.cn/document/client-docs/bot-v3/add-custom-bot
- 企微机器人: https://developer.work.weixin.qq.com/document/path/91770
- Slack Block Kit: https://api.slack.com/block-kit