## 1. R1 — 评分引擎 + L0/L1 基线

- [x] 1.1 openspec init + 创建 change `data-quality-rebuild`
- [x] 1.2 编写 proposal.md / design.md / specs/ / tasks.md
- [x] 1.3 编写 `scripts/data-gate.js` 评分引擎（5 维度 0-100 + 硬门禁 + 全库门禁 + JSON 报告）
- [x] 1.4 编写 `scripts/parse-skills.js` L0 重解析（1834 SKILL.md → frontmatter 全文 + LICENSE + repoUrl）
- [x] 1.5 跑 L0 重解析，输出 `raw-materials/skills-parsed.json`
- [x] 1.6 跑 L1 相关性过滤（PPT 正则），输出 `raw-materials/skills-parsed.json`（isPPT/isIrrelevant 字段）
- [x] 1.7 对当前 `cloud-skills-data.js` 跑 `data-gate.js` 出基线报告
- [x] 1.8 编写 R2-R5 goal md 文件

## 2. R2 — L2 授权分层 + L3 交付物绑定

- [ ] 2.1 读 LICENSE 文件，为每条 skill 分配 tier（paid / free_ref / inspiration）
- [ ] 2.2 补 clone 90 个 `owner/repo` 格式的 repo（获取 SKILL.md 全文）
- [ ] 2.3 为 paid 条目绑定四件套（repoUrl + installCmd + skillMdContent + 中文使用指南占位）
- [ ] 2.4 为 free_ref 条目绑定 repoUrl 外链
- [ ] 2.5 Behance 122 条转 inspiration（纯渐变卡片，不配图，外链原作者）
- [ ] 2.6 跑 data-gate.js 验证 P0-1/P0-2 清零
- [ ] 2.7 购买记录云端化（云数据库 + localStorage 兜底）

## 3. R3 — L4 中文化 + 编辑点评

- [ ] 3.1 为每条 skill 生成 nameZh（中文名，保留原 slug 用于搜索）
- [ ] 3.2 为每条 skill 生成 descZh（LLM 改写非机翻，长度 40-120，不截断）
- [ ] 3.3 steps 按 skill 实际能力定制（不再全库统一）
- [ ] 3.4 为每条 skill 生成 editorReview（编辑点评，人味但非用户评价）
- [ ] 3.5 剔除全库 9 条与 PPT 无关的条目（theme-factory / lbo-model 等）
- [ ] 3.6 跑 data-gate.js 验证 B 维均分 ≥22/25
- [ ] 3.7 agent 抽检 20 条 descZh + editorReview 防模板腔

## 4. R4 — L5 真实信号 + 预览图补生成

- [ ] 4.1 用 GitHub API 获取 stars / forks / lastCommit / issues
- [ ] 4.2 rating 替换为 GitHub stars 归一化值，salesCount 替换为 forks + issues
- [ ] 4.3 前端标注「数据来源：GitHub」，estimated 字段移除
- [ ] 4.4 补生成预览图至全库唯一率 ≥80%（需 ~130 张，走 Azure gpt-image-2）
- [ ] 4.5 跑 data-gate.js 验证 P0-3 清零、图唯一率 ≥80%

## 5. R5 — L6 补抓至 ≥220 条

- [ ] 5.1 读 `~/projects/social-data-source-index.md` + `research-sop.md`（铁律 4）
- [ ] 5.2 用 agent-reach 路由搜索 GitHub PPT AI skill（禁止自造 gh+curl）
- [ ] 5.3 补抓 ~90 条候选，跑 L0-L5 管线
- [ ] 5.4 跑 data-gate.js 验证 published 真 skill ≥220
- [ ] 5.5 全库门禁全绿 → 替换 cloud-skills-data.js
- [ ] 5.6 跑 run-all-tests.sh 85 项 + devtools 编译 + e2e-v7
- [ ] 5.7 ci-upload 新版本 → 准备提审
