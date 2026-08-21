# R4 · L5 真实信号 + 预览图补生成

## Goal Objective（复制到 set_goal 或 TUI）

> 在 aippt-skill-market 项目中执行数据管线 L5（真实信号）。用 GitHub API 获取每条 skill 的 stars/forks/lastCommit/issues 数，替换编造的 rating/salesCount。前端标注「数据来源：GitHub」，移除 estimated 字段。补生成预览图至全库唯一率 ≥80%（需 ~130 张，走 Azure gpt-image-2）。完成后跑 `node scripts/data-gate.js` 验证 P0-3（虚假信号）清零、图唯一率 ≥80%。

## 约束

- 工作目录：`docs/aippt-skill-market/`
- GitHub API：用 `gh api` 或 `https://api.github.com/repos/<owner>/<repo>`，注意 rate limit（未认证 60/h，认证 5000/h）
- rating 归一化：GitHub stars 映射到 3.5-5.0 区间（0 star=3.5，100+ stars=5.0）
- salesCount 替换为 forks + issues 总数，标注来源
- 前端必须显式标注「数据来源：GitHub」
- 预览图补生成走 `scripts/gen-preview-images.js`（Azure gpt-image-2）
- ⚠️ Azure API 调用需 HI-5 首次确认（付费 endpoint）
- 每条 skill 的预览图必须全库唯一（不复用）

## 完成判据

- [ ] 每条有 repoUrl 的 skill 有 githubStars/githubForks/lastCommit/issues 字段
- [ ] rating 替换为 GitHub stars 归一化值
- [ ] salesCount 替换为 forks + issues
- [ ] estimated 字段移除
- [ ] 前端标注「数据来源：GitHub」
- [ ] 预览图唯一率 ≥80%（当前 15.7%）
- [ ] `node scripts/data-gate.js` D 维（真实性）均分 ≥12/15
- [ ] `node scripts/data-gate.js` image_uniq_rate ≥80

## 前置

- R3 完成（中文化 + 编辑点评）

## 参考

- `openspec/changes/data-quality-rebuild/tasks.md` §4
- `openspec/changes/data-quality-rebuild/specs/data-pipeline/spec.md` L5
- `scripts/gen-preview-images.js`（预览图生成脚本）
- `.env` 含 AZURE_IMAGE_API_URL / AZURE_IMAGE_API_KEY
