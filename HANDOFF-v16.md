# Handoff · M2+M3 v1.6.0

> 凯哥回来后直接复制下面的提示词开 goal，不用再读其他文件。

## 提示词（复制到 TUI 开 goal）

```
按照 openspec/changes/v16-ai-ppt-member/goals/MASTER-v16-m2-m3.md 开启 goal 模式，无人值守，最大化自动化，中途不需要停下来问我。token 没有上限，次数没有上限，一切以完成所有的任务为第一原则，最后的测试必须诚实、完整的跑完 e2e 才算完成验收。如果一定需要我做什么，最后汇总出来我一并处理。
```

## 当前进度

### 已完成

| # | 任务 | 状态 |
|---|---|---|
| 1.1 | 配置 GLM-5.3 到 opencode.json | ✅ model + key 已配，API 验证 200 |
| 1.2 | 购买腾讯云轻量 2C4G 服务器 | ✅ IP=106.55.42.77, SSH 已验证通 |
| — | build 模型切到 glm-5.3 | ✅ opencode.json agent.build.model = tencent-maas/glm-5.3 |
| — | goal md 更新 | ✅ 去掉了 token/次数上限，加了「最大化自动化+诚实 e2e」 |
| — | v1.5.2 已提交审核 | ✅ 旧版本已发布，v1.5.2 在审核队列 |

### 服务器信息

- IP: 106.55.42.77
- 用户名: ubuntu
- 密码: V)^RA97h2Ya!%$T
- SSH: `sshpass -p 'V)^RA97h2Ya!%$T' ssh -o StrictHostKeyChecking=no ubuntu@106.55.42.77`
- 系统: Ubuntu 22.04, Python 3.10.12, 3.6GB RAM, 50GB disk

### 下一步（Phase 1.3 开始）

1. SSH 上去装依赖（fastapi/uvicorn/python-pptx/pillow）
2. clone ppt-master
3. 配 GLM-5.2（线上服务用 5.2 不是 5.3）
4. FastAPI 网关 + systemd
5. python-pptx 导出验证
6. CloudBase storage 集成
7. 小程序云函数 generatePPT
8. 然后进 Phase 2（M3 会员）→ Phase 3（agent 对话）→ Phase 4（上线）

### 关键约束

- 线上服务用 **GLM-5.2**（不是 5.3）
- 开发用 **GLM-5.3**（build 默认）
- 包体积 < 2MB（M2/M3 新增代码走云函数不进包）
- e2e 必须诚实完整跑完（禁止 fake pass）
- 每步最多重试 3 次，3 次仍失败→停下汇总给凯哥

### 需要凯哥最终处理的（执行过程中遇到才填）

- [ ] mp 后台配 downloadFile 合法域名（如果预览图/封面图真机不显示）
- [ ] mp 后台虚拟支付商品管理：新增 member_monthly / member_annual 两个 productId（价格 200分/9900分）
- [ ] 真机验收 v1.6.0

### GLM API 信息

- GLM-5.2（线上服务用）: baseURL=https://tokenhub.tencentmaas.com/v1, key=sk-vElRjCV1KYVs5CqMJ236BR1at63pQWVu3rrX4tSZn9kJH3D0（旧的 tencent-maas key）
  - ⚠️ 注意：这个旧 key 可能已被新 key 覆盖。检查 opencode.json 确认当前 apiKey
- GLM-5.3（开发用）: 已配到 opencode.json tencent-maas provider

### 文件位置

- Goal md: `docs/aippt-skill-market/openspec/changes/v16-ai-ppt-member/goals/MASTER-v16-m2-m3.md`
- M2 后端设计: `docs/aippt-skill-market/docs/m2-backend-design.md`
- 工作目录: `docs/aippt-skill-market/`
- 测试: `bash run-all-tests.sh`
- 上传: `node scripts/ci-upload.js --ver 1.6.0 --desc "M2+M3"`
