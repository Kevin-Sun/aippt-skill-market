# R2 · L2 授权分层 + L3 交付物绑定

## Goal Objective（复制到 set_goal 或 TUI）

> 在 aippt-skill-market 项目中执行数据管线 L2（授权分层）+ L3（交付物绑定）。基于 L0 解析结果 `raw-materials/skills-parsed.json`（62 个 PPT 相关 SKILL.md），为每条 skill 分配 tier（paid/free_ref/inspiration），补 clone 90 个 owner/repo 格式的 repo 获取 SKILL.md 全文，为 paid 条目绑定四件套交付物（repoUrl + installCmd + skillMdContent + 中文使用指南），Behance 122 条转 inspiration（纯渐变卡片不配图），购买记录从 localStorage 云端化。完成后跑 `node scripts/data-gate.js` 验证 P0-1（无交付物）和 P0-2（版权套壳）清零。

## 约束

- 工作目录：`docs/aippt-skill-market/`
- 不改 UI 框架，不改支付链路
- paid tier 必须有 LICENSE 白名单（MIT/Apache/CC0/BSD），无 LICENSE 的强制 free_ref
- Behance 条目转 inspiration，不配图，外链原作者
- 购买记录云端化需兼顾 localStorage 兜底
- 补 clone 走 `agent-reach` 路由或 `gh repo clone`（项目内已有 raw-materials/github/ 下 58 个 repo 模式）

## 完成判据

- [ ] 90 个 owner/repo repo 补 clone 完成（raw-materials/github/ 下 ≥148 个目录）
- [ ] 每条 skill 有 tier 字段（paid/free_ref/inspiration/rejected）
- [ ] paid 条目 100% 有四件套（repoUrl + installCmd + skillMdContent + guideZh）
- [ ] free_ref 条目有 repoUrl 外链
- [ ] Behance 122 条转 inspiration，previewImages 清空
- [ ] 购买记录云端化（云数据库 + localStorage 兜底）
- [ ] `node scripts/data-gate.js` P0 违规数 = 0
- [ ] detail.wxml 已购用户可见 skillMdContent + guideZh

## 前置

- R1 完成（data-gate.js + parse-skills.js + 基线报告）

## 参考

- `openspec/changes/data-quality-rebuild/tasks.md` §2
- `openspec/changes/data-quality-rebuild/specs/data-pipeline/spec.md` L2/L3
- `openspec/changes/data-quality-rebuild/specs/deliverable-binding/spec.md`
- `raw-materials/skills-parsed.json`（L0 解析结果）
- 基线报告：`raw-materials/quality-report-1786766845278.json`
