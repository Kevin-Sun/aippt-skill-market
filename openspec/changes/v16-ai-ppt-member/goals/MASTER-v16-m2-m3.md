# M2+M3 联合版本 · AI 生成 PPT + 会员体系 + 对话式局部修改

> 版本：v1.6.0
> 目标：M2 AI 生成 PPT 后端 + M3 会员体系 + 对话式局部修改（agent）
> 上线顺序：M2 后端 → M3 会员 → agent 对话
> **原则：最大化自动化，不停下来等凯哥。token 无上限，次数无上限。最后必须诚实完整跑完 e2e 才算完成。**

## Goal Objective（复制到 set_goal 或 TUI 开启）

> 在 aippt-skill-market 完成 v1.6.0：M2 AI 生成 PPT 后端 + M3 会员体系 + 对话式局部修改（agent）。
> 每一步完成条件声明 + 清洗测试用例 + 真机验收。全部完成后 ci-upload v1.6.0 并给凯哥二维码。
> 最大化自动化所有执行步骤，不要停下来等我。token 没有上限，次数没有上限，一切以完成所有任务为第一原则。
> 最后的测试必须诚实、完整的跑完 e2e 才算完成验收。如果一定需要我做什么，最后汇总出来我一并处理。

## 决策已锁定

| 项 | 选定 |
|---|---|
| 服务器 | 腾讯云轻量 2C4G（已购买，IP=106.55.42.77，SSH 通） |
| 对话式 agent 入口 | 两个都有（详情页「试用」+ 首页「AI 生成」入口） |
| 会员免费额度 | 月度 10 次 + 年度 120 次 |
| 上线顺序 | 先 M2 后端 → 再 M3 会员 → 再 agent 对话 |
| 线上 AI 模型 | GLM-5.2（已有 key） |
| 开发模型 | GLM-5.3（build 默认） |

## 服务器信息（已验证 SSH 通）

- IP: 106.55.42.77
- 用户名: ubuntu
- 密码: V)^RA97h2Ya!%$T
- 系统: Ubuntu 22.04, Python 3.10.12, 3.6GB RAM, 50GB disk
- SSH 命令: `sshpass -p 'V)^RA97h2Ya!%$T' ssh -o StrictHostKeyChecking=no ubuntu@106.55.42.77`

## 执行顺序（严格按序，每步完成才进下一步）

### Phase 1 · M2 后端搭建（AI 生成 PPT）

| # | 任务 | 完成条件声明 | 清洗测试用例 |
|---|---|---|---|
| 1.1 | 配置 GLM-5.3（已完成：opencode.json 已加 glm-5.3 model + 新 key） | ✅ 已完成 | ✅ API 验证 200 |
| 1.2 | 购买腾讯云轻量 2C4G 服务器（已完成：IP=106.55.42.77，SSH 通） | ✅ 已完成 | ✅ SSH 验证通过 |
| 1.3 | 安装 Python 3.10 + pip + fastapi/uvicorn/python-pptx/pillow | `pip list` 含 fastapi/uvicorn/python-pptx/pillow | `python3 -c "import fastapi, pptx, PIL"` 无报错 |
| 1.4 | clone ppt-master + 配置 GLM-5.2（线上服务用 5.2 不是 5.3） | `git clone` 成功，`.env` 有 GLM-5.2 key | `curl http://localhost:8000/api/health` 返回 `{"status":"ok"}` |
| 1.5 | FastAPI 网关部署 + systemd 自启 | `systemctl status ppt-master` active | `curl http://106.55.42.77:8000/api/health` 返回 ok |
| 1.6 | python-pptx 导出链路验证 | 用 test 数据生成 1 页 .pptx 并下载 | 下载 .pptx 文件，用 python-pptx 打开验证 `len(ppt.slides) == 1` |
| 1.7 | CloudBase storage 上传集成 | 生成 .pptx 后上传到 storage，返回 URL | `tcb storage url output/test.pptx -e aippt-skill-d6g5hsem096551cc3` 返回 https URL 且 HTTP 200 |
| 1.8 | 小程序云函数 generatePPT action | 云函数 `skills` 新增 `generatePPT` action，调用后端 | `tcb fn invoke skills --data '{"action":"generatePPT","data":{"skillId":"skill_001","userMessage":"做一份工作汇报"}}'` 返回 pptxUrl |
| 1.9 | **Phase 1 完成条件** | 小程序调用后端生成 PPT 成功，返回可下载的 .pptx URL | 手动验证：小程序里点「生成」→ 等 10s → 收到下载链接 → 浏览器打开是有效 .pptx |

### Phase 2 · M3 会员体系

| # | 任务 | 完成条件声明 | 清洗测试用例 |
|---|---|---|---|
| 2.1 | 会员页 UI 重构 | 月度 ¥19 / 年度 ¥99 两档 + 权益说明 | WXML 有 `member-monthly` 和 `member-annual` 两个按钮，价格正确 |
| 2.2 | 会员支付链路 | `wx.requestVirtualPayment` 真机验证成功 | 真机点「开通月度会员」→ 支付成功 → 返回会员页显示「已开通」 |
| 2.3 | 会员权益绑定 | 会员解锁所有付费 skill（tier=paid） | 会员状态下点付费 skill → 直接显示「已解锁」不弹支付 |
| 2.4 | AI 生成次数限制 | 月度会员 10 次/月，年度会员 120 次/年 | 云函数 `getUsage` 返回 `{"used": 0, "limit": 10}`；用完返回 `{"used": 10, "limit": 10}` 且前端显示「本月已用完」 |
| 2.5 | 订单中心会员订阅记录 | 会员支付后写云端 `subscriptions` 集合 | `tcb fn invoke skills --data '{"action":"getSubscription"}'` 返回当前会员状态 |
| 2.6 | **Phase 2 完成条件** | 真机开通会员 → 解锁付费 skill → AI 生成次数限制生效 | 手动验证：开通会员 → 点付费 skill → 直接解锁 → 点 AI 生成 → 显示剩余次数 |

### Phase 3 · 对话式局部修改（agent）

| # | 任务 | 完成条件声明 | 清洗测试用例 |
|---|---|---|---|
| 3.1 | 对话页 UI | 详情页「试用」+ 首页「AI 生成」→ 进入对话页，输入框 + 消息列表 | WXML 有 `chat-input` 和 `message-list`，能输入文字 |
| 3.2 | WebSocket 流式连接 | 云函数 WebSocket 网关，后端 SSE 推送 | 对话页发送「第 3 页换成柱状图」→ 后端开始生成 → 前端实时显示进度 |
| 3.3 | 局部修改 API | 后端支持 `refine` endpoint，只重新生成指定页 | 发送 refine 请求 → 返回新 SVG → 只更新第 3 页，其他页不变 |
| 3.4 | 实时预览更新 | 修改后的页立即显示在预览区 | 前端收到新 SVG → 更新 previewDeck → 用户看到第 3 页已变 |
| 3.5 | 最终导出 .pptx | 用户确认后导出完整 .pptx | 点「导出」→ 后端合成所有页 → 返回下载链接 |
| 3.6 | **Phase 3 完成条件** | 对话式修改 → 实时预览 → 导出 .pptx | 手动验证：详情页点「试用」→ 对话页说「第 3 页换柱状图」→ 第 3 页变 → 导出 .pptx |

### Phase 4 · 上线

| # | 任务 | 完成条件声明 | 清洗测试用例 |
|---|---|---|---|
| 4.1 | e2e 补断言 | `tests/e2e-v10.js` 新增 M2/M3 相关断言 | 会员页元素存在 / AI 生成按钮存在 / 对话页存在 / 后端 health check 200 |
| 4.2 | 全量测试 | `bash run-all-tests.sh` 全绿 | 所有套件全绿 |
| 4.3 | ci-upload v1.6.0 | 上传成功 | `node scripts/ci-upload.js --ver 1.6.0` 返回成功 |
| 4.4 | 凯哥真机验收 | 凯哥确认 M2/M3 功能正常 | 凯哥反馈「M2 生成 PPT 正常 / M3 会员支付正常 / agent 对话正常」 |

## 循环修正规则

| 不达标项 | 循环动作 | 达标线 |
|---|---|---|
| 后端 health check 失败 | 检查服务器防火墙/端口/服务状态 | `curl /api/health` 200 |
| python-pptx 生成失败 | 检查 ppt-master 依赖/GLM-5.2 key/网络 | 生成 1 页 .pptx 成功 |
| 小程序调用后端失败 | 检查云函数 HTTP 请求/域名白名单/后端日志 | `tcb fn invoke` 返回 pptxUrl |
| 会员支付失败 | 检查 payment 云函数/虚拟支付 key/商品 ID | 真机支付成功 |
| AI 生成次数限制不生效 | 检查云函数 `getUsage` 返回/前端显示逻辑 | `used` 正确累加 |
| 对话式修改失败 | 检查 WebSocket 连接/后端 refine API/前端更新逻辑 | refine 后第 3 页变 |
| **循环上限** | 每步最多重试 3 次，3 次仍失败 → 停下汇总给凯哥 | — |

## 最终达标判据（全绿才算完成）

```
Phase 1: 小程序调用后端生成 PPT 成功，返回可下载 .pptx URL
Phase 2: 真机开通会员 → 解锁付费 skill → AI 生成次数限制生效
Phase 3: 对话式修改 → 实时预览 → 导出 .pptx
Phase 4: e2e 全绿 + ci-upload v1.6.0 成功 + 凯哥真机验收通过
```

## 风险与应对

| 风险 | 概率 | 应对 |
|---|---|---|
| GLM-5.2 生成质量不如 Claude | 中 | M2 阶段做 A/B 测试，必要时加 Claude 备选 |
| python-pptx SVG → DrawingML 转换有边界 | 中 | 参照 ppt-master PowerCompat 映射表 |
| 独立后端运维成本 | 低 | systemd 自动重启 + 日志轮转 + 监控告警 |
| WebSocket 流式不稳定 | 低 | 降级为轮询（每 2s 查一次进度） |
| 包体积超 2MB | 中 | original-details 已走云函数，cloud-skills-data.js 已压缩，M2/M3 新增代码走云函数不进包 |

## 需要凯哥最终处理的（汇总，执行过程中遇到才填）

- [ ] mp 后台配 downloadFile 合法域名（如果预览图/封面图真机不显示）
- [ ] mp 后台虚拟支付商品管理：新增 member_monthly / member_annual 两个 productId
- [ ] 真机验收 v1.6.0

## 备注

- 线上服务用 GLM-5.2（已有 key），开发用 GLM-5.3（build 默认模型）
- 服务器已购买：106.55.42.77, ubuntu, Python 3.10.12, 3.6GB RAM
- 对话式 agent 入口：详情页「试用」+ 首页「AI 生成」入口（两个都有）
- 会员免费额度：月度 10 次 + 年度 120 次
- 上线顺序：先 M2 后端 → 再 M3 会员 → 再 agent 对话
