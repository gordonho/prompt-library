# sync-notion-obsidian 实战案例

---

## 案例 1：保存公众号文章到 Obsidian

### 输入
```
任务：把 https://mp.weixin.qq.com/s/pMfEKjZhJTTy74sMGRO70A 这篇文章保存到 Obsidian

# Obsidian vault
vault: ~/Documents/ObsidianVault
folder: Articles

# 文件名（按 YYYY-MM-DD-slug）
filename: 2026-07-23-MacBook-7B-GPT5.md

# frontmatter
title: 我用同一台 MacBook，把 7B 小模型跑出了 GPT-5 的效果
date: 2026-07-23
tags: [AI, Prompt, 小模型, 7B]
source: 公众号
url: https://mp.weixin.qq.com/s/pMfEKjZhJTTy74sMGRO70A

# 内容
[summarized content]
```

### 期望文件
```markdown
---
title: 我用同一台 MacBook，把 7B 小模型跑出了 GPT-5 的效果
date: 2026-07-23
tags: [AI, Prompt, 小模型, 7B]
source: 公众号
url: https://mp.weixin.qq.com/s/pMfEKjZhJTTy74sMGRO70A
---

# 我用同一台 MacBook，把 7B 小模型跑出了 GPT-5 的效果

## 摘要

3 招 Prompt 模板，让 7B 模型准确率从 53% 跳到 87%。

## 核心 3 招

1. 结构化拆解（4 段式输出）
2. 自我一致性（投票）
3. 自我反思（让模型当自己的对手方）

[...full content...]
```

### 操作
```bash
mkdir -p ~/Documents/ObsidianVault/Articles
write_file /Users/gordon/Documents/ObsidianVault/Articles/2026-07-23-MacBook-7B-GPT5.md "[content]"
```

---

## 案例 2：Notion 数据库批量写入

### 输入
```
任务：把以下 3 篇文章写入 Notion database "Articles"

# schema
Title (title)
Date (date)
Source (select)
Tags (multi_select)
URL (url)

# 文章列表
1. title=..., date=2026-07-19, source=公众号, tags=[AI, 高考]
2. title=..., date=2026-07-22, source=公众号, tags=[AI, 工信部]
3. title=..., date=2026-07-23, source=公众号, tags=[AI, Prompt]
```

### 期望
- 3 个 page 在 Articles database 创建
- 每个 page 有 properties 和内容
- 返回 3 个 URL

### 实现
```python
import urllib.request, json

NOTION_TOKEN = "secret_..."
DATABASE_ID = "..."

def create_page(title, date, source, tags, url):
    body = {
        "parent": {"database_id": DATABASE_ID},
        "properties": {
            "Title": {"title": [{"text": {"content": title}}]},
            "Date": {"date": {"start": date}},
            "Source": {"select": {"name": source}},
            "Tags": {"multi_select": [{"name": t} for t in tags]},
            "URL": {"url": url},
        }
    }
    req = urllib.request.Request(
        "https://api.notion.com/v1/pages",
        data=json.dumps(body).encode(),
        headers={
            "Authorization": f"Bearer {NOTION_TOKEN}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
        }
    )
    return json.loads(urllib.request.urlopen(req, timeout=10).read())
```

---

## 案例 3：双向同步（Obsidian 主、Notion 镜像）

### 场景
你日常写 Obsidian，但公司同事只看 Notion。

### 流程
```
1. Obsidian 文件变更 → 检测 mtime
2. 转 markdown → Notion blocks
3. 推到 Notion（用 page_id 映射）
4. 失败时 retry 3 次
5. 成功后更新本地 metadata 标记已同步
```

### 关键设计
- **去重**：用 frontmatter `notion_id` 字段做幂等键
- **冲突**：默认以 Notion 为准（多人协作），但本地有更新则优先本地
- **失败隔离**：一个文件失败不影响其他文件

---

## 案例 4：日报同步（每天 23:00）

```bash
hermes cron create \
  --name "Obsidian 每日日报同步" \
  --schedule "0 23 * * *" \
  --deliver local \
  --prompt "把今天的日记 ~/Documents/ObsidianVault/Daily/$(date +%Y-%m-%d).md 同步到 Notion database 'Daily'，并返回 page URL。"
```

---

## 案例 5：从 Notion 拉回本地

### 输入
```
任务：从 Notion database "Articles" 拉所有 tag=AI 的 page，存到 Obsidian
```

### 期望
- 调 Notion query API 过滤 tag=AI
- 拉每篇 page 的内容
- 转 markdown 写 Obsidian
- 用 frontmatter `notion_id` 标记

---

## 反例

### 反例 1：覆盖原有文件

```python
# ❌ 错
with open(filename, "w") as f:
    f.write(content)
# 已有文件被覆盖
```

**改**：先检查文件存在 → 给用户选覆盖 / 改名

### 反例 2：硬编码 vault 路径

```python
# ❌ 错
vault = "~/Documents/MyVault"
```

**改**：
- 读 `~/.config/obsidian/config.json`
- 或问用户指定
- 或用环境变量 `OBSIDIAN_VAULT`

### 反例 3：同步所有 frontmatter

```yaml
# ❌ 错
---
notion_id: "abc-123"
notion_url: "https://..."
last_synced: "2026-07-23T10:00:00"
notion_last_modified: "2026-07-23T09:00:00"
---
# 太啰嗦，10 行 metadata 干扰阅读
```

**改**：只存 `notion_id` 一个字段，需要时再去 Notion 取详情。

---

## vault 结构建议

```
~/Documents/ObsidianVault/
├── 0-Inbox/                  # 临时收件
│   └── 2026-07-25-clip.md
├── Daily/                    # 每日笔记
│   └── 2026-07-25.md
├── Articles/                 # 收藏的文章
│   └── 2026-07-23-MacBook-7B-GPT5.md
├── Projects/                 # 长期项目
│   └── prompt-library/
│       └── notes.md
├── Reference/                # 参考资料
│   └── Prompt 模板.md
├── Templates/                # 模板
│   ├── article.md
│   ├── daily.md
│   └── project.md
└── Index.md                  # 索引
```