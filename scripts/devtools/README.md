# DevTools 自动化配方

> 持久化自 /tmp/mcp-test/ 探索脚本，供项目 #2 和后续迭代复用。

## 关键知识（踩坑换来的）

1. **automation port = 9420**（不是 38242，38242 是 IDE HTTP server）
   - 启动: `cli auto --auto-port 9420 --token 1234abcdef`
2. **miniprogram-automator@0.12.1 与 devtools 36.6.0 不兼容**（`rawPath null`）
   - 用裸 WebSocket 协议直连（`scripts/devtools/devtools-automation.js`）
3. **HTTPS_PROXY 环境变量会拦截 localhost WebSocket**
   - 运行自动化脚本时: `no_proxy="*" node scripts/devtools/test-connect.js`
4. **mockWxMethod 可 mock wx API 让回调触发**
   - devtools 模拟器不触发真实 `requestVirtualPayment` 回调
   - mock success 验证客户端 unlockSkill → storage 链路
5. **DevTools "所有文件" 上传模式才推送 config.json（含 openapi 权限）**
   - "云端安装依赖"模式**不推送 config.json**

## 用法

```js
const auto = require('./scripts/devtools/devtools-automation');

await auto.connect();
await auto.navigate('/pages/index/index');
const data = await auto.getPageData();
await auto.callPageMethod('onBuyTap', [{ currentTarget: { dataset: { id: 'xxx' } } }]);
await auto.mockWxMethod('requestVirtualPayment', { errMsg: 'requestVirtualPayment:ok' });
await auto.disconnect();
```

## 测试连接

```bash
no_proxy="*" node scripts/devtools/test-connect.js
```

## 前置条件

1. DevTools 已启动: `cli open --project . --token 1234abcdef`
2. Automation 已启动: `cli auto --project . --auto-port 9420 --token 1234abcdef`
3. 端口未占用: `bash clean-ports.sh`
