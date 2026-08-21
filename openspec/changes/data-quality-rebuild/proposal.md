## Why

300 条 skill 数据存在 3 个 P0 级问题：①付费商品零交付物（用户付钱只得到按钮变灰）②122 条 Behance 设计师作品套壳出售（版权风险）③rating/salesCount 全为编造且前端未披露 estimated=true。同时 291/300 条名称为英文 slug，189 条描述为英文，用户体验差。数据不清洗完毕不能提审。

## What Changes

- **BREAKING** 数据结构新增字段：`tier`（paid / free_ref / inspiration）、`repoUrl`、`installCmd`、`skillMdContent`、`nameZh`、`descZh`、`editorReview`、`license`、`githubStars`、`githubForks`、`lastCommit`、`sourceUrl`
- **BREAKING** 移除字段：`estimated`（改为前端显式标注「数据来源：GitHub」）、`reviews`（改为 `communityFeedback` + `editorReview`）
- Behance 122 条 → `tier=inspiration`，免费灵感参考，纯渐变卡片不配图，外链原作者
- 无 LICENSE 的 GitHub repo → `tier=free_ref`，免费外链不收费
- MIT/Apache/CC0 → `tier=paid`，强制四件套交付物（repoUrl + installCmd + skillMdContent + 中文使用指南）
- rating/salesCount → GitHub 真实信号（stars/forks/lastCommit/issues）
- 描述不再截断 100 字符；steps 按实际能力定制（不再全库统一）
- 预览图全库唯一率 ≥80%（当前 15.7%）
- 新增数据质量评分引擎 `scripts/data-gate.js`（0-100 分 + 全库门禁）
- 补抓至真 skill published ≥220 条（当前真 skill 池约 186 条）

## Capabilities

### New Capabilities
- `data-pipeline`: L0-L6 数据加工管线（重解析、相关性过滤、授权分层、交付物绑定、中文化、真实信号、补抓）
- `quality-scoring`: 0-100 评分体系 + 硬门禁（单条 + 全库），每轮产出质量报告
- `deliverable-binding`: 付费商品四件套交付物绑定机制（repoUrl + installCmd + skillMdContent + 中文使用指南）

### Modified Capabilities
（无现有 specs）

## Impact

- `miniprogram/data/cloud-skills-data.js` — 数据结构全面重构
- `miniprogram/data/skills-service.js` — 归一化层适配新字段
- `miniprogram/pages/detail/detail.js` — unlockSkill 增加交付物展示
- `miniprogram/pages/detail/detail.wxml` — 已购用户可见 SKILL.md 全文 + 中文使用指南
- `miniprogram/pages/index/index.js` — 卡片渲染适配 tier 分层 + inspiration 不配图
- `miniprogram/pages/member/member.js` — 会员体系适配付费 SKU 缩减
- `scripts/data-gate.js` — 新增评分引擎
- `scripts/parse-skills.js` — 新增 L0 重解析脚本
- `scripts/verify-deliverables.js` — 新增交付物连通性验证
- `cloudfunctions/payment/index.js` — PRODUCT_TIER_MAP 适配付费 SKU 变化
