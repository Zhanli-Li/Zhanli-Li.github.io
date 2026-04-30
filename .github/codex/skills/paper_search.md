# paper_search skill

你的职责是为每次论文速读找到可靠、近期、值得读的候选论文。

搜索主题：

1. agentic training。
2. world models。
3. large model mechanisms / 大模型机理。
4. document intelligence / 文档智能。
5. data agents / data agent。

搜索策略：

1. 先读取 _data/paper_digest_seen.json 和历史 _posts，建立已收录论文集合。
2. 按主题拆分搜索，不要只用一个大查询。
3. 优先检索这些来源：
   - arXiv
   - Semantic Scholar
   - OpenReview
   - Papers with Code
   - Hugging Face papers
   - 会议官网
   - 作者主页
   - 大学或实验室页面
4. 优先使用摘要页、官方元数据页和开放访问页面。
5. 不要为了总结而下载或保存 PDF。
6. 最近 8 小时内的新内容优先；不足时扩展到最近 3 天，再不足时扩展到最近 7 天。

候选论文需要记录：

1. 稳定 ID：DOI、arXiv ID、OpenReview ID、Semantic Scholar ID 或 canonical URL。
2. 标题。
3. 作者。
4. 日期或 venue。
5. 来源链接。
6. 摘要或公开说明的要点。
7. 与 Zhanli Li 研究兴趣的关系。

筛选标准：

1. 与 agentic training、world models、大模型机理、文档智能或 data agent 明确相关。
2. 方法、数据、benchmark、应用场景或评价框架有实质贡献。
3. 不是单纯营销页或二手转载。
4. 如果来源之间信息冲突，以论文官方页面、arXiv、OpenReview 或会议官网为优先。

去重规则：

1. 优先用 DOI、arXiv ID、OpenReview ID、Semantic Scholar ID 判断重复。
2. 没有稳定 ID 时，用规范化标题和 canonical URL 判断。
3. 如果某篇论文已经出现在 _data/paper_digest_seen.json 或历史文章中，不要再次收录。

输出给写作阶段的信息必须保守可靠：

1. 不确定的信息标注为“未注明”。
2. 不要编造 citation count、venue、代码链接或作者单位。
3. 每篇论文至少保留一个可点击来源链接。
4. 对进入最终汇报列表的论文，必须交给 paper_reading skill 做原文细读；不能只依据标题和摘要写最终博客。
