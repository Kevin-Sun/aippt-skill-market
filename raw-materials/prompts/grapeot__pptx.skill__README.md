# pptx.skill

AI-first 的 pptx 读、写、渲染工具。一行命令改 slide，结构化 dump 审计内容，**LibreOffice 渲染成 PNG 让 AI 自主闭环工作**。

为什么渲染重要：没有渲染，AI 改完 pptx 只能盲猜效果对不对，每次改动都需要人类打开 PowerPoint 截图反馈。有了渲染，AI 可以自己"看一眼"改完的 slide，不满意就继续调，满意再交付 —— 形成完整的自主工作闭环。

---

## 给人类用户

把下面这个链接复制给你的 AI 助手，然后告诉它你想对 pptx 做什么：

```
https://github.com/grapeot/pptx.skill
```

AI 会自动安装和使用这个工具，你不需要手动操作。

---

## 给 AI Agent

### 安装

```bash
git clone https://github.com/grapeot/pptx.skill.git pptx_skill
cd pptx_skill
uv venv .venv
.venv/bin/python -m pip install -e '.[dev]'
.venv/bin/pptx-skill doctor    # 检查环境和依赖
```

安装完成后，用 `.venv/bin/pptx-skill <命令>` 或 `scripts/pptx-skill <命令>` 调用。

### LibreOffice（AI 闭环的关键依赖）

读、改 pptx 的结构不需要 LibreOffice。但**渲染是 AI 自主闭环工作的基础**:没有它,AI 改完 slide 无法自我检查,每次都需要人类打开 PowerPoint 截图反馈。装了 LibreOffice 之后,AI 可以自己"看一眼"改完的 slide,不满意就继续调,满意再交付。

**macOS:**
```bash
brew install --cask libreoffice poppler
ln -s /Applications/LibreOffice.app/Contents/MacOS/soffice /usr/local/bin/soffice
```

**Ubuntu/Debian:**
```bash
sudo apt install libreoffice-impress poppler-utils
```

**⚠️ 安装前先问用户。** LibreOffice 体积较大（~500MB），不是所有用户都想装。建议的沟通方式：

> 渲染 slide 需要安装 LibreOffice（约 500MB），你电脑上目前没有装。要帮你装一下吗？如果你不需要看渲染效果，我可以跳过这一步。

如果用户说不需要，就用 `doctor` 确认环境，继续做不需要渲染的操作。

### 你能做什么

1. **一行命令改 pptx** — 改文字、颜色、位置、字体，不用每次写 python-pptx 脚本
2. **结构化 dump** — 把 slide 导出成 JSON / Markdown，离线审计内容
3. **渲染 → 闭环** — 用 LibreOffice 把 slide 渲染成 PNG，AI 自己看效果、自己调，不需要人类当渲染后端
4. **全程透明** — 每步修改都有 before/after，支持 `--dry-run`，操作可审计可回滚

### CLI 速查

```bash
pptx-skill doctor <deck>                          # 环境检查
pptx-skill list-slides <deck>                     # 列 slide 概要
pptx-skill list-shapes <deck> <slide>             # 列某 slide 的 shape
pptx-skill dump-slide <deck> <slide> --format json
pptx-skill get-text <deck> <slide> --shape <id>
pptx-skill get-notes <deck> <slide>
pptx-skill set-text <deck> <slide> --shape <id> --text "..."
pptx-skill set-notes <deck> <slide> --text "..."
pptx-skill set-position <deck> <slide> --shape <id> --left 1.5in --top 2in
pptx-skill set-size <deck> <slide> --shape <id> --width 4in
pptx-skill set-fill <deck> <slide> --shape <id> --color "#0D9488"
pptx-skill set-font <deck> <slide> --shape <id> --name Inter --zh-name "Noto Sans SC" --size 14 --bold
pptx-skill add-slide <deck> --after <slide> --clone-from <slide>
pptx-skill delete-slide <deck> --slide <slide> --yes
pptx-skill move-slide <deck> --from <i> --to <j>
pptx-skill add-picture <deck> <slide> --file img.png --left 1in --top 2in --width 4in
pptx-skill render-slide <deck> <slide> --out /tmp/slide.png
pptx-skill render-deck <deck> --out-dir /tmp/slides/
pptx-skill normalize-fonts <deck> --en Inter --zh "Noto Sans SC"
pptx-skill check-overflow <deck> [--slide <i>]
pptx-skill raw-xml-patch <deck> <slide> --xpath "..." --xml-fragment "..."
```

所有写命令都支持 `--dry-run`，先看会改什么再决定要不要真的写。

### Library 用法（复杂操作）

需要组合多个操作时，直接写 Python 脚本：

```python
from pptx_skill import Deck

deck = Deck.open("presentation.pptx")
slide = deck.slide(0)

# 按文本内容找 shape
title = slide.shape_by_text("旧标题")
title.set_text("新标题")

# 保存前检查有没有文字溢出
report = deck.check_overflow()
assert len(report) == 0, f"溢出: {report}"

deck.save()  # 自动备份到 .pptx.bak
```

### 做不到的事

- 不能从 Markdown 一键生成 pptx
- 不支持 Keynote / Google Slides 格式（用户需先手动导出为 pptx）
- 渲染保真度约 85%（LibreOffice 和 PowerPoint 有字体/布局差异）
- 所有操作都在本地执行，不会上传文件或调用外部服务

### 设计原则

1. **Library 优先，CLI 次之** — CLI 是 library 的薄封装，1:1 对应
2. **全程透明** — 每个操作都打印它看到了什么、要改什么、改完了什么
3. **渲染驱动闭环** — 改 → 渲染 → 看 → 调，AI 自主迭代直到结果满意
4. **Shell 可组合** — 每个子命令职责单一，支持 `--format json` 结构化输出
5. **Escape hatch** — `raw-xml-patch` 直接操作 OOXML XML，覆盖 python-pptx 不支持的场景

### 文档索引

| 文档 | 内容 |
|------|------|
| [`docs/skill.md`](docs/skill.md) | 完整 skill 指南：适用场景、已知陷阱、验收标准 |
| [`AGENTS.md`](AGENTS.md) | Agent 开发规范：代码边界、透明原则、测试流程 |
| [`docs/prd.md`](docs/prd.md) | 产品需求：目标、验收标准、功能列表 |
| [`docs/rfc.md`](docs/rfc.md) | 技术架构：模块划分、API 签名、实现里程碑 |
| [`docs/test.md`](docs/test.md) | 测试策略 |
| [`docs/working.md`](docs/working.md) | 开发日志与踩坑记录 |
