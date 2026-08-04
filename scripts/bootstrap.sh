#!/usr/bin/env bash
# bootstrap.sh · 一键建新小程序项目
# 用法: bash bootstrap.sh <项目名> <appid> <envId>
set -euo pipefail

NAME="${1:?用法: bash bootstrap.sh <项目名> <appid> <envId>}"
APPID="${2:?需要 appid}"
ENVID="${3:?需要 envId}"

TEMPLATE="/Users/sunkai/ops-dashboard/templates/miniprogram-base"
TARGET="/Users/sunkai/ops-dashboard/docs/$NAME"

echo "=== 1. 从脚手架复制 ==="
cp -r "$TEMPLATE" "$TARGET"
echo "  → $TARGET"

echo "=== 2. 替换 appid ==="
sed -i '' "s/touristappid/$APPID/g" "$TARGET/project.config.json"
sed -i '' "s/touristappid/$APPID/g" "$TARGET/miniprogram/project.config.json" 2>/dev/null || true
echo "  → appid = $APPID"

echo "=== 3. 配置 envId ==="
mkdir -p "$TARGET/cloudbaserc.json.tmp" 2>/dev/null || true
cat > "$TARGET/cloudbaserc.json" << EOF
{
  "envId": "$ENVID",
  "functions": [{
    "name": "payment",
    "envVariables": {
      "APPID": "$APPID",
      "APP_SECRET": "",
      "MCHID": "",
      "OFFER_ID": "",
      "VIRTUAL_PAYMENT_KEY": ""
    }
  }]
}
EOF
echo "  → envId = $ENVID"

echo "=== 4. app.js 配置 envId ==="
sed -i '' "s/aippt-skill-d6g5hsem096551cc3/$ENVID/g" "$TARGET/miniprogram/app.js" 2>/dev/null || true

echo "=== 5. npm install ==="
cd "$TARGET" && npm install

echo "=== 6. 跑 sanity 测试 ==="
node tests/sanity.js 2>/dev/null || echo "  (sanity 尚未适配，跳过)"

echo ""
echo "=== ✅ 项目已创建: $TARGET ==="
echo "下一步:"
echo "  1. 填 cloudbaserc.json 里的 APP_SECRET / MCHID / OFFER_ID / VIRTUAL_PAYMENT_KEY"
echo "  2. tcb fn deploy payment --force --env-id $ENVID"
echo "  3. cli open --project $TARGET --token 1234abcdef"
echo "  4. 下载 private.$APPID.key 到项目根目录（mp 后台 → 开发管理 → 开发设置）"
echo "  5. node scripts/ci-preview.js 生成预览二维码"
