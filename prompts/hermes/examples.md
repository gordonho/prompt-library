# Hermes delegation 实战案例

---

## 案例 1：用 OpenClaw 拿"一句话事实"

### 输入
```
你是 OpenClaw main agent。

任务：用一句话中文回答：你是谁？
不要调任何工具。
直接给文本答案。
```

### 期望
```
我是何格的 AI 助手，随时为你效劳。
```

### 实际 wrapper
```bash
~/.local/bin/claw --agent main --message "用一句话中文回答：你是谁？不要调任何工具"
```

---

## 案例 2：用 Claude Code 重构 Python 脚本

### 输入 prompt
```
你是 Claude Code。

上下文：我的 ~/.local/bin/stock_push.py 是 200 行 Python 脚本，现在想重构：
- 把 FETCH_QLIST / FETCH_EOD / MA / EMA / MACD / RSI / BOLL 拆到 ~/.local/bin/stock_lib.py
- 在 stock_push.py 改成 from stock_lib import *

目标：
1. stock_lib.py 要被另外两个脚本（stock_eod.py, stock_premarket.py）复用
2. 行为不变（输出格式、阈值、信号）
3. 加 type hints
4. 加 docstring

约束：
- 不动 schedule
- 不动 cron job 配置
- 不动阈值（5%、2.5 score 等）

输出：
- 新文件 ~/.local/bin/stock_lib.py
- 改后的 stock_push.py
- 简短总结改了哪些

完成度自检：
- [ ] 三个脚本都能跑？
- [ ] 输出与之前一致？
- [ ] 没有破坏 cron job？
```

### 期望摘要
```
完成。拆出 stock_lib.py (12 KB)，stock_push.py 缩到 80 行。stock_eod.py / stock_premarket.py 也改为 import stock_lib。所有 cron job 仍跑原脚本路径，行为不变。
```

---

## 案例 3：用 Codex 写一个解析函数

### 输入
```
你是 Codex。

写一个 Python 函数 parse_chinese_address(s: str) -> dict，
把"广东省广州市天河区珠江新城"解析成：
{"province": "广东", "city": "广州", "district": "天河", "rest": "珠江新城"}

不要用任何外部库，只用 stdlib。

返回完整函数 + 3 个 doctest。
```

### 期望
```python
def parse_chinese_address(s: str) -> dict:
    """把中国地址字符串解析为 province / city / district / rest 四字段。
    
    >>> parse_chinese_address("广东省广州市天河区珠江新城")
    {'province': '广东', 'city': '广州', 'district': '天河', 'rest': '珠江新城'}
    
    >>> parse_chinese_address("北京市朝阳区建国路1号")
    {'province': '北京', 'city': '北京', 'district': '朝阳', 'rest': '建国路1号'}
    
    >>> parse_chinese_address("上海市浦东新区")
    {'province': '上海', 'city': '上海', 'district': '浦东', 'rest': ''}
    """
    ...
```

---

## 案例 4：失败 — 给得太模糊

### 输入（反例）
```
你是 Claude Code。

帮我看下系统。
```

### 实际得到
```
系统已检查。
```
**没有价值**——没说要查什么。

### 修复
```
你是 Claude Code。

任务：检查 ~/Documents 目录，找出 30 天内没被访问但 > 10MB 的大文件，列出 path / size / last_access / 估算可释放空间。

输出：CSV 格式 + 简短总结。

约束：不要删除，只列出。
```

---

## 案例 5：跨 agent 接力

### 场景
- Claude Code 写代码（擅长生成）
- OpenClaw 跑 cron（擅长调度）
- 我（Hermes）负责对话

### 流程
```
用户：帮我写一个监控 /tmp 目录的脚本

我：写完代码 [code] → 写到 ~/.local/bin/tmp_monitor.py

我：让 OpenClaw 把它挂上 cron，每小时跑一次
→ ~/.local/bin/claw --message "挂上 cron..."

OpenClaw：返回 cron job_id + next_run_at

我：给用户报告
"已挂上 cron：job_id=xxx，下次跑：2026-07-25 17:00"
```