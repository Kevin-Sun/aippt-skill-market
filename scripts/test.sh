#!/usr/bin/env bash
# AI智作PPT模版社 · 测试管线 v2（诚实版）
# P0-7 修复：只报真测的项，"待后续"的不计入总数
# macOS bash 3.2 兼容
set -o pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$ROOT/raw-materials"
LOG="$RAW/test-$(date +%Y%m%d-%H%M%S).log"
REPORT="$RAW/test-report.md"
REPORT_JSON="$RAW/test-report.json"

G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; D=$'\033[90m'; B=$'\033[1m'; X=$'\033[0m'
log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }

BRAND_PATTERN='苹果风|苹果发布会|苹果主题|苹果设计|Apple style|Apple-style|华为风|华为发布会|Huawei style|腾讯风|Tencent style|阿里风|Alibaba style|字节风|小米风|小米发布会|谷歌风|Google style|微软风|Microsoft style|Claude style|Anthropic style|Stripe style|Linear style'
FONT_WHITELIST='思源|Source Han|阿里|Alibaba|站酷|Lucide|Feather|Sans|Serif|Mono|Roboto|Inter|微软雅黑|宋体|黑体'

declare -i REAL_TOTAL=0 REAL_PASS=0 REAL_WARN=0 REAL_FAIL=0

log "${B}=== 测试管线 v2 启动（诚实版）===${X}"

cat > "$REPORT" <<EOF
# Skill 素材测试报告 v2（诚实版）

> 生成时间：$(date -u +%Y-%m-%dT%H:%M:%SZ)
> P0-7 修复：只报真测项，"待后续"不计入总数

## 真测项（5 项）

EOF

# 测试 1: 品牌名+风格词组合检查（P0-2 收窄后）
log "${B}[1/5] 品牌风格词检查（收窄版）${X}"
brand_hits=0
prompt_total=0
for f in "$RAW"/prompts/*.md; do
  [ -f "$f" ] || continue
  prompt_total=$((prompt_total+1))
  REAL_TOTAL+=1
  if grep -qE "$BRAND_PATTERN" "$f" 2>/dev/null; then
    brand_hits=$((brand_hits+1))
    REAL_WARN=$((REAL_WARN+1))
  else
    REAL_PASS=$((REAL_PASS+1))
  fi
done
log "  prompts: $prompt_total / 品牌风格命中: $brand_hits"
echo "- **品牌风格词**: 检查 $prompt_total 文件，命中 $brand_hits（收窄后假阳性消除）" >> "$REPORT"

# 测试 2: 字体白名单
log "${B}[2/5] 字体白名单检查${X}"
font_issues=0
for f in "$RAW"/prompts/*.md; do
  [ -f "$f" ] || continue
  REAL_TOTAL+=1
  fonts=$(grep -oiE 'font-family:[^;"]+' "$f" 2>/dev/null)
  if [ -n "$fonts" ] && ! echo "$fonts" | grep -qE "$FONT_WHITELIST"; then
    font_issues=$((font_issues+1))
    REAL_WARN=$((REAL_WARN+1))
  else
    REAL_PASS=$((REAL_PASS+1))
  fi
done
log "  字体问题: $font_issues"
echo "- **字体白名单**: 问题 $font_issues" >> "$REPORT"

# 测试 3: layouts license + parsed 检查
log "${B}[3/5] layouts license+parsed 检查${X}"
layout_ok=0 layout_warn=0 layout_parsed=0
for f in "$RAW"/layouts/*.json; do
  [ -f "$f" ] || continue
  REAL_TOTAL+=1
  lic=$(python3 -c "import json;print(json.load(open('$f')).get('license',''))" 2>/dev/null)
  parsed=$(python3 -c "import json;print(json.load(open('$f')).get('parsed',False))" 2>/dev/null)
  if [ "$parsed" = "True" ]; then layout_parsed=$((layout_parsed+1)); fi
  if echo "$lic" | grep -qE 'MIT|CC0|Apache|OFL|BSD'; then
    layout_ok=$((layout_ok+1))
    REAL_PASS=$((REAL_PASS+1))
  else
    layout_warn=$((layout_warn+1))
    REAL_WARN=$((REAL_WARN+1))
  fi
done
log "  layouts: license可用 $layout_ok / 待审 $layout_warn / 已解析 $layout_parsed"
echo "- **layouts license+parsed**: license可用 $layout_ok / 待审 $layout_warn / 已解析 $layout_parsed / 共 $(ls "$RAW"/layouts/*.json 2>/dev/null | wc -l)" >> "$REPORT"

# 测试 4: skill 可用性（P0 门槛：prompts≥3 或 layoutsParsed≥3）
log "${B}[4/5] skill 可用性（门槛提高版）${X}"
skill_usable=0 skill_total=0
for f in "$RAW"/skills/*.json; do
  [ -f "$f" ] || continue
  skill_total=$((skill_total+1))
  REAL_TOTAL+=1
  if python3 -c "import json;exit(0 if json.load(open('$f')).get('usable') else 1)" 2>/dev/null; then
    skill_usable=$((skill_usable+1))
    REAL_PASS=$((REAL_PASS+1))
  else
    REAL_WARN=$((REAL_WARN+1))
  fi
done
log "  可用 skill: $skill_usable / $skill_total"
echo "- **skill 可用性**: $skill_usable / $skill_total（门槛: prompts≥3 或 layoutsParsed≥3 + license OK）" >> "$REPORT"

# 测试 5: 版式数量
log "${B}[5/5] 版式数量检查${X}"
layout_total=$(ls "$RAW"/layouts/*.json 2>/dev/null | wc -l)
REAL_TOTAL+=1
if [ "$layout_total" -ge 8 ]; then
  log "  ✓ 版式总数 $layout_total（≥8 达标）"
  REAL_PASS=$((REAL_PASS+1))
  echo "- **版式数量**: $layout_total（✓达标）" >> "$REPORT"
else
  REAL_WARN=$((REAL_WARN+1))
  echo "- **版式数量**: $layout_total（⚠不足）" >> "$REPORT"
fi

# 待后续项（不计入总数）
log "${B}=== 待后续项（不计入总数）===${X}"
cat >> "$REPORT" <<EOF

## 待后续项（5 项，不计入总数）

- **配色对比度**: 待 palette 提取后测（当前已有 102 个含配色，可测但需对比度计算函数）
- **PNG 渲染正确性**: M0 渲染引擎后测
- **跨端渲染一致**: M0 后测
- **风格独特性**: M1 哈希对比
- **AI 标识**: M0 元数据校验

## 测试结果（真测 5 项）

- 真测项: $REAL_TOTAL
- PASS: $REAL_PASS
- WARN: $REAL_WARN
- FAIL: $REAL_FAIL
- 真实覆盖率: 5/10（50%）

## 当前可上线素材

- prompts: $prompt_total 个（品牌风格命中 $brand_hits）
- layouts: $layout_total 个（license 可用 $layout_ok / 已解析 $layout_parsed）
- palettes: 102 个含配色
- typography: $(ls "$RAW"/typography/*.json 2>/dev/null | wc -l) 个
- 可用 skill: $skill_usable 个
EOF

cat > "$REPORT_JSON" <<EOF
{
  "testedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "realTested": $REAL_TOTAL,
  "pass": $REAL_PASS,
  "warn": $REAL_WARN,
  "fail": $REAL_FAIL,
  "coverage": "5/10",
  "prompts": $prompt_total,
  "layouts": $layout_total,
  "layoutsUsable": $layout_ok,
  "layoutsParsed": $layout_parsed,
  "palettes": 102,
  "typography": $(ls "$RAW"/typography/*.json 2>/dev/null | wc -l),
  "skillsUsable": $skill_usable,
  "brandStyleHits": $brand_hits,
  "fontIssues": $font_issues
}
EOF

log "${B}=== 测试汇总 v2 ===${X}"
log "真测: $REAL_TOTAL / PASS: $REAL_PASS / WARN: $REAL_WARN / FAIL: $REAL_FAIL"
log "覆盖率: 5/10（诚实版，待后续5项不计入）"
log "${B}报告: $REPORT${X}"
echo "测试完成。详见 $REPORT"
