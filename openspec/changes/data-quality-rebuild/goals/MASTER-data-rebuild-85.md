# 数据质量重建 · 统一 Goal（R2-R5 连续执行至均分 ≥85）

## Goal Objective（复制到 set_goal 或 TUI 开启）

> 在 aippt-skill-market 项目中连续执行数据质量重建 R2-R5 全管线，直到全库门禁通过且 paid 均分 ≥85。不够就循环重跑 L4 中文化和 L5 信号补全直到达标。
>
> **最终目标分数：paid 条目均分 ≥85/100，全库门禁 5/5 全绿，published 真 skill ≥220。**
>
> 不达标的维度需循环修正：B 维 <22 重跑 descZh 改写；D 维 <12 重跑 GitHub 信号获取；E 维 <8 重跑描述去重；published <220 触发补抓（agent-reach）。
>
> 每轮跑完 `node scripts/data-gate.js` 检查分数，报告写入 `raw-materials/quality-report-<ts>.json`。
>
> 全库门禁通过后：替换 `cloud-skills-data.js`（先 cp .bak）→ `bash run-all-tests.sh` 85 项 → devtools 编译 + `node tests/e2e-v7.js` → `node scripts/ci-upload.js --ver 1.1.0`。

## 执行顺序（严格按序，每步完成才进下一步）

### R2 · 授权分层 + 交付物绑定
1. 补 clone 90 个 owner/repo repo（`raw-materials/github/` 下 ≥148 目录）
2. 每条 skill 分配 tier：MIT/Apache/CC0/BSD → `paid`；无 LICENSE → `free_ref`；Behance 122 → `inspiration`
3. paid 绑四件套：repoUrl + installCmd + skillMdContent（SKILL.md 全文）+ guideZh（中文使用指南）
4. free_ref 绑 repoUrl 外链
5. inspiration 清空 previewImages，只留 gradient 渐变 + 外链
6. 购买记录云端化（云数据库 + localStorage 兜底）
7. detail.wxml 已购用户可见 skillMdContent + guideZh
8. **检查点**：`node scripts/data-gate.js` → P0 违规 = 0，A 维均分 ≥25/30

### R3 · 中文化 + 编辑点评
1. 每条生成 nameZh（中文名，保留原 slug 用于搜索）
2. 每条生成 descZh（LLM 改写非机翻，长度 40-120，中文占比 ≥80%，不截断）
3. steps 按 SKILL.md 实际能力定制（unique 组合数 ≥50）
4. 每条生成 editorReview（编辑点评，人味但非用户评价）
5. 剔除 9 条无关条目（theme-factory / skill-creator / brand-guidelines / lbo-model / image-enhancer / comps-analysis / canvas-design / claude-code-polished-documents-skills / paper-analyst）
6. **检查点**：`node scripts/data-gate.js` → B 维均分 ≥22/25

### R4 · 真实信号 + 预览图
1. GitHub API 获取 stars / forks / lastCommit / issues
2. rating 替换为 GitHub stars 归一化值（0 star=3.5, 100+=5.0）
3. salesCount 替换为 forks + issues
4. 移除 estimated 字段
5. 前端标注「数据来源：GitHub」
6. 补生成预览图至全库唯一率 ≥80%（~130 张，Azure gpt-image-2）
7. **检查点**：`node scripts/data-gate.js` → D 维均分 ≥12/15，image_uniq_rate ≥80%

### R5 · 补抓至 ≥220 + 上线
1. ⚠️ 先读 `~/projects/social-data-source-index.md` + `~/projects/research-sop.md`（铁律 4）
2. 用 agent-reach 路由搜索 GitHub PPT AI skill（禁止自造 gh+curl）
3. 补抓 ~90 条候选，跑 L0-L5 全管线
4. **检查点**：`node scripts/data-gate.js` 全库门禁全绿

### 收尾
5. `cp miniprogram/data/cloud-skills-data.js miniprogram/data/cloud-skills-data.js.bak`
6. 替换 `cloud-skills-data.js` 为清洗后数据
7. `bash run-all-tests.sh`（85 项全绿）
8. devtools 编译 0 error + `node tests/e2e-v7.js`（25 项全绿）
9. `node scripts/ci-upload.js --ver 1.1.0 --desc "数据质量重建"`

## 循环修正规则

每轮 data-gate 报告出来后，按不达标维度循环修正：

| 不达标维度 | 循环动作 | 达标线 |
|---|---|---|
| A <25 | 重跑 R2 交付物绑定 | ≥25/30 |
| B <22 | 重跑 descZh LLM 改写 | ≥22/25 |
| C <15 | 重跑 includes/steps 定制化 | ≥15/20 |
| D <12 | 重跑 GitHub API 信号获取 | ≥12/15 |
| E <8 | 重跑 descZh 去重 | ≥8/10 |
| paid 均分 <85 | 逐条看低分项，定向修正最低分维度 | ≥85 |
| published <220 | 触发补抓（agent-reach） | ≥220 |
| image_uniq <80% | 补生成预览图 | ≥80% |
| skeleton <90% | 重写重复描述 | ≥90% |

**循环上限**：每轮最多重跑 3 次同一维度。3 次仍不达标 → 停下报告凯哥。

## 最终达标判据（全绿才算完成）

```
paid 均分 ≥85/100
published 真 skill ≥220
P0 违规 = 0
image_uniq_rate ≥80%
desc_skeleton_rate ≥90%
run-all-tests.sh 85 项全绿
devtools 编译 0 error
e2e-v7 25 项全绿
ci-upload v1.1.0 成功
```

## 约束

- 工作目录：`docs/aippt-skill-market/`
- 不改 UI 框架，不改支付链路
- LLM 调用走 HI-5 首次确认
- 补抓必须用 agent-reach（铁律 4），禁止自造 gh+curl
- Azure gpt-image-2 调用走 HI-5 首次确认
- 替换 cloud-skills-data.js 前必须 cp .bak
- 每轮产出 quality-report JSON，与上轮 diff

## 关键文件

| 文件 | 用途 |
|---|---|
| `scripts/data-gate.js` | 评分引擎，每轮跑 |
| `scripts/parse-skills.js` | L0 重解析 |
| `raw-materials/skills-parsed.json` | L0 解析结果（1835 条） |
| `raw-materials/quality-report-*.json` | 每轮质量报告 |
| `openspec/changes/data-quality-rebuild/` | 规格文档 |
| `miniprogram/data/cloud-skills-data.js` | 最终替换目标 |
| `miniprogram/data/skills-service.js` | 归一化层（需适配新字段） |
