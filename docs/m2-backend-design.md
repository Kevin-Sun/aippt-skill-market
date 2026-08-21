# M2 后端选型与部署方案

> v1.1.4 审核中，v1.3.0（M1 在线预览）完成后启动 M2。
> 决策已锁定：完整移植 ppt-master Python 管线 / GLM-5.2 / 独立后端 / python-pptx

## 架构

```
小程序前端 (wx.cloud.callFunction)
    ↓
CloudBase 云函数 (gateway + 鉴权 + 短任务)
    ↓ HTTP
独立后端 (Python + FastAPI + ppt-master)
    ↓
GLM-5.2 API (生成 SVG) + python-pptx (合成 PPTX)
    ↓
CloudBase storage (存中间产物 + 最终 PPTX)
```

## 独立后端选型

| 项 | 选择 | 理由 |
|---|---|---|
| 计算平台 | 轻量云服务器（2C4G 起步） | ppt-master 需要 Python + Pillow + python-pptx，云函数 60s 超时不够 |
| 操作系统 | Ubuntu 22.04 LTS | ppt-master 官方测试环境 |
| Python 版本 | 3.10+ | ppt-master 要求 |
| Web 框架 | FastAPI | 异步 + 自动文档 + WebSocket（流式生成进度） |
| 进程管理 | systemd + uvicorn | 标准部署 |
| 反向代理 | Nginx | TLS 终端 + 限流 |

## 部署步骤

1. 购买轻量云服务器（腾讯云/阿里云 2C4G）
2. 安装 Python 3.10 + pip
3. `git clone https://github.com/hugohe3/ppt-master.git`
4. `pip install -r requirements.txt`
5. 部署 FastAPI 网关（接收小程序云函数的 HTTP 请求）
6. 配置 GLM-5.2 API Key（`~/.ppt-master/.env`）
7. 配置 CloudBase SDK（存取 storage）
8. Nginx + HTTPS + 限流

## API 契约

### POST /api/generate
```json
{
  "skillId": "skill_001",
  "userMessage": "做一份工作汇报",
  "attachments": ["cloud://xxx/doc.pdf"],
  "openid": "oxxx",
  "style": "商务简约",
  "pages": 8
}
```

Response (streaming SSE):
```json
{"event":"progress","message":"分析内容中..."}
{"event":"progress","message":"生成第 1 页..."}
{"event":"slide","index":0,"svgUrl":"https://xxx/slide_01.svg"}
{"event":"done","pptxUrl":"https://xxx/output.pptx","totalPages":8}
```

### POST /api/refine
```json
{
  "sessionId": "xxx",
  "instruction": "第 3 页换成柱状图"
}
```

Response: 同上 SSE 流

### GET /api/health
返回 `{"status":"ok"}` 用于健康检查

## GLM-5.2 接入

- Provider: tencent-maas
- Model: glm-5.2
- API Key: 已有（在 `~/.config/opencode/opencode.json`）
- 用途：替代 ppt-master 默认的 Claude/Kimi，驱动 SVG 生成 + 内容推理
- 注意：GLM-5.2 的上下文窗口和视觉能力可能不如 Claude，M2 阶段需做质量对比

## python-pptx 导出链路

1. AI 生成 SVG 幻灯片（每页一个 .svg）
2. `compose_pptx.py` 读取 SVG → 转 DrawingML → 写入 .pptx
3. .pptx 上传 CloudBase storage
4. 返回下载 URL 给小程序

## 成本估算

| 项 | 月成本 |
|---|---|
| 轻量云服务器 2C4G | ¥50-80 |
| GLM-5.2 API（100 次生成/月） | ¥30-50（按 token 计费） |
| CloudBase storage（1GB） | ¥1 |
| 域名 + HTTPS | ¥10 |
| 合计 | ¥91-141/月 |

## 风险

1. GLM-5.2 生成质量不如 Claude → M2 阶段做 A/B 测试，必要时加 Claude 备选
2. python-pptx SVG → DrawingML 转换有功能边界 → 参照 ppt-master 的 PowerCompat 映射表
3. 独立后端运维成本 → 监控告警 + 自动重启 + 日志轮转
