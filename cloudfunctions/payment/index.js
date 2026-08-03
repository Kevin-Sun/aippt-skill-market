/**
 * 虚拟支付云函数 · V4 直接 HTTP 调 jscode2session
 *
 * 真因：auth.code2Session 官方明确"不支持云调用"（-604100 = API 不存在）
 * 修复：用 Node 内置 https 直接 GET https://api.weixin.qq.com/sns/jscode2session
 *
 * 客户端调用：
 *   wx.cloud.callFunction({
 *     name: 'payment',
 *     data: {
 *       action: 'createOrder',
 *       data: { code, productId, goodsPrice, attach }
 *     }
 *   })
 *
 * 环境变量（cloudbaserc.json envVariables）：
 *   APPID, APP_SECRET, MCHID, OFFER_ID, VIRTUAL_PAYMENT_KEY
 */

const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const https = require('https')

console.log('[payment] module loading, wx-server-sdk version:', require('wx-server-sdk/package.json').version)

try {
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
  console.log('[payment] cloud.init ok, DYNAMIC_CURRENT_ENV =', cloud.DYNAMIC_CURRENT_ENV)
} catch (initErr) {
  console.error('[payment] cloud.init FAIL:', initErr && initErr.message, initErr && initErr.stack)
  throw initErr
}

const ENV = {
  APPID: process.env.APPID || '',
  APP_SECRET: process.env.APP_SECRET || '',
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
 * 创建订单：用 wx.login code 直接 HTTP 换 session_key，然后生成签名
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
  if (!ENV.APPID || !ENV.APP_SECRET) {
    return {
      errno: 500,
      errMsg: '云函数未配置 APPID / APP_SECRET（jscode2session 需要 AppSecret）',
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

  // 直接 HTTP 调 jscode2session（绕过 cloud.openapi，因为 code2Session 不支持云调用）
  const sessionKey = await getSessionKeyByHttp(code)

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
 * 直接 HTTP GET jscode2session
 * 官方文档：https://developers.weixin.qq.com/miniprogram/dev/server/API/user-login/api_code2session.html
 * 注意：auth.code2Session 不支持云调用（-604100），必须用 HTTP
 */
function getSessionKeyByHttp(code) {
  return new Promise((resolve, reject) => {
    const url = 'https://api.weixin.qq.com/sns/jscode2session'
      + '?appid=' + ENV.APPID
      + '&secret=' + ENV.APP_SECRET
      + '&js_code=' + encodeURIComponent(code)
      + '&grant_type=authorization_code'

    console.log('[payment] jscode2session HTTP calling, appid=' + ENV.APPID + ', code prefix=' + String(code).slice(0, 8) + '...')

    const req = https.get(url, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        console.log('[payment] jscode2session HTTP response status=' + res.statusCode + ', body len=' + body.length)
        try {
          const data = JSON.parse(body)
          console.log('[payment] jscode2session parsed, keys:', Object.keys(data).join(','))
          if (data.errcode && data.errcode !== 0) {
            console.error('[payment] jscode2session API error:', JSON.stringify(data))
            reject(new Error('jscode2session error ' + data.errcode + ': ' + data.errmsg))
            return
          }
          if (data.session_key) {
            console.log('[payment] jscode2session OK, session_key prefix=' + data.session_key.slice(0, 8) + '...')
            resolve(data.session_key)
          } else {
            console.error('[payment] jscode2session no session_key:', JSON.stringify(data))
            reject(new Error('jscode2session returned no session_key: ' + JSON.stringify(data)))
          }
        } catch (e) {
          console.error('[payment] jscode2session JSON parse fail:', e.message, 'body:', body.slice(0, 200))
          reject(new Error('jscode2session response parse fail: ' + e.message))
        }
      })
    })

    req.on('error', (e) => {
      console.error('[payment] jscode2session HTTP error:', e.message, e.stack)
      reject(new Error('jscode2session HTTP error: ' + e.message))
    })

    req.setTimeout(8000, () => {
      console.error('[payment] jscode2session HTTP timeout')
      req.destroy()
      reject(new Error('jscode2session HTTP timeout (8s)'))
    })
  })
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
  return { errno: 0, outTradeNo: outTradeNo, status: 'pending', msg: 'queryOrder 待接业务逻辑' }
}

async function notify(data, context) {
  return { errno: 0, msg: 'notify received, 待接业务逻辑' }
}
