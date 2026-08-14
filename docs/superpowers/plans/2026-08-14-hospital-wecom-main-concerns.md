# Hospital WeCom Main Concerns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send each successfully stored 建始民族医院 submission to the configured enterprise WeChat robot with exactly the submitter's name, full mobile number, and three selected primary concerns.

**Architecture:** Keep the existing post-persistence notification flow and brand router. Replace only the hospital Markdown builder with a label-safe projection of `identity.name`, `identity.phone`, and `healthAnswers.topConcerns`; keep the Nuoma builder, webhook validation, timeout, audit records, and failure isolation unchanged.

**Tech Stack:** TypeScript, Vitest, CloudBase Node SDK, native `fetch`, enterprise WeChat group robot Markdown API.

## Global Constraints

- Only `male-health-v1.0` uses the hospital message; `nuoma-yuanyi-male-health-v1.0` remains unchanged.
- The webhook remains only in CloudBase environment variable `HOSPITAL_WECHAT_WEBHOOK_URL` and never enters source, frontend bundles, Git history, or logs.
- Hospital Markdown contains only title, name, full mobile number, and primary concerns.
- Primary concerns come from the hospital `topConcerns` option labels, are de-duplicated, and are limited to three.
- Notification failure never rolls back a stored questionnaire or changes the client response.
- Deployment validation uses fictional data and deletes all five records plus audit records by exact session identifier.

---

### Task 1: Replace the hospital message projection

**Files:**
- Modify: `functions/submitSurvey/src/notification.test.ts`
- Modify: `functions/submitSurvey/src/wecom.ts`

**Interfaces:**
- Consumes: `PersistedSubmission`, `hospitalSurvey`, and the existing `resolveWeComNotification(record, environment)` router.
- Produces: `buildWeComMarkdown(record: PersistedSubmission): string` with the approved hospital message.

- [ ] **Step 1: Write the failing message contract tests**

Add a hospital fixture with `phone: "13800138000"`, `topConcerns: ["0", "1", "4"]`, and an injected newline in the name. Assert the rendered Markdown equals:

```text
### 建始民族医院｜新问卷
> 姓名：虚构 用户
> 手机号：13800138000
> 主要问题：精力不足、睡眠、压力与情绪
```

Also assert unknown and duplicate values do not appear, and the output excludes `记录编号`、`提交时间`、`提交状态`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- functions/submitSurvey/src/notification.test.ts`

Expected: FAIL because the current builder masks the phone, omits `topConcerns`, and adds status/record/time fields.

- [ ] **Step 3: Implement the minimal hospital projection**

In `functions/submitSurvey/src/wecom.ts`, import `hospitalSurvey`, construct a `Map` from the `topConcerns` question options, and add:

```ts
function hospitalConcernLabels(record: PersistedSubmission) {
  const selected = record.healthAnswers.topConcerns;
  if (!Array.isArray(selected)) return "未填写";
  const labels = [...new Set(selected.map(String))]
    .slice(0, 3)
    .map((value) => hospitalConcernLabelMap.get(value))
    .filter((value): value is string => Boolean(value))
    .map(safeInline);
  return labels.length ? labels.join("、") : "未填写";
}
```

Build the message from only the title and three required fields. Show the complete phone only when it matches `/^1\d{10}$/`; otherwise show `未提供`.

- [ ] **Step 4: Run focused and full tests**

Run: `npm test -- functions/submitSurvey/src/notification.test.ts && npm test -- --run`

Expected: the focused contract and all repository tests pass.

- [ ] **Step 5: Commit the behavior**

```bash
git add functions/submitSurvey/src/notification.test.ts functions/submitSurvey/src/wecom.ts
git commit -m "feat: send hospital WeCom lead details"
```

### Task 2: Build, deploy, and validate the CloudBase function

**Files:**
- Regenerate: `functions/submitSurvey/index.js`
- Modify: `docs/cloudbase-deployment.md`

**Interfaces:**
- Consumes: `scripts/build-functions.mjs`, CloudBase environment `yuecheng-survey-d4fucklsf6b68aaf`, and environment variable `HOSPITAL_WECHAT_WEBHOOK_URL`.
- Produces: deployed `submitSurvey` function that stores the survey first and posts the approved hospital Markdown second.

- [ ] **Step 1: Regenerate the deployable function bundle**

Run: `npm run build:functions`

Expected: `functions/submitSurvey/index.js` contains the new title, `手机号`, and `主要问题`, and does not contain the webhook key.

- [ ] **Step 2: Update deployment documentation**

Document that the hospital group message contains the full phone number and three selected primary concerns, that the group must be restricted to authorized hospital staff, and that the webhook value remains an environment variable.

- [ ] **Step 3: Run the completion gate**

Run: `npm test -- --run && npm run typecheck && npm run build:all && npm audit --omit=dev && git diff --check`

Expected: zero test failures, typecheck/build exit 0, production audit reports zero vulnerabilities, and no whitespace errors.

- [ ] **Step 4: Configure and deploy without logging the secret**

Update only `HOSPITAL_WECHAT_WEBHOOK_URL` in the CloudBase `submitSurvey` function environment, preserving `ALLOWED_ORIGIN` and `NUOMA_YUANYI_WECOM_WEBHOOK_URL`. Deploy with:

```bash
npx -y -p @cloudbase/cli tcb fn deploy submitSurvey -e yuecheng-survey-d4fucklsf6b68aaf
```

Verify only environment variable names, never values.

- [ ] **Step 5: Perform an end-to-end fictional hospital submission**

Submit a complete `male-health-v1.0` payload with a unique client ID, fictional identity, full test mobile number, and known `topConcerns`. Confirm the HTTP response succeeds, the stored session uses the correct version, and `hospital_wecom_notification` has audit status `sent`.

- [ ] **Step 6: Delete the fictional health data**

Resolve the exact `sessionId`, delete the matching profile, answers, assessment, all matching audit logs, and the session, then query all five collections again to confirm no matching records remain.

- [ ] **Step 7: Commit and publish**

```bash
git add functions/submitSurvey/index.js docs/cloudbase-deployment.md
git commit -m "build: deploy hospital WeCom lead notification"
git push origin main
```

Wait for GitHub Actions, then confirm local and remote `main` hashes match.
