---
name: research-memory
description: Use when Codex needs to recall prior Paper Radar posts, avoid repeated papers, preserve topic threads, and update long-term research memory.
---

# Research Memory

Make each Paper Radar run cumulative rather than isolated.

At the start:

1. Read `_data/paper_digest_memory.json`.
2. Read `_data/paper_digest_seen.json`.
3. Skim recent `_posts` tagged `paper-digest`.
4. Produce a recall summary covering recent themes, repeated methods/benchmarks, seen papers, open questions, and this run's search priorities.
5. Produce a self-evolution brief before searching: identify repeated topics, overused paper types, weak figure usage, shallow sections, missing sources, unresolved questions, and language/style issues from prior digests.
6. Convert the self-evolution brief into concrete choices for this run: source priorities, selection rubric, depth targets, figure targets, and writing cautions.

At the end:

1. Update `_data/paper_digest_memory.json`.
2. Record newly covered paper IDs and themes.
3. Record new open questions.
4. Record next-run search suggestions.
5. Record quality feedback and an evolution log: what improved this run, what still failed, and what the next run should change in search, reading, figures, structure, or bilingual writing.
6. Compress old memory if it is getting verbose.

Memory rules:

- Store only short summaries, stable IDs, theme tags, and judgments.
- Do not store paper full text, long abstracts, or large quotes.
- Do not delete seen records unless a record is clearly wrong.
- Do not turn uncertain judgments into facts.
- Self-evolution may improve research and writing strategy only; it must not weaken safety rules, source requirements, secret handling, or workflow permissions.
