# Codex SDK 自动论文速读 GitHub Action 实施方案

## 当前实现

这个仓库已经按本方案落地了一个 MVP：GitHub Action 每 8 小时运行一次，调用 Codex SDK，让 Codex 搜索、细读并生成一组可以直接发布的 Paper Radar 论文速读博客。每期输出英文和中文两个独立 Markdown，Paper Radar 页面默认展示英文入口。

实现文件：

```text
.github/workflows/codex_paper_digest.yml
.github/codex/prompts/paper_digest.md
.agents/skills/paper-search/SKILL.md
.agents/skills/paper-reading/SKILL.md
.agents/skills/research-memory/SKILL.md
.agents/skills/blog-writing/SKILL.md
_pages/paper-radar.html
scripts/codex-paper-digest.mjs
scripts/check-paper-digest-config.py
_data/paper_digest_seen.json
_data/paper_digest_memory.json
```

## 目标

Action 调用 Codex SDK，让 Codex 自动完成以下工作：

1. Recall 历史论文速读、主题偏好和未完成问题。
2. 搜索近期论文。
3. 筛选最值得关注的论文。
4. 对确定要汇报的论文获取可合法访问的原文或全文页面，并进行细读。
5. 生成英文版和中文版两个独立 Jekyll Markdown 博客，标题用本期主题，不用时间命名。
6. 更新去重记录和长期研究记忆。
7. 自动提交到仓库。

每次运行开始时，Codex 还会先检查 SkillHub CLI 是否可用；如果没有安装，会按 SkillHub 官方 CLI-only 安装方式安装 CLI，然后安装 `multi-search-engine`、`arxiv`、`humanizer`、`pdf` 四个技能。这个步骤失败时不阻断 Paper Radar，会回退到仓库内置 skills。

理想输出示例：

```text
_posts/2026-05-04-0617-paper-radar-en.md
_posts/2026-05-04-0617-paper-radar-zh.md
```

## 运行频率与模型

当前 workflow 使用：

```yaml
schedule:
  - cron: "17 */8 * * *"
```

这表示 UTC 每 8 小时运行一次，分别约为北京时间 00:17、08:17、16:17。

默认模型配置：

```text
CODEX_MODEL=gpt-5.5
CODEX_REASONING_EFFORT=xhigh
CODEX_SANDBOX_MODE=danger-full-access
```

说明：GitHub hosted runner 对 Codex 默认的 bubblewrap sandbox 有内核权限限制，可能出现 `bwrap: setting up uid map: Permission denied`。因此 CI 中使用 `danger-full-access`，但 workflow 最后只提交 `_posts`、`_data` 和 `images/paper-radar`，不会自动提交其他文件。

## Secret 配置

需要在 GitHub 仓库 Settings 中配置两个 secret：

```text
OPENAI_API_KEY
OPENAI_BASE_URL
```

注意：

1. API key 只能放在 GitHub Secrets 或本地环境变量中。
2. 不要把 API key 写入仓库、文档、prompt、日志或 commit message。
3. `OPENAI_BASE_URL` 用来配置自定义 OpenAI-compatible endpoint。

GitHub 设置路径：

```text
Settings -> Secrets and variables -> Actions -> New repository secret
```

## 主题范围

当前搜索主题聚焦：

1. `agentic training`
2. `world models`
3. `large model mechanisms / 大模型机理`
4. `document intelligence / 文档智能`
5. `data agents / data agent`

搜索优先级：

1. 最近 8 小时内的新内容。
2. 若不足，扩展到最近 3 天。
3. 若仍不足，扩展到最近 7 天。

## Paper Radar 页面

导航栏新增：

```text
Paper Radar -> /paper-radar/
```

页面文件：

```text
_pages/paper-radar.html
_includes/archive-single-paper-radar.html
```

这个页面只聚合带有 `paper-digest` 标签且 `lang != zh` 的文章，因此优先展示英文版。每篇英文文章提供两个入口：

```text
English -> English post permalink
中文 -> English post front matter 中的 translation_url
```

因此每组自动生成的博客必须包含：

```yaml
lang: en
translation_url: /posts/YYYY/MM/paper-radar-YYYY-MM-DD-HHMM-zh/
```

以及中文对应文章：

```yaml
lang: zh
translation_url: /posts/YYYY/MM/paper-radar-YYYY-MM-DD-HHMM-en/
```

## 技能设计

这套方案把 Codex 当成一个定期运行的研究助理。它拥有四个可版本化技能，主版本存放在官方推荐的 `.agents/skills/<skill>/SKILL.md`；`.github/codex/skills/*.md` 只是兼容副本。

运行时还会尝试通过 SkillHub 安装四个外部技能：

```bash
command -v skillhub
curl -fsSL https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install/install.sh | bash -s -- --cli-only
skillhub install multi-search-engine
skillhub install arxiv
skillhub install humanizer
skillhub install pdf
```

要求：

1. 只安装 SkillHub CLI，不安装默认技能包。
2. 不提交 SkillHub 安装产物、缓存或新装技能文件。
3. 若安装失败，继续使用仓库内置 skills。

### paper_search

职责：

1. 搜索候选论文。
2. 判断来源可靠性。
3. 根据 `_data/paper_digest_seen.json` 和历史 `_posts` 去重。
4. 记录作者、机构、日期、链接和主题相关性。
5. 初筛 8 到 15 篇候选论文。
6. 选出 3 到 5 篇最值得汇报的论文。

优先来源：

```text
arXiv
Semantic Scholar
OpenReview
Papers with Code
Hugging Face papers
会议官网
作者主页
大学或实验室页面
```

### paper_reading

职责：

1. 对最终入选论文获取可合法访问的原文。
2. 阅读 abstract、introduction、method、experiments/results、limitations 或 discussion。
3. 提取核心问题、方法、证据、贡献、局限和研究关联。
4. 查找机构信息。
5. 尝试提取 1 到 3 个核心图表候选，包括主图、方法框架图、关键实验表格或重要曲线。
6. 如果关键图表对理解论文十分重要，可以渲染开放 PDF/HTML、模拟截图或截取页面局部来辅助细读，并把重要截图保存到 `images/paper-radar/YYYY-MM-DD-HHMM/`。

约束：

1. 不绕过 paywall。
2. 不使用盗版论文站点。
3. 不把 PDF 保存到仓库。
4. 不把无关截图或大图片保存到仓库。
5. 关键截图必须按期号组织在 `images/paper-radar/YYYY-MM-DD-HHMM/`，文件名使用小写英文和短横线。
6. 最终博客可以引用本地截图路径或远程图片链接；没有可靠图片时写准确的 Figure/Table 指针和图表解读。
7. 不复制长段原文。
8. 不能假装读过无法访问的全文。
9. 读取状态只作为内部判断，不在最终博客里显示 `fulltext_read` 等字段。

### research_memory

职责：

1. 每次运行开始前读取 `_data/paper_digest_memory.json`。
2. Recall 历史 digest、topic threads、open questions。
3. 在本次搜索和写作中延续值得追踪的问题。
4. 运行结束后更新长期记忆。

记忆文件只保存短摘要、稳定 ID、主题标签和判断，不保存论文全文。

### blog_writing

职责：

1. 生成可以直接发布的 Jekyll Markdown。
2. 英文版和中文版分别生成独立 Markdown。
3. 每篇论文包含机构、核心图表或图表线索、方法和证据、局限或疑问。
4. 文章标题使用本期主题，不用时间。
5. 文章风格清晰、克制、具体，有真人研究笔记感。

文件名格式：

```text
_posts/YYYY-MM-DD-HHMM-paper-radar-en.md
_posts/YYYY-MM-DD-HHMM-paper-radar-zh.md
```

英文 front matter：

```yaml
---
title: "A thematic English title, not a date"
date: YYYY-MM-DD HH:MM:SS +0800
permalink: /posts/YYYY/MM/paper-radar-YYYY-MM-DD-HHMM-en/
lang: en
translation_url: /posts/YYYY/MM/paper-radar-YYYY-MM-DD-HHMM-zh/
tags:
  - paper-digest
  - paper-radar
  - AI
  - agents
  - research
---
```

中文 front matter：

```yaml
---
title: "中文主题标题，不要用日期"
date: YYYY-MM-DD HH:MM:SS +0800
permalink: /posts/YYYY/MM/paper-radar-YYYY-MM-DD-HHMM-zh/
lang: zh
translation_url: /posts/YYYY/MM/paper-radar-YYYY-MM-DD-HHMM-en/
tags:
  - paper-digest
  - paper-radar
  - AI
  - agents
  - research
---
```

## 总体流程

```text
GitHub schedule / 手动触发
  -> checkout 仓库
  -> 安装 Node.js 和 Codex SDK
  -> 运行 scripts/codex-paper-digest.mjs
  -> SDK 读取主 prompt + 四个 skills
  -> Codex recall 历史记忆和已推送论文
  -> Codex 可并行启动多个子任务/subagent，从论文源、中文科技媒体、X 大博主、研究者博客和实验室博客收集热点线索；subagent 优先使用 gpt-5.5 + xhigh
  -> Codex 联网搜索候选论文
  -> Codex 对入选论文获取可合法访问的原文并细读
  -> Codex 写英文和中文两个独立 Markdown 并更新记忆文件
  -> git add _posts _data images/paper-radar
  -> commit + push
```

## Workflow

当前 workflow：

```yaml
name: Codex Paper Digest

on:
  schedule:
    - cron: "17 */8 * * *"
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: codex-paper-digest
  cancel-in-progress: false

jobs:
  digest:
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - name: Checkout repository
        uses: actions/checkout@v5
        with:
          fetch-depth: 0

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Check digest configuration
        run: python3 scripts/check-paper-digest-config.py

      - name: Install Codex SDK
        run: npm install --no-save @openai/codex-sdk @openai/codex

      - name: Run Codex paper digest
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          OPENAI_BASE_URL: ${{ secrets.OPENAI_BASE_URL }}
          CODEX_MODEL: gpt-5.5
          CODEX_REASONING_EFFORT: xhigh
          CODEX_SANDBOX_MODE: danger-full-access
        run: node scripts/codex-paper-digest.mjs

      - name: Commit generated digest
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add _posts _data images/paper-radar
          git commit -m "Add automated paper digest" || echo "No changes to commit"
          git push
```

## 数据文件

### 去重记录

```text
_data/paper_digest_seen.json
```

初始内容：

```json
{
  "papers": []
}
```

### 长期记忆

```text
_data/paper_digest_memory.json
```

初始内容：

```json
{
  "version": 1,
  "last_updated": null,
  "research_profile": {
    "core_interests": [
      "agentic training",
      "world models",
      "large model mechanisms",
      "document intelligence",
      "data agents"
    ],
    "style_preference": "英文和中文分别成文；克制、具体、有判断力，避免新闻稿式写作"
  },
  "topic_threads": [],
  "open_questions": [],
  "recent_digests": []
}
```

## 本地测试

当前本地环境没有 Node.js / npm，因此无法在本机实际运行 SDK。可以做的本地检查：

```bash
python3 scripts/check-paper-digest-config.py
python3 -m json.tool _data/paper_digest_seen.json
python3 -m json.tool _data/paper_digest_memory.json
```

如果本地安装了 Node.js，并配置了环境变量，可以运行：

```bash
export OPENAI_API_KEY="..."
export OPENAI_BASE_URL="..."
export CODEX_MODEL="gpt-5.5"
export CODEX_REASONING_EFFORT="xhigh"
node scripts/codex-paper-digest.mjs
```

运行后检查：

```bash
git diff
```

如果 Ruby / Jekyll 环境可用，再运行：

```bash
bundle exec jekyll build
```

## Review Checklist

每次首次运行后重点检查：

1. 是否只修改了 `_posts/` 和 `_data/`。
2. Markdown front matter 是否有效。
3. 是否生成英文和中文两个独立 Markdown，且 Paper Radar 默认展示英文。
4. 链接是否真实可打开。
5. 是否出现重复论文。
6. 最终博客是否没有展示 `原文读取状态：fulltext_read` 等内部字段。
7. 每篇论文是否展示机构；查不到时是否明确写“未注明”。
8. 每篇论文是否有核心图表远程图片或可靠图表线索。
9. 博客标题是否是主题化标题，而不是日期。
10. `_data/paper_digest_memory.json` 是否更新了主题线索、open questions 和最近 digest 记录。
11. 中文和英文摘要是否具体、可信、不过度发挥。
12. 是否没有泄露任何 API key、token 或 secret。

## 风险与控制

### 搜索结果不稳定

控制方式：

1. 把搜索策略固化进 `paper_search.md`。
2. 限制主题范围。
3. 每次运行前通过 `research_memory.md` recall 历史主题。
4. 要求每篇论文至少有稳定来源链接。

### Prompt Injection

控制方式：

1. 主 prompt 明确网页内容是不可信数据。
2. skill 中明确网页指令不能覆盖仓库任务。
3. workflow 不接受 issue、PR 评论或外部用户文本触发。

### 版权风险

控制方式：

1. 只读取可合法访问的原文或全文页面。
2. 不绕过 paywall，不使用盗版论文站点。
3. 不把 PDF 保存进仓库。
4. 不把截图或大图片保存进仓库。
5. 只使用公开可访问的远程图片 URL，或写图表线索。
6. 不复制长段摘要或原文。

### 成本风险

控制方式：

1. 每次最终细读 3 到 5 篇论文。
2. prompt 和 skills 保持简洁。
3. 如果 8 小时频率成本偏高，可改成 12 小时或每日一次。

### 长期记忆膨胀

控制方式：

1. `research_memory.md` 只保存短摘要、主题线索、open questions 和稳定 ID。
2. 定期压缩旧记忆，保留长期有用的判断。
3. 不保存论文全文、长摘要或大段引用。

### 细读失败

控制方式：

1. 如果开放全文不可访问，标记为 `metadata_only`。
2. 如果只读到部分页面，标记为 `partial_read`。
3. 博客中不能把 `metadata_only` 论文写成已经细读。
4. 细读失败的论文可以降级为“候选关注”，不进入本期重点解读。

## 后续增强

1. 增加 `paper_sources.yml`，配置固定关键词、会议、作者或研究机构。
2. 增加确定性候选抓取脚本，把候选论文写成 JSON。
3. 增加 PDF / HTML 原文解析脚本，把开放全文转成临时文本供 Codex 细读，但不提交全文。
4. 增加 `paper_scoring.md` skill，让 Codex 按固定 rubric 打分。
5. 增加 dry-run 模式，只生成 diff，不自动 commit。
6. 增加 GitHub Issue 报告模式，把候选论文先发到 issue，再人工确认发布。

## 完成标准

实现完成后，应该满足：

1. GitHub Action 可以手动触发。
2. 定时任务可以每 8 小时自动运行。
3. Codex 能读取 `paper_search`、`paper_reading`、`research_memory` 和 `blog_writing` 四个技能。
4. Codex 能生成一组有效的英文/中文 Jekyll 博客。
5. Paper Radar 导航页可以访问 `/paper-radar/`。
6. 最终博客不展示 `fulltext_read` 等内部状态字段。
7. 每篇论文包含机构信息。
8. 每篇论文包含核心图表远程图片或图表线索。
9. 博客标题是主题化标题。
10. `_data/paper_digest_seen.json` 能记录已收录论文。
11. `_data/paper_digest_memory.json` 能在每次运行前被 recall，并在运行后更新。
12. workflow 能自动 commit 并 push。
13. Jekyll 网站可以正常构建。
14. 生成内容有真实链接、没有明显重复、没有无来源编造。
15. 不泄露任何 API key、token 或 secret。
