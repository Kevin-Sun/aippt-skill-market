# AI智作PPT模版社 · PRD v2（review 修订版）

> v2 修订：吸收产品/技术/版权/商业四视角第一轮 review 意见
> 关键变更：目标用户重定位/主攻agent改Trae/Codex/加试用生成+PNG导出/生成引擎改客户端渲染/WorkBuddy降级/定价19.9-29.9/版权纠正
> 配套：feasibility.md / roadmap.md / review-round1.md

---

## 1. 产品定位（v2 重定位）

**一句话**：帮"想做 PPT 但不想花时间设计的人"，用 AI 一键生成不撞款的工作汇报/答辩 PPT——交付物是可被 agent 读取的 skill/规则包，配套预览+试用生成+PNG导出。

**v1→v3 定位变更**：
| 维度 | v1 | v2 | **v3** |
|---|---|---|---|
| 目标用户 | "用 WorkBuddy/Trae/Codex 生成 PPT 的人" | "想做 PPT 不想花时间设计的人" | 同 v2（skill 是交付形态非用户筛选） |
| 主攻 agent | WorkBuddy 为主 | Trae/Codex 为主（WorkBuddy降级） | **三家平等（凯哥判断 WorkBuddy 基数大）** |
| 用户语言 | "agent-native skill" | "一键生成不撞款的汇报 PPT" | 同 v2 |
| 交付物 | skill YAML/Markdown | skill+试用生成+PNG导出 | 同 v2 |
| M-1 验证 | 无 | 访谈5-8人 | **本地跑通3 agent+发帖获客** |

**与上时代模板站差异**（用户可感知版本）：
- 千图：300万模板，下载.pptx手动改，5分钟，但撞款严重
- 本项目：输入主题→AI按skill风格生成→不撞款，PNG直接用/配置agent深度编辑

**目标用户**：
- **职场白领**（工作汇报/述职/方案，低设计力，愿付费省时间）
- **学生**（答辩/课程展示，预算敏感但爱用AI工具）
- （后续）公务员/投标/咨询报告扩展

**核心价值**：解决「AI生成PPT千篇一律（ui定势）」痛点——多样化风格skill库，每个skill独特风格，生成不撞款。

## 2. 核心用户故事（v2 补配置失败+效果反馈旅程）

1. 作为**职场白领**，我想浏览"工作汇报"skill，**付费前先看试用生成样张**（输入"Q3销售复盘"生成1页），确认效果后付费解锁，**下载PNG图片**直接用于汇报截图，或复制skill到Trae深度编辑。
2. 作为**学生**，我想选免费"答辩"skill，复制到Trae项目规则，生成答辩PPT，不花钱也能交作业。
3. 作为**付费用户**，我想解锁高级skill，生成不撞款的专业汇报。
4. 作为**小红书用户**，我想看到skill生成的PPT效果图被种草，去小程序获取。
5. 作为**多agent用户**，我想同一skill在Trae和Codex都能用。
6. **【v2新增】作为首次配置失败的用户**，我想在skill详情页找到图文/视频教程，把skill成功配置到Trae。
7. **【v2新增】作为效果不满意的用户**，我想反馈"标题溢出"等问题，得到修复或换skill。

## 3. MVP 功能清单（M0 v2）

**必须（M0）**
- [P0] skill 浏览：首页skill流（场景分类），卡片=预览图+名称+价格
- [P0] skill 预览：**预生成+缓存**（上架时一次性生成所有预览图存云存储，详情页只读缓存，0延迟）
- [P0] **【v2新增】试用生成**：用户付费前输入一句话需求，平台用skill+智谱GLM现场生成1页样张PNG（证明"这个skill真能生成这样的PPT"）
- [P0] **【v2新增】PNG导出**：付费后可导出skill生成的PPT每页PNG（用户拿得见的东西，用于分享/汇报截图）
- [P0] skill 详情页：风格描述+预览所有页+适用场景+试用生成按钮+复制/下载按钮+**【v2新增】配置教程（图文/视频）**+**【v2新增】反馈入口**+价格/解锁
- [P0] skill 复制/下载：一键复制skill内容（Markdown/JSON）+下载.md/.json文件
- [P0] **【v3改】三 agent 打通**：skill 适配 WorkBuddy/Trae/Codex 三家（平等对待，凯哥判断 WorkBuddy 基数大）：
  - Trae：下载 .trae/rules/*.md 放入项目
  - Codex：复制 AGENTS.md 片段
  - WorkBuddy：复制 skill 内容 + 图文引导去企业后台配置（M0 不押 wx.navigateToMiniProgram 传参，接收端黑盒；但 WorkBuddy 作为目标 agent 不降级，基数大）
- [P0] 虚拟支付：付费skill解锁（微信虚拟支付，offerId=1450602455）
- [P0] 我的：已解锁skill+会员状态+设置
- [P0] **【v2新增】配置教程内容资产**：每个skill配套"如何配置到Trae/Codex/WorkBuddy"图文/视频教程
- [P0] **【v2新增】反馈通道**：详情页"有问题？反馈"入口→structured feedback（效果问题分类下拉+截图上传）→人工跟进

**砍掉（后置）**
- ❌ chat优化/修复（M1）
- ❌ 拆解-同步-拼接管线（M1）
- ❌ UGC上架（M2）
- ❌ PPTX导出（M3，M0只PNG）
- ❌ PPT润色（M3）
- ❌ Web站（**v2提前到M1**）
- ❌ wx.navigateToMiniProgram一键发送WorkBuddy（**v3：三家平等但送达方式各自适配，WorkBuddy 走复制+引导因接收端黑盒**）

## 4. skill 多格式适配（v2 从YAML派生不存三份）

一个skill在平台内是统一YAML中间格式，输出时**派生**（不存储）适配三种agent：

| Agent | 输出格式 | 安装方式 | 门槛 | v3优先级 |
|---|---|---|---|---|
| **WorkBuddy** | 技能包JSON（同步Manifest） | 复制内容→企业后台手动配置 | 企业账号 | **三家平等（凯哥判断基数大）** |
| **Trae** | `.trae/rules/<skill>.md`（frontmatter: alwaysApply/description/globs + Markdown） | 下载.md→放入项目.trae/rules/ | 个人低 | 三家平等 |
| **Codex** | AGENTS.md 片段 | 复制片段→追加项目AGENTS.md | 个人低 | 三家平等 |

**v2技术实现**：3个adapter纯函数 `toTraeRule(skill)` / `toCodexAgents(skill)` / `toWorkBuddy(skill)`，从YAML实时派生，不存skillFormats表。

## 5. 轻量生成引擎（v2 放弃Puppeteer，改客户端原生渲染）

**v1→v2 技术方案变更**：
- ❌ v1：服务端Puppeteer渲染HTML+CSS→截图（云函数跑不动：包体/系统库/冷启动全不行）
- ✅ v2：**客户端原生渲染**——LLM生成结构化页面JSON（含box坐标），小程序用WXML+WXSS原生渲染+canvas画图表，`wx.canvasToTempFilePath`导缩略图/PNG

**实现**：
1. 输入skill的prompt+原子组件配置+用户一句话需求
2. 调智谱GLM生成每页结构化JSON（标题/段落/图表数据/配色token/box坐标{x,y,w,h,zIndex}）
3. **zod schema校验**（失败自动重试最多3次）
4. 小程序WXML+WXSS原生渲染（它本来就是渲染引擎）+canvas画图表
5. `wx.canvasToTempFilePath`导PNG（预览缩略图+付费后导出）

**边界**：
- 不生成PPTX（M3才做）
- 不做用户交互式生成（M1 chat才做）
- 预览预生成+缓存（上架时一次性生成，详情页0延迟读缓存）
- 试用生成实时（用户付费前现场生成1页，接受5-15s延迟）

## 6. 页面清单（v2 加试用生成+反馈）

| 页面 | 路径 | 核心元素 | 跳转 |
|---|---|---|---|
| 首页 | pages/index | 场景tabs+skill瀑布流+底部tabBar | →skill详情 |
| skill详情 | pages/skill-detail | 风格描述+预览所有页+**试用生成按钮**+复制/下载+**配置教程**+**反馈入口**+价格/解锁 | →支付/试用/复制 |
| 试用生成 | pages/trial(组件) | 一句话需求输入+生成按钮+1页样张PNG展示 | ←详情 |
| 预览 | pages/preview | 全屏轮播skill生成的PPT每页+缩略图列表+**导出PNG** | ←详情 |
| 支付 | pages/payment(组件) | 套餐(单skill/会员)+虚拟支付 | ←详情 |
| 我的 | pages/profile | 头像+会员+已解锁skill+设置 | →skill列表 |
| 搜索 | pages/search | 搜索框+热门+结果 | →详情 |
| **反馈** | pages/feedback(组件) | 效果问题分类下拉+截图上传+提交 | ←详情 |

## 7. 数据模型（v2 加版本字段+删skillFormats）

```
skills    { _id, id, name, scene, style, preview[paths], prompt, promptVersion, atomicComponents, price, isFree, downloads, likes, createdAt, status }
users     { _id, openid, nick, avatar, memberLevel, memberExpire, createdAt }
userUnlocks { _id, openid, skillId, unlockedAt }  # v2从users.unlockedSkills[]改子表
orders    { _id, openid, outTradeNo, skillId, amount, channel, status, createdAt }
previews  { _id, skillId, pagePaths[], promptVersion, modelVersion, status, generatedAt }  # v2加版本字段
trials    { _id, skillId, openid, userInput, resultPath, createdAt }  # v2新增试用生成记录
feedbacks { _id, skillId, openid, category, description, screenshotPaths[], status, createdAt }  # v2新增反馈
```

## 8. 边界 case（v2 补充）

1. skill预览生成失败→显示占位图+「预览生成中」，异步重试（预生成阶段处理）
2. **试用生成失败**→提示重试，不扣费，记录失败计数器
3. **WorkBuddy配置失败**→降级为复制+图文引导（v2明确不押wx传参）
4. iOS用户买付费skill→wx.requestVirtualPayment苹果支付通道(12%佣金)
5. 会员过期访问已解锁skill→仍可看已解锁，不可解锁新的
6. skill内容命中敏感词→上架前审核+用户举报
7. 预览/试用与实际agent生成效果不一致→**标注「平台预览效果，实际取决于agent和模型」+试用生成降低预期落差**
8. **配置失败**→详情页配置教程+反馈通道（v2补）
9. **LLM输出格式错**→zod校验+重试3次+失败计数器（v2补）

## 9. 合规（v2 纠正版权认知）

- **支付**：虚拟商品→微信虚拟支付，iOS苹果12%/Android微信1%(优惠期)
- **类目**：工具/文娱，非游戏
- **版权（v2纠正）**：
  - ⚠️ **Pexels/Unsplash 不是 CC0，是自定义许可**（允许商用但有限制，需逐图核对许可，不能笼统说CC0）
  - Pixabay 才是 CC0
  - 思源/阿里普惠字体免费可商用（核实署名要求）
  - Lucide/Feather 图标 MIT
  - **skill版式设计必须原创**（"拆解重组=原创"抗辩脆弱，版式设计有著作权，不能抓千图成品拆解）
  - **skill prompt禁用品牌名**（如"苹果发布会风格"→改"极简大字风格"）
- **AI生成内容（v2补）**：预览/试用/PNG标注「AI生成」；遵守生成式AI服务管理办法（标识/内容审核/备案）
- **隐私**：getUserProfile→requiredPrivateInfos声明
- **UGC（M2）**：创作者上架需内容安全审核+版权承诺+平台避风港机制
- **小红书虚拟商品**：核实小红书平台政策合规性

## 10. 商业模式（v2 提价+主推会员）

| 收入项 | v1定价 | **v2定价** | 通道 | 抽成 |
|---|---|---|---|---|
| 单skill解锁 | 3-9元 | **19.9-29.9元** | 虚拟支付-道具 | Android 1%/iOS 12% |
| 会员月订阅 | 9.9元/月 | 19.9元/月 | 虚拟支付-订阅 | 首笔1%/次月10% |
| 会员年订阅 | 88元/年 | **88元/年（主推）** | 虚拟支付-订阅 | 首笔1%/次月10% |

**v2定价逻辑**：
- 单skill 19.9-29.9元（对齐小红书PPT模板中位价，覆盖生产成本105-265元需18-50单盈亏平衡）
- 主推会员年费88元（提升LTV，对冲skill非消耗品+PPT低频的留存问题）
- 免费skill比例压到15-20%（v1的30-40%太高）

**冷启动**：M0 8-10精品skill（v1的16个砍半），每场景1-2免费引流+4-5付费；小红书种草+**M1 Web站SEO**（v2提前）。

## 11. v3 新增 M-1 验证阶段（凯哥方向：本地跑通+发帖获客）

**M-1（1-2周，M0前必做，v3 修订）**：
1. **本地跑通 3 个 agent 的 skill**（技术 PoC）：
   - WorkBuddy：skill 作为技能包接入企业后台（凯哥有企业主体北京威智启明科技，需开 WorkBuddy 企业后台）→ 配置 → 生成 PPT → 截图存证
   - Trae：skill 转 .trae/rules/*.md → 放入项目 → 生成 PPT → 截图存证
   - Codex：skill 转 AGENTS.md 片段 → 放入项目 → 生成 PPT → 截图存证
   - 跑通 = 3/3 都能生成可接受 PPT
2. **社交媒体/闲鱼发帖获客验证**（真实市场反馈，非访谈）：
   - 闲鱼发 PPT skill 商品帖（9.9 元试水，验证付费意愿）
   - 小红书发效果对比帖（撞款 vs skill 生成不撞款）
   - 微博/即刻扩大触达
   - 看浏览/咨询/购买数
3. **判断点**：
   - 3 agent 跑通率 < 3/3 → 修 skill 格式或砍 agent
   - 发帖 0 咨询 → 需求不真实或话术不对
   - 发帖有咨询但 0 购买 → 付费意愿弱或定价问题
   - 发帖有购买 → M0 可启动

**v3 vs v2 关键差异**：WorkBuddy 不降级（三家平等）；验证从访谈改为本地跑通+发帖获客（用户做>用户说）

**补充点**：WorkBuddy 基数大 ≠ 用 WorkBuddy 生成 PPT 习惯。发帖获客恰好同时验证"基数"和"使用习惯"。

## 12. 待 review 的点（v2）

1. v2定价19.9-29.9元/88元年，凯哥接受吗？
2. 主攻agent改Trae/Codex（WorkBuddy降级），接受吗？
3. M0加试用生成+PNG导出，技术上能做吗（客户端原生渲染）？
4. M-1用户验证阶段先做，接受吗？
5. 版权纠正（Pexels非CC0/版式必原创/禁品牌名）影响skill生产方式吗？
6. Web站提前到M1，资源够吗？
