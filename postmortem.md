# Postmortem — aippt-skill-market 项目错误目录

> 从 idea 到上线全过程中踩过的坑，按类归档。每条含：现象 → 根因 → 耗的轮次 → **现在哪个自动检查能拦住它**。
> 项目 #2 开始前必读——这是你的免疫系统。

---

## A. 编译类

### A1. WXSS 中文注释/类名导致编译失败
- **现象**：`community.wxss` 有 `/* 头部 */` 和 `.op-tag-数据分析` 类名，编译报 `unexpected character`
- **根因**：WeChat WXSS 解析器不支持中文（memory #199）
- **当时耗时**：2+ 小时排查，多次误判为代码逻辑问题
- **现在拦住它的检查**：`sanity.js` S6（WXSS 非 ASCII 扫描）+ `compile-check.js` check 2

### A2. 包体积超 4MB 限制
- **现象**：12 张 icon + 8 张 skill preview + 5 张 banner = 13MB，超过 4MB 限制
- **根因**：生成图片未压缩，大图直接放本地
- **当时耗时**：1 小时排查 + 压缩
- **现在拦住它的检查**：`sanity.js` S7（包体积 + 单图上限 200KB）+ `compile-check.js` check 5

### A3. .ts 文件覆盖 .js 模块解析
- **现象**：WeChat DevTools 在编译 .ts 后，同名 .js 模块无法被 resolve
- **根因**：DevTools 优先编译 .ts，与已有 .js 冲突
- **当时耗时**：3 小时排查
- **现在拦住它的检查**：脚手架已删所有 .ts 文件 + `regression-check.sh` 不再跑 `npx tsc`

---

## B. 数据类

### B1. gradient 字段类型不一致（卡片白屏）
- **现象**：首页卡片头部白色，style-tag 隐形（白字白底）
- **根因**：本地 8 条 gradient 是 CSS 字符串 `"linear-gradient(...)"`，云端 300 条是数组 `["#a","#b"]`，WXML 拼成非法 CSS
- **当时耗时**：被误判为"缺 previewImages"，实际首页卡片不用 previewImages
- **现在拦住它的检查**：`sanity.js` S2（gradient 类型一致性）

### B2. 300 条云端 skill 缺 3 个详情页字段
- **现象**：点进任意云端 skill，详情页无预览图、无评价、无适用场景
- **根因**：云端数据只有基础字段，缺 `previewImages`/`reviews`/`suitableFor`
- **当时耗时**：多轮发现，每次补一个
- **现在拦住它的检查**：`sanity.js` S1（15 字段完整性矩阵）

### B3. 1200 条假数据（PPT Skill #N 式命名）
- **现象**：首页只有 8 条真实 skill，云端 1200 条全是 `PPT Skill #1`...`PPT Skill #1200`
- **根因**：把"从已有 prompts 随机扩展"当成了"搜索"
- **当时耗时**：1 整天搜索 308 条真实数据替换
- **现在拦住它的检查**：`sanity.js` S5（假数据回归：假名/重名/重 id）

### B4. skills.js 重复 reviews 键覆盖
- **现象**：所有 8 个 skill 的 reviews 全是"打工人小王"
- **根因**：Python 替换脚本没生效，后面的 reviews 键覆盖前面的
- **当时耗时**：2 小时排查根因
- **现在拦住它的检查**：`sanity.js` S4（重复键检测）

### B5. 云端 DB 价格未同步
- **现象**：本地代码已改整数价格，真机仍显示 9.9
- **根因**：compile-check 只查本地代码，不查云端 MongoDB
- **当时耗时**：2 小时排查
- **现在拦住它的检查**：`sanity.js` S9（云端/本地价格一致性）

---

## C. 支付类

### C1. auth.code2Session 不支持云调用 → -604100
- **现象**：云函数 `cloud.openapi.auth.code2Session` 返回 -604100 system error
- **根因**：官方文档明确"本接口不支持云调用"，`permissions.openapi` 配置无意义
- **当时耗时**：跨多个会话反复排查，误判为权限/环境/冷启动问题
- **现在拦住它的检查**：`compile-check.js` check 9（检测残留的 `auth.code2Session` 配置）+ memory #247

### C2. paySig 漏 `requestVirtualPayment&` 前缀 → -15006
- **现象**：真机报 -15006，误判为"商品审核未通过"，实为 PAY_SIG_INVALID（签名无效）
- **根因**：paySig = HMAC-SHA256(key, "requestVirtualPayment&" + signData)，代码漏了前缀
- **当时耗时**：多轮误判，直到 DevTools automation 抓到真实错误码
- **现在拦住它的检查**：`e2e-v7.js` PAY-01~08 + memory #255

### C3. MCHID 错字 → -15006
- **现象**：paySig 修复后仍 -15006
- **根因**：cloudbaserc.json 里 MCHID 1748691274 应为 1748696056（5 位错字）
- **当时耗时**：2 小时比对凭据
- **现在拦住它的检查**：`sanity.js` S10（凭据齐备性）+ `compile-check.js` check 10

### C4. wx.login 频率限制 → 空 code → 400
- **现象**：多次点击购买，后续报 `[400] missing wx.login code`
- **根因**：wx.login 有 5 分钟频率限制，频繁调用返回空 code
- **当时耗时**：1 小时排查
- **现在拦住它的检查**：`e2e-v7.js` PAY-01/02（code 缓存 TTL）+ memory #230

---

## D. 路径事实源类

### D1. 脚手架 appid 指向生产环境 → DevTools 加载错项目
- **现象**：真机扫码后价格仍为 9.9、错误格式旧
- **根因**：`templates/miniprogram-base/project.config.json` 的 appid 是生产值，DevTools 加载了脚手架而非真项目
- **当时耗时**：3 小时排查
- **现在拦住它的检查**：`sanity.js` S8（真项目 vs 脚手架 appid 必须不同）+ memory #239/#240

### D2. e2e-v3/verify-search 只在脚手架目录
- **现象**：报"83 e2e PASS"，实际真项目从未跑过那 27 个
- **根因**：测试文件落在 `templates/miniprogram-base/tests/` 而非 `docs/aippt-skill-market/tests/`
- **当时耗时**：发现即修复
- **现在拦住它的检查**：`regression-check.sh` 路径指向真项目 + 移植测试文件

### D3. regression-check.sh 指向脚手架
- **现象**：回归护栏跑的是脚手架项目，不是真项目
- **根因**：`PROJ` 硬编码 `templates/miniprogram-base`
- **当时耗时**：发现即修复
- **现在拦住它的检查**：`regression-check.sh` V2 路径已修正

---

## E. 测试可信度类

### E1. fake pass — e2e 只做静态断言
- **现象**：32/32 PASS，但真机不能用
- **根因**：e2e 只 grep 源码文本，不验证运行时行为
- **当时耗时**：多轮用户团验收才发现
- **现在拦住它的检查**：sanity.js 补充了运行时维度检查 + devtools automation 验证

### E2. compile-check 漏跑检查项
- **现象**：报"11 PASS"，实际只跑了 9 项（图片路径检查未实现、编号跳 7）
- **根因**：header 声明的检查项在代码里未实现
- **当时耗时**：发现即修复
- **现在拦住它的检查**：compile-check.js 编号 1-10 连续 + 每项有 console.log

### E3. 用户团只看代码不编译
- **现象**：3 轮 15 人验收"通过"，但真机不能用
- **根因**：验收时没在 DevTools 里编译运行
- **当时耗时**：重新建立了 compile → preview → e2e 验证流程
- **现在拦住它的检查**：`regression-check.sh` 编排了完整验证链
