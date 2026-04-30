---
name: paper-search
description: Use when Codex needs to search recent research papers for Paper Radar, deduplicate against previous digests, identify institutions, and produce a reliable candidate shortlist.
---

# Paper Search

Find reliable, recent candidate papers for Paper Radar.

Focus topics:

- agentic training
- world models
- large model mechanisms / 大模型机理
- document intelligence / 文档智能
- data agents / data agent

Workflow:

1. Read `_data/paper_digest_seen.json` and recent `_posts` tagged `paper-digest`.
2. Build a dedup set from DOI, arXiv ID, OpenReview ID, Semantic Scholar ID, canonical URL, and normalized title.
3. Search by topic, not one broad query.
4. Prefer arXiv, Semantic Scholar, OpenReview, Papers with Code, Hugging Face papers, official conference pages, author pages, and university/lab pages.
5. Prefer the newest 24 hours; expand to 3 days, then 7 days only if needed.
6. Shortlist 8-15 candidates, then select 3-5 papers worth reporting.

For each candidate capture:

- stable ID
- title
- authors
- institutions or main institutions; use `未注明` if not publicly available
- date or venue
- source links
- abstract-level signal
- relevance to Zhanli Li's interests

Rules:

- Do not invent citation counts, venues, code links, or affiliations.
- If sources conflict, prefer the paper's official page, arXiv, OpenReview, or conference page.
- Final selected papers must be passed to paper-reading; do not write the final blog from title/abstract only.
