/**
 * skills 云函数 · 购买记录云端化 + SKILL.md 内容按需读取
 *
 * 客户端调用：
 *   wx.cloud.callFunction({ name: 'skills', data: { action: 'getPurchases' } })
 *   wx.cloud.callFunction({ name: 'skills', data: { action: 'getSkillContent', skillId: 'skill_001' } })
 *   wx.cloud.callFunction({ name: 'skills', data: { action: 'savePurchase', data: {...} } })
 */

const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const ACTIONS = {
  getPurchases,
  savePurchase,
  getSkillContent,
  getSkillContents,
  getOriginalDetail,
  importOriginalDetails,
  generatePPT,
  getUsage,
  getSubscription,
  saveSubscription,
  refinePPT,
}

exports.main = async (event, context) => {
  const { action, data } = event
  const handler = ACTIONS[action]
  if (!handler) return { errno: -1, errMsg: 'unknown action: ' + action }
  try {
    return await handler(data || {}, context)
  } catch (e) {
    console.error('[skills] handler error:', e)
    return { errno: -2, errMsg: String((e && e.message) || e) }
  }
}

/**
 * 读取用户购买记录（从云端 purchases 集合）
 */
async function getPurchases(data, context) {
  const openid = context.OPENID || (data && data.openid) || ''
  if (!openid) return { errno: 0, purchases: [] }

  const res = await db.collection('purchases')
    .where({ openid: openid })
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get()

  return { errno: 0, purchases: res.data || [] }
}

/**
 * 保存购买记录（支付成功后调用）
 */
async function savePurchase(data, context) {
  const openid = context.OPENID || ''
  if (!openid) return { errno: 401, errMsg: 'no openid' }
  if (!data || !data.skillId) return { errno: 400, errMsg: 'missing skillId' }

  // 检查是否已存在（防重复）
  const existing = await db.collection('purchases')
    .where({ openid: openid, skillId: data.skillId })
    .count()

  if (existing.total > 0) {
    return { errno: 0, msg: 'already purchased', duplicated: true }
  }

  const record = {
    openid: openid,
    skillId: data.skillId,
    skillName: data.skillName || '',
    productId: data.productId || '',
    amount: data.amount || 0,
    outTradeNo: data.outTradeNo || '',
    status: '已完成',
    createdAt: new Date().toISOString(),
  }

  const res = await db.collection('purchases').add({ data: record })
  return { errno: 0, _id: res._id, msg: 'saved' }
}

/**
 * 获取单个 skill 的 SKILL.md 全文（从 skill_contents 集合）
 */
async function getSkillContent(data, context) {
  if (!data || !data.skillId) return { errno: 400, errMsg: 'missing skillId' }

  const res = await db.collection('skill_contents')
    .where({ skillId: data.skillId })
    .limit(1)
    .get()

  if (res.data && res.data.length > 0) {
    return { errno: 0, content: res.data[0] }
  }
  return { errno: 404, errMsg: 'content not found for ' + data.skillId }
}

/**
 * 批量获取 skill 的 SKILL.md 全文（用于上传初始化）
 */
async function getSkillContents(data, context) {
  const res = await db.collection('skill_contents')
    .limit(1000)
    .get()

  return { errno: 0, total: res.data.length, contents: res.data }
}

/**
 * 获取单个 skill 的原作详情（从 original_details 集合）
 */
async function getOriginalDetail(data, context) {
  if (!data || !data.skillId) return { errno: 400, errMsg: 'missing skillId' }
  const res = await db.collection('original_details').where({ skillId: data.skillId }).limit(1).get()
  if (res.data && res.data.length > 0) return { errno: 0, detail: res.data[0] }
  return { errno: 404, errMsg: 'detail not found for ' + data.skillId }
}

/**
 * 批量导入原作详情（内部初始化用）
 */
async function importOriginalDetails(data, context) {
  const items = data.items || []
  if (items.length === 0) return { errno: 400, errMsg: 'no items' }
  let ok = 0
  for (const item of items) {
    const id = item._id || item.id
    if (!id) continue
    await db.collection('original_details').add({ data: { skillId: id, ...item } }).catch(() => {})
    ok++
  }
  return { errno: 0, imported: ok }
}

const httpx = require('got')
const PPT_BACKEND = 'http://106.55.42.77'

/**
 * 生成 PPT（调用独立后端 GLM-5.2 + python-pptx）
 */
async function generatePPT(data, context) {
  const openid = context.OPENID || (data && data.openid) || ''
  if (!openid) return { errno: 401, errMsg: 'no openid' }
  
  const { skillId, userMessage, style, pages } = data || {}
  if (!userMessage) return { errno: 400, errMsg: 'missing userMessage' }

  // 检查使用次数
  const usage = await checkUsage(openid)
  if (usage.used >= usage.limit) return { errno: 403, errMsg: '本月生成次数已用完', used: usage.used, limit: usage.limit }

  // 调用后端
  try {
    const resp = await httpx.post(PPT_BACKEND + '/api/generate', {
      json: { skillId: skillId || 'test', userMessage, style: style || '商务简约', pages: pages || 5, openid },
      timeout: { request: 120000 },
    })
    
    // 解析 SSE 流，提取 done 事件
    const text = resp.body
    const doneMatch = text.match(/"event":\s*"done"[\s\S]*?"pptxUrl":\s*"([^"]+)"/)
    if (doneMatch) {
      // 上传到 CloudBase storage
      const pptxUrl = doneMatch[1]
      const sessionId = doneMatch[0].match(/"sessionId":\s*"([^"]+)"/)
      
      // 下载 .pptx
      const pptxResp = await httpx(PPT_BACKEND + pptxUrl.replace(PPT_BACKEND, ''), { timeout: 30000 })
      const cloudPath = 'output/' + openid + '/' + Date.now() + '.pptx'
      const uploadResult = await cloud.uploadFile({ cloudPath, fileContent: pptxResp.body })
      
      // 记录使用次数
      await db.collection('usage_records').add({ data: { openid, skillId, createdAt: new Date().toISOString() } })
      
      return { errno: 0, pptxUrl: uploadResult.fileID, fileID: uploadResult.fileID }
    }
    return { errno: 500, errMsg: 'backend did not return done event', raw: text.slice(0, 500) }
  } catch (e) {
    return { errno: 502, errMsg: String((e && e.message) || e) }
  }
}

/**
 * 局部修改 PPT（对话式 agent）
 */
async function refinePPT(data, context) {
  const openid = context.OPENID || ''
  if (!openid) return { errno: 401, errMsg: 'no openid' }
  const { sessionId, instruction } = data || {}
  if (!sessionId || !instruction) return { errno: 400, errMsg: 'missing sessionId or instruction' }

  try {
    const resp = await httpx.post(PPT_BACKEND + '/api/refine', {
      json: { sessionId, instruction },
      timeout: { request: 60000 },
    })
    const text = resp.body
    const doneMatch = text.match(/"event":\s*"done"[\s\S]*?"content":\s*"([^"]*)"/)
    if (doneMatch) {
      return { errno: 0, content: doneMatch[1] }
    }
    return { errno: 500, errMsg: 'refine did not return done', raw: text.slice(0, 500) }
  } catch (e) {
    return { errno: 502, errMsg: String((e && e.message) || e) }
  }
}

/**
 * 检查用户使用次数
 */
async function checkUsage(openid) {
  // 查会员状态
  const subRes = await db.collection('subscriptions').where({ openid, status: 'active' }).limit(1).get().catch(() => ({ data: [] }))
  let limit = 0
  if (subRes.data && subRes.data.length > 0) {
    const sub = subRes.data[0]
    if (sub.plan === 'monthly') limit = 10
    else if (sub.plan === 'annual') limit = 120
  }
  
  // 查本月已用次数
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const usageRes = await db.collection('usage_records').where({ openid, createdAt: _.gte(monthStart) }).count().catch(() => ({ total: 0 }))
  
  return { used: usageRes.total || 0, limit }
}

/**
 * 获取使用次数
 */
async function getUsage(data, context) {
  const openid = context.OPENID || (data && data.openid) || ''
  if (!openid) return { errno: 401, errMsg: 'no openid' }
  const usage = await checkUsage(openid)
  return { errno: 0, ...usage }
}

/**
 * 获取会员订阅状态
 */
async function getSubscription(data, context) {
  const openid = context.OPENID || (data && data.openid) || ''
  if (!openid) return { errno: 401, errMsg: 'no openid' }
  const res = await db.collection('subscriptions').where({ openid, status: 'active' }).limit(1).get().catch(() => ({ data: [] }))
  return { errno: 0, subscription: res.data[0] || null }
}

/**
 * 保存会员订阅（支付成功后调用）
 */
async function saveSubscription(data, context) {
  const openid = context.OPENID || ''
  if (!openid) return { errno: 401, errMsg: 'no openid' }
  const { plan, productId, outTradeNo } = data || {}
  if (!plan) return { errno: 400, errMsg: 'missing plan' }
  
  // 过期时间
  const now = new Date()
  let expiresAt
  if (plan === 'monthly') expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  else if (plan === 'annual') expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
  else return { errno: 400, errMsg: 'invalid plan' }
  
  await db.collection('subscriptions').add({ data: {
    openid, plan, productId: productId || '', outTradeNo: outTradeNo || '',
    status: 'active', createdAt: now.toISOString(), expiresAt: expiresAt.toISOString(),
  }})
  return { errno: 0, msg: 'saved', expiresAt: expiresAt.toISOString() }
}
