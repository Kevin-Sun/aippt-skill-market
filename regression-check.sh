#!/usr/bin/env bash
# 回归纪律：每次修改后执行
# V2: 修正路径→真项目、12页面全覆盖、删 tsc（已无.ts）、token 从配置读、port 9420
set -o pipefail
PROJ="/Users/sunkai/ops-dashboard/docs/aippt-skill-market"
CLI="/Applications/wechatwebdevtools.app/Contents/MacOS/cli"
TOKEN="${WECHAT_CLI_TOKEN:-1234abcdef}"
AUTO_PORT="${WECHAT_AUTO_PORT:-9420}"

echo "=== 1. 文件完整性检查（12 页面）==="
PAGES="index detail preview promotion promotion-detail member mine orders reviews community search login"
PASS=0; FAIL=0
for dir in $PAGES; do
  miss=""
  for ext in js wxml wxss json; do
    [ -f "$PROJ/miniprogram/pages/$dir/$dir.$ext" ] || miss="$miss $ext"
  done
  if [ -n "$miss" ]; then echo "  ❌ $dir 缺:$miss"; FAIL=$((FAIL+1)); else echo "  ✅ $dir 4件套完整"; PASS=$((PASS+1)); fi
done
echo "  小计: $PASS PASS / $FAIL FAIL"

echo "=== 2. compile-check（编译前静态检查 11 项）==="
cd "$PROJ" && node compile-check.js 2>&1 | tail -3

echo "=== 3. e2e-v7（支付+价格+配置契约 25 项）==="
cd "$PROJ" && node tests/e2e-v7.js 2>&1 | tail -3

echo "=== 4. 清 devtools 端口（防 EADDRINUSE）==="
bash "$PROJ/clean-ports.sh" 2>/dev/null

echo "=== 5. 重开项目 + automation（port $AUTO_PORT）==="
"$CLI" close --project "$PROJ" --token "$TOKEN" 2>&1 | tail -1
sleep 2
"$CLI" open --project "$PROJ" --token "$TOKEN" 2>&1 | tail -1
sleep 5
"$CLI" auto --project "$PROJ" --auto-port "$AUTO_PORT" --token "$TOKEN" 2>&1 | tail -1

echo "=== 回归完成 ==="
echo "下一步: 在 devtools 点编译刷新，或跑 'node tests/e2e-suite.js' 做 devtools e2e"
