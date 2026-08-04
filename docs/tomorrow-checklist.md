# 明天扫码清单

> 凯哥明天扫码登录 mp 后台后，以下 3 件事做完，其余全自动。

## 1. 下载代码上传密钥（3 分钟·一次性·永久解锁全自动预览/上传）

1. 登录 mp.weixin.qq.com
2. 开发管理 → 开发设置 → 找到「小程序代码上传」
3. 点「下载密钥」（**IP 白名单不勾选**，密钥本身是强凭据）
4. 保存文件到项目根目录：`docs/aippt-skill-market/private.wx9647f4ecd0d033fe.key`
5. 写 inbox 标记：`echo "已下载" > checklist/inbox/M11.txt`
6. 跑：`cd docs/aippt-skill-market && bash checklist/check.sh` 确认 M11 变 PASS

做完这步后，AI 就能用 `node scripts/ci-preview.js` 自己出预览二维码，不再需要你点 DevTools GUI。

## 2. 确认虚拟支付 5 商品状态（已配置，只需确认）

1. mp.weixin.qq.com → 功能 → 虚拟支付 → 商品管理
2. 确认 5 个商品全部「已发布」：
   - skill_lite (¥2) / skill_basic (¥9) / skill_pro (¥19)
   - member_monthly (¥19) / member_annual (¥99)
3. 如果有商品「审核中」，等待通过即可

## 3. 真机扫码验支付（真机 only）

1. DevTools 点「预览」生成二维码（或密钥下载后用 `node scripts/ci-preview.js`）
2. 手机扫码
3. 点一个付费 skill → 点购买 → 确认微信支付弹窗 → 输入密码
4. 确认购买成功 → 返回首页 → 确认该 skill 显示「已购买」
5. 点会员中心 → 选月度会员 → 购买 → 确认弹窗
6. 取消支付 → 确认**无任何错误提示**（静默取消已实现）

如果支付失败：
- 截图错误弹窗的完整内容（标题+正文）
- 检查 `tcb fn log payment` 的云函数日志

---

## 已完成的（你不用管）

| 项 | 状态 |
|---|---|
| 308 条 skill 数据完整 | ✅ gradient/reviews/suitableFor 全归一 |
| 首页 308 张卡片全部正常渲染 | ✅ gradient 类型统一 |
| 详情页空态优雅 | ✅ reviews 空数组→空态+CTA |
| getRelated 回退 | ✅ 同场景推荐 |
| 测试基建修复 | ✅ sanity 18/18 + compile 12/12 + e2e-v7 25/25 + verify 30/30 |
| 76 张预览图生成 | ⏳ 生成中（gpt-image-2 + CloudBase storage） |
| devtools 配方持久化 | ✅ scripts/devtools/ |
| miniprogram-ci 打通 | ✅ ci-preview.js / ci-upload.js |
| bootstrap 一键建项目 | ✅ scripts/bootstrap.sh |
| 错误目录 | ✅ postmortem.md |
| checklist 重写 | ✅ 13 PASS / 4 PENDING |
| pipeline 标注 | ✅ AI全自动/凯哥一次/凯哥每次 |

## 仍 PENDING 的（等备案）

| 项 | 状态 | 何时做 |
|---|---|---|
| ICP 备案 | PENDING | **已注册小程序，备案需在 mp 后台提交** |
| 提审 | PENDING | 备案通过后 |
| 发布 | PENDING | 审核通过后 |
