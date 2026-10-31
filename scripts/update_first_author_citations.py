#!/usr/bin/env python3
"""Update the first-author citation count from Google Scholar.

Scrapes the public Google Scholar profile, keeps only papers where the
profile owner is the first author, sums their citations, and writes the
result to assets/json/scholar_first_author.json. That JSON powers the
"First Author Citations" shields.io badge on the about page, so papers
where Zhanli Li is not first author are never counted.
"""
import html
import json
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SCHOLAR_USER = "LW5bAdAAAAAJ"
REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUT = REPO_ROOT / "assets" / "json" / "scholar_first_author.json"
PAGE_SIZE = 100
MAX_PAGES = 5
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
)


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", "ignore")


def normalize(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", name.lower())


def owner_name_keys(full_name: str) -> set:
    """Acceptable first-author renderings, e.g. 'Zhanli Li' -> {'zhanlili', 'zli'}."""
    parts = full_name.split()
    surname, given = parts[-1], parts[:-1]
    initials = "".join(p[0] for p in re.split(r"[\s-]+", " ".join(given)) if p)
    return {normalize(full_name), normalize(f"{initials} {surname}")}


def strip_tags(text: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", text)).strip()


def parse_profile(page_html: str):
    """Return (owner_name, rows) where rows are (title, first_author, citations)."""
    m = re.search(r'<div id="gsc_prf_in"[^>]*>(.*?)</div>', page_html, re.S)
    owner = strip_tags(m.group(1)) if m else ""
    rows = []
    for row in re.findall(r'<tr class="gsc_a_tr">(.*?)</tr>', page_html, re.S):
        title_m = re.search(r'gsc_a_at">(.*?)</a>', row, re.S)
        gray = re.findall(r'class="gs_gray">(.*?)</div>', row, re.S)
        cite_m = re.search(r'gsc_a_ac[^>]*>(.*?)</a>', row, re.S)
        if not (title_m and gray):
            continue
        authors = strip_tags(gray[0])
        first_author = re.split(r",| and ", authors)[0].strip()
        cites = cite_m.group(1).strip() if cite_m else ""
        rows.append((strip_tags(title_m.group(1)), first_author, int(cites) if cites.isdigit() else 0))
    return owner, rows


def main() -> int:
    owner, papers, seen_titles = "", [], set()
    for page in range(MAX_PAGES):
        url = (
            f"https://scholar.google.com/citations?user={SCHOLAR_USER}"
            f"&hl=en&cstart={page * PAGE_SIZE}&pagesize={PAGE_SIZE}"
        )
        try:
            owner_name, rows = parse_profile(fetch(url))
        except Exception as exc:  # network blocked / captcha: keep old data
            print(f"error: failed to fetch profile page {page}: {exc}", file=sys.stderr)
            return 1
        if page == 0:
            owner = owner_name
            if not owner:
                print("error: could not read profile owner name", file=sys.stderr)
                return 1
        if not rows:
            break
        new = [r for r in rows if r[0] not in seen_titles]
        seen_titles.update(r[0] for r in rows)
        papers.extend(new)
        if len(rows) < PAGE_SIZE or not new:
            break
        time.sleep(2)

    if not papers:
        print("error: no papers parsed; profile page may be captcha-blocked", file=sys.stderr)
        return 1

    keys = owner_name_keys(owner)
    first_author = [p for p in papers if normalize(p[1]) in keys]
    total = sum(p[2] for p in first_author)

    payload = {
        "owner": owner,
        "scholar_user": SCHOLAR_USER,
        "citations": total,
        "first_author_papers": len(first_author),
        "papers": [
            {"title": t, "first_author": a, "citations": c} for t, a, c in first_author
        ],
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    print(f"owner: {owner}")
    print(f"first-author papers: {len(first_author)}/{len(papers)}, citations: {total}")
    for t, _, c in first_author:
        print(f"  [{c}] {t}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
