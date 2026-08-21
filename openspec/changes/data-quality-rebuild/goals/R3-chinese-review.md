# R3 · L4 中文化 + 编辑点评

## Goal Objective（复制到 set_goal 或 TUI）

> 在 aippt-skill-market 项目中执行数据管线 L4（中文化）。为每条 skill 生成 nameZh（中文名，保留原 slug 用于搜索）和 descZh（LLM 改写非机翻，长度 40-120 字符，不截断），steps 按 skill 实际能力定制（不再全库统一），生成 editorReview（编辑点评，人味但非用户评价），剔除 9 条与 PPT 无关的条目。完成后跑 `node scripts/data-gate.js` 验证 B 维（可读性）均分 ≥22/25。

## 约束

- 工作目录：`docs/aippt-skill-market/`
- LLM 调用：用项目已配的模型（glm-5.2 或 deepseek），走 HI-5 首次确认
- descZh 是改写不是机翻，长度 40-120，不以半词/省略号结尾
- editorReview 是编辑观点，不是用户评价，不违反广告法
- steps 按实际 SKILL.md 内容定制，不套模板
- 剔除 9 条无关条目：theme-factory / skill-creator / brand-guidelines / lbo-model / image-enhancer / comps-analysis / canvas-design / claude-code-polished-documents-skills / paper-analyst
- 中文化后跑 agent 抽检 20 条防模板腔

## 完成判据

- [ ] 每条 skill 有 nameZh（中文名）
- [ ] 每条 skill 有 descZh（中文描述，长度 40-120，中文占比 ≥80%）
- [ ] descZh 无截断（不以 … 或半词结尾）
- [ ] steps 定制化（unique steps 组合数 ≥50，当前 1）
- [ ] 每条 skill 有 editorReview（编辑点评）
- [ ] 9 条无关条目 status=rejected
- [ ] `node scripts/data-gate.js` B 维均分 ≥22/25
- [ ] agent 抽检 20 条 descZh + editorReview 无模板腔

## 前置

- R2 完成（tier 分层 + 交付物绑定）

## 参考

- `openspec/changes/data-quality-rebuild/tasks.md` §3
- `openspec/changes/data-quality-rebuild/specs/data-pipeline/spec.md` L4
- humanizer skill（防 AI 腔）
- `miniprogram/data/taxonomy.js`（场景/风格枚举）
