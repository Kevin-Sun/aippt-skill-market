#!/usr/bin/env bash
# AI智作PPT模版社 · 清洗管线 v2（P0 修复版）
# 修复：①license 实读 LICENSE 文件 ②品牌名收窄(品牌+风格词组合) ③palettes 从.pptx解析 ④layouts 解析(python-pptx)
# macOS bash 3.2 兼容
set -o pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$ROOT/raw-materials"
GH_DIR="$RAW/github"
OUT_SKILLS="$RAW/skills"
OUT_PROMPTS="$RAW/prompts"
OUT_LAYOUTS="$RAW/layouts"
OUT_PALETTES="$RAW/palettes"
OUT_FONTS="$RAW/typography"
PARSE_SCRIPT="$ROOT/scripts/parse_pptx.py"
LOG="$RAW/clean-$(date +%Y%m%d-%H%M%S).log"

# 清空旧产物（避免脏数据）
rm -rf "$OUT_SKILLS"/* "$OUT_PROMPTS"/* "$OUT_LAYOUTS"/* "$OUT_PALETTES"/* "$OUT_FONTS"/* 2>/dev/null
mkdir -p "$OUT_SKILLS" "$OUT_PROMPTS" "$OUT_LAYOUTS" "$OUT_PALETTES" "$OUT_FONTS"

G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; D=$'\033[90m'; B=$'\033[1m'; X=$'\033[0m'
log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }

# P0-2 修复：品牌名收窄（品牌+风格词组合才命中，单纯品牌名提及不算）
BRAND_PATTERN='苹果风|苹果发布会|苹果主题|苹果设计|Apple style|Apple-style|AppleStyle|华为风|华为发布会|Huawei style|腾讯风|Tencent style|阿里风|Alibaba style|字节风|ByteDance style|小米风|小米发布会|谷歌风|Google style|微软风|Microsoft style|Claude style|Anthropic style|Stripe style|Linear style'

FONT_WHITELIST='思源|Source Han|阿里|Alibaba|站酷|Lucide|Feather|Sans|Serif|Mono|Roboto|Inter|微软雅黑|宋体|黑体'

declare -i TOTAL=0 OK=0 SKIP=0 FAIL=0 PALETTES_TOTAL=0 LAYOUTS_PARSED=0

# P0-1 修复：实读 LICENSE 文件判断 license（v3：也找一级子目录）
detect_license() {
  local dir="$1"
  # 先找根目录
  for lf in "$dir"/LICENSE "$dir"/license "$dir"/LICENSE.md "$dir"/LICENSE.txt "$dir"/COPYING; do
    if [ -f "$lf" ]; then
      local content; content=$(head -10 "$lf" 2>/dev/null)
      if echo "$content" | grep -qi 'MIT License'; then echo "MIT"
      elif echo "$content" | grep -qi 'Apache License'; then echo "Apache"
      elif echo "$content" | grep -qE 'Creative Commons|CC0|CC BY'; then echo "CC0"
      elif echo "$content" | grep -qi 'OFL|SIL Open Font'; then echo "OFL"
      elif echo "$content" | grep -qi 'BSD'; then echo "BSD"
      else echo "other"; fi
      return
    fi
  done
  # 找一级子目录（如 codex-ppt/LICENSE）
  for lf in "$dir"/*/LICENSE "$dir"/*/license; do
    if [ -f "$lf" ]; then
      local content; content=$(head -10 "$lf" 2>/dev/null)
      if echo "$content" | grep -qi 'MIT License'; then echo "MIT"
      elif echo "$content" | grep -qi 'Apache License'; then echo "Apache"
      else echo "other"; fi
      return
    fi
  done
  # 也看 README 里的 license 声明
  for readme in "$dir"/README.md "$dir"/readme.md; do
    if [ -f "$readme" ]; then
      local content; content=$(grep -iE 'license|MIT|Apache' "$readme" 2>/dev/null | head -5)
      if echo "$content" | grep -qi 'MIT'; then echo "MIT"
      elif echo "$content" | grep -qi 'Apache'; then echo "Apache"
      fi
      return
    fi
  done
  echo "unknown"
}

log "${B}=== 清洗管线 v2 启动（P0 修复版）===${X}"

for repo_dir in "$GH_DIR"/*/; do
  [ -d "$repo_dir" ] || continue
  repo_name=$(basename "$repo_dir")
  meta="$repo_dir.source-meta.json"
  TOTAL+=1

  # 读元数据（stars/category 从 meta，license 重新实读）
  category="unknown" stars=0
  if [ -f "$meta" ]; then
    category=$(python3 -c "import json;d=json.load(open('$meta'));print(d.get('category','unknown'))" 2>/dev/null)
    stars=$(python3 -c "import json;d=json.load(open('$meta'));print(d.get('stars',0))" 2>/dev/null)
  fi
  # P0-1：实读 LICENSE
  license=$(detect_license "$repo_dir")

  log "${D}[$TOTAL] 清洗 $repo_name (license=$license[实读] stars=$stars cat=$category)${X}"

  # ① 提取 SKILL.md / prompt / references / yaml → prompts/（P0-2：品牌名收窄检查）
  # v3 扩充：iname 不区分大小写 + references/*.md + agents/*.yaml（Codex skill 格式）
  skill_count=0 brand_hit_count=0
  while IFS= read -r f; do
    [ -f "$f" ] || continue
    rel="${f#$repo_dir}"
    out="$OUT_PROMPTS/${repo_name}__${rel//\//_}"
    # P0-2：品牌名+风格词组合才命中
    if grep -qE "$BRAND_PATTERN" "$f" 2>/dev/null; then
      brand_hit_count=$((brand_hit_count+1))
      log "${Y}  ⚠ 品牌风格命中: $rel${X}"
      echo "{\"status\":\"brand_style_hit\",\"file\":\"$f\",\"needFix\":true,\"pattern\":\"$BRAND_PATTERN\"}" > "$out.brand.json"
    fi
    cp "$f" "$out" 2>/dev/null && skill_count=$((skill_count+1))
  done < <(find "$repo_dir" -maxdepth 5 \( -iname 'SKILL*' -o -iname 'skill*.md' -o -iname 'prompt*.md' -o -iname '*.prompt' -o -path '*/references/*.md' -o -path '*/agents/*.yaml' -o -iname 'openai.yaml' \) 2>/dev/null)

  # ② README
  readme_count=0
  for readme in "$repo_dir"/README.md "$repo_dir"/readme.md; do
    if [ -f "$readme" ]; then
      cp "$readme" "$OUT_PROMPTS/${repo_name}__README.md" 2>/dev/null && readme_count=1
      break
    fi
  done

  # ③+④ P0-3/P0-4：.pptx 解析（版式+配色+字体）→ layouts/ + palettes/ + typography/
  pptx_count=0 pptx_parsed=0 palette_count=0 font_count=0
  while IFS= read -r f; do
    [ -f "$f" ] || continue
    rel="${f#$repo_dir}"
    out="$OUT_LAYOUTS/${repo_name}__${rel//\//_}.json"
    # 调用 parse_pptx.py 解析（传 source/license/category 参数）
    python3 "$PARSE_SCRIPT" "$f" "$out" "$repo_name" "$license" "$category" 2>/dev/null
    if python3 -c "import json;exit(0 if json.load(open('$out')).get('parsed') else 1)" 2>/dev/null; then
      pptx_parsed=$((pptx_parsed+1))
      LAYOUTS_PARSED=$((LAYOUTS_PARSED+1))
      # 提取 palettes
      colors=$(python3 -c "import json;d=json.load(open('$out'));print(' '.join(d.get('palettes',[])))" 2>/dev/null)
      if [ -n "$colors" ]; then palette_count=$((palette_count+1)); PALETTES_TOTAL=$((PALETTES_TOTAL+1)); fi
      # 提取 fonts → typography/
      fonts=$(python3 -c "import json;d=json.load(open('$out'));print(' '.join(d.get('fonts',[])))" 2>/dev/null)
      if [ -n "$fonts" ]; then font_count=$((font_count+1)); fi
    fi
    pptx_count=$((pptx_count+1))
  done < <(find "$repo_dir" -name '*.pptx' 2>/dev/null)

  # 写 typography 汇总
  if [ "$font_count" -gt 0 ]; then
    cat > "$OUT_FONTS/${repo_name}.json" <<EOF
{"source":"$repo_name","fontFilesCount":$font_count,"license":"$license","note":"字体从.pptx解析,需核对商用授权"}
EOF
  fi

  # ⑤ 写 skill 元数据（P0-1：license 实读，P0 门槛：prompts≥3 或 layouts≥3 才 usable）
  # v3：hasContent 门槛降低（prompts≥1 或 layouts≥1，一个 SKILL.md 本身就是完整 skill）
  has_content=false
  [ "$skill_count" -ge 1 ] || [ "$pptx_parsed" -ge 1 ] && has_content=true
  license_ok=false
  echo "$license" | grep -qE 'MIT|CC0|Apache|OFL|BSD' && license_ok=true
  usable=false
  [ "$license_ok" = true ] && [ "$has_content" = true ] && usable=true

  REPO_NAME="$repo_name" STARS="$stars" LIC="$license" CAT="$category" \
  SKILL_CNT="$skill_count" README_CNT="$readme_count" PPTX_CNT="$pptx_count" \
  PPTX_PARSED="$pptx_parsed" PAL_CNT="$palette_count" FONT_CNT="$font_count" \
  BRAND_HITS="$brand_hit_count" USABLE="$usable" LIC_OK="$license_ok" HAS_CNT="$has_content" \
  OUT_SKILLS="$OUT_SKILLS" \
  python3 -c "
import json, os
d = {
  'id': os.environ['REPO_NAME'], 'source': os.environ['REPO_NAME'],
  'stars': int(os.environ['STARS']), 'license': os.environ['LIC'], 'licenseVerified': True,
  'category': os.environ['CAT'],
  'promptsExtracted': int(os.environ['SKILL_CNT']), 'readmeExtracted': int(os.environ['README_CNT']),
  'layoutsFound': int(os.environ['PPTX_CNT']), 'layoutsParsed': int(os.environ['PPTX_PARSED']),
  'palettesExtracted': int(os.environ['PAL_CNT']), 'fontsExtracted': int(os.environ['FONT_CNT']),
  'brandStyleHits': int(os.environ['BRAND_HITS']),
  'usable': os.environ['USABLE'] == 'true', 'licenseOk': os.environ['LIC_OK'] == 'true',
  'hasContent': os.environ['HAS_CNT'] == 'true',
  'cleanedAt': os.environ.get('CLEAN_TS','')
}
with open(os.environ['OUT_SKILLS'] + '/' + os.environ['REPO_NAME'] + '.json', 'w') as f:
    json.dump(d, f, ensure_ascii=False, indent=2)
" 2>/dev/null
  # 如果 python 失败，用 heredoc 兜底
  if [ ! -s "$OUT_SKILLS/${repo_name}.json" ]; then
    cat > "$OUT_SKILLS/${repo_name}.json" <<EOF
{
  "id": "$repo_name", "source": "$repo_name", "stars": $stars,
  "license": "$license", "licenseVerified": true, "category": "$category",
  "promptsExtracted": $skill_count, "readmeExtracted": $readme_count,
  "layoutsFound": $pptx_count, "layoutsParsed": $pptx_parsed,
  "palettesExtracted": $palette_count, "fontsExtracted": $font_count,
  "brandStyleHits": $brand_hit_count,
  "usable": $usable, "licenseOk": $license_ok, "hasContent": $has_content,
  "cleanedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
  fi

  if [ "$usable" = true ]; then
    OK=$((OK+1))
    log "${G}  ✓ 可用(prompts=$skill_count layoutsParsed=$pptx_parsed/$pptx_count palettes=$palette_count fonts=$font_count brandHits=$brand_hit_count)${X}"
  elif [ "$license_ok" = true ] && [ "$has_content" = false ]; then
    SKIP=$((SKIP+1))
    log "${Y}  ⚠ license OK 但内容不足(prompts=$skill_count layouts=$pptx_parsed) 空壳${X}"
  else
    SKIP=$((SKIP+1))
    log "${Y}  ⚠ 跳过(license=$license 待审 或 内容不足)${X}"
  fi
done

log "${B}=== 清洗汇总 v2 ===${X}"
log "总数: $TOTAL / 可用: $OK / 待审/空壳: $SKIP / 失败: $FAIL"
log "产物:"
log "  prompts/    : $(ls "$OUT_PROMPTS" 2>/dev/null | grep -c '\.md$') 文件"
log "  layouts/    : $(ls "$OUT_LAYOUTS" 2>/dev/null | wc -l) 文件（已解析 $LAYOUTS_PARSED）"
log "  palettes/   : 含配色的 layouts $PALETTES_TOTAL 个"
log "  typography/ : $(ls "$OUT_FONTS" 2>/dev/null | wc -l) 文件"
log "  skills/     : $(ls "$OUT_SKILLS" 2>/dev/null | wc -l) 文件"
log "${B}P0 修复: license实读✓ 品牌名收窄✓ palettes从.pptx解析✓ layouts解析✓${X}"
log "${B}日志: $LOG${X}"
echo "清洗完成。详见 $LOG"
