# web-article / extraction 实战案例

---

## 案例 1：微信公众号文章（mp.weixin.qq.com）

### 输入
```bash
python3 ~/.local/bin/wx_article.py "https://mp.weixin.qq.com/s/ABC123" --keyword "中山大学"
```

### 期望输出
```
📰 **工科热门，医科遇冷！广东高考本科批次投档线出炉**
📨 公众号: 南方日报
🕐 发布: 2026-07-19 23:59:44
🔗 https://mp.weixin.qq.com/s/ABC123

📄 正文摘要（前 8 段）
  · 7月19日...
  · 记者梳理发现...

🔍 关键词 '中山大学' 出现 3 次
  · 历史类中，**中山大学**依旧稳居首位，投档最低分为615分...
  · **中山大学**以2分之差紧随其后，投档最低分为625分...
```

### 关键实现
- og:title 优先（公众号文章的元数据在 JS 里）
- nickname 是 JSON-escaped：`nickname=\x22...\x22`
- publish_time 是 URL-encoded：`%22publish_time%22%3A1784346712%7D`

---

## 案例 2：A 股日报（已经稳定跑）

### 输出
```
⏰ 推送 #34 · 10:46:30
🇨🇳 A股实时监控 · 2026-07-09

📐 价阈值 ±5% · 信号阈值 BUY≥2.5 / SELL≤-2.5

```                                               
代码         名称          价     涨% MA5/10/20    RSI  MACD  信号
sh600036   招商银行    37.72 -0.58%⬇ 37.33/36.67/37.42   55  +0.28  🟢 BUY
...
```

### 关键代码
- Sina K-line: `http://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=sh600036&scale=240&ma=no&datalen=60`
- 实时: `https://hq.sinajs.cn/list=sh600036,sz002001,...`
- 60 天历史 → MA5/10/20、RSI、MACD、BOLL

---

## 案例 3：广东考试院官方 PDF 监控

### 流程
1. 抓 PTGK 索引页（`https://eea.gd.gov.cn/ptgk/index.html`）
2. 抓 li 列表，提取 post_id + 标题
3. 已发布 → 跳过；新发布且命中"投档线"关键词 → 推
4. 抓正文 + 4 个 PDF 附件链接
5. 推送给用户

### 实际命中（2026-07-18 测试）
```
⏰ 14:12:47 · 共发现 2 篇投档线相关新文章
🎓 广东高考投档线 · 新通知
📌 我省2026年提前批本科普通类军检、面试院校和非军检、面试院校征集志愿投档情况
🕐 发布时间：2026-07-16 18:02:30
🔗 https://eea.gd.gov.cn/ptgk/content/post_4925965.html

📎 附件链接（共 4 个）
  · https://eea.gd.gov.cn/attachment/0/619/619892/4925965.pdf
  · ...
```

### 关键点
- 标题有 `<span class="line"></span>` 嵌套（用 strip tags 解决）
- URL 是**完整**不是相对：`href="https://eea.gd.gov.cn/ptgk/content/post_XXX.html"`
- 文章数据在 HTML 里（不需 JS 渲染）

---

## 案例 4：关键词搜索（"中山大学" + "投档线"）

### 工具组合
```bash
# 单篇：直接传 URL
python3 ~/.local/bin/wx_article.py <URL> --keyword 中山大学

# 公众号发现：手动给 URL（搜索引擎不索引公众号文章）
```

### 实战
用户：「https://mp.weixin.qq.com/s/zSB28PR6e9Oc2eSHtHC_nQ」

实际跑出来：
- 标题：工科热门，医科遇冷！广东高考本科批次投档线出炉
- 中山大学出现 3 次（命中用户的关键词）
- 历史类：615 分，省排 1446 位
- 物理类：625 分

### 限制
- Bing/搜狗 搜索引擎对公众号文章索引不全
- 必须用户提供 URL
- 反爬偶尔触发

---

## 反例

### 反例 1：抓 HTML 不去 script

```python
# ❌ 错
text = re.search(r"<body>(.*)</body>", html)
# 含大量 JS 代码
```

### 错例 2：硬编码相对 URL
```python
# ❌ 错：有的页面 URL 是 https://x.com/，有的可能是 /x/
href = re.search(r'href="(/ptgk/.*)"', html)
# 漏抓 https:// 形式
```

### 反例 3：每段都截断
```python
# ❌ 错
parts[:8]   # 永远 8 段，可能错过关键信息
```
**改**：根据内容长度动态取，或用 token 计数。

---

## 工具脚本索引

| 文件 | 用途 |
|------|------|
| `~/.local/bin/wx_article.py` | 微信公众号单文章抓取 |
| `~/.local/bin/gk_monitor.py` | 广东考试院 PTGK 监控 |
| `~/.local/bin/stock_push.py` | A 股实时推送 |
| `~/.local/bin/stock_eod.py` | A 股收盘日报 |
| `~/.local/bin/stock_premarket.py` | A 股集合竞价 |
| `~/.local/bin/buddywatch.py` | Hermes ↔ OpenClaw watchdog |
| `~/.local/bin/claw` | Hermes → OpenClaw 跨调 wrapper |