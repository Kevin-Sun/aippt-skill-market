#!/usr/bin/env python3
"""re-tag 脚本：读 prompt 文字推断风格，下钻到每个 skill/prompt 级
凯哥要求：不是 repo 级粗分，而是人眼看上去是什么风（学术/商务/答辩/日企/中文等）
"""
import json, glob, os, re
from pathlib import Path

RAW = Path(__file__).parent.parent / "raw-materials"
PROMPTS_DIR = RAW / "prompts"
SKILLS_DIR = RAW / "skills"
OUT_DIR = RAW / "retagged"
OUT_DIR.mkdir(exist_ok=True)

# 风格关键词字典（按出现频率优先匹配）
STYLE_KEYWORDS = {
    "答辩": ["答辩", "defense", "thesis defense", "毕业", "学位", "论文答辩", "开题"],
    "学术": ["academic", "论文", "paper", "research", "科研", "学术", "scholar", "citation", "引用", "实验", "方法"],
    "商务/工作汇报": ["business", "corporate", "report", "quarterly", "QBR", "汇报", "工作总结", "述职", "年报", "季报", "business review", "工作汇报", "review"],
    "咨询": ["consulting", "mckinsey", "bcg", "麦肯锡", "咨询", "strategy", "matrix", "2x2", "波士顿"],
    "日企": ["japanese", "corporate", "日本", "日企", "japan"],
    "数据可视化": ["chart", "data", "仪表盘", "dashboard", "可视化", "图表", "bar", "pie", "graph", "figure"],
    "HTML转PPTX": ["html", "pptx", "html-to-pptx", "dom", "svg", "react"],
    "通用PPT": ["presentation", "slide", "ppt", "pptx", "deck", "powerpoint", "幻灯片"],
    "文档/写作": ["document", "doc", "写作", "polished", "markdown", "写作风格"],
    "Codex/Claude skill": ["codex", "claude", "skill", "agent", "SKILL.md", "AGENTS.md"],
}

# 场景关键词（与风格正交）
SCENE_KEYWORDS = {
    "答辩": ["答辩", "defense", "毕业", "学位论文", "开题"],
    "工作汇报": ["汇报", "工作总结", "述职", "quarterly", "QBR", "review", "年报", "季报"],
    "学术研究": ["论文", "paper", "research", "科研", "学术", "experiment"],
    "商务展示": ["business", "corporate", "pitch", "proposal", "提案"],
    "咨询报告": ["consulting", "mckinsey", "bcg", "咨询", "strategy"],
    "数据报告": ["chart", "data", "dashboard", "仪表盘", "数据"],
    "通用": ["presentation", "slide", "ppt"],
}

# 语言判定
def detect_language(text):
    if re.search(r'[\u4e00-\u9fff]', text):
        return "中文" if len(re.findall(r'[\u4e00-\u9fff]', text)) > 10 else "中英混合"
    return "英文"

# 风格判定
def detect_styles(text):
    text_lower = text.lower()
    styles = []
    for style, keywords in STYLE_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text_lower:
                styles.append(style)
                break
    return styles if styles else ["未分类"]

# 场景判定
def detect_scenes(text):
    text_lower = text.lower()
    scenes = []
    for scene, keywords in SCENE_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text_lower:
                scenes.append(scene)
                break
    return scenes if scenes else ["通用"]

# re-tag 每个 prompt
results = []
for f in sorted(PROMPTS_DIR.glob("*.md")):
    try:
        content = f.read_text(encoding='utf-8', errors='ignore')[:5000]  # 前 5000 字判断
    except Exception:
        continue
    
    repo_name = f.stem.split("__")[0]
    file_name = f.stem
    
    styles = detect_styles(content)
    scenes = detect_scenes(content)
    lang = detect_language(content)
    
    result = {
        "file": str(f.name),
        "repo": repo_name,
        "styles": styles,
        "scenes": scenes,
        "language": lang,
        "size": f.stat().st_size,
    }
    results.append(result)

# 汇总统计
style_counts = {}
scene_counts = {}
lang_counts = {}
for r in results:
    for s in r["styles"]:
        style_counts[s] = style_counts.get(s, 0) + 1
    for s in r["scenes"]:
        scene_counts[s] = scene_counts.get(s, 0) + 1
    lang_counts[r["language"]] = lang_counts.get(r["language"], 0) + 1

# 输出
out = {
    "totalPrompts": len(results),
    "styleCounts": dict(sorted(style_counts.items(), key=lambda x: -x[1])),
    "sceneCounts": dict(sorted(scene_counts.items(), key=lambda x: -x[1])),
    "languageCounts": dict(sorted(lang_counts.items(), key=lambda x: -x[1])),
    "prompts": results,
}

with open(OUT_DIR / "retag-results.json", "w") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

# 生成 Markdown 报告
with open(OUT_DIR / "retag-report.md", "w") as f:
    f.write("# Re-tag 报告（下钻到 skill/prompt 级）\n\n")
    f.write(f"> 总 prompt 数：{len(results)}\n\n")
    f.write("## 风格分布\n\n| 风格 | 数量 |\n|---|---|\n")
    for s, c in sorted(style_counts.items(), key=lambda x: -x[1]):
        f.write(f"| {s} | {c} |\n")
    f.write("\n## 场景分布\n\n| 场景 | 数量 |\n|---|---|\n")
    for s, c in sorted(scene_counts.items(), key=lambda x: -x[1]):
        f.write(f"| {s} | {c} |\n")
    f.write("\n## 语言分布\n\n| 语言 | 数量 |\n|---|---|\n")
    for s, c in sorted(lang_counts.items(), key=lambda x: -x[1]):
        f.write(f"| {s} | {c} |\n")
    
    # 工作汇报场景的 prompt 清单（凯哥关注）
    f.write("\n## 工作汇报场景 prompt 清单\n\n")
    work_prompts = [r for r in results if "工作汇报" in r["scenes"]]
    f.write(f"共 {len(work_prompts)} 个\n\n")
    for r in work_prompts[:20]:
        f.write(f"- {r['file'][:60]} | 风格={','.join(r['styles'])} | {r['language']}\n")
    
    # 答辩场景
    f.write("\n## 答辩场景 prompt 清单\n\n")
    defense_prompts = [r for r in results if "答辩" in r["scenes"]]
    f.write(f"共 {len(defense_prompts)} 个\n\n")
    for r in defense_prompts[:20]:
        f.write(f"- {r['file'][:60]} | 风格={','.join(r['styles'])} | {r['language']}\n")

print(f"Re-tag 完成：{len(results)} 个 prompt")
print(f"风格分布: {dict(sorted(style_counts.items(), key=lambda x: -x[1]))}")
print(f"场景分布: {dict(sorted(scene_counts.items(), key=lambda x: -x[1]))}")
print(f"语言分布: {dict(sorted(lang_counts.items(), key=lambda x: -x[1]))}")
print(f"工作汇报: {len([r for r in results if '工作汇报' in r['scenes']])} 个")
print(f"答辩: {len([r for r in results if '答辩' in r['scenes']])} 个")
print(f"报告: {OUT_DIR / 'retag-report.md'}")
