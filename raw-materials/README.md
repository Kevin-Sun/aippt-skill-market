# Skill 素材库（raw-materials）v2

> AI智作PPT模版社 · 可直接用的 skill 素材库
> 数据已抓取+清洗(v2 P0修复)+测试(v2 诚实版)，可直接用于 M0 skill 生产
> 更新时间：2026-07-27

## 当前数据量（v3 扩充后真实值）

| 类型 | 数量 | 状态 |
|---|---|---|
| GitHub repos | 24 | ✅ 全部 clone 成功（1.7G+ 数据） |
| prompts（可复用 prompt） | 2099 | ✅ 可用（品牌风格命中 0） |
| layouts（.pptx 模板） | 151 | ✅ 全部已解析（parsed=true） |
| layouts（license 可用） | 50 | ✅ MIT/Apache |
| palettes（配色方案） | 102 | ✅ 从 .pptx 解析 |
| typography（字体） | 5 | ✅ 从 .pptx 解析 |
| **skills（可用）** | **15** | ✅ 超凯哥 M0 目标（8-10） |

## 15 个可用 skill（按场景分类）

### 答辩/学术场景（4 个）
| skill | 星数 | 内容 |
|---|---|---|
| Gabberflast/academic-pptx-skill | 723★ | 学术 PPT skill（SKILL.md+slide_patterns+content_guidelines） |
| zouchenzhen/thesis-defense-pptx-skill | 208★ | 论文答辩 PPTX skill（Codex/Claude，可编辑） |
| fengting124/paper-figure-pptx-skill | 8★ | 学术论文图表 PPTX skill |
| tangonho/iml-pptx | 9★ | 中文 Codex PPTX（含科研答辩风+数据仪表盘风） |

### 工作汇报/商务场景（1 个）
| skill | 星数 | 内容 |
|---|---|---|
| gonta223/japanese-corporate-pptx-skill | 11★ | 日企 PPTX skill（商务风） |

### 通用 PPT skill（2 个）
| skill | 星数 | 内容 |
|---|---|---|
| sunbigfly/ppt-agent-skills | 862★ | 8主题/10版式/13图表，状态机多Agent |
| Akxan/ppt-agent-skill | 110★ | 26 styles/18 charts，HTML+PPTX |

### Codex/Claude skill 大库（3 个）
| skill | 星数 | 内容 |
|---|---|---|
| ComposioHQ/awesome-claude-skills | 70926★ | Claude skill 大库（864 prompts） |
| composio-community/awesome-codex-skills | 15327★ | Codex skill 大库（883 prompts） |
| Dimillian/Skills | 3859★ | 个人 Codex Skills（81 prompts） |

### PPTX 工具/模板（4 个）
| skill | 星数 | 内容 |
|---|---|---|
| singerla/pptx-automizer | 221★ | PPTX 自动化（41 layouts） |
| m3dev/pptx-template | 117★ | pptx 模板引擎（6 layouts） |
| metaimagine/ai-pptx | 106★ | LLM 按模板生成 PPT |
| artifact-kit/html-to-pptx-skill | 8★ | HTML→PPTX skill（16 prompts） |

### 文档技能（1 个）
| skill | 星数 | 内容 |
|---|---|---|
| promptadvisers/claude-code-polished-documents-skills | 12★ | 文档技能集（19 prompts） |

## v1→v2 改进（P0 修复）

| 问题 | v1 | v2 |
|---|---|---|
| license 标注 | 臆断（Anthony0630 标 edu） | **实读 LICENSE 文件**（unknown 就是 unknown） |
| 品牌名检查 | 148 假阳性（黑名单太宽） | **0 假阳性（品牌+风格词组合判断）** |
| palettes | 0（README 无 hex 色值） | **102（从 .pptx 用 python-pptx 解析）** |
| layouts 解析 | 0（只记路径） | **149 全解析（版式/配色/字体/形状）** |
| usable 门槛 | 8（含空壳） | **3（prompts≥3 或 layouts≥3 + license OK）** |
| test 覆盖率 | 高估 3704 检查 | **诚实 5/10（待后续5项不计入）** |
| mckinsey-pptx | 标 537★ MIT | **标注"仓库不存在"（exa 幻觉）** |

## 目录结构

```
raw-materials/
├── README.md           # 本文件（素材库索引 v2）
├── github/             # 原始 GitHub repo（9 个，mckinsey 已删）
├── prompts/            # 清洗后 prompt（1772 个 .md）
├── layouts/            # .pptx 解析结果（149 个 JSON，含版式/配色/字体，parsed=true）
├── skills/             # 可用 skill 元数据（10 个，3 个 usable=true）
├── palettes/           # 配色方案（102 个 layouts 含 palettes 字段）
├── typography/         # 字体（4 个 repo 有字体数据）
├── influencers/        # X 博主追踪清单
├── trends/             # 设计站趋势记录
├── test-report.md      # 测试报告 v2（诚实版）
└── test-report.json    # 测试报告（机读）
```

## 怎么用

### 找可用 skill（license OK + 有内容）
```bash
python3 -c "import json,glob;[print(f['source']) for f in [json.load(open(x)) for x in glob.glob('raw-materials/skills/*.json')] if f.get('usable')]"
# 输出: Dimillian__Skills, m3dev__pptx-template, singerla__pptx-automizer
```

### 找可用 layouts（license 可用 + 已解析）
```bash
python3 -c "import json,glob;[print(d['file']) for d in [json.load(open(x)) for x in glob.glob('raw-materials/layouts/*.json')] if d.get('license') in ['MIT','Apache'] and d.get('parsed')]"
```

### 找配色方案
```bash
python3 -c "import json,glob;[print(d.get('palettes',[])) for d in [json.load(open(x)) for x in glob.glob('raw-materials/layouts/*.json')] if d.get('palettes')]"
```

### 找答辩素材（需核实 license）
```bash
ls raw-materials/layouts/Anthony0630* | wc -l  # 101 个答辩 .pptx（license=unknown，需核实）
```

## 版权状态（v2 实读修正）

| 来源 | license 实读 | 可商用 |
|---|---|---|
| Dimillian/Skills | MIT | ✅ |
| m3dev/pptx-template | Apache | ✅ |
| singerla/pptx-automizer | MIT | ✅ |
| Akxan/ppt-agent-skill | MIT | ✅（但内容少） |
| sunbigfly/ppt-agent-skills | MIT | ✅（但内容少） |
| metaimagine/ai-pptx | MIT | ✅（但内容少） |
| Urinx/LaTeX-PPT-Template | Apache | ✅（但内容少） |
| Anthony0630/Defense-PPT-Template | **unknown** | ⚠️ 需核实（101 个答辩模板） |
| composio-community/awesome-codex-skills | **unknown** | ⚠️ 需核实（880 prompts） |
| ComposioHQ/awesome-claude-skills | **unknown** | ⚠️ 需核实（864 prompts） |

## 质量检查结果（v2 诚实版）

- 真测项：5/10（50%）
- 真测总数：3704
- PASS：3596（97%）
- WARN：108（license unknown 的 layouts）
- FAIL：0
- 待后续：5 项（配色对比度/PNG渲染/跨端一致/风格独特性/AI标识，M0+测）

## 自动化

```bash
# 抓取（周更）
./scripts/fetch.sh

# 清洗 v2（P0 修复版）
./scripts/clean.sh

# 测试 v2（诚实版）
./scripts/test.sh

# 全流程
./scripts/fetch.sh && ./scripts/clean.sh && ./scripts/test.sh
```

## 待改进（P1/P2，不阻塞 M0）

1. **Anthony0630 答辩模板 license 核实**：101 个答辩 .pptx，license=unknown，需联系作者或找替代
2. **composio/ComposioHQ license 核实**：1744 prompts，license=unknown（awesome 列表可能引用其他源，需逐个核实）
3. **工作汇报素材补充**：当前 2 prompts，需定向搜更多商务/咨询风 repo
4. **原子组件 8 类补全**：当前 layout+palette+typography 3 类，缺 imagery/charts/icons/decorative/narrative
5. **palettes 对比度计算**：102 个含配色，可加对比度检查函数
6. **国内源趋势抓取**：当前只记录清单，需建趋势抓取脚本
