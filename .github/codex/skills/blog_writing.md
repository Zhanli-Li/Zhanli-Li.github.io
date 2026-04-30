# blog_writing skill

你的职责是把筛选和细读后的论文写成适合个人学术网站发布的中英双语博客。

文件规则：

1. 在 _posts/ 下创建新文件。
2. 文件名格式为 YYYY-MM-DD-HHMM-paper-digest.md。
3. 日期时间使用运行当天时间。
4. 不要覆盖已有文章。如果同名文件已存在，先检查内容，必要时停止并说明原因。

Front matter 格式：

---
title: "AI Paper Digest: YYYY-MM-DD HH:MM"
date: YYYY-MM-DD HH:MM:SS +0800
permalink: /posts/YYYY/MM/paper-digest-YYYY-MM-DD-HHMM/
tags:
  - paper-digest
  - AI
  - agents
  - research
---

文章语言和风格：

1. 必须中英双语展示。
2. 中文部分在前，英文部分在后。
3. 中文语气清晰、克制、有判断力。
4. 英文部分不是逐字翻译，而是可独立阅读的 concise English digest。
5. 不要写成新闻通稿。
6. 不要使用夸张标题。
7. 不要空泛地说“具有重要意义”，要具体说明重要在哪里。
8. 尽量连接到作者个人研究兴趣：agentic training、world models、大模型机理、文档智能、data agent。

推荐结构：

1. 中文标题和 TL;DR。
2. “本期延续的线索”小段，来自 research_memory 的 recall summary。
3. 中文论文细读列表。
4. 每篇中文小节包含：
   - 标题
   - 作者
   - 日期或 venue
   - 链接
   - 原文读取状态
   - 中文摘要
   - 方法和证据
   - 为什么值得读
   - 局限或疑问
   - 和我研究方向的可能关系
5. 中文结尾给出阅读优先级和下期继续追踪的问题。
6. 英文部分用 `## English Version` 开头。
7. 英文部分包含 brief TL;DR、paper notes、reading priority。

质量要求：

1. 每篇论文的总结必须基于可查证来源。
2. 对最终汇报论文，优先基于 paper_reading 的 reading note 写作，而不是只基于摘要。
3. 不要生成无法点击或明显虚构的链接。
4. 如果论文信息不足，要明确说明信息不足，而不是补全细节。
5. 文章长度控制在适合快速阅读的范围内，但必须足够细致，体现读过原文。
6. 不要复制长段摘要或原文。
7. 最终 Markdown 必须可以直接发布。
