#!/usr/bin/env bash
# run-all-tests.sh · 单一测试入口
# 顺序：sanity → compile-check → e2e-v7 → e2e-v8 → verify-search → (devtools up? 真e2e)
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
run "e2e-v8 (30项中文化/搜索/数据)" node tests/e2e-v8.js
run "e2e-v9 (25项UI重构验收)" node tests/e2e-v9.js
run "page-logic (780项page JS onLoad)" node tests/page-logic.js
run "verify-search (30项搜索)" node tests/verify-search.js

# 真界面 e2e: devtools automation（element.text/size/offset/tap）
if nc -z 127.0.0.1 9420 2>/dev/null; then
  echo ""
  echo "  devtools automation port 9420 已开，跑真界面 e2e..."
  run "e2e-ui (真界面element API)" node tests/e2e-ui.js
else
  echo ""
  echo "  ⚠️ devtools automation port 9420 未启动，跳过真界面 e2e"
  echo "  启动: cli auto --project . --auto-port 9420 --token 1234abcdef"
fi

echo ""
echo "=========================================="
echo "  汇总: $PASS PASS / $FAIL FAIL"
echo "=========================================="
exit $FAIL
