# 教程：sync-notion-obsidian（同步到 Notion / Obsidian）

> 适用：把内容保存到 Notion 数据库 / Obsidian vault

## 何时用

- ✅ 保存公众号文章到本地 Obsidian
- ✅ 同步日记到 Notion（团队可见）
- ✅ 跨平台双向同步
- ❌ 一次性保存（直接用 `write_file`）
- ❌ 不希望同步的内容（私密度高）

## 30 秒上手

### 保存到 Obsidian 本地

```python
import os
from datetime import datetime

vault = os.path.expanduser("~/Documents/ObsidianVault")
folder = "Articles"
filename = f"{datetime.now().strftime('%Y-%m-%d')}-title-slug.md"
path = os.path.join(vault, folder, filename)

content = f"""---
title: {title}
date: {datetime.now().strftime('%Y-%m-%d')}
tags: [{tags}]
source: {source}
url: {url}
---

{body}
"""

os.makedirs(os.path.dirname(path), exist_ok=True)
with open(path, "w") as f:
    f.write(content)
```

### 写入 Notion

```python
import urllib.request, json

NOTION_TOKEN = os.environ["NOTION_TOKEN"]
DATABASE_ID = "..."

body = {
    "parent": {"database_id": DATABASE_ID},
    "properties": {
        "Title": {"title": [{"text": {"content": title}}]},
        "Date": {"date": {"start": "2026-07-25"}},
        "Tags": {"multi_select": [{"name": t} for t in tags]},
        "URL": {"url": url},
    },
    "children": [...]  # block list
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
urllib.request.urlopen(req, timeout=10)
```

## 实战：保存一篇文章

### 步骤

```
1. 抓文章（用 wx_article.py）
2. 解析（title, body, date, source, url）
3. 写到 Obsidian（带 frontmatter）
4. 同步到 Notion
```

### 示例 prompt 给 LLM

```text
# 任务
把 https://mp.weixin.qq.com/s/XXX 这篇公众号文章保存到 Obsidian + Notion

# Obsidian
vault: ~/Documents/ObsidianVault
folder: Articles
filename: 2026-07-25-title-slug.md
frontmatter:
  title, date, tags, source, url

# Notion
database: Articles
properties:
  Title, Date, Tags, Source, URL

# 输出
- Obsidian 本地路径
- Notion page URL
- 两边都验证存在
```

## 同步策略

### 单向（简单）

Obsidian 主写，定期 push 到 Notion：

```python
# 每小时检查 Obsidian 新文件 → push 到 Notion
import time, os
seen = set()

while True:
    for path in glob("~/Documents/ObsidianVault/Articles/*.md"):
        if path not in seen:
            push_to_notion(path)
            seen.add(path)
    time.sleep(3600)
```

### 双向（复杂）

需要去重 + 冲突解决：

```python
# 用 frontmatter notion_id 做幂等键
def should_push(local_path):
    fm = parse_frontmatter(local_path)
    if "notion_id" not in fm:
        return True
    # 检查 Notion 端 modified time vs 本地 modified time
    notion_mod = get_notion_modified(fm["notion_id"])
    local_mod = os.path.getmtime(local_path)
    return local_mod > notion_mod
```

## 冲突解决

| 本地有更新 | Notion 有更新 | 默认行为 |
|----------|---------------|---------|
| ✅ | ❌ | 推 Notion |
| ❌ | ✅ | 拉本地 |
| ✅ | ✅ | 提示用户选 |

## 实战：vault 结构

```
~/Documents/ObsidianVault/
├── 0-Inbox/              # 临时收件
│   └── 2026-07-25-clip.md
├── Daily/                # 每日笔记
│   └── 2026-07-25.md
├── Articles/             # 收藏的文章
│   └── 2026-07-23-MacBook-7B-GPT5.md
├── Projects/             # 长期项目
│   └── prompt-library/
│       └── notes.md
├── Reference/            # 参考资料
│   └── Prompt 模板.md
├── Templates/            # 模板
│   ├── article.md
│   ├── daily.md
│   └── project.md
└── Index.md              # 索引
```

## frontmatter 模板

### 文章
```yaml
---
title: 我用同一台 MacBook，把 7B 小模型跑出了 GPT-5 的效果
date: 2026-07-23
tags: [AI, Prompt, 小模型, 7B]
source: 公众号
url: https://mp.weixin.qq.com/s/XXX
---

# 标题

## 摘要

[3-5 句话]

## 核心要点

1. ...
2. ...
3. ...

## 原文引用

[引用关键段]

## 我的笔记

[comment]
```

### 日记
```yaml
---
date: 2026-07-25
mood: 😐
weather: ☀️
---

# 2026-07-25

## 今天做了什么
- ...

## 学到什么
- ...

## 明天计划
- ...
```

## 反例

### 反例 1：覆盖原文件

```python
# ❌ 错
with open(path, "w") as f:
    f.write(content)
# 不检查文件是否存在
```

**改**：先 `os.path.exists()` → 给用户提示

### 反例 2：硬编码 vault 路径

```python
# ❌ 错
vault = "~/Documents/MyVault"
```

**改**：用环境变量 `OBSIDIAN_VAULT` 或读 `~/.config/obsidian/config.json`

### 反例 3：把 markdown 转 Notion blocks 漏掉代码块

```python
# ❌ 错：直接当 paragraph 写
{"type": "paragraph", "text": "```python\nprint('hi')\n```"}

# ✅ 对：用 code block
{"type": "code", "language": "python", "text": "print('hi')"}
```

## 流程图

```
   source URL / file
        │
        ▼
   ┌─────────┐
   │  parse  │  抓 / 解析
   └────┬────┘
        │ dict
        ▼
   ┌──────────────────────────┐
   │  同步                       │
   │  ├─ write Obsidian file    │
   │  └─ push Notion page       │
   └──────────────┬─────────────┘
                  │
                  ▼
          ┌──────────────┐
          │  验证两边     │
          │  返回 URL      │
          └──────────────┘
```

## 相关

- 模板: [`prompts/automation/sync-notion-obsidian.md`](../prompts/automation/sync-notion-obsidian.md)
- 案例: [`prompts/automation/sync-examples.md`](../prompts/automation/sync-examples.md)
- Obsidian 官方: https://obsidian.md/
- Notion API: https://developers.notion.com/