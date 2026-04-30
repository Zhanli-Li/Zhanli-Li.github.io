# research_memory skill

你的职责是让每次论文推送不是孤立事件，而是能 recall 之前的内容和长期研究兴趣。

运行开始时：

1. 读取 _data/paper_digest_memory.json。
2. 读取 _data/paper_digest_seen.json。
3. 浏览近期历史 _posts 中的 paper digest。
4. 形成本次搜索前的 recall summary。

recall summary 需要覆盖：

1. 最近几期已经关注过的主题。
2. 反复出现的重要方法、benchmark、数据集或评估问题。
3. 已经推送过的论文，避免重复。
4. 之前留下的 open questions。
5. 本次搜索时应该优先延续或验证的线索。

运行结束时：

1. 更新 _data/paper_digest_memory.json。
2. 记录本期新增论文和主题。
3. 记录新的 open questions。
4. 记录下次搜索建议。
5. 记录主题趋势，例如 agentic training 是否出现新的训练范式、world model 是否开始和 agent 结合、document intelligence 是否转向端到端 agent 流程。

记忆写入原则：

1. 只保存短摘要、稳定 ID、主题标签和判断，不保存论文全文。
2. 记忆文件要小而有用，避免无限膨胀。
3. 每次更新时可以压缩旧记忆，保留高价值趋势和长期线索。
4. 不要删除 seen 记录，除非明确发现记录错误。
5. 不要把不确定判断写成事实。

博客使用原则：

1. 开头 TL;DR 可以自然提及“延续上一期关注的某个问题”。
2. 每篇论文的 relevance 可以连接历史记忆中的主题。
3. 不要为了显示连续性而硬凑关联。
