/**
 * 虚拟支付云函数 · 按官方 API 重写
 *
 * 客户端调用：
 *   wx.cloud.callFunction({
 *     name: 'payment',
 *     data: {
 *       action: 'createOrder',
 *       code: <wx.login 拿到的 code>,
 *       productId: 'skill_lite' | 'skill_basic' | 'skill_pro' | 'member_monthly' | 'member_annual',
 *       goodsPrice: <分，如 290>,
 *       attach: <透传，如 skillId>
 *     }
 *   })
 *
 * 返回：
 *   {
 *     errno: 0,
 *     signData: '<JSON string，传给 wx.requestVirtualPayment 的 signData>',
 *     paySig: '<HMAC-SHA256 签名，用 VIRTUAL_PAYMENT_KEY>',
 *     signature: '<用户态签名，用 session_key>',
 *     outTradeNo, offerId, appId
 *   }
 *
 * 环境变量（cloudbaserc.json envVariables）：
 *   APPID, MCHID, OFFER_ID, VIRTUAL_PAYMENT_KEY
 */

const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const ENV = {
  APPID: process.env.APPID || '',
  MCHID: process.env.MCHID || '',
  OFFER_ID: process.env.OFFER_ID || '',
  SIGN_KEY: process.env.VIRTUAL_PAYMENT_KEY || '',
}

const PRODUCT_TIER_MAP = {
  'skill_lite': 200,
  'skill_basic': 900,
  'skill_pro': 1900,
  'member_monthly': 1900,
  'member_annual': 9900,
}

const ACTIONS = {
  createOrder,
  queryOrder,
  notify,
}

exports.main = async (event, context) => {
  const { action, data } = event
  const handler = ACTIONS[action]
  if (!handler) return { errno: -1, errMsg: 'unknown action: ' + action }
  try {
    return await handler(data || {}, context)
  } catch (e) {
    console.error('[payment] handler error:', e)
    return { errno: -2, errMsg: String((e && e.message) || e) }
  }
}

/**
 * 创建订单：用 wx.login code 换 session_key，然后生成 signData + paySig + signature
 */
async function createOrder(data, context) {
  const { code, productId = '', goodsPrice, attach = '' } = data

  if (!code) {
    return { errno: 400, errMsg: 'missing wx.login code' }
  }
  if (!productId) {
    return { errno: 400, errMsg: 'missing productId' }
  }

  if (!ENV.OFFER_ID || !ENV.SIGN_KEY) {
    return {
      errno: 500,
      errMsg: '云函数未配置 OFFER_ID / VIRTUAL_PAYMENT_KEY',
    }
  }

  const expectedPrice = PRODUCT_TIER_MAP[productId]
  if (!expectedPrice) {
    return { errno: 400, errMsg: 'invalid productId: ' + productId }
  }
  const finalPrice = Number(goodsPrice) || expectedPrice
  if (finalPrice !== expectedPrice) {
    console.warn('[payment] price mismatch: client=' + finalPrice + ' expected=' + expectedPrice + ' (use expected)')
  }

  const outTradeNo = genOrderNo(context.OPENID)

  console.log('[payment] createOrder start:', { code: code.slice(0,8)+'...', productId, finalPrice, attach, outTradeNo })

  const sessionKey = await getSessionKeyByCode(code)

  const signDataObj = {
    offerId: ENV.OFFER_ID,
    buyQuantity: 1,
    env: 0,
    currencyType: 'CNY',
    productId: productId,
    goodsPrice: expectedPrice,
    outTradeNo: outTradeNo,
    attach: attach || productId,
  }
  const signDataStr = JSON.stringify(signDataObj)

  const paySig = hmacSHA256(signDataStr, ENV.SIGN_KEY)
  const signature = hmacSHA256(signDataStr, sessionKey)

  console.log('[payment] createOrder done:', {
    signDataLen: signDataStr.length,
    paySigLen: paySig.length,
    signatureLen: signature.length,
  })

  return {
    errno: 0,
    signData: signDataStr,
    paySig: paySig,
    signature: signature,
    outTradeNo: outTradeNo,
    offerId: ENV.OFFER_ID,
    appId: ENV.APPID,
    mchId: ENV.MCHID,
    productId: productId,
    goodsPrice: expectedPrice,
  }
}

/**
 * 用 wx.login code 调 cloud.openapi.auth.code2Session 换 session_key
 */
async function getSessionKeyByCode(code) {
  try {
    const result = await cloud.openapi.auth.code2Session({
      appid: ENV.APPID,
      secret: '',
      js_code: code,
      grant_type: 'authorization_code',
    })
    console.log('[payment] code2Session ok, keys:', Object.keys(result || {}).join(','))
    if (result && result.session_key) {
      return result.session_key
    }
    throw new Error('code2Session returned no session_key: ' + JSON.stringify(result))
  } catch (e) {
    console.error('[payment] code2Session fail:', e && e.errCode, e && e.errMsg)
    throw new Error('code2Session failed: ' + ((e && e.errMsg) || String(e)))
  }
}

function hmacSHA256(data, key) {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest('hex')
}

function genOrderNo(openid) {
  const ts = Date.now().toString(36)
  const rand = crypto.randomBytes(4).toString('hex')
  const uid = (openid || 'u').slice(-4)
  return 'vp_' + ts + rand + uid
}

async function queryOrder(data, context) {
  const { outTradeNo } = data
  if (!outTradeNo) return { errno: 400, errMsg: 'outTradeNo required' }
  return { errno: 0, outTradeNo: outTradeNo, status: 'pending', msg: 'queryOrder 待接微信 API' }
}

async function notify(data, context) {
  return { errno: 0, msg: 'notify received, 待接业务逻辑' }
}
