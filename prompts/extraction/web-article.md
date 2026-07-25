# 数据提取 / 文章分析 Prompt

> 抓取网页 / PDF / 公众号文章 / 表格后抽取结构化信息时用。

---

## 微信公众号文章提取

```text
# 任务
从微信公众号文章 URL 中提取以下字段：
- 标题（从 og:title / <title> 取）
- 公众号昵称（从 nickname JSON 字段取）
- 发布时间（从 publish_time unix ts 取，转 YYYY-MM-DD HH:MM:SS）
- 正文（从 id="js_content" 容器取，去 script/style/HTML 标签）
- 含关键词 [KEYWORD] 的段落高亮

# 输出格式
📰 **标题**
📨 公众号: [nickname]
🕐 发布: [YYYY-MM-DD HH:MM:SS]
🔗 [URL]

📄 正文摘要（前 N 段）
  · [段落 1]
  · [段落 2]

🔍 关键词 '[KEYWORD]' 出现 [X] 次
  · 含关键词段落预览: ...

# 抓取要点
- User-Agent 用 macOS Safari 16
- 接受 zh-CN
- 公众号文章的 nickname 字段是 JSON-escaped: \x22 ... \x22
- publish_time 是 URL-encoded: %22publish_time%22%3A[ts]
- ts 是 unix 秒（10 位）或毫秒（13 位）

# 不要做
- 不要执行 JS
- 不要爬 article 之外的内容（不抓其他公众号、不抓广告）
- 不要猜测缺失字段（找不到就写 "?"）
```

---

## PDF 表格抽取（学术/政策/财务）

```text
# 任务
PDF 文件 [PATH] 中第 [X] 页是 [table description] 表格，请抽取所有行。

# 字段定义
[列出每列的含义，例如：
- 院校代码（6 位数字）
- 院校名称
- 专业组代码
- 投档最低分
- 投档最低排位
- 计划数
- 备注]

# 输出格式
CSV 格式（逗号分隔），首行是字段名。
例：
院校代码,院校名称,专业组代码,投档最低分,投档最低排位,计划数
10001,北京大学,201,690,150,12
...

# 抽取规则
- 用 pdftotext -layout 保留列对齐
- 多页表格拼接成一整个
- 缺失字段写 -1
- 复杂表头（合并单元格）写 "见原 PDF"

# 自检
- [ ] 行数与原 PDF 一致？
- [ ] 数值字段是数字（非中文逗号）？
- [ ] 院校代码是 6 位？
- [ ] 排位是 1-20000 之间？
```

---

## A 股行情综合判定 Prompt

```text
# 任务
基于实时报价 + 60 天 K 线 + 技术指标，给出 6 只 A 股的 BUY / SELL / HOLD 信号。

# 输入
实时数据（Sina）：
- 当前价、开、高、低、量、额、昨收

历史数据（60 天）：
- MA5 / MA10 / MA20 / MA60
- RSI(14)
- MACD(12, 26, 9)
- BOLL(20, 2)

# 信号打分（每项 ±0.5 到 ±2 分）
1. 价 vs MA20：突破 = +1，跌破 = -1
2. MA5 vs MA10：金叉 = +1，死叉 = -1
3. MACD 柱：正 = +1，负 = -1
4. RSI：>=75 超买 -1.5，<=25 超卖 +1.5，>=60 +0.5，<=40 -0.5
5. 当日涨跌：跨 ±5% 加 ±1
6. BOLL 触轨：触上轨 -0.5，触下轨 +0.5

# 决策
- score >= +2.5 → 🟢 BUY
- score <= -2.5 → 🔴 SELL
- 其它 → 🟡 HOLD

# 输出格式
代码 | 名称 | 价 | 涨跌% | MA5/10/20 | RSI | MACD柱 | 信号

🚨 触发详情（只列 BUY/SELL）
**{name}** {signal} · score=±X.X
  · 价 [price]
  · 判据: ...

⚠️ 数据仅供参考，不构成投资建议
```

---

## 关键词监控 + 推送 Prompt

```text
# 任务
每 [N] 分钟扫描 [URL] 列表，看是否有新文章含关键词 [KEYWORDS]。

# 扫描方式
- 抓 [INDEX_URL]，解析文章列表（id + title + 日期）
- 跟 state 文件对比，发现新文章则触发
- 新文章的 title 命中 [KEYWORDS] 中的任何一个 → 推送给用户
- 其它新文章 → 静默

# 推送格式
🎓/🤖/📰 **新通知**
⏰ [timestamp]

📌 **[title]**
🕐 发布: [date]
🔗 [url]

📄 正文摘要
  · [para 1]
  · [para 2]

📎 附件（如有）
  · [pdf/xlsx link]

# 不要做
- 已推送过的不要再推（state 持久化）
- 静默时不要给用户任何信号
- 抓取失败时 stderr 写一行 JSON 给 log 即可
```