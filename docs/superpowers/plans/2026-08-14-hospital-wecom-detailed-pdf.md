# 建始民族医院企业微信详细 PDF 报告实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 医院版问卷首次提交成功后，企业微信群在彩色摘要之后自动收到一份脱敏边界明确、可直接下载的客户版 PDF 详细报告。

**Architecture:** 纯函数先把持久化记录转换为安全报告模型，PDFKit 再将模型绘制成固定三页 A4 PDF；网络层把 PDF 上传到企业微信并发送 `file` 消息。摘要、PDF和数据库保存相互隔离失败，报告发送结果写入独立审计，完整逐题答案继续只由鉴权管理函数读取。

**Tech Stack:** TypeScript、Vitest、PDFKit、开源 Noto Sans CJK SC 字体、CloudBase Node SDK、企业微信群机器人 Webhook、Poppler。

## Global Constraints

- 仅医院版 `male-health-v1.0` 生成并发送 PDF；诺玛元一现有通知不变。
- PDF不得包含具体红旗答案、内部触发规则、疾病诊断、总分或身体年龄。
- 群内附件使用客户版内容；完整答案继续通过 `adminSurvey` 鉴权读取。
- Webhook key不得写入代码、数据库、审计、错误日志或测试快照。
- 企业微信上传和发送分别使用 5 秒超时，任何通知失败都不回滚问卷入库。
- 报告固定为三页 A4，使用随函数部署的开源中文字体，所有页面必须经过 PNG 渲染检查。
- 所有新行为先写测试并确认按预期失败，再写最小实现。

---

### Task 1: 安全报告模型

**Files:**
- Create: `functions/submitSurvey/src/report-model.ts`
- Create: `functions/submitSurvey/src/report-model.test.ts`

**Interfaces:**
- Consumes: `PersistedSubmission`、`findHospitalQuestion(id)` 和医院问卷结构化答案。
- Produces: `buildHospitalClientReportModel(record): HospitalClientReportModel`。

- [ ] **Step 1: 写失败测试**

覆盖以下断言：

```ts
const report = buildHospitalClientReportModel(record);
expect(report.concerns).toEqual(["精力不足", "睡眠", "压力与情绪"]);
expect(report.statusCounts).toEqual({ evaluate: 2, signal: 1, stable: 5 });
expect(report.lifestyle.map((item) => item.label)).toContain("久坐时间");
expect(JSON.stringify(report)).not.toContain("q55");
expect(JSON.stringify(redFlagReport)).not.toContain("测试风险");
expect(unknownReport.mainChange).toBe("未填写");
```

- [ ] **Step 2: 确认 RED**

Run: `npm test -- functions/submitSurvey/src/report-model.test.ts`

Expected: FAIL，因为 `report-model.ts` 尚不存在。

- [ ] **Step 3: 实现模型与映射**

定义：

```ts
export type ClientReportLevel = "clinical_priority" | "evaluate" | "signal" | "stable";

export interface HospitalClientReportModel {
  institution: "建始民族医院";
  title: "男性健康与功能状态评估报告";
  name: string;
  phone: string;
  confirmationId: string;
  submittedAt: string;
  followUpLabel: string;
  concerns: string[];
  mainChange: string;
  primaryGoal: string;
  statusCounts: { evaluate: number; signal: number; stable: number };
  domains: Array<{ title: string; level: ClientReportLevel; levelLabel: string; reason: string; recommendation: string }>;
  lifestyle: Array<{ label: string; value: string }>;
  twelveWeekGoals: string[];
  safetyNotice: string | null;
}
```

所有选项值只能从 `findHospitalQuestion()` 映射；未知值返回“未填写”。红旗记录统一覆盖领域原因与建议，不读取 `assessment.redFlags`。

- [ ] **Step 4: 确认 GREEN**

Run: `npm test -- functions/submitSurvey/src/report-model.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add functions/submitSurvey/src/report-model.ts functions/submitSurvey/src/report-model.test.ts
git commit -m "feat: build safe hospital client report model"
```

---

### Task 2: 三页 A4 PDF 绘制器

**Files:**
- Create: `functions/submitSurvey/src/report-pdf.ts`
- Create: `functions/submitSurvey/src/report-pdf.test.ts`
- Create: `functions/submitSurvey/assets/NotoSansCJKsc-Regular.otf`
- Create: `functions/submitSurvey/assets/OFL.txt`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `functions/submitSurvey/package.json`
- Modify: `scripts/build-functions.mjs`

**Interfaces:**
- Consumes: `HospitalClientReportModel` 和可读取的字体路径。
- Produces: `renderHospitalClientReportPdf(model, fontPath): Promise<Buffer>` 与 `hospitalClientReportFilename(model): string`。

- [ ] **Step 1: 写失败测试**

```ts
const pdf = await renderHospitalClientReportPdf(model, fontPath);
expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
const parsed = await PDFDocument.load(pdf);
expect(parsed.getPageCount()).toBe(3);
expect(hospitalClientReportFilename(model)).toBe("建始民族医院_健康评估报告_虚构用户_JS-TEST-0001.pdf");
```

同时验证文件名移除斜杠、控制字符和超长姓名。

- [ ] **Step 2: 确认 RED**

Run: `npm test -- functions/submitSurvey/src/report-pdf.test.ts`

Expected: FAIL，因为 PDF 接口尚不存在。

- [ ] **Step 3: 增加依赖和字体**

Root dev dependencies: `pdfkit`、`@types/pdfkit`、`pdf-lib`。

Function runtime dependency: `pdfkit`。

从 Noto CJK 官方仓库取得 `NotoSansCJKsc-Regular.otf` 及 OFL 许可文件，记录来源和 SHA-256；云函数构建将 `pdfkit` 标记为 external，由函数目录在云端安装。

- [ ] **Step 4: 实现固定三页绘制**

```ts
export async function renderHospitalClientReportPdf(
  model: HospitalClientReportModel,
  fontPath: string,
): Promise<Buffer>;

export function hospitalClientReportFilename(model: Pick<HospitalClientReportModel, "name" | "confirmationId">): string;
```

页面结构：

1. 封面、核心诉求、三段状态条和安全提示。
2. 八维状态卡片，每行两张，共四行。
3. 生活方式、12周目标、后续评估原则和免责声明。

使用 `height`、`ellipsis` 和固定卡片高度避免跨页溢出；页脚显示记录编号和 `第 n / 3 页`。

- [ ] **Step 5: 确认 GREEN 并生成本地样例**

Run: `npm test -- functions/submitSurvey/src/report-pdf.test.ts`

Expected: PASS，PDF头正确且页数为3。

- [ ] **Step 6: 提交**

```bash
git add package.json package-lock.json functions/submitSurvey/package.json scripts/build-functions.mjs functions/submitSurvey/assets functions/submitSurvey/src/report-pdf.ts functions/submitSurvey/src/report-pdf.test.ts
git commit -m "feat: render hospital client PDF report"
```

---

### Task 3: 企业微信 PDF 上传与文件消息

**Files:**
- Modify: `functions/submitSurvey/src/wecom.ts`
- Modify: `functions/submitSurvey/src/wecom.test.ts`

**Interfaces:**
- Consumes: 已校验的群机器人 Webhook、UTF-8文件名和 PDF Buffer。
- Produces: `uploadWeComFile(...) => Promise<string>` 与 `sendWeComFile(...) => Promise<void>`。

- [ ] **Step 1: 写上传失败测试**

测试 Fetcher 捕获的请求：

```ts
expect(url.pathname).toBe("/cgi-bin/webhook/upload_media");
expect(url.searchParams.get("type")).toBe("file");
expect(init.body).toBeInstanceOf(FormData);
expect(await uploadWeComFile(webhook, filename, pdf, fetcher)).toBe("MEDIA-ID");
```

另写文件发送测试，断言请求体为：

```json
{"msgtype":"file","file":{"media_id":"MEDIA-ID"}}
```

错误测试确认抛出的消息不包含 Webhook key 或企业微信响应正文。

- [ ] **Step 2: 确认 RED**

Run: `npm test -- functions/submitSurvey/src/wecom.test.ts`

Expected: FAIL，因为上传和文件发送函数尚不存在。

- [ ] **Step 3: 实现上传和发送**

用现有 `validateWebhook()` 解析 key；上传 URL 固定为相同域名的 `/cgi-bin/webhook/upload_media?key=...&type=file`。FormData 字段名固定为 `media`，Blob MIME 为 `application/pdf`。

- [ ] **Step 4: 确认 GREEN**

Run: `npm test -- functions/submitSurvey/src/wecom.test.ts`

Expected: PASS，原 Markdown 测试保持通过。

- [ ] **Step 5: 提交**

```bash
git add functions/submitSurvey/src/wecom.ts functions/submitSurvey/src/wecom.test.ts
git commit -m "feat: send hospital PDF through WeCom"
```

---

### Task 4: 报告通知编排与独立审计

**Files:**
- Create: `functions/submitSurvey/src/report-delivery.ts`
- Create: `functions/submitSurvey/src/report-delivery.test.ts`
- Modify: `functions/submitSurvey/src/index.ts`
- Modify: `functions/submitSurvey/src/notification.ts`
- Modify: `functions/submitSurvey/src/notification.test.ts`

**Interfaces:**
- Consumes: 医院通知配置、`PersistedSubmission`、字体路径和可注入的渲染/上传/发送依赖。
- Produces: `deliverHospitalClientReport(...) => Promise<"sent" | "failed" | "not_configured">`。

- [ ] **Step 1: 写失败测试**

覆盖：

- 医院版依次调用渲染、上传、文件发送并返回 `sent`。
- 未配置 Webhook 返回 `not_configured` 且不渲染。
- 任一环节失败返回 `failed`，错误日志使用固定文本。
- 诺玛元一的 `resolveWeComNotification()` 不启用医院报告。
- 持久化层写入 `hospital_wecom_report_notification` 独立审计。

- [ ] **Step 2: 确认 RED**

Run: `npm test -- functions/submitSurvey/src/report-delivery.test.ts functions/submitSurvey/src/notification.test.ts`

Expected: FAIL，因为编排模块与报告审计尚不存在。

- [ ] **Step 3: 实现编排**

```ts
export async function deliverHospitalClientReport(
  record: PersistedSubmission,
  webhookUrl: string | undefined,
  dependencies: ReportDeliveryDependencies,
): Promise<"sent" | "failed" | "not_configured">;
```

`index.ts` 在摘要审计之后执行报告交付并写独立审计。使用 `path.join(__dirname, "assets", "NotoSansCJKsc-Regular.otf")` 定位字体。所有异常在交付边界被吸收，提交接口仍返回 200。

- [ ] **Step 4: 确认 GREEN**

Run: `npm test -- functions/submitSurvey/src/report-delivery.test.ts functions/submitSurvey/src/notification.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add functions/submitSurvey/src/report-delivery.ts functions/submitSurvey/src/report-delivery.test.ts functions/submitSurvey/src/index.ts functions/submitSurvey/src/notification.ts functions/submitSurvey/src/notification.test.ts
git commit -m "feat: deliver and audit hospital client reports"
```

---

### Task 5: PDF 视觉验收与部署文档

**Files:**
- Create: `scripts/render-hospital-report-sample.ts`
- Modify: `docs/cloudbase-deployment.md`
- Modify: `.gitignore` only if `tmp/pdfs/` or `output/pdf/` is not already ignored.

**Interfaces:**
- Consumes: 固定虚构记录和生产 PDF 绘制器。
- Produces: 本地样例 `output/pdf/建始民族医院_健康评估报告_虚构用户_JS-VISUAL-TEST.pdf`；该样例仅用于验收，不提交真实健康数据。

- [ ] **Step 1: 标记 PDF 创建操作**

立即在首次生成样例前执行 PDF 技能要求的：

```bash
node container_tools/mark_artifact_operation_started.mjs --operation-kind create --expected-output-count 1 --output-format pdf
```

若仓库没有该脚本，从已加载的 Codex 工作区依赖中定位后执行；不得跳过标记。

- [ ] **Step 2: 生成并渲染**

Run:

```bash
npx tsx scripts/render-hospital-report-sample.ts
pdfinfo output/pdf/建始民族医院_健康评估报告_虚构用户_JS-VISUAL-TEST.pdf
pdftoppm -png output/pdf/建始民族医院_健康评估报告_虚构用户_JS-VISUAL-TEST.pdf tmp/pdfs/hospital-report
```

Expected: 3页 A4；生成3张PNG，无字体缺失。

- [ ] **Step 3: 逐页检查**

使用图像查看工具检查全部页面：中文无黑方块，文本不重叠或裁切，状态条和八维卡片对齐，页眉页脚及页码清晰。发现问题先写回归测试或固定样例断言，再调整绘制器并重新渲染。

- [ ] **Step 4: 更新部署说明**

记录企业微信会收到 Markdown 摘要和客户版 PDF 两条消息；完整答案仍仅通过鉴权管理接口访问；机器人文件上传和发送分别有独立失败审计。

- [ ] **Step 5: 提交**

```bash
git add scripts/render-hospital-report-sample.ts docs/cloudbase-deployment.md .gitignore
git commit -m "docs: document hospital PDF report delivery"
```

---

### Task 6: 完整验证、部署和真实链路

**Files:**
- Modify generated: `functions/submitSurvey/index.js`

**Interfaces:**
- Produces: 可部署函数包、线上成功审计和已清理的虚构测试数据。

- [ ] **Step 1: 完整本地门禁**

Run:

```bash
npm test -- --run
npm run typecheck
npm run build:all
npm audit --omit=dev
git diff --check
```

Expected: 零失败、零类型错误、全部构建成功、生产依赖零已知漏洞。

- [ ] **Step 2: 检查部署包**

确认 `functions/submitSurvey/index.js` 引用 `pdfkit`，字体文件存在，函数目录生产依赖安装后总体积处于 CloudBase 限制内，生成物中不包含 Webhook 值。

- [ ] **Step 3: 部署函数**

```bash
npx -y -p @cloudbase/cli tcb fn deploy submitSurvey -e yuecheng-survey-d4fucklsf6b68aaf --force --json
```

仅核验环境变量名称，禁止打印值；函数必须返回 `Active`。

- [ ] **Step 4: 虚构端到端提交**

提交姓名为 `企业微信PDF报告系统测试（虚构）`、手机号 `13800000000`、无红旗且包含已知评估信号的完整医院问卷。确认：

- HTTP函数返回 200。
- `hospital_wecom_notification = sent`。
- `hospital_wecom_report_notification = sent`。
- 企业微信群出现一条摘要和一个三页 PDF 附件。

- [ ] **Step 5: 清理测试数据**

先按唯一 `clientSubmissionId` 解析精确 `sessionId`，再删除对应 profile、answers、assessment、全部 audit 和 session；重新查询五个集合确认全部为空。群内虚构摘要和 PDF 无法撤回，在最终交付中明确说明。

- [ ] **Step 6: 提交生成物**

```bash
git add functions/submitSurvey/index.js
git commit -m "build: package hospital PDF report delivery"
```

---

### Task 7: 合并、GitHub 与 CI

**Files:** none beyond prior tasks.

- [ ] **Step 1: 使用完成前验证流程复核**

重新执行全量测试、类型检查、构建、审计和 `git diff --check`，确认工作树干净。

- [ ] **Step 2: 合并回 main**

按工作树来源安全快进合并，合并后在主分支再次运行测试，再删除本次创建的工作树和功能分支。

- [ ] **Step 3: 推送并等待 CI**

```bash
git push origin main
gh run list --branch main
gh run watch <new-run-id> --exit-status
```

Expected: 新提交对应的 GitHub Actions `Verify health survey` 完成且结论为 `success`，远端 `main` SHA 与本地一致。

## 计划自审

- 设计中的安全模型、三页 PDF、文件上传、失败隔离、双审计、视觉检查和真实链路均有对应任务。
- 新接口在定义和调用处名称一致。
- 无未决事项、延后实现说明或未定义占位步骤。
- 单个实现任务均包含 RED、GREEN、验证和独立提交。
