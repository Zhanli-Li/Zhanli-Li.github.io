#!/usr/bin/env python3
"""Lightweight checks for the Codex paper digest automation."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    ".github/workflows/codex_paper_digest.yml",
    ".github/codex/prompts/paper_digest.md",
    ".agents/skills/paper-search/SKILL.md",
    ".agents/skills/paper-reading/SKILL.md",
    ".agents/skills/research-memory/SKILL.md",
    ".agents/skills/blog-writing/SKILL.md",
    "scripts/codex-paper-digest.mjs",
    "_data/paper_digest_seen.json",
    "_data/paper_digest_memory.json",
    "_pages/paper-radar.html",
    "_includes/archive-single-paper-radar.html",
    "images/paper-radar/.gitkeep",
]

SECRET_SCAN_FILES = [
    ".github/workflows/codex_paper_digest.yml",
    ".github/codex/prompts/paper_digest.md",
    ".agents/skills/paper-search/SKILL.md",
    ".agents/skills/paper-reading/SKILL.md",
    ".agents/skills/research-memory/SKILL.md",
    ".agents/skills/blog-writing/SKILL.md",
    "scripts/codex-paper-digest.mjs",
    "scripts/check-paper-digest-config.py",
    "docs/codex-paper-digest-action-plan.md",
    "_data/paper_digest_seen.json",
    "_data/paper_digest_memory.json",
]

SECRET_PATTERNS = [
    re.compile(r"sk-[A-Za-z0-9_-]{20,}"),
    re.compile(r"https://[A-Za-z0-9-]+\\.trycloudflare\\.com"),
]


def assert_file_exists(path: str) -> None:
    if not (ROOT / path).is_file():
        raise SystemExit(f"Missing required file: {path}")


def assert_valid_json(path: str) -> None:
    try:
        json.loads((ROOT / path).read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON in {path}: {exc}") from exc


def assert_memory_shape() -> None:
    memory = json.loads((ROOT / "_data/paper_digest_memory.json").read_text())
    style = memory.get("research_profile", {}).get("style_preference", "")
    required_snippets = [
        "英文和中文分别生成独立 Markdown",
        "Paper Radar 默认展示英文",
    ]
    for snippet in required_snippets:
        if snippet not in style:
            raise SystemExit(f"Memory style preference missing expected snippet: {snippet}")


def assert_workflow_shape() -> None:
    workflow = (ROOT / ".github/workflows/codex_paper_digest.yml").read_text(
        encoding="utf-8",
    )
    required_snippets = [
        'cron: "0 0 * * *"',
        "OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}",
        "OPENAI_BASE_URL: ${{ secrets.OPENAI_BASE_URL }}",
        "CODEX_MODEL: gpt-5.5",
        "CODEX_REASONING_EFFORT: xhigh",
        "CODEX_SANDBOX_MODE: danger-full-access",
        "npm install --no-save @openai/codex-sdk @openai/codex",
        "git add _posts _data images/paper-radar",
    ]
    for snippet in required_snippets:
        if snippet not in workflow:
            raise SystemExit(f"Workflow missing expected snippet: {snippet}")


def assert_prompt_shape() -> None:
    prompt = (ROOT / ".github/codex/prompts/paper_digest.md").read_text(
        encoding="utf-8",
    )
    required_snippets = [
        "command -v skillhub",
        "skillhub install multi-search-engine",
        "skillhub install arxiv",
        "skillhub install humanizer",
        "skillhub install pdf",
        "--cli-only",
        "可以并行启动多个子任务/subagent",
        "subagent 优先使用 `gpt-5.5`",
        "主题化标题",
        "机构",
        "核心图表",
        "images/paper-radar/YYYY-MM-DD-HHMM/",
        "渲染开放 PDF/HTML 页面",
        "模拟截图",
        "不要在最终博客里展示 `原文读取状态：fulltext_read`",
        "英文版是 Paper Radar 默认入口",
        "lang: en",
        "lang: zh",
        "translation_url",
    ]
    for snippet in required_snippets:
        if snippet not in prompt:
            raise SystemExit(f"Prompt missing expected snippet: {snippet}")


def assert_paper_radar_page_shape() -> None:
    page = (ROOT / "_pages/paper-radar.html").read_text(encoding="utf-8")
    include = (ROOT / "_includes/archive-single-paper-radar.html").read_text(
        encoding="utf-8",
    )
    page_snippets = [
        "archive-single-paper-radar.html",
        "post.tags contains 'paper-digest'",
        "post.lang == 'zh'",
        "radar_count",
    ]
    include_snippets = [
        "English",
        "中文",
        "translation_url",
    ]
    for snippet in page_snippets:
        if snippet not in page:
            raise SystemExit(f"Paper Radar page missing expected snippet: {snippet}")
    if "where_exp" in page:
        raise SystemExit("Paper Radar page must not use where_exp; GitHub Pages Liquid rejects complex expressions here")
    for snippet in include_snippets:
        if snippet not in include:
            raise SystemExit(f"Paper Radar include missing expected snippet: {snippet}")


def assert_no_sensitive_markers() -> None:
    for relative_path in SECRET_SCAN_FILES:
        path = ROOT / relative_path
        text = path.read_text(encoding="utf-8", errors="ignore")
        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                raise SystemExit(f"Possible secret found in {relative_path}")


def main() -> None:
    for path in REQUIRED_FILES:
        assert_file_exists(path)
    assert_valid_json("_data/paper_digest_seen.json")
    assert_valid_json("_data/paper_digest_memory.json")
    assert_memory_shape()
    assert_workflow_shape()
    assert_prompt_shape()
    assert_paper_radar_page_shape()
    assert_no_sensitive_markers()
    print("paper digest config checks passed")


if __name__ == "__main__":
    main()
