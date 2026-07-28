# AI智作PPT模版社 · 迭代规范

> 测试护栏 + 代码修改规则

## 测试护栏

### 1. e2e 回归（每次改代码后必须跑）
```bash
# 清端口 + 重开 devtools + 跑 e2e
./clean-ports.sh && \
/Applications/wechatwebdevtools.app/Contents/MacOS/cli open --project . --token 1234abcdef && \
sleep 8 && \
/Applications/wechatwebdevtools.app/Contents/MacOS/cli auto --project . --auto-port 7777 --token 1234abcdef && \
sleep 5 && \
node tests/e2e-suite.js
```

### 2. 验收标准
- e2e 32/32 PASS 100%（不能低于 100%）
- console 0 error
- typecheck EXIT=0

### 3. 测试用例覆盖
- US1 首页渲染（6用例）
- US2 场景筛选（3用例）
- US3 详情页（7用例）
- US4 返回首页（1用例）
- US5 我的页（3用例）
- US6 登录页（3用例）
- US7 首页登录入口（2用例）
- US8 skill卡片内容（3用例）
- US9 console无报错（1用例）
- US10 免费skill（2用例）
- US11 skill描述（1用例）

## 代码修改规则

### 只改需求相关的代码
- 不要动需求以外的文件
- 不要改 e2e 测试用例（除非需求明确要改测试）
- 不要改 app.wxss 的全局变量（除非需求要改配色）
- 不要改 project.config.json（除非需求要改配置）

### 修改前检查
1. 确认改动范围（哪些文件需要改）
2. 确认不改哪些文件（测试用例/其他页面）
3. 改完跑 e2e 确认不破坏其他功能

### 修改后回归
1. 跑 `./clean-ports.sh`
2. 重开 devtools + automation
3. 跑 `node tests/e2e-suite.js`
4. 确认 32/32 PASS 100%

## 端口回归纪律
- 每次 `cli auto --auto-port` 后，端口可能不释放
- 下次操作前必须跑 `./clean-ports.sh` 清端口
- 否则 `EADDRINUSE` 报错

## Git 提交规范
- feat: 新功能
- fix: 修复 bug
- refactor: 重构
- test: 测试相关
- docs: 文档
- 提交前确认 e2e 32/32 通过
