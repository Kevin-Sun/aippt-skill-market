#!/usr/bin/env bash
# 清理所有 devtools 相关端口（修复 EADDRINUSE 反复出现）
for port in 7777 8848 9966 38242; do
  pids=$(lsof -ti :$port 2>/dev/null)
  [ -n "$pids" ] && echo "杀端口 $port: $pids" && echo "$pids" | xargs kill -9 2>/dev/null
done
sleep 1
pkill -9 -f "wechatwebdevtools" 2>/dev/null
sleep 2
echo "端口已清理"
