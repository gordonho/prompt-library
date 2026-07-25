# 教程：web-article（数据提取）

> 适用：从网页 / PDF / API 抓数据并整理为结构化文本

## 何时用

- ✅ 抓微信公众号文章（mp.weixin.qq.com）
- ✅ 抓政府 / 考试院 / 高校官网
- ✅ PDF 表格抽取（pdftotext + 解析）
- ✅ A 股实时数据 + 技术指标
- ✅ 监控关键词 + 推送

## 30 秒上手

### 抓微信公众号单篇文章

```bash
~/.local/bin/wx_article.py "https://mp.weixin.qq.com/s/XXX" --keyword "中山大学"
```

返回 markdown 报告，可直接推送。

### 抓政府网站列表（监控新文章）

```bash
~/.local/bin/gk_monitor.py
```

### A 股实时数据

```bash
~/.local/bin/stock_push.py
```

## 实战：4 种数据源

### 1. 微信公众号（mp.weixin.qq.com）

**关键技巧**：
- 标题在 `<meta og:title>` 不在 `<title>`
- 公众号昵称是 JSON-escaped：`nickname=\x22...\x22`
- 发布时间是 URL-encoded：`%22publish_time%22%3A1784346712%7D`

**反例**：
```python
# ❌ 错：抓标题用 <title>
title = re.search(r'<title>([^<]+)</title>', html)
# 公众号会拿到 description 或空白

# ❌ 错：抓 nickname 用 ASCII 引号
nick = re.search(r'"nickname":\s*"([^"]+)"', html)
# 公众号用的是 \x22 编码
```

### 2. 政府网站（如 eea.gd.gov.cn）

**关键技巧**：
- 列表在 `<ul class="list">` 里
- URL 可能是完整 `https://x.com/path` 也可能是相对 `/path`
- 文章结构在 HTML 里（不需 JS 渲染）

**实战**：
```python
# 抓列表
html = fetch("https://eea.gd.gov.cn/ptgk/index.html")
posts = re.findall(r'<li>.*?</li>', html, flags=re.S)
for li in posts:
    m = re.search(r'href="(?:https://eea\.gd\.gov\.cn)?(/ptgk/content/post_\d+\.html)"', li)
    ...
```

### 3. PDF 表格（pdftotext + 解析）

```bash
# 1. 安装
brew install poppler
pip install pdfplumber

# 2. 抽文本（保留列对齐）
pdftotext -layout input.pdf output.txt

# 3. 解析（python）
import pdfplumber
with pdfplumber.open("input.pdf") as pdf:
    for page in pdf.pages:
        tables = page.extract_tables()
        for t in tables:
            print(t)  # [[row1], [row2], ...]
```

### 4. A 股 Sina API

**实时**：
```python
url = "https://hq.sinajs.cn/list=sh600036,sz002001"
# 拿到: var hq_str_sh600036="name,open,prev_close,price,high,low,..."
```

**历史（60 天 EOD）**：
```python
url = "http://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=sh600036&scale=240&ma=no&datalen=60"
# JSON 数组，每条 {day, open, high, low, close, volume}
```

## 常见错误

| 错误 | 怎么改 |
|------|--------|
| 抓不到正文（只看到 JS） | 用 og:title / nickname=\x22 兜底 |
| HTML 标签还在文本里 | `re.sub(r'<[^>]+>', '\n', body)` |
| 时间格式混乱 | 统一转 `datetime` |
| CSV 列错位 | `pdftotext -layout` 保留对齐 |
| API 限流 | 加 retry + backoff |

## 实战：监控 + 推送完整流程

```bash
# 1. 抓 + 判定（脚本自动）
~/.local/bin/gk_monitor.py > /tmp/output.txt

# 2. 推（仅当有内容时）
if [ -s /tmp/output.txt ]; then
    ~/.local/bin/hermes send -t qqbot "$(cat /tmp/output.txt)"
fi
```

## 流程图

```
   URL / API / PDF
        │
        ▼
   ┌──────────┐
   │  fetch()  │  HTTP/curl/requests
   └────┬─────┘
        │ raw HTML/JSON/PDF text
        ▼
   ┌──────────┐
   │  parse()  │  正则 / JSON / pdfplumber
   └────┬─────┘
        │ dict {title, body, date, ...}
        ▼
   ┌──────────┐
   │  render() │  markdown 模板
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │  push    │  WeChat / QQ bot / Slack
   └──────────┘
```

## 状态机

```
IDLE → FETCH → PARSE → RENDER → PUSH → IDLE
                          │
                          └──(parse fail)→ ERROR (retry 3x)
                                              │
                                              └──(fail)→ ADMIN ALERT
```

## 相关

- 模板: [`prompts/extraction/web-article.md`](../prompts/extraction/web-article.md)
- 案例: [`prompts/extraction/examples.md`](../prompts/extraction/examples.md)
- 脚本: `~/.local/bin/wx_article.py` / `gk_monitor.py` / `stock_push.py`