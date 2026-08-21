# R5 · L6 补抓至 ≥220 条 + 上线

## Goal Objective（复制到 set_goal 或 TUI）

> 在 aippt-skill-market 项目中执行数据管线 L6（补抓）。当 published 真 skill < 220 时，用 agent-reach 路由搜索 GitHub PPT AI skill（禁止自造 gh+curl），补抓 ~90 条候选，跑 L0-L5 全管线。全库门禁通过后替换 `cloud-skills-data.js`，跑 85 项静态测试 + devtools 编译 + e2e-v7 回归，ci-upload 新版本，准备提审。

## 约束

- 工作目录：`docs/aippt-skill-market/`
- ⚠️ 铁律 4：补抓前必须先读 `~/projects/social-data-source-index.md` + `~/projects/research-sop.md`
- ⚠️ 必须用 agent-reach 路由，禁止自造 gh+curl
- 补抓的 skill 必须跑完 L0-L5 全管线（重解析→过滤→授权→交付物→中文化→真实信号）
- 全库门禁全绿才能替换 cloud-skills-data.js
- 替换前备份：`cp miniprogram/data/cloud-skills-data.js miniprogram/data/cloud-skills-data.js.bak`
- 回归不通过不提审

## 完成判据

- [ ] 补抓候选 ≥90 条（走 agent-reach）
- [ ] 补抓条目跑完 L0-L5 管线
- [ ] `node scripts/data-gate.js` 全库门禁全绿（exit 0）：
  - published_real_skill ≥220
  - paid_avg_score ≥85
  - p0_violations = 0
  - image_uniq_rate ≥80
  - desc_skeleton_rate ≥90
- [ ] `cloud-skills-data.js` 已替换（有 .bak 备份）
- [ ] `bash run-all-tests.sh` 85 项全绿
- [ ] devtools 编译 0 error（memory #212）
- [ ] `node tests/e2e-v7.js` 25 项全绿
- [ ] `node scripts/ci-upload.js --ver 1.1.0 --desc "数据质量重建"` 上传成功
- [ ] 提审材料更新（版本说明 + 截图 + 虚拟支付合规说明）

## 前置

- R4 完成（真实信号 + 预览图）

## 参考

- `openspec/changes/data-quality-rebuild/tasks.md` §5
- `openspec/changes/data-quality-rebuild/specs/data-pipeline/spec.md` L6
- `~/projects/social-data-source-index.md`（铁律 4）
- `~/projects/research-sop.md`（调研 SOP）
- agent-reach skill（`~/.agents/skills/agent-reach/SKILL.md`）
- 基线报告：`raw-materials/quality-report-1786766845278.json`
