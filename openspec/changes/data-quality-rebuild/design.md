## Context

300 条 skill 数据从 58 个 GitHub repo + Behance + X 博主推荐抓取。当前数据存在 3 个 P0 级问题（零交付物、版权套壳、虚假信号），且 63% 为英文。数据清洗完毕后才能提审上线。

现有原料池：`raw-materials/github/` 下 58 个已 clone repo（1834 个 SKILL.md），其中 62 个 PPT 相关；另有 90 个 `owner/repo` 格式需补 clone。

## Goals / Non-Goals

**Goals:**
- 真 skill published ≥220 条（Behance 灵感参考不计入）
- 付费商品 100% 有四件套交付物
- 全库 P0 违规 = 0
- 中文化率 100%
- 预览图唯一率 ≥80%
- 评分体系可重复 + 可 diff，支持 goal 模式多轮迭代

**Non-Goals:**
- 不改 UI 框架（仍 vanilla WXML/WXSS）
- 不改支付链路（paySig/HMAC 已验证通过）
- 不改云函数部署方式
- R1 不做中文化 LLM 调用（只建评分引擎 + 跑基线）
- 不做新功能开发（社区/评论等后续迭代）

## Decisions

### D1: tier 三层分层而非二值 paid/free

- `paid`：MIT/Apache/CC0 LICENSE，四件套交付，可收费
- `free_ref`：无 LICENSE，免费外链到原 repo，不收费
- `inspiration`：Behance 作品，免费灵感参考，纯渐变卡片不配图

**替代方案**：二值 paid/free → 无法区分「不可收费但可外链」和「纯灵感参考」。三层更精确。

### D2: 评分引擎独立于数据管线

`data-gate.js` 只读数据 + 评分，不修改数据。管线脚本（L0-L6）负责修改数据。分离关注点 → 评分引擎可对任意中间态数据跑评分。

### D3: 评分维度权重 30/25/20/15/10

- A 可交付性 30 — 最高，因为 P0-1 最严重
- B 可读性 25 — 中文化核心
- C 完整性 20 — 字段齐全
- D 真实性 15 — GitHub 信号
- E 差异性 10 — 防模板套壳

**替代方案**：均分 20/20/20/20/20 → 可交付性权重不足，无法有效拦截 P0-1。

### D4: 硬门禁优先于总分

`tier=paid` 但 LICENSE 不在白名单 → 强制 draft，不管总分。合规红线不可绕。

### D5: 预览图复用检测用 Set 去重

全库 previewImages 扁平化后 Set.size / 总数 = 唯一率。简单有效，无需 perceptual hash。

### D6: 描述相似度用 Jaccard on bigrams

对每条 descZh 取中文 bigram 集合，与其他条目算 Jaccard 相似度。max similarity ≥0.7 → E 维扣分。O(n²) 但 n≈220 可接受。

## Risks / Trade-offs

- [付费 SKU 从 213 缩至 ~85] → 变现重心移至会员订阅；用户可选单买或会员解锁全部
- [补抓 ~90 条新 repo] → 走 agent-reach，供给不保证（GitHub 上 PPT AI skill 总量有限）
- [预览图补生成 ~130 张] → Azure gpt-image-2 API 成本 + 耗时
- [90 个 repo 补 clone] → 磁盘开销（现有 2.4G）
- [中文化用 LLM 改写] → 非 API 调用即机翻；需人工抽检防 AI 腔

## Migration Plan

1. R1 完成 → 评分引擎 + 基线报告（不改线上数据）
2. R2-R5 逐层清洗 → 每轮跑 data-gate.js 验证
3. 全库门禁通过 → 替换 `cloud-skills-data.js` → 跑 e2e 回归
4. 回归通过 → ci-upload 新版本 → 提审

**回滚**：`cloud-skills-data.js.bak` 保留上一版本，门禁不过则 `cp` 回滚。
