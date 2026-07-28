"use strict";
/**
 * 虚拟支付封装（微信小程序虚拟支付 · 双端自动路由）
 *
 * 微信「小程序虚拟支付」：调 wx.requestVirtualPayment，平台按设备类型自动路由
 *   - iOS → 苹果支付（Apple Pay）
 *   - Android → 微信支付
 * 开发者只需开通虚拟支付能力 + 配置道具/代币，无需分别接两端支付 SDK。
 *
 * 前置（凯哥在 mp 后台手动，见 checklist M5）：
 *   1. 已开通「小程序虚拟支付」能力
 *   2. 已配置道具/代币（configId / 道具列表）
 *   3. iOS：用户 iOS 15+ / 微信 8.0.68+ / 最低 1 元 / 中国大陆 App Store 账户
 *
 * 用法：
 *   import { requestVirtualPayment } from '../../services/payment'
 *   const res = await requestVirtualPayment({
 *     mode: 'coin',            // 'coin' 代币 | 'goods' 道具
 *     outTradeNo: 'order_xxx', // 商户订单号（云函数生成）
 *     amount: 100,             // 金额（分），iOS 最低 100=1元
 *     attach: 'vip_30d',       // 透传业务标识
 *   })
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestVirtualPayment = requestVirtualPayment;
exports.pay = pay;
/**
 * 发起虚拟支付（双端自动路由）。
 * 订单需先由云函数（cloudfunctions/payment）在服务端创建，
 * 此处仅负责客户端调用 + 错误归一化。
 */
async function requestVirtualPayment(params) {
    const { mode, outTradeNo, amount, attach, productId, currency = 'CNY' } = params;
    if (mode === 'goods' && !productId) {
        throw new Error('mode=goods 时 productId 必填');
    }
    if (amount < 100) {
        throw new Error('金额最低 100 分（1 元），iOS 限制');
    }
    return new Promise((resolve, reject) => {
        const wxMode = mode === 'coin' ? 'short_series_coin' : 'short_series_goods';
        const opts = {
            mode: wxMode,
            outTradeNo,
            sign: '', // 由云函数生成签名（见 cloudfunctions/payment）
            nonce: `${Date.now()}`,
            attach: attach || '',
            productInfo: { productId: productId || '', name: attach || 'virtual-goods' },
            currencyType: currency,
            modeIndex: 0,
            offerId: '', // 虚拟支付 offerId，来自 mp 后台
            buyQuantity: mode === 'coin' ? amount : 1,
            success: (res) => {
                resolve({
                    errno: 0,
                    errMsg: 'requestVirtualPayment:ok',
                    paymentChannel: detectChannel(),
                    outTradeNo,
                    attach,
                    ...res,
                });
            },
            fail: (err) => {
                var _a;
                const result = {
                    errno: (_a = err.errno) !== null && _a !== void 0 ? _a : -1,
                    errMsg: err.errMsg || 'requestVirtualPayment:fail',
                    outTradeNo,
                    attach,
                };
                // 用户取消不算硬失败
                if (/cancel/i.test(result.errMsg)) {
                    resolve(result);
                }
                else {
                    reject(result);
                }
            },
        };
        wx.requestVirtualPayment(opts);
    });
}
/** 推断当前支付通道（iOS→apple, Android→wechat） */
function detectChannel() {
    try {
        const sys = wx.getDeviceInfo ? wx.getDeviceInfo() : wx.getSystemInfoSync();
        return /ios/i.test(sys.platform || '') ? 'apple' : 'wechat';
    }
    catch (_a) {
        return 'unknown';
    }
}
/**
 * 下单 + 支付一站式：先调云函数创建订单拿签名，再发起支付。
 * 推荐入口：业务侧只调这个。
 */
async function pay(params) {
    // 1. 云函数创建订单（服务端生成 sign / nonce / offerId）
    const orderRes = await wx.cloud.callFunction({
        name: 'payment',
        data: { action: 'createOrder', data: params },
    });
    const order = orderRes.result || {};
    if (order.errno && order.errno !== 0) {
        throw new Error(`下单失败: ${order.errMsg || JSON.stringify(order)}`);
    }
    // 2. 发起客户端支付
    return requestVirtualPayment({
        ...params,
        outTradeNo: order.outTradeNo || params.outTradeNo,
    });
}
