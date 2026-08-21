## ADDED Requirements

### Requirement: L0 重解析 SKILL.md 全文
管线 SHALL 从 `raw-materials/github/**/SKILL.md` 提取 YAML frontmatter（name + description 全文，不截断）+ body 首段正文 + LICENSE 文件类型 + repoUrl（`https://github.com/<source>`）。

#### Scenario: 正常 repo 有 SKILL.md 和 LICENSE
- **WHEN** repo 目录下存在 SKILL.md 且 frontmatter 含 name 和 description
- **THEN** 提取 name、description 全文、body 首段、LICENSE 类型、repoUrl，输出到 `raw-materials/skills/<repo>.json`

#### Scenario: SKILL.md 无 frontmatter
- **WHEN** SKILL.md 不含 YAML frontmatter（无 `---` 开头）
- **THEN** 从 body 首行提取 name，首段提取 description，标注 `frontmark=none`

### Requirement: L1 相关性过滤
管线 SHALL 对每条 skill 用 PPT 正则（ppt|pptx|slide|presentation|deck|keynote|幻灯|演示|汇报）+ LLM 二次判定，剔除与 PPT 无关的条目。

#### Scenario: Composio SaaS 自动化条目被剔除
- **WHEN** skill 名称或描述匹配 `via Rube MCP|Composio|Automate .* tasks` 且不含 PPT 关键词
- **THEN** 条目 status 设为 `rejected`，不进入后续管线

### Requirement: L2 授权分层
管线 SHALL 按 LICENSE 类型分配 tier：MIT/Apache/CC0 → `paid`；无 LICENSE/GPL/other → `free_ref`；Behance → `inspiration`。

#### Scenario: MIT LICENSE 可收费
- **WHEN** repo 的 LICENSE 文件包含 "MIT License"
- **THEN** tier 设为 `paid`，允许设置价格

#### Scenario: 无 LICENSE 不可收费
- **WHEN** repo 无 LICENSE 文件或 LICENSE 不在白名单内
- **THEN** tier 设为 `free_ref`，price 强制为 0

### Requirement: L3 交付物四件套绑定
tier=paid 的条目 MUST 绑定四件套：repoUrl + installCmd + skillMdContent（SKILL.md 全文）+ 中文使用指南。

#### Scenario: paid 条目缺交付物
- **WHEN** tier=paid 但 skillMdContent 为空或 repoUrl 不可达
- **THEN** 强制 status=draft，不进入 published

### Requirement: L4 中文化
管线 SHALL 对每条 skill 生成 nameZh（中文名，保留原 slug 用于搜索）和 descZh（中文描述，LLM 改写非机翻，长度 40-120 字符，不以半词/省略号截断）。

#### Scenario: 英文描述被中文化
- **WHEN** previewDesc 为英文或含 ASCII 字符
- **THEN** 生成 descZh 为中文改写，previewDesc 保留为原始值

### Requirement: L5 真实信号绑定
管线 SHALL 用 GitHub API 获取 stars/forks/lastCommit/issues 数，替换编造的 rating/salesCount。前端 MUST 显式标注「数据来源：GitHub」。

#### Scenario: rating 替换为 GitHub stars
- **WHEN** 条目有有效的 repoUrl
- **THEN** rating 替换为 GitHub stars 数对应的归一化值，salesCount 替换为 forks + issues 总数

### Requirement: L6 补抓触发
当 published 真 skill 数 < 220 时，管线 SHALL 触发补抓流程，使用 agent-reach 路由（禁止自造 gh+curl）。

#### Scenario: published 不足触发补抓
- **WHEN** data-gate 报告 published 真 skill < 220
- **THEN** 输出缺口数 = 220 - published，触发 agent-reach 补抓流程
