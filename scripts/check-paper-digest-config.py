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
    ".github/codex/skills/paper_search.md",
    ".github/codex/skills/paper_reading.md",
    ".github/codex/skills/research_memory.md",
    ".github/codex/skills/blog_writing.md",
    "scripts/codex-paper-digest.mjs",
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


def assert_workflow_shape() -> None:
    workflow = (ROOT / ".github/workflows/codex_paper_digest.yml").read_text(
        encoding="utf-8",
    )
    required_snippets = [
        'cron: "17 */8 * * *"',
        "OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}",
        "OPENAI_BASE_URL: ${{ secrets.OPENAI_BASE_URL }}",
        "CODEX_MODEL: gpt-5.5",
        "CODEX_REASONING_EFFORT: xhigh",
    ]
    for snippet in required_snippets:
        if snippet not in workflow:
            raise SystemExit(f"Workflow missing expected snippet: {snippet}")


def assert_no_sensitive_markers() -> None:
    for path in ROOT.rglob("*"):
        if path.is_dir() or ".git" in path.parts or "_site" in path.parts:
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                raise SystemExit(f"Possible secret found in {path.relative_to(ROOT)}")


def main() -> None:
    for path in REQUIRED_FILES:
        assert_file_exists(path)
    assert_valid_json("_data/paper_digest_seen.json")
    assert_valid_json("_data/paper_digest_memory.json")
    assert_workflow_shape()
    assert_no_sensitive_markers()
    print("paper digest config checks passed")


if __name__ == "__main__":
    main()
