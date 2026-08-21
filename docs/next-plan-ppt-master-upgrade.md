# 下一步计划 · 基于 ppt-master 升级预览和局部编辑功能

> v1.1.4 上线后执行，当前版本只做市场（浏览+购买+复制技能包），不做生成。
> 升级方向：让用户在小程序内完成「预览效果 → 局部精修 → 导出」全链路。

## 现状 vs ppt-master 的差距

| 维度 | 当前 v1.1.4 | ppt-master |
|---|---|---|
| 生成 | ❌ 不生成，只卖技能包 | ✅ AI 生成原生 PPTX |
| 预览 | ❌ 无预览（只有渐变卡） | ✅ 在线翻页预览 SVG/HTML |
| 编辑 | ❌ 不可编辑 | ✅ 可编辑 PPTX + 对话式精修 |
| 导出 | ❌ 不导出 | ✅ 导出 .pptx 文件 |
| 交付物 | 复制技能包文本（用户自己去装） | 一站式生成→预览→编辑→导出 |

## 升级路线（3 个里程碑）

### M1 · 在线预览（小程序内翻页预览）
**目标**：用户购买 skill 后，在小程序内看到「这个 skill 能做出什么样的 PPT」的翻页预览

**方案**：
1. 引入 ppt-master 的 `examples/` 示例作品（已有 6 套精美 deck）
2. 每个付费 skill 关联一套预览 deck（SVG → 小程序 `<image>` 渲染）
3. 详情页新增「效果预览」区：左右滑动翻页，点击全屏查看
4. 预览 deck 存 CloudBase storage（已有环境 `aippt-skill-d6g5hsem096551cc3`）

**技术要点**：
- ppt-master 的 SVG 输出 → 转 PNG/JPG → 上传 CloudBase
- 小程序不支持 SVG 渲染，需预转换
- 预览图按 16:9 比例，每页一张

**预计工时**：2-3 天

### M2 · 对话式生成（云函数 + ppt-master 后端）
**目标**：用户在小程序内说「做一份工作汇报」，AI 生成 PPT，用户翻页预览

**方案**：
1. 云函数 `generate-ppt` 接收 `{ skillId, userMessage, attachments }`
2. 云函数调用 AI 模型（GLM-5.2 / Claude）生成 SVG 幻灯片
3. SVG → PNG 转换 → 存 CloudBase → 返回预览 URL
4. 小程序新增「生成」页：输入框 + 附件上传 + 生成进度 + 翻页预览
5. 复用 ppt-master 的 `skills/ppt-master/` 工作流（SKILL.md）

**技术要点**：
- ppt-master 的 Python 管线不能直接跑在云函数（无 Python 环境）
- 方案 A：云函数只做 AI 对话 + SVG 生成，SVG→PNG 用 Node.js（svg2img / sharp）
- 方案 B：用 ppt-master 的 Claude Code 插件能力（`/plugin install ppt-master`），在用户的 AI 工具里生成
- 方案 C：轻量自研 SVG 模板生成（不走 ppt-master 全管线，只借设计模板）

**预计工时**：5-7 天

### M3 · 局部精修 + 导出
**目标**：用户对生成结果不满意时，继续对话精修，最终导出 .pptx

**方案**：
1. 预览页新增「编辑」按钮 → 进入对话式精修模式
2. 用户说「第 3 页换成柱状图」→ 云函数重新生成该页 SVG → 更新预览
3. 精修完成后点「导出」→ 云函数合成 .pptx → 返回下载链接
4. .pptx 合成用 ppt-master 的 SVG→PPTX 转换器（Python 脚本，需独立后端服务）

**技术要点**：
- .pptx 导出需要 ppt-master 的 Python 后端 → 需部署到云服务器（CloudBase Cloud Run 或独立 VM）
- 或用 Node.js 的 pptxgenjs 库（功能有限但无 Python 依赖）
- 导出的 .pptx 通过 CloudBase storage 分发给用户下载

**预计工时**：5-7 天

## 建议执行顺序

```
v1.1.4 提审上线
  ↓
M1 在线预览（2-3天）→ v1.2.0
  ↓ 用户能看到效果，转化率提升
M2 对话式生成（5-7天）→ v1.3.0
  ↓ 用户在小程序内生成 PPT
M3 局部精修+导出（5-7天）→ v1.4.0
  ↓ 全链路闭环
```

## 关键决策点（执行前需凯哥拍板）

1. **ppt-master 集成方式**：完整移植 Python 管线（需后端服务） vs 轻量自研 SVG 模板（无 Python）？
2. **AI 模型选择**：GLM-5.2（已有 key）vs Claude（质量更好但贵）vs Kimi K3（ppt-master 推荐）？
3. **云函数 vs 独立后端**：CloudBase 云函数（有 60s 超时限制）vs Cloud Run（无超时但需运维）？
4. **PPTX 导出**：pptxgenjs（Node.js，功能有限）vs ppt-master 的 python-pptx（完整但需 Python 后端）？
