## ADDED Requirements

### Requirement: 单条 0-100 评分
评分引擎 SHALL 对每条 skill 计算 0-100 总分，由 5 个维度加权：A 可交付性(30) + B 可读性(25) + C 完整性(20) + D 真实性(15) + E 差异性(10)。

#### Scenario: 完美条目得满分
- **WHEN** 条目有四件套交付物、nameZh 存在、descZh 中文占比≥80%且长度 40-120、字段齐全、steps 定制、预览图唯一、rating 有 GitHub 依据、descZh 与全库最相似条目 similarity <0.7
- **THEN** 总分 = 100

#### Scenario: 无交付物的 paid 条目
- **WHEN** tier=paid 但 skillMdContent 为空
- **THEN** A 维度 = 0 且总分上限 70，且强制 status=draft

### Requirement: 硬门禁（不可绕）
tier=paid 但 LICENSE 不在白名单（MIT/Apache/CC0）→ 强制 status=draft，不管总分。

#### Scenario: 无 LICENSE 的 paid 条目被拦截
- **WHEN** tier=paid 但 license 字段不在 MIT/Apache/CC0 中
- **THEN** status 强制为 draft，评分报告标注 P0 违规原因

### Requirement: 全库门禁
全库门禁 SHALL 检查以下指标，任一不过则 exit 1：published 真 skill ≥220、paid 均分 ≥85、P0 违规数 = 0、预览图唯一率 ≥80%、描述唯一骨架率 ≥90%。

#### Scenario: 全库门禁通过
- **WHEN** 所有全库指标达标
- **THEN** exit 0，输出 quality-report JSON

#### Scenario: 全库门禁不通过
- **WHEN** 任意全库指标不达标
- **THEN** exit 1，报告标注不达标指标及当前值与目标值

### Requirement: 质量报告可 diff
每轮评分 SHALL 输出 `raw-materials/quality-report-<timestamp>.json`，包含：总条数、published 数、各 tier 分布、各维度均分、P0 违规列表、全库门禁结果。

#### Scenario: 与上轮报告 diff
- **WHEN** 存在上轮 quality-report JSON
- **THEN** 输出提升/退化指标对比（published 数变化、均分变化、P0 清零进度）
