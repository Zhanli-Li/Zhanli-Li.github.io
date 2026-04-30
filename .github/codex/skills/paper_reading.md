---
name: paper-reading
description: Use when Codex needs to read open-access paper full text for Paper Radar, extract methods/evidence/limitations, identify affiliations, and find core figure or table candidates.
---

# Paper Reading

Read selected papers closely using legal open sources.

Allowed sources:

- arXiv PDF or HTML
- OpenReview PDF or forum page
- author/lab/university open PDFs
- official conference open pages
- publisher pages that are explicitly open access

Do not:

- bypass paywalls
- use pirate paper sites
- save PDFs or unrelated large binary files to the repo
- copy long passages
- pretend a paper was fully read when only metadata was available

For each selected paper produce an internal reading note with:

- `source_fulltext_url`
- `read_status`: `fulltext_read`, `partial_read`, or `metadata_only`
- `one_sentence_idea`
- `core_question`
- `method`: concrete mechanism, pipeline, training signal, data construction, or evaluation design
- `evidence`: datasets, benchmarks, baselines, ablations, key tables/curves, and any source-backed numbers
- `contribution`
- `limitation`
- `institutions`
- `figures`: 1-3 candidates with `label`, `image_url` if reliable, otherwise `source_hint`, and `caption_summary`
- `visual_claims`: what each figure/table supports and what should be interpreted carefully
- `relevance`
- `confidence`

Figure guidance:

- Prefer the main figure or method overview first, then key result tables/curves, then important ablations or case studies.
- If a figure/table is central to understanding the paper, render the open PDF/HTML page or make a local screenshot/page crop to inspect it closely.
- Important screenshots may be committed only under `images/paper-radar/YYYY-MM-DD-HHMM/`.
- Use short, lowercase, hyphenated filenames such as `futureworld-main-figure.png`.
- Do not commit whole PDFs, unrelated screenshots, or oversized raw images.
- If arXiv HTML exposes stable figure image URLs, use remote URLs in the final Markdown.
- If no reliable image URL is available, write a short figure pointer such as `Figure 2: ...` or `Table 1: ...`, and summarize what the figure shows based on the temporary inspection.
- Never fabricate figures or captions.

Writing handoff:

- Do not expose raw `read_status` labels in the blog.
- If the reading was partial, explain the limitation naturally.
- Hand off enough detail for a mini explainer: the reader should grasp the core idea quickly, then see how the method works and what evidence actually supports it.
- Keep methods and evidence specific enough to show close reading; do not hand off abstract paraphrases as if they were analysis.
