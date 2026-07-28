# 建库设计三轮审查报告

> 审查对象：docs/aippt-skill-market/ 建库环节（catalog.md + fetch/clean/test 脚本 + raw-materials）
> 审查方式：三轮深度审查（正确性/完整性/可用性），每轮实跑验证
> 审查时间：2026-07-27

---

## 第一轮 · 正确性审查（数据真可用吗？标注准吗？）

### 发现 5 个问题

| # | 问题 | 严重度 | 根因 |
|---|---|---|---|
| 1.1 | **fetch.sh 用 shuf 抽样，macOS 无 shuf** | 🟡中 | 脚本兼容性，clean.sh 无此问题但抽样逻辑要用 |
| 1.2 | **Anthony0630 无 LICENSE 文件却标 license=edu** | 🔴高 | 我臆断"教育用途"，实际 repo 无 LICENSE，license 应标 unknown |
| 1.3 | **品牌名检查假阳性严重** | 🔴高 | Akxan README 命中 Anthropic/Apple/Claude/Linear/Stripe 是"benchmarked against"对标说明，不是品牌滥用；"小米"可能是中文巧合。黑名单太宽泛 |
| 1.4 | **palettes 全 0** | 🔴高 | clean.sh 从 README grep #hex 色值，但 README 无 hex 色值（Akxan 实测无）。提取逻辑失效 |
| 1.5 | **usable=true 但内容空的 skill** | 🟡中 | sunbigfly prompts=1 layouts=0 仍标 usable，"可用"门槛太低 |

### 第一轮结论：正确性不 solid。license 臆断 + 品牌名假阳性 + palette 提取失效，数据可信度打折。

---

## 第二轮 · 完整性审查（覆盖够吗？测试真测了吗？）

### 发现 6 个问题

| # | 问题 | 严重度 | 根因 |
|---|---|---|---|
| 2.1 | **工作汇报 prompts 只有 2 个** | 🔴高 | 目标场景之一，素材严重不足（答辩有 6+101 layouts 够，工作汇报几乎没素材） |
| 2.2 | **10 项测试里 5 项是"待 M0/M1"** | 🔴高 | test.sh 实际只测了 5 项（品牌名/字体/license/可用性/版式数），另外 5 项（对比度/渲染/跨端/独特性/AI标识）标记后续。test-report 却报 3704 检查，高估了自己 |
| 2.3 | **原子组件 8 类只覆盖 2 类** | 🔴高 | 只有 layouts(版式)+palettes(配色=0)；字体/图片/图表/图标/装饰/叙事 全无独立目录和提取 |
| 2.4 | **mckinsey-pptx clone 失败** | 🔴高 | 537★ 麦肯锡风（工作汇报关键素材）clone 失败。第三轮查实：**仓库不存在**（GitHub 返回 not found，exa 数据幻觉或已删） |
| 2.5 | **catalog 列 66 源但 fetch.sh 只抓 10 个** | 🟡中 | 56 个源只记录清单不抓，名不副实。catalog 是"清单"非"已抓取" |
| 2.6 | **国内源 trends 只记录 JSON 元数据** | 🟡中 | 版权站只记录 URL+note，没真正抓趋势内容（设计趋势/热门模板） |

### 第二轮结论：完整性不 solid。工作汇报场景素材不足 + 测试高估自己 + 原子组件覆盖 1/4 + 关键素材源不存在。

---

## 第三轮 · 可用性审查（M0 真能用吗？转化路径通吗？）

### 发现 5 个问题

| # | 问题 | 严重度 | 根因 |
|---|---|---|---|
| 3.1 | **M0 转化路径不通** | 🔴高 | 工作汇报素材只有 2 prompts，无法做 4-5 个工作汇报 skill。答辩够（101 layouts）但工作汇报严重不足 |
| 3.2 | **prompts 质量参差** | 🟡中 | 最大 6.3MB（可能是 awesome-codex-skills 整个 README），最小 140 字节。30 个 >10KB 大文件可能是整库 README 非单个 prompt |
| 3.3 | **149 layouts 全是路径记录，0 个已解析** | 🔴高 | layouts 只记 .pptx 文件路径，parsed=false 全部。M0 要用需 python-pptx 解析版式结构，当前完全没做 |
| 3.4 | **palettes=0 导致 skill 无法定义风格** | 🔴高 | skill 中间格式需要配色方案，当前 0 个 palette，skill 无法生成 |
| 3.5 | **8 个"可用"skill 含 2 个空壳** | 🟡中 | sunbigfly prompts=1、Akxan prompts=2 内容极少，usable 门槛太低 |

### 第三轮结论：可用性不 solid。从 raw-materials 到 M0 skill 的转化路径关键环节缺失（layouts 未解析 + palettes=0 + 工作汇报素材不足）。

---

## 综合结论：当前建库设计 **不 solid**

### 核心问题（三轮共发现 16 个，去重后 12 个关键）

**🔴 高严重度（6 个，必须修）**：
1. license 臆断（Anthony0630 标 edu 实际无 LICENSE）
2. 品牌名检查假阳性（黑名单太宽泛，误杀对标说明）
3. palettes 全 0（提取逻辑失效，README 无 hex 色值）
4. 工作汇报 prompts 只有 2 个（目标场景素材不足）
5. mckinsey-pptx 仓库不存在（537★ 是 exa 幻觉，工作汇报关键素材丢失）
6. 149 layouts 全是路径未解析（M0 无法直接用）

**🟡 中严重度（6 个，应修）**：
7. 10 项测试 5 项是"待后续"（test.sh 高估自己）
8. 原子组件 8 类只覆盖 2 类
9. catalog 66 源 vs fetch 只抓 10 个（名不副实）
10. 国内源只记录清单未抓趋势
11. usable 门槛太低（空壳 skill 也标可用）
12. prompts 质量参差（6.3MB 大文件可能是整库 README）

### 三轮之后的改进项（优先级排序）

#### P0 必须改（影响 M0 可用性）

1. **修 mckinsey-pptx 数据错误**：catalog 删除或标注"仓库不存在"，重新找麦肯锡风替代源
2. **修 license 臆断**：clean.sh 实际读 LICENSE 文件，无 LICENSE 标 unknown（不臆断 edu）
3. **修品牌名检查**：黑名单收窄到"品牌+滥用词"（如"苹果发布会风格"），纯品牌名提及不算命中；或改成"品牌名+风格描述"组合判断
4. **修 palettes 提取**：改从 .pptx 用 python-pptx 解析配色（theme1.xml），不只靠 README grep
5. **补工作汇报素材**：定向搜 GitHub "business report pptx"/"quarterly review template" + 找麦肯锡风替代 repo
6. **layouts 解析**：clean.sh 加 python-pptx 解析版式结构（提取版式名/占位符/配色/字体），parsed=true

#### P1 应改（影响质量）

7. **test.sh 诚实化**：只报真测的 5 项，"待后续"的不计入 3704 总数
8. **补原子组件**：建 typography/imagery/charts/icons/decorative/narrative 目录 + 提取脚本
9. **fetch.sh 扩抓取**：把 catalog 里的高星 repo 都加进 GITHUB_REPOS（不只 10 个）
10. **usable 门槛**：要求 prompts≥3 或 layouts≥3 才标 usable=true

#### P2 可改（优化）

11. **国内源趋势抓取**：写 fetch-cn.sh 抓站酷/千图趋势页（只看热门不抓成品）
12. **prompts 质量过滤**：>1MB 的文件拆分或标记为"整库 README 非单 prompt"

---

## 测试报告（三轮后的真实状态）

### 数据量（修正后）

| 类型 | 声称数量 | 真实可用 | 差距 |
|---|---|---|---|
| 数据源 | 66 | 10 实抓 + 56 仅清单 | catalog 名不副实 |
| GitHub repos | 10 | 10（1 个 mckinsey 不存在→9） | -1 |
| prompts | 1843 | 1843（但 30 个 >10KB 可能是整库 README） | 质量参差 |
| layouts | 149 | 149（全部 parsed=false 未解析） | 0 可直接用 |
| palettes | 0 | 0 | 提取失效 |
| 可用 skill | 8 | 6（2 个空壳） | -2 |
| 工作汇报素材 | — | 2 prompts | 严重不足 |
| 答辩素材 | — | 6 prompts + 101 layouts | 够 |

### 测试项真实情况

| # | 测试项 | 声称 | 真实 |
|---|---|---|---|
| 1 | 品牌名检查 | ✅ 测了 | ⚠️ 假阳性严重（黑名单太宽） |
| 2 | 字体白名单 | ✅ 测了 | ✅ 真测（0 问题） |
| 3 | layouts license | ✅ 测了 | 🔴 license 臆断（edu 是假的） |
| 4 | skill 可用性 | ✅ 测了 | ⚠️ 门槛太低（空壳也算） |
| 5 | 版式数量 | ✅ 测了 | ✅ 真测（149≥8 达标） |
| 6 | 配色对比度 | 待 palette | 🔴 palette=0 无法测 |
| 7 | PNG 渲染 | 待 M0 | 未测 |
| 8 | 跨端一致 | 待 M0 | 未测 |
| 9 | 风格独特性 | 待 M1 | 未测 |
| 10 | AI 标识 | 待 M0 | 未测 |

**真实测试覆盖：5/10（50%）**，非声称的 3704 检查。

### 三轮审查最终判断

**当前建库设计不 solid**，存在 6 个高严重度问题。主要短板：
1. 数据可信度（license 臆断 + 品牌名假阳性 + 幻觉仓库）
2. 场景覆盖（工作汇报素材严重不足）
3. 转化路径（layouts 未解析 + palettes=0，M0 无法直接用）
4. 测试诚实度（高估自己，5/10 报成 3704 检查）

**需完成 P0 改进项（6 个）后才能算 solid**。建议下一步：先修 P0（数据可信度 + 转化路径），再补 P1（测试诚实化 + 原子组件），然后才进 M0。
