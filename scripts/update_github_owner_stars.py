#!/usr/bin/env python3
"""Update the owner's GitHub stars count.

Sums stargazers over non-fork repositories owned by GITHUB_USER
(repos the user merely contributes to or forked are never counted) and
writes assets/json/github_owner_stars.json. That JSON powers the
"Repo Owner Stars" shields.io badge on the about page.
"""
import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

GITHUB_USER = "Zhanli-Li"
REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUT = REPO_ROOT / "assets" / "json" / "github_owner_stars.json"
USER_AGENT = "github-owner-stars-script"


def fetch_repos(page: int) -> list:
    url = (
        f"https://api.github.com/users/{GITHUB_USER}/repos"
        f"?per_page=100&page={page}&type=owner&sort=updated"
    )
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    repos = []
    for page in range(1, 6):
        try:
            batch = fetch_repos(page)
        except Exception as exc:
            print(f"error: failed to fetch repos page {page}: {exc}", file=sys.stderr)
            return 1
        repos.extend(batch)
        if len(batch) < 100:
            break
    if not repos:
        print("error: no repositories returned by the GitHub API", file=sys.stderr)
        return 1

    owned = [r for r in repos if not r.get("fork")]
    total = sum(r.get("stargazers_count", 0) for r in owned)
    payload = {
        "user": GITHUB_USER,
        "stars": total,
        "owned_repos": len(owned),
        "top_repos": sorted(
            (
                {"name": r["name"], "stars": r.get("stargazers_count", 0)}
                for r in owned
            ),
            key=lambda r: r["stars"],
            reverse=True,
        )[:10],
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    print(f"owner (non-fork) repos: {len(owned)}, stars: {total}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
