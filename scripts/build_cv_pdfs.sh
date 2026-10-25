#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

update_date="$(date +'%Y.%-m.%-d')"
perl -0pi -e "s/\\*Last Update: [^*]+\\*/\\*Last Update: $update_date\\*/" "$repo_root/_pages/cv.md"
perl -0pi -e "s/Last updated: [0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}/Last updated: $update_date/" "$repo_root/cv-latex/english/Resume_for_Frehers.tex"
perl -0pi -e "s/最近更新: [0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}/最近更新: $update_date/" "$repo_root/cv-latex/chinese/resume-zh_CN.tex"

if [[ "${1:-}" != "--publish-only" ]]; then
  (cd "$repo_root/cv-latex/english" && latexmk -xelatex -interaction=nonstopmode -halt-on-error Resume_for_Frehers.tex)
  (cd "$repo_root/cv-latex/chinese" && latexmk -xelatex -interaction=nonstopmode -halt-on-error resume-zh_CN.tex)
fi

mkdir -p "$repo_root/files"
cp "$repo_root/cv-latex/english/Resume_for_Frehers.pdf" "$repo_root/files/lizhanli_cv_en.pdf"
cp "$repo_root/cv-latex/chinese/resume-zh_CN.pdf" "$repo_root/files/lizhanli_cv_cn.pdf"

find "$repo_root/cv-latex" -type f \( \
  -name '*.aux' -o \
  -name '*.fdb_latexmk' -o \
  -name '*.fls' -o \
  -name '*.log' -o \
  -name '*.out' -o \
  -name '*.pdf' -o \
  -name '*.synctex.gz' -o \
  -name '*.xdv' \
\) -delete
