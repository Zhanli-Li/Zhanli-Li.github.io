#!/usr/bin/env python3
"""Update the Google Scholar citation count for the profile badge.

Every paper on the profile is first-authored by the owner, so the badge
shows the profile's total citation count.

Data sources, in order of preference:
1. SerpApi google_scholar_author API (when SERPAPI_API_KEY is set) —
   reliable from GitHub Actions, where Google blocks direct scraping.
2. Direct scraping of the public Scholar profile (local fallback;
   skipped in CI, where datacenter IPs are captcha-blocked).
   Both of these read the profile's own "Cited by" total.
3. AnySearch (https://anysearch.com): parses Google-Scholar-style
   "Cited by N" snippets from general search results. Works anonymously
   (ANYSEARCH_API_KEY raises the daily quota) and matches Scholar counts
   more closely than citation databases for very recent citations.
4. OpenAlex REST API: sums cited_by_count over a curated list of the
   profile's paper DOIs. Free and reachable from GitHub Actions,
   so it is the last-resort source there.

The two fallback sources sum a curated per-paper list (all papers on the
profile, so the sum equals the profile total). The result goes to
assets/json/scholar_citations.json, which powers the "Citations"
shields.io badge on the about page.
"""
import html
import json
import os
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SCHOLAR_USER = "LW5bAdAAAAAJ"
REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUT = REPO_ROOT / "assets" / "json" / "scholar_citations.json"
PAGE_SIZE = 100
MAX_PAGES = 5
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
)

OWNER_NAME = "Zhanli Li"
OPENALEX_MAILTO = "lizhanli@stu.zuel.edu.cn"
# Curated papers on the profile as (DOI, title); add new papers here.
# Only used by the AnySearch/OpenAlex fallback sources.
PROFILE_PAPERS = [
    (
        "10.1016/j.frl.2025.107127",
        "ESG rating disagreement and corporate Total Factor Productivity: "
        "Inference and prediction",
    ),
    (
        "10.48550/arxiv.2602.05014",
        "DeepRead: Document Structure-Aware Reasoning to Enhance Agentic Search",
    ),
    (
        "10.18653/v1/2026.findings-acl.341",
        "Navigating Large-Scale Document Collections: MuDABench for "
        "Multi-Document Analytical QA",
    ),
    (
        "10.48550/arxiv.2610.21656",
        "Data World: Scaling Data Environments from Scratch",
    ),
]


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", "ignore")


def normalize(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", name.lower())


def strip_tags(text: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", text)).strip()


def parse_profile(page_html: str):
    """Return (owner_name, total_citations, rows) where rows are
    (title, citations). total_citations is the profile's 'Cited by' total."""
    m = re.search(r'<div id="gsc_prf_in"[^>]*>(.*?)</div>', page_html, re.S)
    owner = strip_tags(m.group(1)) if m else ""
    total_m = re.search(r'gsc_rsb_std">(\d+)', page_html)
    total = int(total_m.group(1)) if total_m else None
    rows = []
    for row in re.findall(r'<tr class="gsc_a_tr">(.*?)</tr>', page_html, re.S):
        title_m = re.search(r'gsc_a_at">(.*?)</a>', row, re.S)
        cite_m = re.search(r'gsc_a_ac[^>]*>(.*?)</a>', row, re.S)
        if not title_m:
            continue
        cites = cite_m.group(1).strip() if cite_m else ""
        rows.append((strip_tags(title_m.group(1)), int(cites) if cites.isdigit() else 0))
    return owner, total, rows


def fetch_direct():
    """Scrape the public Scholar profile. Works from residential IPs;
    GitHub Actions runners are usually captcha-blocked."""
    owner, papers, seen_titles, total = "", [], set(), None
    for page in range(MAX_PAGES):
        url = (
            f"https://scholar.google.com/citations?user={SCHOLAR_USER}"
            f"&hl=en&cstart={page * PAGE_SIZE}&pagesize={PAGE_SIZE}"
        )
        owner_name, page_total, rows = parse_profile(fetch(url))
        if page == 0:
            owner, total = owner_name, page_total
            if not owner:
                raise RuntimeError("could not read profile owner name")
        if not rows:
            break
        new = [r for r in rows if r[0] not in seen_titles]
        seen_titles.update(r[0] for r in rows)
        papers.extend(new)
        if len(rows) < PAGE_SIZE or not new:
            break
        time.sleep(2)
    if not papers:
        raise RuntimeError("no papers parsed; profile page may be captcha-blocked")
    if total is None:
        total = sum(p[1] for p in papers)
    return owner, papers, total


def fetch_serpapi(api_key: str):
    """Fetch the profile via SerpApi's google_scholar_author engine.
    Each results page costs one SerpApi credit."""
    url = (
        "https://serpapi.com/search.json?engine=google_scholar_author"
        f"&author_id={SCHOLAR_USER}&hl=en&num={PAGE_SIZE}&api_key={api_key}"
    )
    owner, papers, total = "", [], None
    for _ in range(MAX_PAGES):
        data = json.loads(fetch(url))
        if "error" in data:
            raise RuntimeError(f"SerpApi error: {data['error']}")
        if not owner:
            owner = (data.get("author") or {}).get("name", "")
            if not owner:
                raise RuntimeError("SerpApi response has no author name")
            table = (data.get("cited_by") or {}).get("table") or []
            if table:
                total = ((table[0].get("citations") or {}).get("all"))
        articles = data.get("articles") or []
        for art in articles:
            cited = (art.get("cited_by") or {}).get("value", 0)
            papers.append((art.get("title", ""), int(cited)))
        next_url = (data.get("serpapi_pagination") or {}).get("next")
        if not next_url:
            break
        url = f"{next_url}&api_key={api_key}"
        time.sleep(1)
    if not papers:
        raise RuntimeError("SerpApi returned no articles")
    if total is None:
        total = sum(p[1] for p in papers)
    return owner, papers, total


def fetch_anysearch():
    """Parse Google-Scholar-style 'Cited by N' snippets via AnySearch
    (https://api.anysearch.com). Its general search surfaces Scholar result
    snippets, so counts track Google Scholar closely even for very recent
    citations. Anonymous quota works without a key; ANYSEARCH_API_KEY
    raises it. Only results whose title matches the paper are trusted, so
    unrelated 'Cited by' snippets cannot leak into the count."""
    api_key = os.environ.get("ANYSEARCH_API_KEY", "").strip()
    headers = {"Content-Type": "application/json", "User-Agent": USER_AGENT}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    papers = []
    for _, title in PROFILE_PAPERS:
        body = json.dumps(
            {"query": f"{title} citations google scholar", "max_results": 5}
        ).encode("utf-8")
        req = urllib.request.Request(
            "https://api.anysearch.com/v1/search", data=body, headers=headers
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8", "ignore"))
        if data.get("code") != 0:
            raise RuntimeError(f"AnySearch error: {data.get('message')}")
        results = (data.get("data") or {}).get("results") or []
        key = normalize(title)
        cited, matched = None, False
        for r in results:
            rtitle = normalize(r.get("title") or "")
            title_hit = key in rtitle or (len(rtitle) >= 15 and rtitle in key)
            if not title_hit:
                continue
            matched = True
            text = f"{r.get('snippet') or ''} {r.get('content') or ''}"
            m = re.search(r"Cited by (\d+)", text)
            if m:
                n = int(m.group(1))
                cited = n if cited is None else max(cited, n)
        if not matched:
            raise RuntimeError(f"AnySearch returned no result matching: {title}")
        papers.append((title, cited if cited is not None else 0))
        time.sleep(1)
    return OWNER_NAME, papers, sum(p[1] for p in papers)


def fetch_openalex():
    """Sum per-paper cited_by_count over the curated profile DOI list.
    OpenAlex is free and reachable from GitHub Actions runners (unlike
    Google Scholar). Uses the filter endpoint, whose search index is
    fresher than the per-work entity endpoint. Without an API key,
    requests share a small daily budget per IP; setting OPENALEX_API_KEY
    (free at https://openalex.org/settings/api) gets a dedicated budget."""
    api_key = os.environ.get("OPENALEX_API_KEY", "").strip()
    key_param = f"&api_key={api_key}" if api_key else ""
    papers = []
    for doi, title in PROFILE_PAPERS:
        url = (
            f"https://api.openalex.org/works?filter=doi:{doi}"
            f"&select=display_name,cited_by_count&mailto={OPENALEX_MAILTO}{key_param}"
        )
        data = json.loads(fetch(url))
        results = data.get("results") or []
        if not results:
            raise RuntimeError(f"OpenAlex has no record for DOI {doi}")
        papers.append((title, int(results[0]["cited_by_count"])))
        time.sleep(0.5)
    return OWNER_NAME, papers, sum(p[1] for p in papers)


def collect_papers():
    """Return (owner, papers, total_citations, source)."""
    api_key = os.environ.get("SERPAPI_API_KEY", "").strip()
    if api_key:
        try:
            print("source: SerpApi")
            owner, papers, total = fetch_serpapi(api_key)
            return owner, papers, total, "serpapi"
        except Exception as exc:
            print(f"warning: SerpApi failed ({exc})", file=sys.stderr)
    if os.environ.get("GITHUB_ACTIONS") != "true":
        try:
            print("source: direct scraping")
            owner, papers, total = fetch_direct()
            return owner, papers, total, "google_scholar"
        except Exception as exc:
            print(f"warning: direct scraping failed ({exc})", file=sys.stderr)
    try:
        print("source: AnySearch")
        owner, papers, total = fetch_anysearch()
        if not total:
            raise RuntimeError("AnySearch found no 'Cited by' counts for any paper")
        return owner, papers, total, "anysearch"
    except Exception as exc:
        print(f"warning: AnySearch failed ({exc})", file=sys.stderr)
    print("source: OpenAlex")
    owner, papers, total = fetch_openalex()
    return owner, papers, total, "openalex"


def main() -> int:
    try:
        owner, papers, total, source = collect_papers()
    except Exception as exc:  # keep old data on any failure
        print(f"error: failed to fetch citation data: {exc}", file=sys.stderr)
        return 1

    payload = {
        "owner": owner,
        "scholar_user": SCHOLAR_USER,
        "citations": total,
        "papers": len(papers),
        "per_paper": [
            {"title": t, "citations": c} for t, c in papers
        ],
        "source": source,
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    print(f"owner: {owner}")
    print(f"papers: {len(papers)}, citations: {total}")
    for t, c in papers:
        print(f"  [{c}] {t}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
