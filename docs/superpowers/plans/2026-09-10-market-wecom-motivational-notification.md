# Market WeCom Motivational Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the single WeCom preadmission notification with motivational visual hierarchy and a notes field, while fixing verified registration usability gaps and validating the mobile workflow without sending a real group message.

**Architecture:** Keep the current save-before-send workflow and single WeCom `markdown` payload. Extend the shared message model and formatter, map persisted notes through the CloudBase service (including retries), and reuse the shared draft validator in the React client so invalid submissions fail visibly before the API call. Keep full patient identity in the message and enforce the 4096-byte WeCom limit by truncating only the message copies of `mainProblem` and `notes` on UTF-8 code-point boundaries.

**Tech Stack:** TypeScript 5.7, React 19, Vitest, Testing Library, Vite, CloudBase Node SDK, Enterprise WeChat group robot markdown API.

## Global Constraints

- Preserve the existing one-message notification architecture; do not add template cards, images, rankings, daily totals, or a second notification.
- Never print, commit, or call the real WeCom webhook during tests or verification.
- Keep the persisted `mainProblem` and `notes` values complete; the byte budget applies only to the outgoing markdown.
- Always retain full patient name and contact phone in the outgoing message.
- Preserve save-before-send, idempotency, retry ownership, audit logging, and notification status semantics.
- Treat “registration saved but notification failed” as a successful registration with a clearly visible retry path.
- Maintain 390px mobile support, at least 44px touch targets, keyboard operation, and accessible error announcements.

---

## Task 1: Build the motivational, byte-safe WeCom markdown

**Files:**
- Modify: `src/domain/market-preadmission.ts`
- Modify: `src/domain/market-preadmission.test.ts`

- [x] Add failing domain tests for the three contact-result presentation groups, populated and empty notes, sanitization, full patient identity, and the 4096-byte UTF-8 ceiling.

```ts
expect(markdown).toContain("<font color=\"info\">有效意向线索｜建议优先确认</font>");
expect(markdown).toContain("**备注**：上午联系方便");
expect(new TextEncoder().encode(markdown).byteLength).toBeLessThanOrEqual(4096);
expect(markdown).toContain(message.patientName);
expect(markdown).toContain(message.contactPhone);
```

- [x] Run the focused test and confirm it fails because `notes`, the colored status line, and the byte cap are not implemented.

Run: `npx vitest run src/domain/market-preadmission.test.ts`

Expected: FAIL in the newly added message-format tests.

- [x] Add `notes: string` to `PreadmissionMessageModel` and implement contact-result presentation metadata.

```ts
const contactMessagePresentation: Record<ContactResult, {
  color: "info" | "warning" | "comment";
  label: string;
}> = {
  patient_interested: { color: "info", label: "有效意向线索｜建议优先确认" },
  family_interested: { color: "info", label: "有效意向线索｜建议优先确认" },
  considering: { color: "warning", label: "待持续跟进｜请安排下一次联系" },
  no_answer: { color: "warning", label: "待持续跟进｜请安排下一次联系" },
  declined: { color: "comment", label: "已完成触达记录｜感谢完成真实记录" },
  other: { color: "comment", label: "已完成触达记录｜感谢完成真实记录" },
};
```

- [x] Implement UTF-8 byte measurement and code-point-safe ellipsis truncation, then render the approved five-part markdown structure. Use `未填写` when notes are empty and truncate only `mainProblem` and `notes` if the full message exceeds 4096 bytes.

- [x] Re-run the focused domain test and confirm it passes.

Run: `npx vitest run src/domain/market-preadmission.test.ts`

Expected: PASS.

- [x] Commit the domain change.

```bash
git add src/domain/market-preadmission.ts src/domain/market-preadmission.test.ts
git commit -m "feat: enhance market WeCom notifications"
```

## Task 2: Carry notes through initial delivery and retry

**Files:**
- Modify: `functions/marketPreadmission/src/service.ts`
- Modify: `functions/marketPreadmission/src/service.test.ts`

- [x] Add failing service tests proving initial delivery receives the saved note and a retry rebuilds the same note from the persisted record.

```ts
expect(notifier.send).toHaveBeenCalledWith(
  expect.objectContaining({ notes: "上午联系方便" }),
  expect.stringContaining("**备注**：上午联系方便"),
);
```

- [x] Run the service test and confirm it fails because `messageModel` omits notes.

Run: `npx vitest run functions/marketPreadmission/src/service.test.ts`

Expected: FAIL in the new note-mapping assertions.

- [x] Map `record.notes` into `PreadmissionMessageModel` so both initial send and retry use the persisted value.

```ts
mainProblem: record.mainProblem,
contactResult: record.contactResult,
notes: record.notes,
createdByName: record.createdByName,
```

- [x] Re-run the service and WeCom adapter tests.

Run: `npx vitest run functions/marketPreadmission/src/service.test.ts functions/marketPreadmission/src/wecom.test.ts`

Expected: PASS and exactly one markdown payload per send.

- [x] Commit the service change.

```bash
git add functions/marketPreadmission/src/service.ts functions/marketPreadmission/src/service.test.ts
git commit -m "feat: include notes in market notification delivery"
```

## Task 3: Prevent opaque registration failures in the market UI

**Files:**
- Modify: `src/market/MarketPreadmissionApp.tsx`
- Modify: `src/market/MarketPreadmissionApp.test.tsx`
- Modify if verified necessary: `src/market/market-preadmission.css`

- [x] Add failing UI tests for notes submission, invalid historic-patient contact information being blocked before the API call, and a failed retry from “我的登记” remaining visible while the record list stays on screen.

```ts
expect(api.createPreadmission).not.toHaveBeenCalled();
expect(screen.getByRole("alert")).toHaveTextContent("联系方式格式不正确");
expect(screen.getByText("重新推送失败，请稍后再试")).toBeInTheDocument();
expect(screen.getByText("PY-20260907-0001")).toBeInTheDocument();
```

- [x] Run the focused UI test and confirm the new cases fail.

Run: `npx vitest run src/market/MarketPreadmissionApp.test.tsx`

Expected: FAIL because the shared draft validator is not used client-side and retry errors are hidden in the records view.

- [x] Build a typed `PreadmissionDraft` in `handleSubmit`, validate it with `validatePreadmissionDraft`, show the exact safe validation message, and avoid the API request when validation fails.

```ts
const draft: PreadmissionDraft = {
  clientSubmissionId: submissionId,
  patientId: history.patient.patientId,
  contactPhone: form.contactPhone,
  patientType: form.patientType as PatientType,
  plannedAdmissionDate: form.plannedAdmissionDate,
  intendedDepartment: form.intendedDepartment as IntendedDepartment,
  mainProblem: form.mainProblem,
  contactResult: form.contactResult as ContactResult,
  notes: form.notes,
  ...(newPatient ? { newPatient } : {}),
};
let validatedDraft: PreadmissionDraft;
try {
  validatedDraft = validatePreadmissionDraft(draft);
} catch (error) {
  setSubmissionError(error instanceof Error ? error.message : "请检查登记信息后重试");
  return;
}
```

- [x] Render submission errors inside `PreadmissionForm` immediately before its action area and pass retry action errors into `RecordsView` with `role="alert"`. Clear stale action errors when the user changes a form field or begins a new retry.

- [x] Add or adjust only the CSS required to keep the alert full-width, readable at 390px, and free of horizontal overflow; retain existing minimum control heights.

- [x] Re-run the focused UI test and confirm it passes.

Run: `npx vitest run src/market/MarketPreadmissionApp.test.tsx`

Expected: PASS.

- [x] Commit the UI reliability change.

```bash
git add src/market/MarketPreadmissionApp.tsx src/market/MarketPreadmissionApp.test.tsx src/market/market-preadmission.css
git commit -m "fix: surface market registration and retry errors"
```

## Task 4: Build, audit, deploy, and verify without real messages

**Files:**
- Modify generated artifact: `functions/marketPreadmission/index.js`
- Modify if verification identifies an in-scope defect: relevant market UI or function source and tests

- [ ] Run the complete automated verification suite.

```bash
npm test
npm run typecheck
npm run build:functions
npm run build:market-preadmission
```

Expected: all tests pass; TypeScript exits 0; the CloudBase function bundle and static market build complete.

- [ ] Scan tracked source and build output for accidental webhook keys, credentials, and unexpected URLs without printing matching secret values.

Run: `git grep -l -E 'qyapi\.weixin\.qq\.com/cgi-bin/webhook/send\?key=|MARKET_WEBHOOK_URL=' -- . ':!docs/superpowers/specs/*' ':!docs/superpowers/plans/*'`

Expected: no tracked source containing a live webhook URL or configured secret value.

- [ ] Start the production build locally and audit the market page at 390px width: login screen, search, historical-patient form, new-patient form, required-field feedback, notes at 0/500 characters, saved-versus-push-failed presentation, records retry error, keyboard focus, touch-target sizing, and horizontal overflow. Use synthetic records and mocked APIs only; do not submit to the real CloudBase function.

- [ ] Fix any verified low-risk, in-scope usability or registration defect with a regression test, then repeat the focused and full verification commands.

- [ ] Deploy the rebuilt `marketPreadmission` CloudBase function, then deploy `dist-market-preadmission` to the existing `market-preadmission` hosting path because the UI changed.

```bash
npx -y -p @cloudbase/cli tcb fn deploy marketPreadmission --install-dependency true -e yuecheng-survey-d4fucklsf6b68aaf
npx -y -p @cloudbase/cli tcb hosting deploy ./dist-market-preadmission market-preadmission -e yuecheng-survey-d4fucklsf6b68aaf --safe --verify
```

- [ ] Verify deployment state and the public page shell without logging patient data or invoking `createPreadmission`. Confirm the deployed function is healthy and the published assets match the current build.

- [ ] Commit generated and audit-driven changes, push the branch, and confirm the existing pull request reflects the new commits.

```bash
git add functions/marketPreadmission/index.js
git commit -m "build: refresh market preadmission function bundle"
git push origin feature/market-preadmission-cloudbase
git status --short
```

Expected: push succeeds and the worktree is clean.
