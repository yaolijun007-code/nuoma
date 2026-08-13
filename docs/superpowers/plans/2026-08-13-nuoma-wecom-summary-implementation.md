# 诺玛元一企业微信概要通知 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 客户完成诺玛元一问卷后，将脱敏功能状态概要可靠推送到指定企业微信群。

**Architecture:** 扩展现有 `submitSurvey` 企业微信适配，按 `questionnaireVersion` 选择品牌、环境变量、消息构建器和审计动作。消息构建使用纯函数，网络发送继续复用受限官方域名、5 秒超时和通用错误封装。

**Tech Stack:** TypeScript、Vitest、CloudBase Node SDK、企业微信群机器人 Markdown Webhook。

## Global Constraints

- Webhook 只存在于 CloudBase 环境变量 `NUOMA_YUANYI_WECOM_WEBHOOK_URL`。
- 诺玛元一消息不得包含姓名、手机号、逐题答案、红旗具体内容或开放文本。
- 通知失败不回滚入库，不改变客户端提交成功响应。
- 幂等重复提交不得重复通知。

---

### Task 1: 品牌化概要构建器

**Files:**
- Modify: `functions/submitSurvey/src/wecom.test.ts`
- Modify: `functions/submitSurvey/src/wecom.ts`

**Interfaces:**
- Consumes: `PersistedSubmission`、`maleHealthV1` 中 `twelveWeekGoals` 的选项定义。
- Produces: `buildNuomaYuanyiWeComMarkdown(record): string`。

- [ ] 在 `wecom.test.ts` 添加失败测试，断言标题、记录编号、红旗状态、评估/信号维度和目标标签存在，并断言姓名、手机号、具体红旗、开放文本和原始题目 ID 不存在。
- [ ] 运行 `npm test -- --run functions/submitSurvey/src/wecom.test.ts`，确认因构建器不存在或内容不完整而失败。
- [ ] 在 `wecom.ts` 实现标签映射、空状态文案、长度限制和安全 Markdown 输出。
- [ ] 重跑定向测试并确认通过。

### Task 2: 提交通知路由与审计

**Files:**
- Create: `functions/submitSurvey/src/notification.ts`
- Create: `functions/submitSurvey/src/notification.test.ts`
- Modify: `functions/submitSurvey/src/index.ts`
- Modify: `scripts/build-functions.mjs` generated output: `functions/submitSurvey/index.js`

**Interfaces:**
- Produces: `resolveNotification(record, env)`，返回 `{ webhookUrl, markdown, auditAction, failureLog }` 或 `null`。
- `persistence.save` 在数据入库后调用解析器和 `sendWeComNotification`。

- [ ] 先写失败测试覆盖医院版、诺玛元一版、未配置和未知版本。
- [ ] 运行定向测试观察正确失败。
- [ ] 实现纯路由器，并把 `index.ts` 中医院专用条件替换为品牌化处理；不再以手机号是否存在决定诺玛元一通知。
- [ ] 运行定向测试和函数构建，确认生成包不包含真实 Webhook。

### Task 3: 云端配置、部署和闭环验证

**Files:**
- Modify: `.env.example`
- Modify: `docs/cloudbase-deployment.md`
- Modify: `README.md`

- [ ] 文档声明两个独立 Webhook 环境变量、脱敏消息字段、审计动作和密钥轮换要求。
- [ ] 使用 CloudBase CLI 更新 `submitSurvey` 的 `NUOMA_YUANYI_WECOM_WEBHOOK_URL`，只核验变量名，不打印值。
- [ ] 部署 `submitSurvey`。
- [ ] 用明确虚构数据完成一次诺玛元一提交，确认群消息与 `nuoma_yuanyi_wecom_notification: sent`。
- [ ] 按精确 `sessionId` 删除五类测试记录及相关审计记录。

### Task 4: 完整验证与发布

**Files:** All changed files.

- [ ] 运行 `npm test -- --run`，预期所有测试通过。
- [ ] 运行 `npm run typecheck`，预期退出码 0。
- [ ] 运行 `npm run build:all`，预期两个前端和两个云函数构建成功。
- [ ] 运行 `npm audit --omit=dev`，预期 0 个生产依赖漏洞。
- [ ] 确认 Git 差异无密钥后提交并推送 `main`。
- [ ] 等待 GitHub Actions 完成并确认远端提交哈希一致。

