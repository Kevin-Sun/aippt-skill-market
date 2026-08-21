## ADDED Requirements

### Requirement: paid 条目四件套
tier=paid 的条目 MUST 绑定四件套：repoUrl（GitHub 原仓库 URL）、installCmd（安装命令）、skillMdContent（SKILL.md 全文，已购用户可见）、中文使用指南（LLM 生成的中文操作步骤）。

#### Scenario: 已购用户查看交付物
- **WHEN** 用户购买 paid skill 后进入详情页
- **THEN** 详情页展示 SKILL.md 全文 + 中文使用指南 + installCmd + repoUrl 外链

#### Scenario: 未购用户不可见交付物
- **WHEN** 用户未购买该 skill
- **THEN** 详情页只展示 previewDesc + 编辑点评 + 预览图，不展示 skillMdContent 和中文使用指南

### Requirement: free_ref 条目外链交付
tier=free_ref 的条目 SHALL 提供 repoUrl 外链，不提供 skillMdContent 和中文使用指南。

#### Scenario: free_ref 详情页
- **WHEN** 用户查看 free_ref 条目详情
- **THEN** 详情页展示「免费资源」标签 + repoUrl 外链按钮 + 编辑点评，不展示购买按钮

### Requirement: inspiration 条目纯渐变卡片
tier=inspiration 的条目 SHALL 使用纯渐变卡片（无预览图），展示标题 + 编辑点评 + 「查看原作」外链。

#### Scenario: inspiration 卡片渲染
- **WHEN** 首页渲染 inspiration 条目
- **THEN** 卡片使用 gradient 渐变色块 + 标题 + 「查看原作」链接，不显示预览图

### Requirement: 购买记录云端化
购买记录 SHALL 存储在云端（云数据库），不再使用 localStorage。换设备/清缓存后购买记录不丢失。

#### Scenario: 换设备后购买记录保留
- **WHEN** 用户在设备 A 购买 skill 后，在设备 B 登录
- **THEN** 设备 B 的详情页显示该 skill 为「已解锁」

#### Scenario: localStorage 兜底
- **WHEN** 云端查询失败
- **THEN** 降级到 localStorage 读取，不影响基础功能
