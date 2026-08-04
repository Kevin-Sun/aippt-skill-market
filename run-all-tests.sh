#!/usr/bin/env bash
# run-all-tests.sh · 单一测试入口
# 顺序：sanity → compile-check → e2e-v7 → verify-search → (devtools up? e2e-suite/v2/v3/promotion)
set -o pipefail
cd "$(dirname "$0")"
PASS=0; FAIL=0

run() {
  local name="$1"; shift
  echo ""
  echo "=========================================="
  echo "  $name"
  echo "=========================================="
  "$@"
  local rc=$?
  if [ $rc -eq 0 ]; then echo "  ✅ $name PASS"; PASS=$((PASS+1)); else echo "  ❌ $name FAIL (exit=$rc)"; FAIL=$((FAIL+1)); fi
  return $rc
}

run "sanity (10类防回归)"      node tests/sanity.js
run "compile-check (11项编译)" node compile-check.js
run "e2e-v7 (25项支付/价格/配置)" node tests/e2e-v7.js
run "verify-search (30项搜索)" node tests/verify-search.js

# devtools 依赖套件（需 automation port 9420 + miniprogram-automator 兼容版）
# 注意：miniprogram-automator@0.12.1 与 devtools 36.6.0 不兼容（rawPath null）
# 需要改用 scripts/devtools/devtools-automation.js（裸 WebSocket）重写
if nc -z 127.0.0.1 9420 2>/dev/null; then
  echo ""
  echo "  ⚠️ port 9420 已开，但 miniprogram-automator 不兼容 devtools 36.6.0"
  echo "  devtools e2e 套件需改用裸 WebSocket（scripts/devtools/devtools-automation.js）"
  echo "  跳过 devtools e2e 套件（静态套件已覆盖核心防回归检查）"
else
  echo ""
  echo "  ⚠️ devtools automation port 9420 未启动，跳过 devtools e2e 套件"
  echo "  启动: cli auto --project . --auto-port 9420 --token 1234abcdef"
fi

echo ""
echo "=========================================="
echo "  汇总: $PASS PASS / $FAIL FAIL"
echo "=========================================="
exit $FAIL
