#!/usr/bin/env bash
# AI智作PPT模版社 · 自动化抓取脚本
# 抓取 GitHub 高星 repo（MIT/CC0）+ 记录 X/设计站趋势
# 用法：./fetch.sh [--github-only|--x-only]
# macOS bash 3.2 兼容（不用 -u，grep 用 -E）
set -o pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$ROOT/raw-materials"
GH_DIR="$RAW/github"
X_DIR="$RAW/influencers"
TRENDS_DIR="$RAW/trends"
LOG="$RAW/fetch-$(date +%Y%m%d-%H%M%S).log"

mkdir -p "$GH_DIR" "$X_DIR" "$TRENDS_DIR"

G=$'\033[32m'; Y=$'\033[33m'; D=$'\033[90m'; B=$'\033[1m'; X=$'\033[0m'
log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }

# GitHub 高星 repo 列表（MIT/CC0/Apache，可直接用）
# P0-5 修复：删除 mckinsey-pptx（仓库不存在，exa 幻觉）
# v3 扩充：新增 15 个 PPT skill repo（学术/答辩/商务/pitch deck/中文/日企）
GITHUB_REPOS=(
  "sunbigfly/ppt-agent-skills:862:MIT:ppt-skill"
  "Gabberflast/academic-pptx-skill:723:unknown:academic-ppt"
  "Akxan/ppt-agent-skill:110:MIT:ppt-skill"
  "Urinx/LaTeX-PPT-Template:418:Apache:latex-ppt"
  "zouchenzhen/thesis-defense-pptx-skill:208:unknown:thesis-defense"
  "singerla/pptx-automizer:221:MIT:pptx-automizer"
  "Anthony0630/Defense-PPT-Template:78:unknown:defense-ppt"
  "metaimagine/ai-pptx:106:MIT:ai-pptx"
  "m3dev/pptx-template:117:Apache:pptx-template"
  "Dimillian/Skills:3859:MIT:codex-skills"
  "composio-community/awesome-codex-skills:15327:unknown:codex-skills"
  "ComposioHQ/awesome-claude-skills:70926:unknown:claude-skills"
  "sanographix/azusa-colors:374:unknown:color-palette"
  "sanographix/azusa3:137:unknown:design-theme"
  "cocodrips/keynote-themes:48:unknown:keynote-theme"
  "reichenbach/iwork_mcp:37:unknown:keynote-mcp"
  "aspose-slides/Awesome-Presentations:35:unknown:presentation-list"
  "grapeot/pptx.skill:13:unknown:pptx-cli"
  "promptadvisers/claude-code-polished-documents-skills:12:unknown:doc-skills"
  "gonta223/japanese-corporate-pptx-skill:11:unknown:jp-corporate-ppt"
  "yoheinakajima/autodeck:11:unknown:pitch-deck"
  "tangonho/iml-pptx:9:unknown:cn-pptx-skill"
  "artifact-kit/html-to-pptx-skill:8:unknown:html-to-pptx"
  "fengting124/paper-figure-pptx-skill:8:unknown:paper-figure-pptx"
  "giaffa86/corporate-pptx-deck-skill:0:unknown:corporate-ppt"
  "banki-teh/opencode-corporate-pptx:0:unknown:corporate-ppt"
  "mauriciomcv/pptx-skill:5:unknown:branded-pptx"
  "garyhe231/QBRAgent:0:unknown:qbr-ppt"
)

fetch_github() {
  log "${B}=== GitHub 抓取 ===${X}"
  local ok=0 fail=0
  for entry in "${GITHUB_REPOS[@]}"; do
    local repo="${entry%%:*}"
    local rest="${entry#*:}"
    local stars="${rest%%:*}"
    rest="${rest#*:}"
    local license="${rest%%:*}"
    local category="${rest##*:}"
    local target="$GH_DIR/${repo//\//__}"
    log "${D}抓取 $repo ($stars★ $license) → $category${X}"
    if [ -d "$target/.git" ]; then
      git -C "$target" pull --ff-only --quiet 2>>"$LOG" && { log "${G}✓ 更新 $repo${X}"; ok=$((ok+1)); } || { log "${Y}⚠ pull 失败 $repo${X}"; fail=$((fail+1)); }
    else
      git clone --depth 1 "https://github.com/$repo.git" "$target" --quiet 2>>"$LOG" && { log "${G}✓ clone $repo${X}"; ok=$((ok+1)); } || { log "${Y}⚠ clone 失败 $repo${X}"; fail=$((fail+1)); }
    fi
    # 写元数据
    cat > "$target/.source-meta.json" <<EOF
{"repo":"$repo","stars":$stars,"license":"$license","category":"$category","fetchedAt":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"}
EOF
  done
  log "${B}GitHub 汇总：成功 $ok / 失败 $fail / 共 ${#GITHUB_REPOS[@]}${X}"
}

fetch_x_trends() {
  log "${B}=== X 博主趋势记录 ===${X}"
  # X 博主（高频追踪）
  local influencers=(
    "ROB.PPT:Kostrzewa Robert:AI PPT设计专家:https://x.com/ROB_PPT"
    "待挖:PPT设计趋势账号::"
    "待挖:agent skill分享账号::"
  )
  for entry in "${influencers[@]}"; do
    local handle="${entry%%:*}"
    rest="${entry#*:}"
    local name="${rest%%:*}"
    rest="${rest#*:}"
    local desc="${rest%%:*}"
    rest="${rest#*:}"
    local url="$rest"
    cat > "$X_DIR/${handle}.json" <<EOF
{"handle":"$handle","name":"$name","desc":"$desc","url":"$url","trackedAt":"$(date -u +%Y-%m-%dT%H:%M:%SZ)","status":"${handle#待挖}"} 
EOF
    log "${D}记录博主 @$handle${X}"
  done
  log "${B}X 博主追踪清单：${#influencers[@]} 个${X}"
  log "${Y}提示：X 实时抓取需 agent-reach x 登录态，当前只记录清单。后续用 opencli x 抓最新帖。${X}"
}

fetch_design_trends() {
  log "${B}=== 设计站趋势记录（只参考不抓成品）===${X}"
  local sites=(
    "Slidesgo:slidesgo.com:Freepik旗下,⚠️版权不抓成品"
    "Dribbble:dribbble.com:搜PPT设计,⚠️参考不抄"
    "Behance:behance.net:同上"
    "站酷:zcool.com.cn:国内设计师社区,⚠️参考不抄"
  )
  for entry in "${sites[@]}"; do
    local name="${entry%%:*}"
    rest="${entry#*:}"
    local url="${rest%%:*}"
    local note="${rest##*:}"
    cat > "$TRENDS_DIR/${name}.json" <<EOF
{"site":"$name","url":"$url","note":"$note","trackedAt":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"}
EOF
    log "${D}记录设计站 $name${X}"
  done
  log "${B}设计站追踪：${#sites[@]} 个（只参考趋势）${X}"
}

case "${1:-all}" in
  --github-only) fetch_github ;;
  --x-only) fetch_x_trends ;;
  all) fetch_github; fetch_x_trends; fetch_design_trends ;;
  *) echo "用法: $0 [--github-only|--x-only|all]"; exit 1 ;;
esac

log "${B}=== 抓取完成，日志：$LOG ===${X}"
echo "抓取完成。详见 $LOG"
