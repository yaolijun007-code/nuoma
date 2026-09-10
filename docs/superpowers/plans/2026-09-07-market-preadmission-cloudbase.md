# 市场预住院 CloudBase 系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 CloudBase 工程中交付一套登录后可查患者住院史、登记预住院并向企业微信群推送完整姓名和联系电话的市场工作台。

**Architecture:** 新增独立的 React 入口和 `marketPreadmission` 事件云函数；浏览器只通过 CloudBase 登录态调用云函数，业务集合禁止客户端直连。共享领域模块负责输入校验、消息生成和稳定类型，云函数服务层负责授权、幂等持久化、通知失败隔离与审计。

**Tech Stack:** React 19、TypeScript 5.7、Vite 6、Vitest、CloudBase Web SDK、CloudBase Node SDK、企业微信群机器人 Markdown、Python 3 标准库 SQLite/JSONL。

## Global Constraints

- 企业微信群消息必须包含患者完整姓名和完整联系电话，但不得包含详细住院史、费用、住址或无关病历信息。
- 机器人地址只能通过云函数环境变量 `JSMZ_PREADMISSION_WECOM_WEBHOOK_URL` 注入，禁止进入源码、前端产物、测试快照和日志。
- 所有业务访问必须验证 CloudBase UID 和 `hospital_market_users` 中的启用角色，匿名访问拒绝。
- 预住院记录必须先保存后通知；通知失败不得回滚登记。
- `clientSubmissionId` 必须同时防止重复建档和成功通知重复发送。
- 同名、重复手机号、住院号冲突不得自动合并患者。
- 真实患者导出文件、账号密码和密钥不得提交 Git。
- UI 只保留“查患者 → 看历史 → 登记推送”主流程，控件触控高度不小于 44px，并提供键盘焦点、可见标签和读屏状态。

---

## File Structure

- `src/domain/market-preadmission.ts`：领域类型、输入规范化、表单校验、Markdown 消息与展示格式。
- `src/domain/market-preadmission.test.ts`：领域边界、完整身份字段、清洗和日期测试。
- `functions/marketPreadmission/src/service.ts`：授权、检索、详情、幂等创建、列表和重试的可测试服务层。
- `functions/marketPreadmission/src/service.test.ts`：内存仓库与通知器的服务行为测试。
- `functions/marketPreadmission/src/index.ts`：CloudBase 集合适配、上下文 UID、审计和 HTTP 兼容响应。
- `functions/marketPreadmission/package.json`：云函数运行依赖。
- `src/market/api.ts`：CloudBase 登录、会话与函数调用适配。
- `src/market/MarketPreadmissionApp.tsx`：登录、搜索、详情、登记、我的登记的单页状态流。
- `src/market/MarketPreadmissionApp.test.tsx`：用户关键路径与无障碍行为测试。
- `src/market/market-preadmission.css`：简洁医院工作台视觉与响应式布局。
- `scripts/export_market_patient_data.py`：只读 SQLite 最小字段导出与质量清单。
- `scripts/test_export_market_patient_data.py`：合成 SQLite 导出测试。
- `docs/market-preadmission-deployment.md`：集合、索引、规则、账号、环境变量、数据导入和合成群测试步骤。
- `vite.config.ts`、`src/main.tsx`、`src/vite-env.d.ts`、`package.json`、`cloudbaserc.json`、`scripts/build-functions.mjs`：新应用与函数接入现有构建。

### Task 1: 领域契约和企业微信群消息

**Files:**
- Create: `src/domain/market-preadmission.ts`
- Test: `src/domain/market-preadmission.test.ts`

**Interfaces:**
- Produces: `normalizePatientQuery(value)`, `validatePreadmissionDraft(input)`, `buildPreadmissionMarkdown(record)`, `PatientSummary`, `PatientHistory`, `PreadmissionDraft`, `PreadmissionRecord`。

- [ ] **Step 1: 写失败测试**

```ts
expect(normalizePatientQuery(" 138 0013 8000 ")).toEqual({ kind: "phone", value: "13800138000" });
expect(() => validatePreadmissionDraft({ ...validDraft, plannedAdmissionDate: "" })).toThrow("请选择计划住院日期");
const markdown = buildPreadmissionMarkdown(record);
expect(markdown).toContain("张三");
expect(markdown).toContain("13800138000");
expect(markdown).not.toContain("住院费用");
```

- [ ] **Step 2: 验证测试失败**

Run: `npx vitest run src/domain/market-preadmission.test.ts`  
Expected: FAIL，模块尚不存在。

- [ ] **Step 3: 实现最小领域模块**

```ts
export function safeInline(value: unknown, limit = 120) {
  return String(value ?? "").replace(/[\r\n<>`\[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}

export function normalizePatientQuery(raw: string) {
  const value = raw.trim();
  const digits = value.replace(/\s+/g, "");
  if (/^\d{5,20}$/.test(digits)) return { kind: digits.length === 11 ? "phone" : "hospitalNo", value: digits } as const;
  if (/^[\p{L}·]{2,30}$/u.test(value)) return { kind: "name", value } as const;
  throw new Error("请输入姓名、手机号或住院号");
}
```

- [ ] **Step 4: 验证领域测试通过**

Run: `npx vitest run src/domain/market-preadmission.test.ts`  
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/domain/market-preadmission.ts src/domain/market-preadmission.test.ts
git commit -m "feat: define market preadmission domain"
```

### Task 2: 云函数服务层授权与工作流

**Files:**
- Create: `functions/marketPreadmission/src/service.ts`
- Test: `functions/marketPreadmission/src/service.test.ts`

**Interfaces:**
- Consumes: Task 1 的领域类型和校验函数。
- Produces: `createMarketPreadmissionService(repository, notifier, clock)`；方法 `getSession`、`searchPatients`、`getPatientHistory`、`createPreadmission`、`listPreadmissions`、`retryNotification`。

- [ ] **Step 1: 写授权、幂等和失败隔离测试**

```ts
await expect(service.searchPatients("", "张三")).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
const first = await service.createPreadmission("uid-market", validDraft);
const duplicate = await service.createPreadmission("uid-market", validDraft);
expect(duplicate.recordId).toBe(first.recordId);
expect(notifier.send).toHaveBeenCalledTimes(1);
notifier.send.mockRejectedValueOnce(new Error("timeout"));
await expect(service.createPreadmission("uid-market", anotherDraft)).resolves.toMatchObject({ notificationStatus: "failed" });
```

- [ ] **Step 2: 验证测试失败**

Run: `npx vitest run functions/marketPreadmission/src/service.test.ts`  
Expected: FAIL，服务模块尚不存在。

- [ ] **Step 3: 实现服务边界**

```ts
export class MarketServiceError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

export function createMarketPreadmissionService(repository: MarketRepository, notifier: MarketNotifier, clock = () => new Date()) {
  const authorize = async (uid: string) => {
    if (!uid) throw new MarketServiceError("AUTH_REQUIRED", "请先登录");
    const user = await repository.findActiveUser(uid);
    if (!user) throw new MarketServiceError("FORBIDDEN", "账号未授权或已停用");
    return user;
  };
  return { getSession, searchPatients, getPatientHistory, createPreadmission, listPreadmissions, retryNotification };
}
```

- [ ] **Step 4: 验证服务测试通过**

Run: `npx vitest run functions/marketPreadmission/src/service.test.ts`  
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add functions/marketPreadmission/src/service.ts functions/marketPreadmission/src/service.test.ts
git commit -m "feat: add market preadmission workflow"
```

### Task 3: CloudBase 集合适配和企业微信发送器

**Files:**
- Create: `functions/marketPreadmission/src/index.ts`
- Create: `functions/marketPreadmission/package.json`
- Modify: `scripts/build-functions.mjs`
- Modify: `cloudbaserc.json`
- Test: `functions/marketPreadmission/src/index.test.ts`

**Interfaces:**
- Consumes: `createMarketPreadmissionService` 和 `buildPreadmissionMarkdown`。
- Produces: CloudBase 事件函数 `main(event, context)`；环境变量 `JSMZ_PREADMISSION_WECOM_WEBHOOK_URL`。

- [ ] **Step 1: 写路由和机器人地址校验失败测试**

```ts
expect(validateWeComWebhook("http://example.com/x")).toBe(false);
const host = ["qyapi", "weixin", "qq", "com"].join(".");
expect(validateWeComWebhook(`https://${host}/cgi-bin/webhook/send?key=synthetic-test-key`)).toBe(true);
expect(parseAction({ action: "unknown" })).toEqual({ ok: false, code: "INVALID_ACTION" });
```

- [ ] **Step 2: 验证测试失败**

Run: `npx vitest run functions/marketPreadmission/src/index.test.ts`  
Expected: FAIL，入口模块尚不存在。

- [ ] **Step 3: 实现 CloudBase 入口与发送器**

```ts
export function validateWeComWebhook(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "qyapi.weixin.qq.com" && url.pathname === "/cgi-bin/webhook/send" && Boolean(url.searchParams.get("key"));
  } catch { return false; }
}

async function sendMarkdown(markdown: string) {
  const webhook = process.env.JSMZ_PREADMISSION_WECOM_WEBHOOK_URL || "";
  if (!webhook) return { status: "not_configured" as const };
  if (!validateWeComWebhook(webhook)) throw new Error("INVALID_WEBHOOK");
  const response = await fetch(webhook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ msgtype: "markdown", markdown: { content: markdown } }), signal: AbortSignal.timeout(5000) });
  const result = await response.json();
  if (!response.ok || result.errcode !== 0) throw new Error(`WECOM_${String(result.errcode ?? response.status)}`);
  return { status: "sent" as const, responseCode: "0" };
}
```

- [ ] **Step 4: 把函数加入构建和 CloudBase 清单并验证**

Run: `npm run build:functions && node --check functions/marketPreadmission/index.js`  
Expected: 三个函数完成打包，语法检查通过。

- [ ] **Step 5: 提交**

```bash
git add functions/marketPreadmission cloudbaserc.json scripts/build-functions.mjs
git commit -m "feat: expose market preadmission cloud function"
```

### Task 4: 浏览器 CloudBase 客户端

**Files:**
- Create: `src/market/api.ts`
- Test: `src/market/api.test.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `createMarketApi(cloudbaseApp)`，含 `restoreSession`、`login`、`logout`、`call`；读取 `VITE_CLOUDBASE_ENV_ID` 和可发布密钥 `VITE_CLOUDBASE_ACCESS_KEY`。

- [ ] **Step 1: 写解析云函数响应的失败测试**

```ts
expect(parseFunctionResult({ result: { statusCode: 200, body: JSON.stringify({ ok: true }) } })).toEqual({ ok: true });
expect(() => parseFunctionResult({ result: { statusCode: 403, body: '{"error":{"code":"FORBIDDEN","message":"无权限"}}' } })).toThrow("无权限");
```

- [ ] **Step 2: 验证测试失败**

Run: `npx vitest run src/market/api.test.ts`  
Expected: FAIL，API 模块尚不存在。

- [ ] **Step 3: 安装并封装 CloudBase Web SDK**

Run: `npm install @cloudbase/js-sdk@latest`  
Expected: SDK 写入生产依赖和锁文件。

```ts
export async function callMarketFunction(app: CloudBaseLike, action: string, payload: Record<string, unknown> = {}) {
  const response = await app.callFunction({ name: "marketPreadmission", data: { action, ...payload } });
  return parseFunctionResult(response);
}
```

- [ ] **Step 4: 验证客户端测试与类型**

Run: `npx vitest run src/market/api.test.ts && npm run typecheck`  
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add package.json package-lock.json src/vite-env.d.ts src/market/api.ts src/market/api.test.ts
git commit -m "feat: add market CloudBase client"
```

### Task 5: 登录、搜索和患者历史界面

**Files:**
- Create: `src/market/MarketPreadmissionApp.tsx`
- Create: `src/market/market-preadmission.css`
- Test: `src/market/MarketPreadmissionApp.test.tsx`

**Interfaces:**
- Consumes: `MarketApi`、`PatientSummary`、`PatientHistory`。
- Produces: 可键盘操作的登录、搜索、候选核对和住院历史页面。

- [ ] **Step 1: 写关键用户路径失败测试**

```tsx
render(<MarketPreadmissionApp api={fakeApi} />);
await user.type(screen.getByLabelText("账号"), "sc001");
await user.type(screen.getByLabelText("密码"), "strong-password");
await user.click(screen.getByRole("button", { name: "登录" }));
await user.type(screen.getByLabelText("患者姓名、手机号或住院号"), "张三");
await user.click(screen.getByRole("button", { name: "查询" }));
expect(await screen.findByText("共住院 3 次")).toBeInTheDocument();
```

- [ ] **Step 2: 验证测试失败**

Run: `npx vitest run src/market/MarketPreadmissionApp.test.tsx`  
Expected: FAIL，界面尚不存在。

- [ ] **Step 3: 实现登录与患者核对界面**

```tsx
<form onSubmit={handleSearch} className="patient-search">
  <label htmlFor="patient-query">患者姓名、手机号或住院号</label>
  <div className="search-row">
    <input id="patient-query" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" />
    <button type="submit" disabled={busy}>查询</button>
  </div>
</form>
```

- [ ] **Step 4: 验证测试、键盘焦点和窄屏样式**

Run: `npx vitest run src/market/MarketPreadmissionApp.test.tsx`  
Expected: PASS，候选项为真实按钮，错误状态位于 `role="alert"`。

- [ ] **Step 5: 提交**

```bash
git add src/market
git commit -m "feat: build patient search workspace"
```

### Task 6: 预住院登记、通知状态和本人记录

**Files:**
- Modify: `src/market/MarketPreadmissionApp.tsx`
- Modify: `src/market/market-preadmission.css`
- Modify: `src/market/MarketPreadmissionApp.test.tsx`

**Interfaces:**
- Consumes: `createPreadmission`、`listPreadmissions`、`retryNotification`。
- Produces: 表单、幂等提交 ID、成功/失败/未配置反馈和重试操作。

- [ ] **Step 1: 写提交与重试失败测试**

```tsx
await user.type(screen.getByLabelText("计划住院日期"), "2026-09-20");
await user.type(screen.getByLabelText("拟入科室"), "内科");
await user.type(screen.getByLabelText("主要问题"), "反复腹胀，拟进一步评估");
await user.selectOptions(screen.getByLabelText("联系结果"), "patient_interested");
await user.click(screen.getByRole("button", { name: "保存并推送到企业微信群" }));
expect(await screen.findByText("登记已保存，群推送失败")).toBeInTheDocument();
expect(screen.getByRole("button", { name: "重新推送" })).toBeEnabled();
```

- [ ] **Step 2: 验证测试失败**

Run: `npx vitest run src/market/MarketPreadmissionApp.test.tsx`  
Expected: FAIL，登记界面尚未接入。

- [ ] **Step 3: 实现表单与状态反馈**

```tsx
<button type="submit" disabled={busy || !selectedPatient}>
  {busy ? "正在保存…" : "保存并推送到企业微信群"}
</button>
<div aria-live="polite" className={`notification-result is-${result.notificationStatus}`}>
  {notificationStatusText(result.notificationStatus)}
</div>
```

- [ ] **Step 4: 验证界面测试通过**

Run: `npx vitest run src/market/MarketPreadmissionApp.test.tsx`  
Expected: PASS，重复点击在请求期间禁用且沿用同一 `clientSubmissionId`。

- [ ] **Step 5: 提交**

```bash
git add src/market/MarketPreadmissionApp.tsx src/market/market-preadmission.css src/market/MarketPreadmissionApp.test.tsx
git commit -m "feat: add preadmission registration UI"
```

### Task 7: 独立构建入口

**Files:**
- Modify: `src/main.tsx`
- Modify: `vite.config.ts`
- Modify: `package.json`
- Test: `src/brand.test.ts`

**Interfaces:**
- Produces: `/market-preadmission/` 静态产物和 `npm run build:market-preadmission`。

- [ ] **Step 1: 写市场入口元数据失败测试**

```ts
expect(resolveBrandMetadata("market-preadmission")).toEqual({
  base: "/market-preadmission/",
  title: "患者预住院登记｜建始民族医院",
  description: "建始民族医院患者预住院登记系统",
});
```

- [ ] **Step 2: 验证测试失败**

Run: `npx vitest run src/brand.test.ts`  
Expected: FAIL，品牌元数据尚未注册。

- [ ] **Step 3: 注册构建和条件入口**

```tsx
const brand = import.meta.env.VITE_SURVEY_BRAND;
createRoot(document.getElementById("root")!).render(
  <StrictMode>{brand === "market-preadmission" ? <MarketPreadmissionApp /> : <App />}</StrictMode>,
);
```

- [ ] **Step 4: 验证独立构建**

Run: `npm run build:market-preadmission`  
Expected: `dist-market-preadmission/index.html` 和哈希资源生成。

- [ ] **Step 5: 提交**

```bash
git add src/main.tsx vite.config.ts package.json src/brand.test.ts
git commit -m "build: add market preadmission application"
```

### Task 8: 历史数据最小化导出

**Files:**
- Create: `scripts/export_market_patient_data.py`
- Test: `scripts/test_export_market_patient_data.py`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `patients.jsonl`、`encounters.jsonl`、`diagnosis_stats.jsonl`、`manifest.json`；真实输出目录被 Git 忽略。

- [ ] **Step 1: 写合成数据库导出失败测试**

```py
self.assertEqual(manifest["counts"]["patients"], 2)
self.assertEqual(manifest["counts"]["encounters"], 3)
self.assertTrue(records[0]["identityRisk"])
self.assertNotIn("费用", json.dumps(records, ensure_ascii=False))
```

- [ ] **Step 2: 验证测试失败**

Run: `python3 -m unittest scripts/test_export_market_patient_data.py -v`  
Expected: FAIL，导出模块尚不存在。

- [ ] **Step 3: 实现只读查询、JSONL 和清单**

```py
connection = sqlite3.connect(f"file:{source}?mode=ro", uri=True)
connection.row_factory = sqlite3.Row
write_jsonl(output / "patients.jsonl", patients)
manifest = {"schemaVersion": 1, "counts": counts, "sha256": hashes, "generatedAt": datetime.now(timezone.utc).isoformat()}
```

- [ ] **Step 4: 验证合成数据和真实源只读导出**

Run: `python3 -m unittest scripts/test_export_market_patient_data.py -v`  
Expected: PASS。

Run: `python3 scripts/export_market_patient_data.py --source /Users/yaolijun/Downloads/建始民族医院患者健康管理系统_本地单机版_V2/data/hospital_health.db --output /tmp/jsmz-market-import-check`  
Expected: 生成清单且源数据库哈希不变；命令输出只显示记录数和文件名。

- [ ] **Step 5: 提交**

```bash
git add .gitignore scripts/export_market_patient_data.py scripts/test_export_market_patient_data.py
git commit -m "feat: export minimal market patient dataset"
```

### Task 9: 部署和账号操作手册

**Files:**
- Create: `docs/market-preadmission-deployment.md`
- Modify: `.env.example`

**Interfaces:**
- Produces: 可复现的 CloudBase 部署、集合索引、拒绝直连规则、`scNNN` 账号开通、环境变量配置、导入与真实群合成验收清单。

- [ ] **Step 1: 写部署文档并确保没有真实密钥**

```dotenv
VITE_CLOUDBASE_ENV_ID=your-environment-id
VITE_CLOUDBASE_ACCESS_KEY=your-publishable-key
```

云函数环境变量只写名称：`JSMZ_PREADMISSION_WECOM_WEBHOOK_URL`。文档明确要求在 CloudBase 控制台录入，不把值放进 `.env` 或部署命令历史。

- [ ] **Step 2: 添加数据库拒绝直连规则**

```json
{
  "read": false,
  "write": false
}
```

对七个业务集合逐一应用，并创建设计文档所列索引。

- [ ] **Step 3: 写账号与验收步骤**

账号格式固定为 `sc001` 至 `sc099`；每个账号先在 CloudBase 身份认证创建，再把 UID、显示名、角色和启用状态写入 `hospital_market_users`。真实群只发送“测试患者-请勿联系”和虚构号码，验证后删除测试业务记录但明确群消息无法撤回。

- [ ] **Step 4: 运行敏感信息扫描**

Run: `rg -n "qyapi\.weixin\.qq\.com/cgi-bin/webhook/send\?key=|secret(Id|Key)|真实患者" --glob '!package-lock.json' .`  
Expected: 只允许设计/文档中的规则文字，不出现任何机器人 key 或账号密码。

- [ ] **Step 5: 提交**

```bash
git add .env.example docs/market-preadmission-deployment.md
git commit -m "docs: add market system deployment runbook"
```

### Task 10: 全量验证与交付检查

**Files:**
- Modify only if verification reveals a defect in files from Tasks 1-9.

**Interfaces:**
- Produces: 可构建、可部署、无密钥、核心流程自动验证通过的交付分支。

- [ ] **Step 1: 运行单元和组件测试**

Run: `npm test`  
Expected: 所有既有问卷与新增市场系统测试通过。

- [ ] **Step 2: 运行类型和全部构建**

Run: `npm run typecheck && npm run build:all && npm run build:market-preadmission`  
Expected: 0 个 TypeScript 错误；四个前端产物和三个云函数完成构建。

- [ ] **Step 3: 验证前端产物不含密钥和真实数据**

Run: `rg -n "qyapi\.weixin\.qq\.com/cgi-bin/webhook/send\?key=|13800138000|张三" dist-market-preadmission functions/marketPreadmission/index.js`  
Expected: 无机器人地址；若测试示例文字进入函数包则移除后重建。

- [ ] **Step 4: 检查依赖风险和 Git 范围**

Run: `npm audit --omit=dev && git status --short && git diff main...HEAD --stat`  
Expected: 无生产依赖高危漏洞；工作区只包含本功能文件。

- [ ] **Step 5: 记录当前无法由代码替代的上线动作**

最终交付列明：创建/确认 CloudBase 身份账号、配置业务集合和索引、在控制台安全设置机器人环境变量、导入真实数据、使用合成患者做一次不可撤回的群消息验收。未经这些环境动作不得声称线上已投入使用。

## Self-Review

- Spec coverage: 账号、授权、有限历史、同名核对、表单、完整姓名/联系方式通知、先存后发、幂等、重试、审计、最小化导出、可访问 UI、部署与验收均有对应任务。
- Placeholder scan: 无未定义占位实现；运行时值均由明确环境变量、CloudBase UID、患者源数据或用户输入提供。
- Type consistency: 前端和云函数共同使用 `PatientSummary`、`PatientHistory`、`PreadmissionDraft`、`PreadmissionRecord`；通知状态统一为 `pending | sent | failed | not_configured`。
