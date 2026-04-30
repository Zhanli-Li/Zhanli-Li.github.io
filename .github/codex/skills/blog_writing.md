---
name: blog-writing
description: Use when Codex needs to write publish-ready Paper Radar Jekyll posts as two separate English and Chinese Markdown files with thematic titles, institutions, key figures, and a human research-note voice.
---

# Blog Writing

Write publish-ready Paper Radar posts as two separate Markdown files: one English, one Chinese.

File rules:

- Create English post: `_posts/YYYY-MM-DD-HHMM-paper-radar-en.md`.
- Create Chinese post: `_posts/YYYY-MM-DD-HHMM-paper-radar-zh.md`.
- Do not overwrite an existing post.
- Do not save PDFs, screenshots, or large images to the repo.

English front matter:

```yaml
---
title: "A thematic English title, not a date"
date: YYYY-MM-DD HH:MM:SS +0800
permalink: /posts/YYYY/MM/paper-radar-YYYY-MM-DD-HHMM-en/
lang: en
translation_url: /posts/YYYY/MM/paper-radar-YYYY-MM-DD-HHMM-zh/
author_profile: false
tags:
  - paper-digest
  - paper-radar
  - AI
  - agents
  - research
---
```

Chinese front matter:

```yaml
---
title: "中文主题标题，不要用日期"
date: YYYY-MM-DD HH:MM:SS +0800
permalink: /posts/YYYY/MM/paper-radar-YYYY-MM-DD-HHMM-zh/
lang: zh
translation_url: /posts/YYYY/MM/paper-radar-YYYY-MM-DD-HHMM-en/
author_profile: false
tags:
  - paper-digest
  - paper-radar
  - AI
  - agents
  - research
---
```

Style:

- English post contains English only.
- Chinese post contains Chinese only.
- Both posts must be independently readable; do not make one a stub or append one language after the other.
- Use a human research-note voice: concrete, reflective, lightly personal, not promotional.
- The title must summarize the issue's theme, not the timestamp.
- Avoid hype and vague claims.
- It is fine to say “我会优先看这篇的原因是...” when useful.

English structure:

1. Short TL;DR.
2. "What I am watching this round" or similar human-feeling framing.
3. Paper notes.
4. Reading priority and next questions.

Chinese structure:

1. 简短 TL;DR。
2. “本期我在看什么”或类似真人研究笔记式开场。
3. 论文细读笔记。
4. 阅读优先级和下期问题。

Each paper section must include:

- title
- authors
- institutions
- date or venue
- links
- key figures: 1-3 remote images with captions, or figure/table pointers if images are not reliable
- quick idea: one or two sentences that let a reader immediately understand the paper's core move
- why it matters: the concrete research or product bottleneck the paper addresses
- method walkthrough: 2-4 concrete steps covering mechanism, system design, training signal, data construction, or evaluation design
- evidence: source-backed datasets, benchmarks, baselines, ablations, key numbers, result tables, or curves
- why I care
- limitations/questions
- connection to the tracked themes

Depth and figure rules:

- Treat each selected paper as a mini explainer, not an abstract rewrite.
- Prefer fewer papers with deeper reading over more papers with shallow notes.
- English paper sections should usually be 450-800 words; Chinese paper sections should usually be 700-1200 Chinese characters.
- Include or point to the main figure/method diagram whenever possible, plus one key result table/curve when it materially helps the reader.
- After every image or figure/table pointer, write 2-4 sentences explaining what it shows, which claim it supports, and what caveat matters.
- If figure extraction is unreliable, use precise pointers such as `Figure 2` or `Table 1` and explain the visual from the inspected source.

Do not expose internal labels:

- Do not write `原文读取状态：fulltext_read`.
- Do not write `partial_read` or `metadata_only` as raw fields.
- If source access was limited, explain naturally.
