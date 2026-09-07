# 市场账号自助改密 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让已登录的市场人员使用旧密码安全修改自己的 CloudBase 登录密码，并在手机端清晰完成操作。

**Architecture:** 在现有 `MarketApi` 中封装 CloudBase Auth v3 的 `resetPasswordForOld`，不经过业务云函数也不记录密码。React 工作台增加独立的“修改密码”视图和受控表单，前端执行明确的密码规则校验并映射 CloudBase 错误。

**Tech Stack:** React 18、TypeScript、`@cloudbase/js-sdk` 3.9.x、Vitest、Testing Library、Vite、CloudBase 静态托管。

## Global Constraints

- 仅修改当前登录账号本人的密码，不增加账号管理、短信找回或邮箱找回。
- 新密码至少 8 位，且包含大写字母、小写字母、数字和特殊字符，并且不能与旧密码相同。
- 密码不得进入业务云函数、数据库、日志、URL、前端持久化或 Git。
- 390px 手机宽度下表单无横向溢出，输入框与按钮触控目标不小于 44px。
- 所有输入有可见标签，错误与成功状态可被读屏软件感知。

---

### Task 1: CloudBase 自助改密接口

**Files:**
- Modify: `src/market/api.ts`
- Test: `src/market/api.test.ts`

**Interfaces:**
- Consumes: `Auth.resetPasswordForOld({ old_password, new_password })`
- Produces: `MarketApi.changePassword(oldPassword: string, newPassword: string): Promise<void>`

- [ ] **Step 1: Write the failing API tests**

```ts
it("changes the current user's password with the old password", async () => {
  const resetPasswordForOld = vi.fn().mockResolvedValue({ data: { session: {} }, error: null });
  const api = createMarketApi({ auth: () => ({ signInWithPassword: vi.fn(), signOut: vi.fn(), getSession: vi.fn(), resetPasswordForOld }), callFunction: vi.fn() });
  await expect(api.changePassword("OldPass1!", "NewPass2@")).resolves.toBeUndefined();
  expect(resetPasswordForOld).toHaveBeenCalledWith({ old_password: "OldPass1!", new_password: "NewPass2@" });
});

it("maps an invalid old password to a safe Chinese error", async () => {
  const resetPasswordForOld = vi.fn().mockResolvedValue({ data: null, error: { code: "invalid_password", message: "provider detail" } });
  const api = createMarketApi({ auth: () => ({ signInWithPassword: vi.fn(), signOut: vi.fn(), getSession: vi.fn(), resetPasswordForOld }), callFunction: vi.fn() });
  await expect(api.changePassword("WrongPass1!", "NewPass2@")).rejects.toMatchObject({ code: "INVALID_OLD_PASSWORD", message: "旧密码不正确，请重新输入" });
});

it("maps weak-password and network failures without leaking provider details", async () => {
  const weak = vi.fn().mockResolvedValue({ data: null, error: { code: "password_too_weak", message: "provider detail" } });
  const network = vi.fn().mockRejectedValue(new Error("request carried a secret"));
  const makeApi = (resetPasswordForOld: typeof weak) => createMarketApi({ auth: () => ({ signInWithPassword: vi.fn(), signOut: vi.fn(), getSession: vi.fn(), resetPasswordForOld }), callFunction: vi.fn() });
  await expect(makeApi(weak).changePassword("OldPass1!", "weak")).rejects.toMatchObject({ code: "WEAK_PASSWORD", message: "新密码至少 8 位，并包含大小写字母、数字和特殊字符" });
  await expect(makeApi(network).changePassword("OldPass1!", "NewPass2@")).rejects.toMatchObject({ code: "PASSWORD_CHANGE_FAILED", message: "密码修改失败，请稍后重试" });
});
```

- [ ] **Step 2: Run the API tests and verify RED**

Run: `npm test -- --run src/market/api.test.ts`

Expected: FAIL because `changePassword` and `resetPasswordForOld` are not declared.

- [ ] **Step 3: Implement the minimal API wrapper**

Add `resetPasswordForOld` to `AuthLike`, add `changePassword` to `MarketApi`, and implement it with exact parameter names:

```ts
const result = await auth.resetPasswordForOld({
  old_password: oldPassword,
  new_password: newPassword,
});
```

Map `invalid_password` to `旧密码不正确，请重新输入`, weak-password errors to the stated password rule, and all other failures to `密码修改失败，请稍后重试`.

- [ ] **Step 4: Run the API tests and verify GREEN**

Run: `npm test -- --run src/market/api.test.ts`

Expected: all API tests PASS.

### Task 2: 可访问的手机端改密页

**Files:**
- Modify: `src/market/MarketPreadmissionApp.tsx`
- Modify: `src/market/market-preadmission.css`
- Test: `src/market/MarketPreadmissionApp.test.tsx`

**Interfaces:**
- Consumes: `MarketApi.changePassword(oldPassword, newPassword)`
- Produces: 顶部“修改密码”入口与 `ChangePasswordView` 普通页面区块

- [ ] **Step 1: Write the failing UI tests**

Add `changePassword: vi.fn().mockResolvedValue(undefined)` to `fakeApi`, then add these tests:

```tsx
it("lets the signed-in user change their own password", async () => {
  const user = userEvent.setup();
  const api = fakeApi();
  render(<MarketPreadmissionApp api={api} />);
  await user.click(await screen.findByRole("button", { name: "修改密码" }));
  await user.type(screen.getByLabelText("旧密码"), "OldPass1!");
  await user.type(screen.getByLabelText("新密码"), "NewPass2@");
  await user.type(screen.getByLabelText("确认新密码"), "NewPass2@");
  await user.click(screen.getByRole("button", { name: "确认修改密码" }));
  expect(api.changePassword).toHaveBeenCalledWith("OldPass1!", "NewPass2@");
  expect(await screen.findByRole("status")).toHaveTextContent("密码修改成功");
  expect(screen.getByLabelText("旧密码")).toHaveValue("");
});

it("rejects mismatched or weak new passwords before calling CloudBase", async () => {
  const user = userEvent.setup();
  const api = fakeApi();
  render(<MarketPreadmissionApp api={api} />);
  await user.click(await screen.findByRole("button", { name: "修改密码" }));
  await user.type(screen.getByLabelText("旧密码"), "OldPass1!");
  await user.type(screen.getByLabelText("新密码"), "weak");
  await user.type(screen.getByLabelText("确认新密码"), "different");
  await user.click(screen.getByRole("button", { name: "确认修改密码" }));
  expect(screen.getByRole("alert")).toHaveTextContent("两次输入的新密码不一致");
  expect(api.changePassword).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the UI tests and verify RED**

Run: `npm test -- --run src/market/MarketPreadmissionApp.test.tsx`

Expected: FAIL because the change-password control and form do not exist.

- [ ] **Step 3: Implement the minimal React view**

Extend `View` with `password`, add a topbar button with `aria-label="修改密码"`, and render a form containing `旧密码`, `新密码`, `确认新密码`. Use `aria-invalid`, `aria-describedby`, `role="alert"` for errors and `role="status"` for success. Do not retain any password after success, view change, or logout.

- [ ] **Step 4: Add responsive styling**

Use the existing `.market-section`, `.form-field`, button and alert tokens. Limit the form width on desktop, keep it full-width on small screens, preserve 44px minimum controls, and hide only the action button's visible label below 620px while retaining its accessible name.

- [ ] **Step 5: Run the UI tests and verify GREEN**

Run: `npm test -- --run src/market/MarketPreadmissionApp.test.tsx`

Expected: all UI tests PASS.

### Task 3: Documentation, regression verification and deployment

**Files:**
- Modify: `docs/market-preadmission-deployment.md`

**Interfaces:**
- Consumes: completed API and UI feature
- Produces: operator guidance and deployed CloudBase page

- [ ] **Step 1: Document user and administrator flows**

Document the old-password requirement, password strength rule, successful-change behavior and administrator reset path. Do not include any real account password.

- [ ] **Step 2: Run the complete verification suite**

Run: `npm test -- --run && npm run typecheck && npm run build:market-preadmission && npm audit --omit=dev --audit-level=high`

Expected: all tests pass, TypeScript and Vite builds exit 0, and high-risk production dependency vulnerabilities are 0.

- [ ] **Step 3: Deploy through the existing CloudBase workflow**

Deploy only the updated static hosting bundle; the password change calls CloudBase Auth directly, so the business cloud function does not require a code change.

- [ ] **Step 4: Verify production without exposing credentials**

Use one authorized test account to open the change-password page at 390px, verify no horizontal overflow and all interactive controls are at least 44px. Perform a reversible password-change test by changing to a temporary strong password and immediately changing back; never print either password and do not send a WeCom message.

- [ ] **Step 5: Commit and push**

```bash
git add src/market/api.ts src/market/api.test.ts src/market/MarketPreadmissionApp.tsx src/market/MarketPreadmissionApp.test.tsx src/market/market-preadmission.css docs/market-preadmission-deployment.md docs/superpowers/specs/2026-09-07-market-preadmission-cloudbase-design.md docs/superpowers/plans/2026-09-07-market-password-change.md
git commit -m "feat: let market users change passwords"
git push origin feature/market-preadmission-cloudbase
```

Expected: the existing pull request receives the new commit and the worktree is clean.
