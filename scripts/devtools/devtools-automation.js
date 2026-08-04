// devtools-automation.js · 可复用的 DevTools 自动化配方
// 持久化自 /tmp/mcp-test/ 的探索脚本，供项目 #2 和后续迭代复用
//
// 关键知识（踩坑换来的）:
// 1. automation port = 9420（不是 38242，38242 是 IDE HTTP server）
// 2. 启动: cli auto --auto-port 9420 --token <TOKEN>
// 3. miniprogram-automator@0.12.1 与 devtools 36.6.0 不兼容（rawPath null）
//    → 用裸 WebSocket 协议直连
// 4. HTTPS_PROXY 环境变量会拦截 localhost WebSocket → no_proxy="*"
// 5. mockWxMethod 可 mock wx API 让回调触发（devtools 模拟器不触发真实支付回调）
//
// 用法:
//   const auto = require('./devtools-automation');
//   await auto.connect();
//   await auto.navigate('/pages/index/index');
//   const data = await auto.getPageData();
//   await auto.callPageMethod('onBuyTap', { currentTarget: { dataset: { id: 'xxx' } } });
//   await auto.disconnect();

const WebSocket = require('ws');

let ws = null;
let msgId = 0;
const pending = new Map();

const DEFAULT_PORT = 9420;
const DEFAULT_TOKEN = process.env.WECHAT_CLI_TOKEN || '1234abcdef';

async function connect(port = DEFAULT_PORT) {
  return new Promise((resolve, reject) => {
    const wsEndpoint = `ws://127.0.0.1:${port}`;
    ws = new WebSocket(wsEndpoint, { agent: undefined });

    ws.on('open', () => {
      console.log('[devtools] connected to', wsEndpoint);
      // 启用日志
      send('App.enableLog', { match: 'payment' }).then(() => {
        resolve();
      }).catch(reject);
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.id && pending.has(msg.id)) {
          const { resolve, reject } = pending.get(msg.id);
          pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
        // 处理 console.log 事件
        if (msg.method === 'App.consoleLog' || msg.method === 'Log.entryAdded') {
          const entry = msg.params && (msg.params.entry || msg.params);
          if (entry && entry.text) {
            console.log('[console]', entry.text);
          }
        }
      } catch (e) {
        // ignore parse errors
      }
    });

    ws.on('error', (err) => {
      console.error('[devtools] ws error:', err.message);
      reject(err);
    });

    ws.on('close', () => {
      console.log('[devtools] disconnected');
    });

    setTimeout(() => {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new Error('Connection timeout (port ' + port + '). Ensure devtools running with: cli auto --auto-port ' + port + ' --token ' + DEFAULT_TOKEN));
      }
    }, 5000);
  });
}

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      reject(new Error('Not connected'));
      return;
    }
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error('Timeout: ' + method));
      }
    }, 10000);
  });
}

async function navigate(url) {
  return send('App.navigateTo', { url });
}

async function getPageData() {
  return send('Page.getData');
}

async function setPageData(data) {
  return send('Page.setData', { data });
}

async function callPageMethod(method, args = []) {
  return send('Page.callMethod', { method, args });
}

async function callElementMethod(selector, method, args = []) {
  return send('Element.callMethod', { selector, method, args });
}

async function tapElement(selector) {
  return send('Element.tap', { selector });
}

async function mockWxMethod(method, result) {
  return send('App.mockWxMethod', { method, result: JSON.stringify(result) });
}

async function restoreWxMethod(method) {
  return send('App.restoreWxMethod', { method });
}

async function screenshot() {
  return send('Page.captureScreenshot', {});
}

async function getCurrentPage() {
  return send('App.getCurrentPage');
}

async function disconnect() {
  if (ws) {
    ws.close();
    ws = null;
  }
}

module.exports = {
  connect,
  disconnect,
  send,
  navigate,
  getPageData,
  setPageData,
  callPageMethod,
  callElementMethod,
  tapElement,
  mockWxMethod,
  restoreWxMethod,
  screenshot,
  getCurrentPage,
  DEFAULT_PORT,
};
