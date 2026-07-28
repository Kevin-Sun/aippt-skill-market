# AI智作PPT模版社 · 可行性分析报告

> 面向国内 WorkBuddy/Trae/Codex 的多样化 PPT skill 分发平台
> 生成方式：pipeline.md 调研 SOP 五节契约（执行摘要/信源矩阵/交叉验证/死区声明/原始引用）
> 生成时间：2026-07-26 · 决策基线：凯哥确认 3 决策点（目标 agent=WorkBuddy/Trae/Codex；场景=工作汇报+学生答辩；M0 砍 chat 和拼接）
>
> ⚠️ **v3 声明**：本报告经三轮 review + 凯哥挑战修订。第六节「v2 修订补充」+ 本节 v3 纠正为最终结论。v3 关键变更（覆盖 v2）：
> - "WorkBuddy 为主" → v2 改"Trae/Codex 为主 WorkBuddy 降级" → **v3 纠正：三家平等（凯哥 95% 确定 WorkBuddy 基数大，企业微信渗透率 >> 开发者工具）**。v2 把"企业级技术门槛"等同于"用户基数小"是错的。
> - "M-1 验证=访谈5-8人" → **v3 改：本地跑通3 agent skill + 社交媒体/闲鱼发帖获客**（访谈是"用户说"，发帖是"用户做"，真金白银反馈才置信）
> - "CC0 图站（Unsplash/Pexels）" → **v2：Pexels/Unsplash 非 CC0 是自定义许可，Pixabay 才是 CC0**
> - "agent-native 差异化" → **v2：用户可感知的"不撞款"价值**
> - "规则引擎拼接" → **v2：M1 改 LLM 辅助人工上新**
> - "定价 3-9 元" → **v2：19.9-29.9 元，主推会员年费 88 元**
> - **v3 补充**：WorkBuddy 基数大 ≠ 用 WorkBuddy 生成 PPT 习惯，发帖获客恰好同时验证两个维度

---

## 一、执行摘要

### 切入点

「AI智作PPT模版社」定位为**面向国内主流 agent（WorkBuddy/Trae/Codex）的多样化 PPT skill 分发平台**。不自建 PPT 生成能力（至少 M0 不做），交付物是**可被 agent 读取的 skill/规则包**（WorkBuddy 技能包 / Trae `.trae/rules/*.md` / Codex AGENTS.md），平台提供 skill 预览（轻量生成引擎）+ 一键复制/发送。直接竞品不是 AI PPT 生成器（Gamma/Tome），而是**上个时代的 PPT 模板站**（千图/包图/WPS稻壳儿）——把"卖成品 .pptx 文件"升级为"卖 agent 生成能力（skill）"。

### 可行性判断：✅ 成立，但有两个关键风险必须正视

**支撑成立的证据**：
1. **赛道正规军已入场**：Anthropic 官方有 `skills/pptx` skill；GitHub `sunbigfly/ppt-agent-skills` 862★ 证明需求真实。
2. **「ui 定势」痛点真实存在**：《Why AI Slides Look Fake in 2026》(2026-04) 列出 AI slides 千篇一律的 5 个感知原因（统一排版节奏/过饱和插画/库图占位/通用用语…）——单个 skill 风格有限，用户快速看腻。这正是差异化机会：**多样化风格 skill 库**。
3. **目标 agent 有标准 skill 接入机制**：WorkBuddy 技能/专家/MCP/连接器（同步 Manifest）；Trae `.trae/rules/*.md`（Markdown 规则）；Codex AGENTS.md——三种格式可适配。
4. **分发渠道有真实先例**：小红书卖 PPT 模板虚拟商品，有店铺 3 个月单月进账近 2 万（GitHub enn7304 调研）。
5. **版权可解决**：CC0 图站（Unsplash/Pexels/Pixabay）+ 免费可商用字体（思源/阿里普惠）+ MIT 图标库（Lucide/Feather）覆盖原子组件版权。

**两个必须正视的风险**：
- ⚠️ **风险1：竞品不是"上个时代"，是"正在 AI 化的巨头"**。千图（300万+模板/8万企业VIP/28万设计师/版税上亿）已做"AI汇报PPT"；PPTwiki 已做"AIPPT+一键排版"；WPS稻壳儿有金山生态。它们有钱有版权有用户，且在主动转型。你的差异化必须清晰：**比它们更"agent-native"（卖 skill 而非卖文件），比开源 skill（862★但只有8套主题）更"多样化"**。
- ⚠️ **风险2：小程序→WorkBuddy 打通受限于 WorkBuddy 开放度**。`wx.navigateToMiniProgram + extraData` 传参技术上可行，但 WorkBuddy 小程序**是否解析外部传入的 skill 数据**由腾讯决定，凯哥控制不了。M0 可能只能做到"小程序展示/复制 skill → 引导用户去 WorkBuddy 手动配置"，真正"一键发送"需 WorkBuddy 开放接收接口（不确定）。

### 核心差异化（护城河）

不是 skill 库本身（开源框架已有），而是**持续生产新 skill 的管线**：原子组件拆解（8类：layout/配色/字体/图片/图表/图标/装饰/叙事）→ 趋势追踪（X/Dribbble/GitHub UI skill/色彩站）→ 规则引擎拼接 → 质量检查 → 多格式适配上线。这套管线让"上新"成本远低于人工设计，且天然规避版权（原子组件分开抓+重组=原创组合）。

---

## 二、信源矩阵

### 2.1 上时代 PPT 模板站（直接竞品）

| 竞品 | 模板量 | 模式 | AI化进度 | 版权机制 | 弱点 | 信源 |
|---|---|---|---|---|---|---|
| 千图网 | 300万+(PPT 150万+) | 企业VIP(8万+企业) | AI汇报PPT已上线 | 28万设计师+版税上亿 | 风格偏传统/agent原生缺位 | 58pic.com / exa |
| 包图网 | 200万+(PPT 120万+,60%+) | 会员 | 未明确AI PPT | 设计师签约 | 同上 | pptwiki.com评测 |
| PPTwiki | 10万+原创 | 会员+AI生成 | AIPPT+一键排版 | 设计师审核 | 模板量小/国内认知低 | pptwiki.com |
| WPS稻壳儿 | 金山生态海量 | 订阅(WPS会员) | WPS AI集成 | 金山版权 | 封闭生态/不可外带 | 金山官方 |
| Canva可画 | 国际海量 | 订阅+免费 | Magic Design AI | 收购Pexels/合规 | 国内访问/本土化 | 36氪专访 |
| Slidesgo | 国际 | 免费+付费 | AI Pres Maker | Freepik 旗下 | 中文少 | slidesgo.com |

### 2.2 agent skill 生态（参照物+潜在竞品）

| 项目 | 星数 | 形态 | 风格数 | 分发 | 信源 |
|---|---|---|---|---|---|
| sunbigfly/ppt-agent-skills | 862★ | Claude Code Skill(7阶段/10版式/13图表) | 8套主题 | npx skills add | GitHub |
| Akxan/ppt-agent-skill | 110★ | Claude Code Skill(HTML+PPTX) | 26 styles | GitHub | GitHub |
| Anthropic skills/pptx | 官方 | 通用pptx处理skill | 无风格(基础能力) | 官方仓库 | github.com/anthropics/skills |
| knight6669/knight-html-ppt-skill | 4★ | 中文报告HTML PPT skill | 单风格 | GitHub | GitHub |

### 2.3 目标 agent skill 系统（决定 skill 格式）

| Agent | skill 形态 | 接入方式 | 门槛 | 信源 |
|---|---|---|---|---|
| WorkBuddy | 技能/专家/MCP/连接器(同步Manifest) | 企业后台配置+发布 | 企业账号+企业坐席 | cloud.tencent.com/document/product/1831 |
| Trae | `.trae/rules/*.md`(全局/项目规则,alwaysApply/description/globs) | 项目内创建规则文件 | 个人开发者,低门槛 | docs.trae.cn/ide_rules |
| Codex | AGENTS.md | 项目根目录文件 | 个人开发者,低门槛 | OpenAI Codex 文档 |

### 2.4 ui 定势痛点（需求验证）

| 证据 | 来源 | 要点 |
|---|---|---|
| 《Why AI Slides Look Fake in 2026》 | 2slides.com 2026-04 | AI slides 假的5原因:统一排版节奏/过饱和插画/库图占位/通用用语/可疑 |
| 《Why AI-Generated Slides Look Generic》 | winningpresentations.com 2026-01 | AI slides 千篇一律是真实痛点 |
| sunbigfly 仅8套主题 | GitHub | 单 skill 风格有限,印证定势问题 |

### 2.5 分发渠道与版权

| 维度 | 事实 | 信源 |
|---|---|---|
| 小红书卖PPT模板 | 有店铺3个月单月进账近2万 | GitHub enn7304/xiaohongshu-virtual-products |
| 小红书虚拟产品品类 | 文档模板类(PPT/简历/合同/商业计划书)是热门 | 同上 |
| CC0免费商用图 | Unsplash/Pexels/Pixabay | 36氪专访Canva法务 |
| 免费可商用中文字体 | 思源黑体/宋体、阿里巴巴普惠体 | 字体厂商 |
| 开源图标 | Lucide(MIT/ISC)/Feather(MIT) | lucide.dev |
| 小程序间传参 | wx.navigateToMiniProgram+extraData | 微信官方文档 |

---

## 三、交叉验证

### 3.1 「ui 定势」痛点真实性（≥2信源验证 ✅）

- 信源1：《Why AI Slides Look Fake in 2026》(2slides.com)——5个感知原因
- 信源2：《Why AI-Generated Slides Look Generic》(winningpresentations.com)
- 信源3：sunbigfly 862★ 仅8套主题（开源框架的局限性）
- **结论**：AI 生成 slides 千篇一律是真实且被广泛讨论的痛点，多样化风格 skill 库有明确需求。

### 3.2 skill 作为交付形态的可行性（≥2信源验证 ✅）

- 信源1：Anthropic 官方 skills/pptx（官方认可形态）
- 信源2：sunbigfly 862★（社区已大量使用）
- 信源3：WorkBuddy 技能包机制（企业级 agent 支持技能挂载）
- 信源4：Trae `.trae/rules` 系统（IDE 级 agent 支持规则文件）
- **结论**：skill/规则包作为 PPT 生成能力的交付形态，已被官方、社区、企业级 agent 三方验证。

### 3.3 小红书分发渠道可行性（≥2信源验证 ✅）

- 信源1：GitHub enn7304 调研报告（PPT模板店铺3个月单月近2万）
- 信源2：小红书虚拟产品品类分析（文档模板类是热门）
- **结论**：小红书卖 PPT skill/模板作为分发+变现渠道可行，有真实营收先例。

### 3.4 版权解决方案可行性（≥2信源验证 ✅）

- 信源1：36氪专访 Canva法务+Pexels商务（CC0 免费商用合规）
- 信源2：Lucide 官网（MIT/ISC 开源图标）
- 信源3：思源/阿里普惠字体（免费可商用）
- **结论**：原子组件版权可通过 CC0图站+免费商用字体+MIT图标库解决，但**模板版式设计本身仍需原创**（不能抓千图成品）。

---

## 四、死区声明

以下信息**未拿到确切数据**，报告中相关判断标注为推测：

1. **千图/包图的真实营收**：非公开，只能从"8万企业VIP+版税上亿"侧面估算，具体 GMV/利润未知。
2. **WorkBuddy 小程序是否开放接收外部 skill 参数**：官方文档未明确，wx.navigateToMiniProgram 传参可行但 WorkBuddy 接收端开放度未确认——**M0 最大技术不确定点**。
3. **skill 市场付费转化率**：agensi.io 有创作者指南但无公开转化数据，定价靠对标小红书虚拟商品（3-29元区间）。
4. **Trae 用户规模**：字节未公开 Trae 活跃用户数，市场体量靠推测。
5. **"拼接规则引擎"的可行性**：原子组件拼接需要设计系统规则，技术可行性未实测，M0 先不做拼接（M1 验证）。
6. **小红书 PPT 模板"单月近2万"为单一案例**：不代表普遍水平，实际收入看运营能力。

---

## 五、原始引用

1. 千图网-免费在线设计图片素材网站-正版商用素材图库模板大全 · https://www.58pic.com/ · 2026
2. 千图网 vs 包图网 +PPT百科，商用PPT模板网站资源谁更丰富？ · https://www.pptwiki.com/1610690.html · 2025-12-16
3. WorkBuddy Enterprise 快速开始 · https://cloud.tencent.com/document/product/1831/134527 · 2026-07-01
4. Trae 规则（Rule）文档 · https://docs.trae.cn/ide_rules
5. sunbigfly/ppt-agent-skills · https://github.com/sunbigfly/ppt-agent-skills · 862★
6. Akxan/ppt-agent-skill · https://github.com/Akxan/ppt-agent-skill · 110★
7. Anthropic skills/pptx · https://github.com/anthropics/skills/blob/main/skills/pptx/SKILL.md
8. Why AI Slides Look Fake in 2026 · https://2slides.com/blog/why-ai-slides-look-fake-and-how-to-fix · 2026-04-17
9. Why AI-Generated Slides Look Generic · https://winningpresentations.com/ai-generated-slides-look-generic/ · 2026-01-19
10. enn7304/xiaohongshu-virtual-products（小红书虚拟产品调研）· https://github.com/enn7304/xiaohongshu-virtual-products
11. 专访Canva可画和Pexels：创作者如何合法合规使用免费图库？· https://m.36kr.com/p/1123938382098950 · 2026-06-25
12. Lucide Icons · https://lucide.dev/
13. wx.navigateToMiniProgram 官方文档 · https://developers.weixin.qq.com/miniprogram/dev/api/navigate/wx.navigateToMiniProgram.html
14. How to Sell AI Agent Skills: Creator Economy Guide · https://www.agensi.io/learn/sell-ai-agent-skills-creator-guide · 2026
15. Presentation Design Trends 2026 · https://www.inkppt.com/post/presentation-design-trends-the-complete-guide · 2026-06-22

---

## 六、v2 修订补充（第一轮 review 后纠正）

### 6.1 版权认知纠正（版权视角 review）
- ⚠️ **Pexels/Unsplash 不是 CC0**，是自定义许可（允许商用但有限制，需逐图核对），原文档笼统说"CC0图站"是错的
- **Pixabay 才是 CC0**
- 思源/阿里普惠字体免费可商用但需核实署名要求
- **"拆解重组=原创"抗辩脆弱**：版式设计有著作权，不能抓千图/包图成品模板拆解
- **skill prompt 禁用品牌名**（如"苹果发布会风格"→"极简大字风格"）
- **AI生成内容需标识**（生成式AI服务管理办法）

### 6.2 新增风险（产品+商业视角 review）
- ⚠️ **WorkBuddy 用户基数不确定**：企业级（企业账号+坐席），普通白领/学生大概率无权限，可触达用户基数存疑（死区声明补充）
- ⚠️ **agent-native 定位商业错误**：国内 agent 用户基数（1-5万乐观估计）远小于千图/WPS（百万级），差异化定位反而抬高获客成本
- ⚠️ **定价 3-9 元单位经济崩塌**：单skill生产成本105-265元>售价6元，CAC>客单价（小红书投流ROI 0.002-0.17血亏）
- ⚠️ **skill 非消耗品+PPT低频**：订阅制难成立，月订阅次月流失率可能>70%
- ⚠️ **前置假设未验证**：目标用户是否已用agent生成PPT且撞款，未验证

### 6.3 新增死区声明
7. **小红书获客成本**：无公开数据，"单月近2万"为单一案例，实际获客成本靠推演（投流ROI极低）
8. **WorkBuddy 用户基数**：非公开，企业坐席渗透率靠推测
9. **agent 生成 PPT 用户习惯比例**：无公开数据，需 M-1 访谈验证

### 6.4 v2 关键修订（对应 prd.md v2 / roadmap.md v2）
1. 定价 3-9 元 → **19.9-29.9 元**，主推会员年费88元
2. 主攻 agent WorkBuddy → **Trae/Codex**（个人低门槛），WorkBuddy 降级
3. 目标用户 → **"想做PPT不想花时间设计的人"**（skill是交付形态非用户筛选）
4. M0 加**试用生成+PNG导出**（解决"付费给YAML体验断裂"）
5. 生成引擎 **Puppeteer→客户端原生渲染**（WXML+canvas+canvasToTempFilePath）
6. WorkBuddy打通 → **降级为复制+引导**（不押wx传参）
7. **Web站提前到M1**（SEO是规模化获客主渠道）
8. **新增 M-1 用户验证阶段**（1-2周，M0前必做）
9. 质量检查 Visual QA → **结构化断言（box几何校验）**
10. UGC 分成 70% → **阶梯分成（50%/60%/70%）**
11. skill数量 16 → **8-10精品**
