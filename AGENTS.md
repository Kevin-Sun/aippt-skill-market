# AI智作PPT模版社 · 迭代规范

> 测试护栏 + 代码修改规则 + git 纪律

## Git 纪律（最高优先级，2026-08-22 起强制）

### 1. 每个版本必须 git 提交
- 每完成一个功能/修复/版本上传（ci-upload），立即 `git add -A && git commit`
- 提交信息格式：`feat|fix|refactor: <版本号> <一句话>`，正文列改动清单 + 测试结果
- **禁止多个版本改动堆在工作区不提交**——2026-08-21 曾因此丢失 v1.6.0 chat 页（git 未追踪被物理删除无法恢复，只能凭记忆重建）

### 2. 提交后必须 push
- `git push origin main`——本地提交不 push 等于没提交（本机磁盘坏了就全丢）

### 3. 回滚/剥离版本必须走 git
- 禁止直接在工作区 `rm -rf` 文件来回滚版本——必须用 `git checkout <commit> -- <path>` 或建分支
- 临时剥离某功能（如 v1.5.3 删 v1.6.0 入口）时：先 `git commit` 当前态，再改，改完再 commit——保证每一步都可恢复

### 4. 新文件必须立即 git add
- 新建的页面/脚本/配置在写完当天必须 `git add`（哪怕还没跑测试）——untracked 文件被删 = 永久丢失

### 5. 大文件/中间产物不进 git
- `raw-materials/ppt-master-svg|png/`、`tests/screenshots/`、`.opencode/` 已在 .gitignore
- 云函数密钥类（cloudbaserc.json）永不入库

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
