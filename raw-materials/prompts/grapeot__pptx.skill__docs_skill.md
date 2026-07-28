# PPTX Skill

AI-first library + CLI for inspecting, editing, and rendering PowerPoint (`.pptx`) decks with aggressive transparency.

**触发词**: "改 pptx"、"改 slide"、"改这个 ppt"、"改 powerpoint"、"pptx 加一张 slide"、"pptx 改文字"、"pptx 渲染"、"pptx 导出"、"把 ppt 转成图"、"ppt 保真"、"渲染 ppt"

---

## 元数据

- **类型**: API Guide(library + CLI 工具)
- **项目位置**: `.`（本 repo 根目录）
- **PRD**: `docs/prd.md`
- **RFC**: `docs/rfc.md`
- **创建日期**: 2026-04-11

## 这个 skill 是做什么的

提供一套对 AI 友好的 pptx 读、写、渲染能力。核心价值不在 python-pptx 本身(这是底层依赖),而在:

1. **Shell-level 访问**: 让 AI 用一行 CLI 命令完成高频任务,不用每次手写 python-pptx 脚本
2. **结构化 dump**: 把 slide 序列化成 JSON / Markdown,让 AI 做离线审计
3. **渲染驱动闭环**: 用 LibreOffice 把 slide 渲染成 PNG,让 AI 自己检查改动效果,不满意就继续调,形成完整的自主工作闭环。没有渲染,AI 改完 slide 只能盲猜效果对不对,每次改动都需要人类打开 PowerPoint 截图反馈
4. **Aggressive transparency**: 每一步修改的 before / after 状态可见,操作可复现、可审计、可 dry-run

AI 在用这个 skill 的时候应该:

- **简单修改** → 走 CLI subcommand(一行搞定)
- **复杂组合** → 走 Python library(写 20-30 行脚本)
- **渲染确认** → 用 `render-slide` 看实际效果
- **碰到 API 没覆盖的 edge case** → 用 `raw-xml-patch` escape hatch

## 适用场景(什么时候用)

- 用户要求修改已有 pptx 的某些 slide(改 agenda、改 speaker notes、替换图片、加新 slide)
- 用户要求从已有 deck 提取结构化信息(列 slide、dump 成 JSON)
- 用户要求把 pptx 渲染成 PNG 让 AI 看
- 用户要求批量操作 deck(循环改每张 slide 的某个 footer、bulk font 替换)
- AI 自己想做 reality check,在改完后看一眼效果

## 不适用场景(不要用)

- **从头生成整个 deck** → 不要写一个一键 md → pptx 生成器。让 AI 写自己的 Python 脚本 `from pptx_skill import Deck`,循环调库函数
- **Keynote / Google Slides 格式** → 只处理 pptx。Keynote 文件用户需要先手动 Export to pptx
- **复杂视觉效果的精确重现** → SmartArt、Chart、3D、animation、WordArt 非线性变形不支持。碰到这些告诉用户手动在 PowerPoint 改
- **Pixel-perfect 保真渲染** → LibreOffice 的 render 和 PowerPoint 有 ~85% 视觉一致,不要把 render PNG 当金标准
- **需要网络的场景** → 所有操作本地执行,不上传、不调外部服务

## 验收标准

修改完一个 deck 之后,用下列标准检查:

1. **目标字段已改,其他字段未改**: 用 `dump-deck` 对比修改前后的 JSON,diff 只应该出现在目标位置。
2. **deck 在 PowerPoint 打开无报错**: 手工打开,或者至少用 `doctor` 报告 "deck readable"。
3. **如果涉及文字修改**: 用 `render-slide` 确认改完的文字没有溢出 shape。
4. **如果涉及批量操作**: 用 `check-overflow` heuristic 跑一遍,确认没新增 overflow。
5. **如果是破坏性操作**(delete / move slide): 有 `.bak` 备份,可以 `mv deck.pptx.bak deck.pptx` 回滚。

## CLI 速查

进入项目 .venv 后运行(也可以用 `scripts/pptx-skill` wrapper 免激活):

```bash
cd pptx_skill
.venv/bin/pptx-skill doctor [<deck>]                    # 环境检查
.venv/bin/pptx-skill list-slides <deck>                 # 列 slide 概要
.venv/bin/pptx-skill list-shapes <deck> <slide>         # 列某 slide 的 shape
.venv/bin/pptx-skill dump-slide <deck> <slide> --format json   # JSON dump
.venv/bin/pptx-skill get-text <deck> <slide> --shape <id>
.venv/bin/pptx-skill get-notes <deck> <slide>
.venv/bin/pptx-skill set-text <deck> <slide> --shape <id> --text "..."
.venv/bin/pptx-skill set-notes <deck> <slide> --text "..."
.venv/bin/pptx-skill set-position <deck> <slide> --shape <id> --left 1.5in --top 2in
.venv/bin/pptx-skill set-size <deck> <slide> --shape <id> --width 4in
.venv/bin/pptx-skill set-fill <deck> <slide> --shape <id> --color "#0D9488"
.venv/bin/pptx-skill set-font <deck> <slide> --shape <id> --name Inter --zh-name "Noto Sans SC" --size 14 --bold
.venv/bin/pptx-skill add-slide <deck> --after <slide> --clone-from <slide>
.venv/bin/pptx-skill delete-slide <deck> --slide <slide> --yes
.venv/bin/pptx-skill move-slide <deck> --from <i> --to <j>
.venv/bin/pptx-skill add-picture <deck> <slide> --file img.png --left 1in --top 2in --width 4in
.venv/bin/pptx-skill render-slide <deck> <slide> --out /tmp/slide.png
.venv/bin/pptx-skill render-deck <deck> --out-dir /tmp/slides/
.venv/bin/pptx-skill normalize-fonts <deck> --en Inter --zh "Noto Sans SC"
.venv/bin/pptx-skill check-overflow <deck> [--slide <i>]
.venv/bin/pptx-skill raw-xml-patch <deck> <slide> --xpath "..." --xml-fragment "..."
```

**所有写命令支持 `--dry-run`**,先看会改什么再决定要不要真的写。

## Library 用法(复杂操作)

对于需要组合多个操作的任务,直接写 Python 脚本:

```python
from pptx_skill import Deck

deck = Deck.open("Sammi_Demo_Deck_v5.pptx")
slide_0 = deck.slide(0)

# Find by text content
part4_title = slide_0.shape_by_text("Technical Demo")
part4_title.set_text("两个实战案例 · 落地方式")

part4_time = slide_0.shape_by_text("30 min")
part4_time.set_text("15 min")

# Batch check before saving
report = deck.check_overflow()
assert len(report) == 0, f"New overflows: {report}"

deck.save()  # auto-backs up to .pptx.bak
```

每个 Library 函数都有对应的 CLI subcommand(1:1 映射),reference 直接看 `docs/rfc.md §2`。

## Aggressive transparency 的五个具体体现

这是 skill 最重要的设计原则。AI 用这个 skill 的时候会自动享受到:

1. **Before/after 可见**: 每个写命令先打印当前值,改完后打印新值,`[pptx-skill] saved ...` 宣告落盘
2. **无 silent 修改**: 命令只做它 name 明确说的事,不替 AI 做 auto-layout / auto-resize 决策
3. **错误透传**: LibreOffice / python-pptx / XML 解析的底层错误原样输出到 stderr,不被包装成 "oops"
4. **Dry-run 支持**: `--dry-run` 显示会改什么但不落盘,让 AI 先试后做
5. **stdout / stderr 分离**: 结构化输出走 stdout,进度 / warning / 操作日志走 stderr,管道里永远不会污染

## 依赖

### 必需

- **Python 3.11+**
- **python-pptx** >= 1.0.2(pptx 读写)
- **Pillow** >= 10.2(图片处理)
- **fonttools** >= 4.50(字体度量,用于 `check-overflow`)

### 可选(仅 render 需要)

- **LibreOffice** (`soffice`)
  - 安装: `brew install --cask libreoffice`
  - 验证: `soffice --version`
- **Poppler** (`pdftoppm`)
  - 安装: `brew install poppler`
  - 验证: `pdftoppm -v`

如果这两个没装,除 `render-slide` / `render-deck` 外的命令全部正常工作。`doctor` 命令会报告缺失。

## 项目初始化(一次性)

```bash
cd pptx_skill
uv venv .venv
.venv/bin/python -m pip install -e '.[dev]'
.venv/bin/pptx-skill doctor
```

## 已知陷阱

> **注意**:这份列表来自 PRD 分析和 v5 deck 的 clone-ability 调研,都是已经被实际观察到的坑。后续 agent 在实际使用中发现新坑时,直接追加到这里。

1. **pdftoppm 输出文件名有零填充**: 单页输出是 `<prefix>-01.png`,不是 `<prefix>-1.png`。实现时用 `f"{prefix}-{page:02d}.png"` 匹配
2. **LibreOffice 首次启动慢**: 初次调用 `soffice --headless` 有 ~5-7 秒 user profile 初始化延迟。第二次及以后快很多。Render 一张 slide 的 cold start 总耗时 8-9 秒
3. **字体 fallback 影响 render 保真度**: Calibri(Microsoft 专有)在 LibreOffice 渲染时会 fallback 到 Liberation Sans,字宽不同。解决方法是先用 `normalize-fonts` 替换为跨平台字体(Inter + Noto Sans SC),但这会改变原 deck 的视觉设计,属于 opt-in 操作
4. **`soffice --convert-to png` 只输出 slide 1**: 所以 render 特定 slide 必须走 PDF 中间格式(soffice → PDF → pdftoppm → PNG)。没有更简单的路径
5. **macOS harmless warning**: Mac 上 soffice 启动时 stderr 会有一行 `Task policy set failed: 4 ((os/kern) invalid argument)`,这是 LibreOffice 的已知无害 log,不影响 render 结果。Skill 的 CLI 会 filter 掉这一行
6. **中文字体的 East Asian typeface 要分开设置**: 英文字体(`a:latin typeface`)和中文字体(`a:ea typeface`)是 OOXML 里两个不同的属性。`set-font --name` 设西文,`set-font --zh-name` 设东亚字体。不要以为设一次就都行
7. **v5 deck 是程序化生成的**: 它的 shape 命名是 `Text N` / `Shape N` 的机械 pattern,所有 slide 共用一个 `DEFAULT` layout,这使得 shape 查找很容易。但其他手工编辑的 deck 可能 shape 命名不规律,要用 `shape_by_text` 或 OOXML shape_id 定位

## 使用 example(基于 v5 deck 修改议程)

这是 PRD success criteria 1 的实际场景: 把 v5 deck slide 1(0-based 索引 0)议程里的 Part 4 改成 "两个实战案例 · 落地方式" + "15 min"。

```bash
cd pptx_skill

# Step 1: 健康检查,看 deck 和环境 OK 不
.venv/bin/pptx-skill doctor deck.pptx

# Step 2: 找到目标 shape(可以看 list-shapes 或直接用 text 查找)
.venv/bin/pptx-skill list-shapes deck.pptx 0 | grep "Technical Demo\|30 min"

# Step 3: dry-run 确认要改的内容
.venv/bin/pptx-skill set-text deck.pptx 0 --shape "Text 15" --text "两个实战案例 · 落地方式" --dry-run

# Step 4: 真改
.venv/bin/pptx-skill set-text deck.pptx 0 --shape "Text 15" --text "两个实战案例 · 落地方式"
.venv/bin/pptx-skill set-text deck.pptx 0 --shape "Text 16" --text "15 min"

# Step 5: 渲染检查
.venv/bin/pptx-skill render-slide deck.pptx 0 --out /tmp/new_slide1.png
# → AI 读 /tmp/new_slide1.png 做视觉确认
```

## 与 skill 写作 meta 原则的关系

这份 skill 文档贯彻了 skill_creator_skill 的几个原则:

- **结果确定性 > 过程确定性**: 上面的验收标准是目标导向,AI 自己判断是否完成
- **Enabling not SOP**: 没有写 "第一步第二步",写的是可用资源 + 边界 + 方法论建议
- **边界清晰**: "不适用场景" 一节明确列出不做什么
- **已知陷阱**: 来自 PRD 阶段的实际调研,不是凭空预测

## 项目其他文档入口

- 完整设计: `docs/prd.md`(what & why)
- 技术架构: `docs/rfc.md`(how)
- 测试策略: `docs/test.md`
- 开发日志: `docs/working.md`(changelog + lessons learned)
- 项目级 agent instructions: `AGENTS.md`
