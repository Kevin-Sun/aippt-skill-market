#!/usr/bin/env bash
# 三 agent 自动化配置脚本
# Codex: 复制 AGENTS.md 到剪贴板
# 豆包: 复制 System Prompt 到剪贴板
# WorkBuddy: 复制技能包 JSON 到剪贴板

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
CODEX="$ROOT/codex/AGENTS.md"
DOUBAO="$ROOT/doubao/system-prompt.txt"
WB="$ROOT/workbuddy/skill-package.json"

G=$'\033[32m'; Y=$'\033[33m'; B=$'\033[1m'; X=$'\033[0m'

echo "${B}=== 三 agent skill 自动配置 ===${X}"
echo ""
echo "1. Codex（复制 AGENTS.md 片段）"
echo "2. 豆包智能体（复制 System Prompt）"
echo "3. WorkBuddy（复制技能包 JSON）"
echo "4. 全部复制（依次）"
echo ""
read -p "选择 (1-4): " choice

copy_to_clipboard() {
  local file="$1"
  local label="$2"
  if [ -f "$file" ]; then
    pbcopy < "$file"
    echo "${G}✓ ${label} 已复制到剪贴板${X}"
    echo "${Y}粘贴到对应 agent 平台即可${X}"
  else
    echo "✗ 文件不存在: $file"
  fi
}

case $choice in
  1) copy_to_clipboard "$CODEX" "Codex AGENTS.md" ;;
  2) copy_to_clipboard "$DOUBAO" "豆包 System Prompt" ;;
  3) copy_to_clipboard "$WB" "WorkBuddy 技能包" ;;
  4)
    copy_to_clipboard "$CODEX" "Codex AGENTS.md"
    sleep 2
    copy_to_clipboard "$DOUBAO" "豆包 System Prompt"
    sleep 2
    copy_to_clipboard "$WB" "WorkBuddy 技能包"
    ;;
  *) echo "无效选择"; exit 1 ;;
esac

echo ""
echo "${B}=== 配置指南 ===${X}"
echo "Codex: 粘贴到项目根目录 AGENTS.md"
echo "豆包: 打开豆包→智能体→创建→粘贴 System Prompt"
echo "WorkBuddy: 打开企业后台→技能管理→新建→粘贴技能包内容"
