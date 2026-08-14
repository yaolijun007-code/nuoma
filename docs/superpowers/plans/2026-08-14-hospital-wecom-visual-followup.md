# Hospital WeCom Visual Follow-up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the hospital WeCom notification to the approved visual follow-up format with icons, four-level triage, mapped communication priorities, an eight-domain status summary, Shanghai submission time, and confirmation ID.

**Architecture:** Keep the existing hospital-only notification route and Markdown transport. Add pure projection helpers inside `wecom.ts` for allow-listed labels, follow-up classification, domain counts, and date formatting; verify the complete Markdown contract before deploying the regenerated CloudBase function bundle.

**Tech Stack:** TypeScript, Vitest, CloudBase Node SDK, enterprise WeChat robot Markdown, native `Intl.DateTimeFormat`.

## Global Constraints

- Only `male-health-v1.0` uses the visual follow-up format; the Nuoma notification is unchanged.
- Send one Markdown message; do not send an image or template card.
- Do not expose raw answers, red-flag details, assessment reasons, recommendations, diagnoses, scores, or body age.
- The full phone remains limited to the authorized hospital group.
- Unknown answer values are never reflected verbatim.
- Notification failure never changes a successful questionnaire submission.
- The Webhook remains only in `HOSPITAL_WECHAT_WEBHOOK_URL`.

---

### Task 1: Visual follow-up Markdown projection

**Files:**
- Modify: `functions/submitSurvey/src/wecom.test.ts`
- Modify: `functions/submitSurvey/src/wecom.ts`

**Interfaces:**
- Consumes: `PersistedSubmission`, hospital question definitions, and eight-domain assessment levels.
- Produces: `buildWeComMarkdown(record: PersistedSubmission): string` with the approved visual message.

- [ ] **Step 1: Write failing exact-format tests**

Build a non-red-flag record with two `evaluate`, one `signal`, and five `stable` domains. Assert the complete string contains:

```text
### 🏥 建始民族医院｜新健康问卷

🚦 **跟进等级**：<font color="warning">建议重点跟进</font>

👤 **姓名**：虚构 用户
📱 **手机号**：13800138000
🎯 **主要问题**：① 精力不足　② 睡眠　③ 压力与情绪
🔎 **最明显变化**：睡眠变差
⭐ **首要改善目标**：睡眠

📊 **状态概览**：<font color="warning">评估 2</font>｜<font color="comment">变化 1</font>｜<font color="info">稳定 5</font>

🕒 **提交时间**：08月13日 11:00
🧾 **记录编号**：JS-TEST-0001
```

Add focused assertions for red flag → `需医务人员优先核实` plus `安全信息待人工核实`, one signal → `存在变化信号`, and all stable → `常规健康管理`.

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- functions/submitSurvey/src/wecom.test.ts`

Expected: FAIL because the existing projection only contains four fields.

- [ ] **Step 3: Implement allow-listed mapping and visual helpers**

Use `findHospitalQuestion("mainChange")` to construct a label map and the existing concern map for `singleImprovement`. Add helpers equivalent to:

```ts
function answerLabel(map: Map<string, string>, value: unknown) {
  return map.get(String(value ?? "")) ?? "未填写";
}

function followUpStatus(record: PersistedSubmission) {
  if (record.session.hasRedFlag) return '<font color="warning">需医务人员优先核实</font>';
  const evaluate = record.assessment.domains.filter(({ level }) => level === "evaluate").length;
  const signal = record.assessment.domains.filter(({ level }) => level === "signal").length;
  if (evaluate >= 2) return '<font color="warning">建议重点跟进</font>';
  if (evaluate + signal > 0) return '<font color="comment">存在变化信号</font>';
  return '<font color="info">常规健康管理</font>';
}
```

Render the three primary concerns with `①`、`②`、`③`. Format `submittedAt` in `Asia/Shanghai`; return `时间待核实` for an invalid date. For red flags, replace domain counts with `<font color="warning">安全信息待人工核实</font>`.

- [ ] **Step 4: Run focused and full tests**

Run: `npm test -- functions/submitSurvey/src/wecom.test.ts functions/submitSurvey/src/notification.test.ts && npm test -- --run`

Expected: all focused tests and the full repository test suite pass.

- [ ] **Step 5: Commit behavior**

```bash
git add functions/submitSurvey/src/wecom.ts functions/submitSurvey/src/wecom.test.ts
git commit -m "feat: enrich hospital WeCom follow-up card"
```

### Task 2: Build, deploy, and verify

**Files:**
- Regenerate: `functions/submitSurvey/index.js`
- Modify: `docs/cloudbase-deployment.md`

**Interfaces:**
- Consumes: the tested Markdown builder, the existing `submitSurvey` function, and configured `HOSPITAL_WECHAT_WEBHOOK_URL`.
- Produces: an active CloudBase function sending the visual follow-up message.

- [ ] **Step 1: Regenerate the function bundle and update documentation**

Run: `npm run build:functions`.

Document the four-level follow-up status, icon-based message, domain category counts, Shanghai time, and the rule that red-flag details stay out of the group.

- [ ] **Step 2: Run the full completion gate**

Run: `npm test -- --run && npm run typecheck && npm run build:all && npm audit --omit=dev && git diff --check`.

Expected: all tests pass; typecheck and builds exit 0; production audit finds zero vulnerabilities.

- [ ] **Step 3: Deploy the server function without modifying secrets**

Run:

```bash
npx -y -p @cloudbase/cli tcb fn deploy submitSurvey -e yuecheng-survey-d4fucklsf6b68aaf --force --json
```

Verify the function is `Active` and only display environment variable names.

- [ ] **Step 4: End-to-end fictional submission**

Submit one complete `male-health-v1.0` test record named `企业微信可视化系统测试（虚构）` with known primary concerns, change, goal, and assessment signals. Confirm HTTP status 200, version `male-health-v1.0`, and audit action `hospital_wecom_notification` with status `sent`.

- [ ] **Step 5: Remove all fictional records**

Delete profiles, answers, assessment, all audit rows, and the session by exact `sessionId`; query all five collections and the unique client ID again to confirm zero remaining rows.

- [ ] **Step 6: Commit and publish**

```bash
git add functions/submitSurvey/index.js docs/cloudbase-deployment.md
git commit -m "build: deploy visual hospital WeCom follow-up"
git push origin main
```

Wait for GitHub Actions and confirm local `main`, remote `main`, and CI head SHA match.
