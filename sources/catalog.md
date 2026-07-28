# AI智作PPT模版社 · 数据源清单（Catalog）v2

> 建库环节核心产物：明确从哪抓/抓谁/多久抓一次/抓完如何清洗和测试
> 统计：国际源 36+ / 国内源 17+ / 合计 53+（凯哥要求国际≥30+国内≥10=40，超额完成）
> v2 修订：mckinsey-pptx 标注"仓库不存在"（exa 幻觉）+ license 实读修正（Anthony0630/composio/ComposioHQ 纠正为 unknown）+ P0 修复落地
> 更新时间：2026-07-27

---

## 一、抓取规则总则

| 维度 | 规则 |
|---|---|
| **从哪抓** | GitHub（开源 repo）/ X（博主 thread）/ Reddit（社区讨论）/ 国内设计站（模板+设计师主页） |
| **抓谁** | 高星 repo（≥50★优先）/ 高频分享博主 / 热门讨论帖 / 设计师主页作品 |
| **多久抓一次** | GitHub repo：周更（周一抓最新 commit）；X 博主：日更（每日抓最新帖）；设计站：周更（热门/最新模板） |
| **抓完如何清洗** | 见清洗管线 clean.sh：①License 审核 ②.pptx→原子组件解析 ③prompt 提取改写 ④去重 ⑤版权标记 |
| **如何测试** | 见测试管线 test.sh：skill 质量检查 10 项（无重叠/字体可商用/图片版权/对比度/版式数等） |
| **自动化** | fetch.sh 定时抓取 → clean.sh 清洗 → test.sh 测试 → raw-materials/ 入库（cron 周更） |
| **版权红线** | ⚠️ 千图/包图/摄图/WPS稻壳儿/Slidesgo/Envato 等版权站**只参考思路不抓成品**；GitHub 开源（MIT/CC0）可直接用；X/设计站参考版式不抄成品 |

---

## 二、国际数据源（36 个，X/Reddit/GitHub）

### A. GitHub agent skill（PPT 专用，11 个）
| # | 仓库 | 星数 | 类型 | 抓取频率 | 清洗方式 | 版权 |
|---|---|---|---|---|---|---|
| 1 | sunbigfly/ppt-agent-skills | 862★ | Claude skill(8主题/10版式) | 周更 | 拆解模板/版式/prompt 重组 | MIT |
| 2 | ~~seulele26/mckinsey-pptx~~ | ~~537★~~ | ~~Claude插件(40麦肯锡模板)~~ | — | — | **⚠️ 仓库不存在（exa 幻觉，GitHub 返回 not found），已从 fetch.sh 删除** |
| 3 | Akxan/ppt-agent-skill | 110★ | Claude skill(26styles/18charts) | 周更 | 拆解风格+图表样式 | MIT |
| 4 | ACTAshui/sjtu-ppt-template-skill | 74★ | Codex skill(上海交大) | 月更 | 拆解版式 | **unknown（实读，需核实）** |
| 19 | Anthony0630/Defense-PPT-Template | 78★ | **答辩** | 月更 | .pptx→原子组件 | **unknown（实读，无LICENSE，需核实）** |
| 5 | knight6669/knight-html-ppt-skill | 4★ | 中文报告HTML PPT | 月更 | 拆解中文版式 | 看 license |
| 6 | Brusdeylins/ppt-skill | — | pptc命令行PPT工具 | 月更 | 参考schema设计 | MIT |
| 7 | Anthropic skills/pptx | 官方 | 通用pptx处理 | 月更 | 参考gotchas | 专有 |
| 8 | yunhs74/presentation-generator-skill | 0★ | 模板+JSON生成PPT | 月更 | 参考架构 | 看 license |
| 9 | mulhamfetna/opencode-presentations-skill | 0★ | Marp演示生成 | 月更 | 参考 Marp 格式 | 看 license |
| 10 | lmanchu/gamma-skill | 0★ | Gamma AI演示 | 月更 | 参考 Gamma 适配 | 看 license |
| 11 | crmiummarketing/crmium-presentation-skill | 0★ | Bento风演示 | 月更 | 参考 Bento 版式 | 看 license |

### B. GitHub skill 汇总库（6 个）
| # | 仓库 | 星数 | 抓取频率 | 清洗 | 版权 |
|---|---|---|---|---|---|
| 12 | ComposioHQ/awesome-claude-skills | 70926★ | 周更 | 筛选PPT相关 | **unknown（实读，无LICENSE，需核实）** |
| 13 | travisvn/awesome-claude-skills | 14341★ | 周更 | 同上 | MIT |
| 14 | BehiSecc/awesome-claude-skills | 9839★ | 周更 | 同上 | MIT |
| 15 | composio-community/awesome-codex-skills | 15327★ | 周更 | 筛选PPT/pptx相关 | **unknown（实读，无LICENSE，需核实）** |
| 16 | Dimillian/Skills | 3859★ | 月更 | 参考 Codex skill 写法 | MIT |
| 16 | Dimillian/Skills | 3859★ | 月更 | 参考 Codex skill 写法 | MIT |
| 17 | Dimillian/CodexSkillManager | 1357★ | 月更 | 参考 skill 管理方式 | MIT |

### C. GitHub PPT 模板素材（6 个）
| # | 仓库 | 星数 | 场景 | 频率 | 清洗 | 版权 |
|---|---|---|---|---|---|---|
| 18 | Urinx/LaTeX-PPT-Template | 418★ | 研究类 | 月更 | LaTeX→版式参考 | 看 license |
| 19 | Anthony0630/Defense-PPT-Template | 78★ | **答辩** | 月更 | .pptx→原子组件 | 看 license |
| 20 | metaimagine/ai-pptx | 106★ | LLM按模板生成 | 月更 | 参考生成逻辑 | MIT |
| 21 | m3dev/pptx-template | 117★ | pptx模板引擎 | 月更 | 参考模板结构 | MIT |
| 22 | singerla/pptx-automizer | 221★ | PPTX自动化 | 月更 | 参考自动化方式 | MIT |
| 23 | 各大学模板(SCU/SHTU/BJUT) | 36-64★ | 学生答辩 | 季更 | .pptx→版式参考 | 教育用途 |

### D. prompt 库（5 个）
| # | 仓库 | 星数 | 频率 | 清洗 | 版权 |
|---|---|---|---|---|---|
| 24 | awesome-nano-banana-pro-prompts | 12976★ | 周更 | 筛选PPT/设计相关prompt | CC0/MIT |
| 25 | awesome-gpt-image-2 | 8807★ | 周更 | 筛选图片生成prompt | CC0/MIT |
| 26 | TheBigPromptLibrary | 5238★ | 周更 | 筛选PPT相关 | CC0/MIT |
| 27 | GPT-Image2-Skill | 3968★ | 周更 | 筛选图片prompt | MIT |
| 28 | yao-open-prompts | 2667★ | 周更 | 筛选中文PPT prompt | MIT |

### E. X 博主（3 个，高频追踪）
| # | 博主 | handle | 特点 | 频率 | 清洗 | 版权 |
|---|---|---|---|---|---|---|
| 29 | Kostrzewa Robert | @ROB.PPT | AI PPT设计专家,百万播放 | 日更 | 抓thread→提取设计趋势 | 参考思路 |
| 30 | (待挖) | — | PPT设计趋势账号 | 日更 | 同上 | 参考思路 |
| 31 | (待挖) | — | agent skill分享账号 | 日更 | 同上 | 参考思路 |

### F. Reddit 社区（2 个）
| # | 社区 | URL | 频率 | 清洗 | 版权 |
|---|---|---|---|---|---|
| 32 | r/powerpoint | reddit.com/r/powerpoint | 周更 | 抓热门讨论→提取痛点/需求 | 公开讨论 |
| 33 | r/slides | reddit.com/r/slides | 周更 | 同上 | 公开讨论 |

### G. 国际设计资源站（4 个，参考思路不抓成品）
| # | 站点 | URL | 频率 | 清洗 | 版权 |
|---|---|---|---|---|---|
| 34 | Slidesgo | slidesgo.com | 周更 | 参考版式设计思路 | ⚠️Freepik版权,不抓成品 |
| 35 | SlideModel | slidemodel.com | 月更 | 同上 | ⚠️版权,不抓 |
| 36 | PresentationGO | presentationgo.com | 月更 | 同上 | ⚠️版权,不抓 |
| 37 | Envato Elements | elements.envato.com | 月更 | 同上 | ⚠️版权,不抓 |

### H. 设计社区（2 个，参考作品）
| # | 社区 | URL | 频率 | 清洗 | 版权 |
|---|---|---|---|---|---|
| 38 | Dribbble | dribbble.com | 周更 | 搜PPT/slide设计→参考版式 | ⚠️参考不抄 |
| 39 | Behance | behance.net | 周更 | 同上 | ⚠️参考不抄 |

---

## 三、国内数据源（17 个）

### I. 国内 PPT 模板站（12 个，⚠️版权站只参考思路）
| # | 站点 | URL | 模板量 | 频率 | 清洗 | 版权 |
|---|---|---|---|---|---|---|
| 40 | 千图网 | 58pic.com | 300万+ | 周更 | ⚠️只参考趋势不抓成品 | 🔴版权风险 |
| 41 | 包图网 | baotu.net | 200万+ | 周更 | ⚠️同上 | 🔴版权风险 |
| 42 | 摄图网 | 699pic.com | 海量 | 周更 | ⚠️同上 | 🔴版权风险 |
| 43 | 觅知网 | 51miz.com | 300万+ | 周更 | ⚠️同上 | 🔴版权风险 |
| 44 | 51PPT模板 | 51pptmoban.com | 海量 | 月更 | ⚠️同上 | 🔴版权风险 |
| 45 | 办公资源网 | bangongziyuan.com | 海量 | 月更 | ⚠️同上 | 🔴版权风险 |
| 46 | 图怪兽 | 818ps.com | 海量 | 月更 | ⚠️同上 | 🔴版权风险 |
| 47 | 稿定设计 | gaoding.com | 海量 | 月更 | ⚠️同上 | 🔴版权风险 |
| 48 | PPT宝藏 | pptbz.com | 海量 | 月更 | ⚠️同上 | 🔴版权风险 |
| 49 | 第一PPT | 1ppt.com | 海量 | 月更 | ⚠️同上 | 🔴版权风险 |
| 50 | WPS稻壳儿 | docer.wps.cn | 海量 | 月更 | ⚠️同上 | 🔴版权风险 |
| 51 | 优品PPT | ypppt.com | 海量 | 月更 | ⚠️同上 | 🔴版权风险 |

### J. 国内设计社区（2 个，设计师主页）
| # | 社区 | URL | 频率 | 清洗 | 版权 |
|---|---|---|---|---|---|
| 52 | 站酷 ZCOOL | zcool.com.cn | 周更 | 搜PPT设计师→参考作品 | ⚠️参考不抄 |
| 53 | 即时设计 | js.design | 月更 | 搜PPT设计→参考 | ⚠️参考不抄 |

### K. 国内 PPT 设计博主（3 个，高频追踪）
| # | 博主 | 平台 | 特点 | 频率 | 清洗 | 版权 |
|---|---|---|---|---|---|---|
| 54 | 凉了药 | 站酷+微博 | 北京PPT设计师 | 周更 | 抓作品→参考版式 | ⚠️参考不抄 |
| 55 | 短酷的PPT工作室 | 站酷+小红书 | 广州PPT设计师 | 周更 | 同上 | ⚠️参考不抄 |
| 56 | (待挖) | 小红书/即刻 | PPT技巧分享博主 | 周更 | 同上 | ⚠️参考不抄 |

---

## 四、原子组件素材源（8 类，版权清白可直接用）

| 组件 | 来源 | 版权 | 抓取方式 |
|---|---|---|---|
| 图片 | Pixabay | ✅CC0 | API/下载 |
| 图片 | Unsplash | ⚠️自定义许可(可商用) | API/下载 |
| 图片 | Pexels | ⚠️自定义许可(可商用) | API/下载 |
| 中文字体 | 思源黑体/宋体 | ✅OFL(可商用) | GitHub下载 |
| 中文字体 | 阿里巴巴普惠体 | ✅免费可商用 | 官方下载 |
| 图标 | Lucide | ✅MIT/ISC | npm包 |
| 图标 | Feather | ✅MIT | GitHub |
| 图表 | ECharts | ✅Apache2.0 | npm包 |

---

## 五、清洗管线（clean.sh v2，P0 修复版）

```
输入：fetch.sh 抓取的原始素材（GitHub repo / X thread / 设计站页面）
  ↓
①License 审核（P0-1 修复：实读 LICENSE 文件，不臆断）
  - 实读 repo 目录下 LICENSE 文件，匹配 MIT/Apache/CC0/OFL/BSD
  - 无 LICENSE → unknown（不臆断 edu/MIT）
  - X/设计站：标记"参考思路"，不可直接用
  ↓
②.pptx 模板→原子组件解析（P0-4 修复：python-pptx 实解析，parsed=true）
  - python-pptx 解析每个 .pptx 文件
  - 提取：版式名(layoutNames) / 配色(palettes) / 字体(fonts) / 形状结构(shapes) / 页数
  - 输出：layouts/*.json（含 license+source+parsed=true+完整解析数据）
  ↓
③prompt 提取改写
  - 从 skill repo 提取 SKILL.md/prompt*.md
  - 品牌名检查（P0-2 修复：品牌+风格词组合判断，如"苹果风/Apple style"，不误杀对标说明）
  - 品牌风格命中 → 标记待修
  ↓
④palettes 提取（P0-3 修复：从 .pptx 解析，不只靠 README grep）
  - python-pptx 读取每个 .pptx 的填充色/字体色
  - 输出：每个 layout JSON 含 palettes[] 字段
  - 当前：102 个 layouts 含配色（之前 0）
  ↓
⑤去重 + 版权标记 + usable 判断（P0 门槛提高）
  - usable = licenseOk AND (prompts≥3 OR layoutsParsed≥3)
  - 空壳 skill（prompts<3 且 layouts<3）不标 usable
  - 输出：raw-materials/<category>/<id>.json（含版权元数据）
```

## 六、测试管线（test.sh，skill 质量检查 10 项）

| # | 检查项 | 标准 | 方法 |
|---|---|---|---|
| 1 | 文字无重叠/溢出 | 100%无重叠 | 结构化断言(box几何校验) |
| 2 | 字体可商用 | 100%白名单 | 字体名校验(思源/阿里普惠) |
| 3 | 图片版权清白 | 100%CC0/可商用 | 源URL/许可证校验 |
| 4 | 配色对比度 | ≥WCAG AA 4.5:1 | 自动计算 |
| 5 | PNG渲染正确 | 无失真 | 渲染抽检 |
| 6 | 跨端渲染一致 | Mac/Win/手机一致 | 多端截图对比 |
| 7 | 版式数量 | 每场景≥4-5 | 计数 |
| 8 | 风格独特性 | 相似度≤阈值 | 哈希对比 |
| 9 | prompt无品牌名 | 100%无 | 黑名单校验 |
| 10 | AI标识 | 标注"AI生成" | 元数据校验 |

---

## 七、自动化调度

```
cron（周更，周一 02:00）：
  0 2 * * 1 /Users/sunkai/ops-dashboard/docs/aippt-skill-market/scripts/fetch.sh
  30 2 * * 1 /Users/sunkai/ops-dashboard/docs/aippt-skill-market/scripts/clean.sh
  0 3 * * 1 /Users/sunkai/ops-dashboard/docs/aippt-skill-market/scripts/test.sh

X 博主日更（每日 09:00）：
  0 9 * * * /Users/sunkai/ops-dashboard/docs/aippt-skill-market/scripts/fetch-x.sh
```

## 八、产物结构

```
docs/aippt-skill-market/
├── sources/
│   └── catalog.md          # 本文件（数据源清单+抓取规则）
├── scripts/
│   ├── fetch.sh            # GitHub+设计站抓取
│   ├── fetch-x.sh          # X 博主抓取
│   ├── clean.sh            # 清洗管线
│   └── test.sh             # 测试管线
├── raw-materials/
│   ├── skills/             # 可直接用的 skill（YAML中间格式）
│   ├── layouts/            # 版式原子组件
│   ├── palettes/           # 配色方案
│   ├── typography/         # 字体组合
│   ├── charts/             # 图表样式
│   ├── prompts/            # 可复用 prompt
│   └── influencers/        # 博主追踪记录
└── (feasibility.md/roadmap.md/prd.md 已有)
```
