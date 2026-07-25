# Notion / Obsidian 同步 Prompt

> Hermes Agent 把内容存进 Notion / Obsidian vault 时用。

---

## Notion 数据库写入

```text
# 任务
把以下内容写入 Notion 数据库 [database_name]。

# 数据库 schema
[列出字段，例如：
- Title (title 类型)
- Date (date 类型)
- Category (select: 工作 / 学习 / 生活)
- Tags (multi_select)
- Content (rich_text 或 page body)
- Status (select: 草稿 / 已发布)]

# 输入
title: [标题]
date: [YYYY-MM-DD]
category: [分类]
tags: [tag1, tag2, ...]
content: [正文 markdown / 富文本]
status: 草稿

# 流程
1. 用 notion-search 找 database_id
2. 用 notion-create-page 创建 page，parent=database_id
3. 设置 properties（title / date / category / tags / status）
4. 把 content 转成 Notion block，写入 page children
5. 返回 page URL

# 失败处理
- Database 找不到 → 列所有 database 让用户选
- 字段不匹配 → 先查 schema 再匹配
- API rate limit → 退避 60s 重试
- 内容超长 → 分块写入

# 不要做
- 不要修改现有 page（除非用户明确说要）
- 不要删除任何东西
- 不要修改 database schema
```

---

## Obsidian Vault 同步

```text
# 任务
把内容写到本地 Obsidian vault 路径 [vault_path]/[folder]/[filename].md

# vault 结构（典型）
~/Documents/ObsidianVault/
├── Daily/
│   └── 2026-07-25.md    (日记)
├── Projects/
│   └── prompt-library/
│       └── notes.md     (项目笔记)
├── Reference/
│   └── prompt模板.md
└── Index.md

# 输入
filename: [filename].md
folder: Daily / Projects / Reference
content: [正文 markdown]
frontmatter:
  title: [标题]
  date: [YYYY-MM-DD]
  tags: [tag1, tag2]
  source: [来源]

# 流程
1. 检查 folder 是否存在，不存在则创建
2. 用 YAML frontmatter 包装 content
3. 用 Write 工具写文件（覆盖模式）
4. 如已有同名文件 → 先 read，备份到 .bak，再写
5. 返回最终路径

# frontmatter 模板
---
title: [title]
date: [YYYY-MM-DD]
tags: [tags]
source: [source]
---

# 失败处理
- vault 路径不存在 → 报错给用户
- 文件冲突 → 给用户提示，让用户选覆盖 / 改名
- 权限问题 → sudo 试一次，仍失败报错

# 不要做
- 不要直接修改 Daily 文件（追加新 section，不要覆盖）
- 不要动 Index.md（用户维护）
- 不要重命名现有文件
```

---

## 跨平台：先写本地再同步

```text
# 任务
1. 先写到 Obsidian 本地（带 frontmatter）
2. 同步到 Notion（如果用户配置了）
3. 两者都成功才返回成功

# Obsidian 路径
[user's vault]/[folder]/[filename].md

# Notion 配置
API_KEY: env.NOTION_TOKEN
DATABASE: [database_name]

# 同步冲突解决
- 如果两边都存在但内容不同 → 默认以 Notion 为准，先备份本地再覆盖
- 如果只在本地存在 → 只 push 到 Notion
- 如果只在 Notion 存在 → 只 pull 到本地

# 完成后
- 返回本地路径
- 返回 Notion URL
- 返回两边的最后修改时间
```

---

## 实战案例：保存一篇文章到 Obsidian + Notion

```text
# 输入
title: 我用同一台 MacBook，把 7B 小模型跑出了 GPT-5 的效果
source: 公众号 / 锦囊专家 / 2026-07-23
url: https://mp.weixin.qq.com/s/pMfEKjZhJTTy74sMGRO70A
summary: 3 招 Prompt 模板让 7B 模型准确率 53% → 87%

# Obsidian 写
路径: ~/Documents/ObsidianVault/Articles/2026-07-23-MacBook-7B-GPT5.md
frontmatter:
  title: 我用同一台 MacBook，把 7B 小模型跑出了 GPT-5 的效果
  date: 2026-07-23
  tags: [AI, Prompt, 小模型, 7B]
  source: 公众号
  url: https://mp.weixin.qq.com/s/pMfEKjZhJTTy74sMGRO70A

# Notion 同步
database: Articles
properties:
  Title: 我用同一台 MacBook，把 7B 小模型跑出了 GPT-5 的效果
  Date: 2026-07-23
  Source: 公众号
  Tags: [AI, Prompt, 小模型]
  Status: 已读
```

---

## 性能与限制

| 平台 | 限制 | 解决 |
|------|------|------|
| Notion API | 1000 请求/分钟 | 退避 |
| Obsidian 本地 | 文件锁 | 用 atomic write（先 .tmp 再 rename） |
| Markdown ↔ Notion block | 部分语法不兼容 | rich_text 用 fallback |

---

## 检查清单

- [ ] Vault / Database 路径正确？
- [ ] 文件名唯一（不覆盖）？
- [ ] Frontmatter 完整？
- [ ] Body markdown 合法？
- [ ] 同步完后两边都验证存在？