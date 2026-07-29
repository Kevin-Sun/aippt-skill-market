# JJT · J 人的 PPT

> J 人专用的无限缩放演示文稿生成器 — 大纲先行、结构清晰、一秒上线。

一句话生成可交互无限缩放演示文稿——拖拽缩放无限画布、双击节点对位飞行、地图式无限放大、8 套主题任选。

**这是一个 agent-agnostic 的 AI 助手 skill**，任何能运行 bash + 写文件的 AI agent 都能跑。

![preview](jjt/examples/theme-handdrawn.png)

---

## 安装

### 前置条件

你需要一个支持 skill 的 AI agent，并且这个 agent 有 bash + 文件读写能力。已验证：

- **OpenClaw** — skill 目录 `~/.openclaw/skills/`
- **Claude Code** — skill 目录 `~/.claude/skills/`
- **Claude Cowork** — skill 目录 `~/.claude/skills/`（与 Code 共用）
- **Cursor / Continue / Copilot** — 各自的 skill / rules / prompts 目录
- 其他 agent — 看它自己的 skill 约定，本 skill 只是一个文件夹 + 一份 SKILL.md，能放进去就能用

### 三步安装

**1. 把仓库拉下来**

```bash
git clone https://github.com/GarfieldJ/jjt.git
cd jjt
```

**2. 把 skill 文件夹复制到你的 agent skill 目录**

```bash
# OpenClaw
cp -r jjt ~/.openclaw/skills/

# Claude Code / Cowork
cp -r jjt ~/.claude/skills/

# 其他 agent
cp -r jjt <your-agent-skill-dir>/
```

**3. 重启 agent 让它识别新 skill**

OpenClaw / Claude Code 在下次启动时会自动扫描 skill 目录。Cursor / Copilot 之类的 IDE 插件可能需要在设置里 reload。

### 验证安装

跟 AI 说：*"列出我安装的 skills"* 或 *"do you have a JJT-style deck-building skill?"* 看它能不能找到 `jjt`。或者直接给它一个任务测试：

> "用赛博朋克主题做一个关于我们公司 Q3 战略的演示"

如果 AI 开始问你大纲（5 章节 × 2 子节）、并询问图源（自带工具 / 你提供 / 网图 / 纯文字），说明 skill 已经生效。

### 关于图片生成

skill **完全不绑定**任何特定图片生成工具。AI agent 会：

1. **优先用你已配置的图片生成能力**——MiniMax mmx-cli、OpenAI DALL-E、本地 Stable Diffusion / ComfyUI / FLUX、Midjourney bridge、Gemini 原生等等
2. 没有图片能力？**询问你**怎么处理：
   - **你提供** — AI 告诉你要哪几张图，你按命名（hub.jpg, ch1.jpg, ...）丢进文件夹
   - **网图搜索** — 如果 agent 有网搜工具
   - **纯文字** — 不要图，所有卡片用便签纸样式（每个主题的 demo 都展示了这种样式）

> 原作者用的是 [mmx-cli](https://github.com/MiniMax-AI/cli) 作为图源，但**这不是必须**。

---

## 快速体验示例

仓库的 `jjt/examples/` 文件夹里有 8 个完整 demo，直接双击 HTML 就能看（无需任何依赖）：

```
open jjt/examples/index.html  # 画廊导航
```

或单独看某个主题：

```
open jjt/examples/handdrawn/index.html
```

## 8 套主题预览

| 主题 | 适合什么 | 布局比喻 | 示例 |
|---|---|---|---|
| 🍰 **KAWAII** | 烘焙、生活、礼物、儿童 | 蛋糕分层垂直堆叠 | [甜品时光](jjt/examples/kawaii/) |
| 🌃 **CYBERPUNK** | 黑客、未来、电影、游戏 | 电路板辐射 | [2099 夜城](jjt/examples/cyberpunk/) |
| ✏️ **HAND-DRAWN** | 日记、读书、旅行 | **地图无限放大**（hub 是世界地图，城市像图钉嵌在上面） | [旅行手账](jjt/examples/handdrawn/) |
| 📊 **FORMAL** | 董事会、年报、投资 | 金字塔自上而下 | [Q3 业务回顾](jjt/examples/formal/) |
| 🌸 **ANIME** | 故事、影评、童话 | 树枝扇形展开 | [海街少女的夏天](jjt/examples/anime/) |
| 🐱 **CATS** | 宠物、温情、童趣 | 爪印小径蜿蜒 | [三只猫的一周](jjt/examples/cats/) |
| 💎 **TECH** | 数据、产品、技术分享 | DAG 知识图谱 | [数据宇宙](jjt/examples/tech/) |
| 🥃 **VINTAGE** | 历史、文学、人物 | 横向翻页相册 | [老上海 1930](jjt/examples/vintage/) |

每个主题 = 独立色板 / 字体 / 节点形状 / 入场动画 / 连线风格 / 配图风格 / 推荐布局比喻。详细规格见 [SKILL.md 的 Theme Packs 章节](jjt/SKILL.md#theme-packs)。

## 交互操作

参考 Prezi 经典的 *"move in any order"*：

- **默认 = 自由模式**：鼠标拖动平移、滚轮缩放——任意角度俯瞰整个画布
- **双击任意节点** → 立即切到演示模式，相机精准对位（HAND-DRAWN 是真正的 5× 拉近到城市，再 3× 拉近到景点）
- **演示中滚动滚轮** → 退回自由模式
- **Esc** → 鸟瞰
- **← →** → 演示模式下顺序翻页

## 用法示例

跟你的 AI 说类似的话：

- *"用赛博朋克主题做个关于我们公司 Q3 战略的演示"*
- *"做一个手绘风格的我去年旅行的回顾，5 个目的地"*
- *"给我做一个猫咪主题的领养指南"*
- *"做一个正式风格的产品发布会 deck，5 个章节每个 2 个子点"*

AI 会：
1. **大纲先行**——列出 hub + 5 章节 + 每章节 2-3 子节点，让你确认
2. **询问图源**——根据你 agent 的能力问你怎么处理
3. **按主题视觉系统组装 HTML**——纯静态文件，无后端
4. **输出可双击运行的完整文件夹**——内含 `index.html` + `impress.js` + `panzoom.min.js` + 5 张图

## 完整 skill 文档

[`jjt/SKILL.md`](jjt/SKILL.md) — 670+ 行：

- Agent 能力发现与 4 路径图源策略
- 完整生成流程（大纲 → 图源 → HTML 组装 → 验证）
- 8 套主题详细规格（色板、字体、形状、动效、布局比喻、配图 prompt 后缀）
- 17+ 条踩坑笔记（impress.js + panzoom 集成的真实陷阱）

## 技术栈

- [impress.js 2.0](https://github.com/impress/impress.js) — 相机/路径动画（MIT）
- [panzoom 9.4](https://github.com/anvaka/panzoom) — 鼠标自由拖拽缩放（MIT）
- 任意 AI agent + 任意 image-gen 工具（由你的环境决定）

## License

MIT
