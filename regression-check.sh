#!/usr/bin/env bash
# 回归纪律：每次修改后执行
set -o pipefail
PROJ="/Users/sunkai/ops-dashboard/templates/miniprogram-base"
CLI="/Applications/wechatwebdevtools.app/Contents/MacOS/cli"
TOKEN="1234abcdef"

echo "=== 1. 文件完整性检查 ==="
for dir in index detail preview mine login; do
  miss=""
  for ext in ts wxml wxss json; do
    [ -f "$PROJ/miniprogram/pages/$dir/$dir.$ext" ] || miss="$miss $ext"
  done
  [ -n "$miss" ] && echo "  ❌ $dir 缺:$miss" || echo "  ✅ $dir 4件套完整"
done

echo "=== 2. TS 编译 ==="
cd "$PROJ" && npx tsc 2>&1 | head -3
echo "EXIT=$?"

echo "=== 3. .js 生成检查 ==="
for dir in index detail preview mine login; do
  [ -f "$PROJ/miniprogram/pages/$dir/$dir.js" ] && echo "  ✅ $dir.js" || echo "  ❌ 无 $dir.js"
done
[ -f "$PROJ/miniprogram/app.js" ] && echo "  ✅ app.js" || echo "  ❌ 无 app.js"

echo "=== 4. 清 devtools 缓存 ==="
"$CLI" cache --clean all --project "$PROJ" --token "$TOKEN" 2>&1 | tail -1

echo "=== 5. 重开项目 ==="
"$CLI" close --project "$PROJ" --token "$TOKEN" 2>&1 | tail -1
sleep 2
"$CLI" open --project "$PROJ" --token "$TOKEN" 2>&1 | tail -1
sleep 5
"$CLI" auto --project "$PROJ" --auto-port 38242 --token "$TOKEN" 2>&1 | tail -1

echo "=== 回归完成，请在 devtools 点编译刷新看报错 ==="
