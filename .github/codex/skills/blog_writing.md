---
name: blog-writing
description: Use when Codex needs to write a publish-ready bilingual Paper Radar Jekyll post with a thematic title, institutions, key figures, and a human research-note voice.
---

# Blog Writing

Write a publish-ready bilingual Paper Radar post.

File rules:

- Create `_posts/YYYY-MM-DD-HHMM-paper-digest.md`.
- Do not overwrite an existing post.
- Do not save PDFs, screenshots, or large images to the repo.

Front matter:

```yaml
---
title: "A thematic title, not a date"
date: YYYY-MM-DD HH:MM:SS +0800
permalink: /posts/YYYY/MM/paper-digest-YYYY-MM-DD-HHMM/
tags:
  - paper-digest
  - paper-radar
  - AI
  - agents
  - research
---
```

Style:

- Chinese first, English second.
- Use a human research-note voice: concrete, reflective, lightly personal, not promotional.
- The title must summarize the issue's theme, not the timestamp.
- Avoid hype and vague claims.
- It is fine to say “我会优先看这篇的原因是...” when useful.

Chinese structure:

1. Start with a stable anchor heading: `## 中文版 {#chinese-version}`.
2. Thematic title and TL;DR.
3. "本期我在看什么" or similar human-feeling framing.
4. Paper notes.
5. Reading priority and next questions.

Each paper section must include:

- title
- authors
- institutions
- date or venue
- links
- key figures: 1-3 remote images with captions, or figure/table pointers if images are not reliable
- summary
- method and evidence
- why I care
- limitations/questions
- connection to the tracked themes

English section:

- Start with `## English Version {#english-version}`.
- Provide a concise English digest, not a literal translation.
- Include institutions and key figures/figure pointers.

Do not expose internal labels:

- Do not write `原文读取状态：fulltext_read`.
- Do not write `partial_read` or `metadata_only` as raw fields.
- If source access was limited, explain naturally.
