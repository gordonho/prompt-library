# 飞书 / 企微 / Slack 机器人 Prompt

> 通过 webhook 或 SDK 给企业内部 IM 发消息时用。

---

## 飞书机器人（自定义机器人 webhook）

```text
# 任务
通过飞书自定义机器人 webhook 发消息到指定 chat。

# Webhook 格式
URL: https://open.feishu.cn/open-apis/bot/v2/hook/<token>
Method: POST
Body: {"msg_type": "interactive", "card": {...}}

# 消息类型
- text: 纯文本
- post: 富文本（带 link）
- interactive: 卡片（推荐，最好看）

# interactive 卡片模板
{
  "msg_type": "interactive",
  "card": {
    "header": {
      "title": {"tag": "plain_text", "content": "[标题]"},
      "template": "blue"  // blue / green / red / orange / purple / grey
    },
    "elements": [
      {
        "tag": "div",
        "text": {"tag": "lark_md", "content": "[markdown 内容]"}
      },
      {
        "tag": "hr"
      },
      {
        "tag": "note",
        "elements": [
          {"tag": "plain_text", "content": "[来源] · [时间]"}
        ]
      },
      {
        "tag": "action",
        "actions": [
          {
            "tag": "button",
            "text": {"tag": "plain_text", "content": "查看详情"},
            "url": "[链接]",
            "type": "primary"
          }
        ]
      }
    ]
  }
}

# 使用
curl -X POST "$WEBHOOK" \
  -H "Content-Type: application/json" \
  -d @card.json

# 限制
- 单条消息最大 30KB
- 每分钟最多 100 条/群
- 卡片元素最多 50 个
```

---

## 企业微信机器人

```text
# Webhook 格式
URL: https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=<key>
Method: POST

# 消息类型
- text: 文本
- markdown: markdown（只支持部分语法）
- news: 图文
- template_card: 模板卡片

# markdown 模板
{
  "msgtype": "markdown",
  "markdown": {
    "content": "## [标题]\n> [引用]\n\n**加粗** [链接](url)\n\n- 列表 1\n- 列表 2"
  }
}

# 注意：企微 markdown 不支持表格、图片、代码块
```

---

## Slack 机器人（Incoming Webhook）

```text
# URL
https://hooks.slack.com/services/<workspace>/<channel>/<token>

# Block Kit 模板
{
  "blocks": [
    {
      "type": "header",
      "text": {"type": "plain_text", "text": "[标题]"}
    },
    {
      "type": "section",
      "text": {"type": "mrkdwn", "text": "*[markdown]*"}
    },
    {"type": "divider"},
    {
      "type": "context",
      "elements": [
        {"type": "mrkdwn", "text": "[来源] · [时间]"}
      ]
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "查看"},
          "url": "[link]"
        }
      ]
    }
  ]
}

# mrkdwn 限制
- bold 用 *text*（不是 **text**）
- italic 用 _text_
- code 用 `text` 或 ```text```
- 不支持表格
```

---

## 通用：选择消息平台

| 平台 | 优点 | 缺点 |
|------|------|------|
| **微信 iLink** | 私人通信友好 | 限流严 |
| **QQ bot** | 无限制推送 | 仅 QQ 用户 |
| **飞书** | 企业首选，卡片漂亮 | 需要 admin 装 bot |
| **企微** | 国内企业普及 | markdown 限制 |
| **Slack** | 国际化好 | 国内访问慢 |
| **Telegram** | 无限制 | 国内访问受限 |
| **Discord** | 社区/游戏用 | 商务场景少 |

---

## 实战案例：A 股推送（同时推飞书 + 企微）

```bash
#!/usr/bin/env bash
# 多渠道发送
REPORT=$(python3 ~/.local/bin/stock_push.py)

# 飞书
curl -X POST "$FEISHU_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg c "$REPORT" '{msg_type:"interactive",card:{header:{title:{tag:"plain_text",content:"A 股监控"},template:"blue"},elements:[{tag:"div",text:{tag:"lark_md",content:$c}}]}}')"

# 企微
curl -X POST "$WECOM_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg c "$REPORT" '{msgtype:"markdown",markdown:{content:$c}}')"
```

---

## 失败处理

| 错误 | 处理 |
|------|------|
| HTTP 429 (rate limit) | 退避 + 重试 |
| HTTP 401 (token 失效) | 重新 oauth |
| HTTP 400 (消息格式错) | 简化内容再发 |
| 网络超时 | 30s 重试 3 次，仍失败记日志 |

---

## 安全提示

- ⚠️ Webhook URL **不要提交到 git**（用 .env）
- ⚠️ 测试 webhook 不要发到生产群
- ⚠️ 大批量推送要分批，每批间隔 5-10s