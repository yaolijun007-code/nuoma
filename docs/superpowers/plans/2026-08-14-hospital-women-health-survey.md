# 建始民族医院女性健康与功能状态问卷 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增独立公开链接的建始民族医院女性健康问卷，并把女性可视化摘要与三页PDF发送到男性版现有的医院企业微信群。

**Architecture:** 在同一 React/Vite 代码库中增加 `hospital-female` 第三品牌和 `src/female` 独立领域/UI模块。`submitSurvey` 依据 `questionnaireVersion` 选择男性、女性或诺玛元一的校验、规范化、评估和通知分支；女性与男性共用数据库集合和医院Webhook，但使用不同版本号、审计动作、Markdown和PDF模型。

**Tech Stack:** React 19、TypeScript 5.7、Vite 6、Vitest、Lucide React、PDFKit、腾讯云 CloudBase Node SDK、企业微信机器人 Markdown/File API。

## Global Constraints

- 女性生产路径固定为 `/women-health-survey/`，版本固定为 `female-health-v1.0`。
- 女性草稿键固定为 `nuoma.hospital.female-health.v1.draft`。
- 男性 `/health-survey/` 与诺玛元一 `/nuoma-yuanyi-survey/` 的行为不得改变。
- 女性使用现有 `HOSPITAL_WECHAT_WEBHOOK_URL`，不得提交或输出Webhook值。
- 不生成女性衰老总分、身体年龄、更年期或疾病诊断。
- 医学安全触发只输出统一人工核实提示，不暴露具体红旗答案。
- PDF固定三页A4，使用仓库内 Noto CJK 字体，不依赖外部资源。
- 前端和云函数都必须校验条件题、互斥选项、手机号、第53题最多3项和第55题0—10整数。
- 所有功能用TDD实现；每个任务结束运行聚焦测试并提交。

---

## File Structure

### 新建前端领域文件

- `src/female/surveyDefinition.ts`：55题、10模块、选项、严重程度、条件和互斥元数据。
- `src/female/navigation.ts`：可见页面、条件题清理和动态进度。
- `src/female/validation.ts`：单题与整份女性问卷校验。
- `src/female/normalize.ts`：服务端可复用的白名单规范化。
- `src/female/assessment.ts`：八维状态、筛查关注项和医学安全覆盖。
- `src/female/draft.ts`：女性本地草稿读写。
- `src/female/FemaleSurveyApp.tsx`：女性欢迎页、一题一页流程与完成页。
- `src/female/tokens.css`：女性颜色、字体、阴影和状态令牌。
- `src/female/female-survey.css`：女性页面、卡片、图标和响应式布局。
- `src/female/*.test.ts(x)`：定义、导航、校验、规范化、评估、草稿与UI测试。

### 新建云函数文件

- `functions/submitSurvey/src/female-wecom.ts`：女性Markdown摘要。
- `functions/submitSurvey/src/female-report-model.ts`：安全的女性客户报告模型。
- `functions/submitSurvey/src/female-report-pdf.ts`：女性三页A4 PDF。
- `functions/submitSurvey/src/female-report-delivery.ts`：渲染、上传、发送和安全日志。
- 对应 `*.test.ts`：选项映射、隐私边界、页数、上传和错误隔离。

### 修改现有文件

- `src/brand.ts`、`vite.config.ts`、`src/App.tsx`：第三品牌、路径和应用路由。
- `package.json`：女性构建与报告样例脚本。
- `src/domain/submission.ts`：版本化校验、规范化和女性评估。
- `functions/submitSurvey/src/notification.ts`：女性Webhook与审计路由。
- `functions/submitSurvey/src/notification-workflow.ts`：按报告类型选择男女PDF交付器。
- `functions/submitSurvey/src/index.ts`：女性PDF字体路径沿用与审计写入。
- `scripts/build-functions.mjs`：打包新增女性代码，无新增运行时依赖。
- `docs/cloudbase-deployment.md`：女性构建、部署、链接和通知说明。

---

### Task 1: 第三品牌、独立路径与构建入口

**Files:**
- Modify: `src/brand.ts`
- Modify: `src/brand.test.ts`
- Modify: `vite.config.ts`
- Modify: `src/domain/cloudbase-config.test.ts`
- Modify: `src/App.tsx`
- Modify: `package.json`

**Interfaces:**
- Produces: `SurveyBrandId` 新值 `hospital-female`；`brandRegistry["hospital-female"]`；`build:hospital-female`。
- Consumes: 现有 `SurveyBrand` 与 Vite 品牌构建模式。

- [ ] **Step 1: 写失败测试**

```ts
expect(getSurveyBrand("hospital-female")).toMatchObject({
  questionnaireVersion: "female-health-v1.0",
  basePath: "/women-health-survey/",
  draftKey: "nuoma.hospital.female-health.v1.draft",
  themeClass: "theme-hospital-female",
});
expect(resolveBrandBase("hospital-female")).toBe("/women-health-survey/");
```

- [ ] **Step 2: 运行红灯测试**

Run: `npm test -- --run src/brand.test.ts src/domain/cloudbase-config.test.ts`  
Expected: FAIL，提示未知品牌或缺少女性构建元数据。

- [ ] **Step 3: 实现品牌和构建脚本**

```ts
"hospital-female": {
  id: "hospital-female",
  organization: "建始民族医院",
  subtitle: "衰老与健康管理中心",
  eyebrow: "WOMEN'S HEALTH · V1.0",
  questionnaireVersion: "female-health-v1.0",
  draftKey: "nuoma.hospital.female-health.v1.draft",
  basePath: "/women-health-survey/",
  themeClass: "theme-hospital-female",
  pageTitle: "女性健康与功能状态问卷｜建始民族医院",
  pageDescription: "建始民族医院女性健康与功能状态问卷",
  consentOwner: "院方",
  identityDescription: "信息仅用于院内健康评估与记录匹配。",
  navigationMode: "questions",
}
```

在 `package.json` 增加：

```json
"build:hospital-female": "VITE_SURVEY_BRAND=hospital-female tsc -b && VITE_SURVEY_BRAND=hospital-female vite build --outDir dist-women-health-survey"
```

并把该命令加入 `build:all`。

- [ ] **Step 4: 运行绿灯测试和女性空构建**

Run: `npm test -- --run src/brand.test.ts src/domain/cloudbase-config.test.ts && npm run build:hospital-female`  
Expected: PASS；输出目录为 `dist-women-health-survey`。

- [ ] **Step 5: 提交**

```bash
git add src/brand.ts src/brand.test.ts vite.config.ts src/domain/cloudbase-config.test.ts src/App.tsx package.json package-lock.json
git commit -m "feat: add hospital female survey brand"
```

### Task 2: 女性55题定义与条件元数据

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/female/surveyDefinition.ts`
- Create: `src/female/surveyDefinition.test.ts`

**Interfaces:**
- Produces: `QuestionType` 新值 `scale`；`femaleSurvey`、`femaleModules`、`findFemaleQuestion(id)`、`FemaleSignal`、条件和互斥元数据。
- Consumes: `Question`、`QuestionOption` from `src/domain/types.ts`。

- [ ] **Step 1: 写定义完整性测试**

```ts
expect(femaleSurvey.version).toBe("female-health-v1.0");
expect(femaleSurvey.pages.filter((page) => page.kind === "question")).toHaveLength(55);
expect(findFemaleQuestion("f5")?.options).toHaveLength(8);
expect(findFemaleQuestion("f53")?.maxSelections).toBe(3);
expect(findFemaleQuestion("f55")?.type).toBe("scale");
```

同时逐题断言附件中的题干、选项数和可选/必选状态，重点断言 f6/f7/f8 条件、f35 可跳过、f11/f31/f33/f47—f51互斥项。

- [ ] **Step 2: 运行红灯测试**

Run: `npm test -- --run src/female/surveyDefinition.test.ts`  
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现全部55题**

先把 `QuestionType` 扩展为 `"single" | "multi" | "text" | "phone" | "date" | "number" | "scale"`，再定义专用扩展：

```ts
export type FemaleSignal = "none" | "mild" | "moderate" | "marked" | "safety";
export interface FemaleQuestion extends Question {
  signalByValue?: Record<string, FemaleSignal>;
  signalBySelectedValue?: Record<string, FemaleSignal>;
  mutuallyExclusiveValues?: string[];
  optional?: boolean;
}
```

题目ID固定为 `f1` 至 `f55`；f1姓名、f2手机号、f3自动日期。f6/f7的条件只包含f5值0、1、2；f8条件只包含f5值4。附件中的每个选项按原顺序编码为字符串 `"0"`、`"1"`……，同时显式填写信号级别，避免依赖序号推断。

- [ ] **Step 4: 运行测试**

Run: `npm test -- --run src/female/surveyDefinition.test.ts`  
Expected: PASS，55题全部存在且选项完整。

- [ ] **Step 5: 提交**

```bash
git add src/domain/types.ts src/female/surveyDefinition.ts src/female/surveyDefinition.test.ts
git commit -m "feat: define hospital female questionnaire"
```

### Task 3: 女性导航、条件清理、互斥和校验

**Files:**
- Create: `src/female/navigation.ts`
- Create: `src/female/navigation.test.ts`
- Create: `src/female/validation.ts`
- Create: `src/female/validation.test.ts`

**Interfaces:**
- Produces: `getVisibleFemalePages(answers)`、`pruneHiddenFemaleAnswers(answers)`、`applyFemaleMultiChoice(question, current, value)`、`validateFemaleQuestion(question, answers)`、`validateFemaleSubmission(answers)`。

- [ ] **Step 1: 写失败测试**

```ts
expect(questionIds(getVisibleFemalePages({ f5: "0" }))).toContain("f6");
expect(questionIds(getVisibleFemalePages({ f5: "4" }))).toContain("f8");
expect(pruneHiddenFemaleAnswers({ f5: "4", f6: "2", f8: "0" }).f6).toBeUndefined();
expect(applyFemaleMultiChoice(q11, ["0"], "9")).toEqual(["9"]);
expect(validateFemaleSubmission({ ...validFemaleAnswers(), f53: ["0", "1", "2", "3"] })).toHaveProperty("f53");
expect(validateFemaleSubmission({ ...validFemaleAnswers(), f55: "11" })).toHaveProperty("f55");
```

- [ ] **Step 2: 确认测试失败**

Run: `npm test -- --run src/female/navigation.test.ts src/female/validation.test.ts`  
Expected: FAIL，函数未定义。

- [ ] **Step 3: 实现条件与校验**

`getVisibleFemalePages`按题目条件过滤；`pruneHiddenFemaleAnswers`只保留当前可见字段及自动日期。互斥函数执行两条确定规则：选择互斥值时返回该值单项；选择具体值时从当前数组删除全部互斥值。f35缺失不报错，其余当前可见题必填；f2匹配 `/^1\d{10}$/`；f53为1—3项；f55为0—10整数。

- [ ] **Step 4: 运行测试**

Run: `npm test -- --run src/female/navigation.test.ts src/female/validation.test.ts`  
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/female/navigation.ts src/female/navigation.test.ts src/female/validation.ts src/female/validation.test.ts
git commit -m "feat: validate female survey flow"
```

### Task 4: 服务端规范化与女性八维评估

**Files:**
- Create: `src/female/normalize.ts`
- Create: `src/female/normalize.test.ts`
- Create: `src/female/assessment.ts`
- Create: `src/female/assessment.test.ts`
- Create: `src/test/femaleAnswers.ts`

**Interfaces:**
- Produces: `normalizeFemaleAnswers(raw)`，返回 `{ identity, healthAnswers, assessmentAnswers }`；`assessFemaleSurvey(answers)`，返回兼容 `AssessmentResult` 且增加 `screeningAttention` 的对象。

- [ ] **Step 1: 写失败测试**

```ts
expect(normalizeFemaleAnswers(validFemaleAnswers()).identity).toEqual({
  name: "虚构女性用户", phone: "13800000000", phoneLast4: "0000", age: 45,
});
expect(normalizeFemaleAnswers({ ...validFemaleAnswers(), f5: "4", f6: "2" }).healthAnswers.f6).toBeUndefined();
expect(assessFemaleSurvey({ ...stableFemaleAnswers(), f8: "1" })).toMatchObject({ hasRedFlag: true });
expect(assessFemaleSurvey({ ...stableFemaleAnswers(), f13: "2" }).domains.find(({ id }) => id === "sleep")?.level).toBe("evaluate");
```

- [ ] **Step 2: 运行红灯测试**

Run: `npm test -- --run src/female/normalize.test.ts src/female/assessment.test.ts`  
Expected: FAIL。

- [ ] **Step 3: 实现白名单规范化**

姓名来自f1，手机号来自f2；年龄档f4映射到报告用代表年龄 `42,47,52,57,62,67,70`，同时在 `healthAnswers.f4` 保留年龄档选项。只保留女性题目定义中可见且合法的值；多选去重并执行互斥清理。

- [ ] **Step 4: 实现八维分类**

```ts
const domainQuestions = {
  femaleLifecycle: ["f5", "f9", "f10"],
  sleep: ["f12", "f13", "f14", "f15", "f25"],
  mind: ["f16", "f17", "f18", "f19"],
  metabolicCardio: ["f20", "f21", "f22", "f23", "f26"],
  musculoskeletal: ["f27", "f28", "f29", "f30"],
  breastGynecology: ["f31", "f32", "f33"],
  urogenital: ["f34", "f35", "f36", "f37", "f38"],
  gutLifestyle: ["f41", "f42", "f43", "f45", "f46", "f47", "f48"],
};
```

一个 mild => signal；一个 moderate/marked 或两个 mild => evaluate；无信号 => stable。安全值来自f8、f24、f31、f33、f44及“正在发生/明显加重”选项，任一安全值把所有维统一为 `clinical_priority`。f39、f40、f52形成 `screeningAttention`，不改变八维等级。

- [ ] **Step 5: 运行测试并提交**

Run: `npm test -- --run src/female/normalize.test.ts src/female/assessment.test.ts`  
Expected: PASS。

```bash
git add src/female/normalize.ts src/female/normalize.test.ts src/female/assessment.ts src/female/assessment.test.ts src/test/femaleAnswers.ts
git commit -m "feat: assess female health signals"
```

### Task 5: 女性草稿、应用流程与高端视觉

**Files:**
- Create: `src/female/draft.ts`
- Create: `src/female/draft.test.ts`
- Create: `src/female/FemaleSurveyApp.tsx`
- Create: `src/female/FemaleSurveyApp.test.tsx`
- Create: `src/hospital/components/ScaleInput.tsx`
- Create: `src/hospital/components/ScaleInput.test.tsx`
- Create: `src/female/tokens.css`
- Create: `src/female/female-survey.css`
- Modify: `src/hospital/components/QuestionPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Produces: `FemaleSurveyApp({ brand })`；48小时女性草稿；欢迎、填写、完成三阶段。
- Consumes: Task 2—4 的定义、导航、校验和 `submitSurvey`。

- [ ] **Step 1: 写失败交互测试**

测试女性标题、独立草稿、f5条件跳转、f35跳过、f53上限、错误焦点、提交版本 `female-health-v1.0`、完成页红旗文案，以及男性App仍路由到 `HospitalSurveyApp`。`ScaleInput.test.tsx`断言0—10键盘/指针输入、当前数值和两端“非常差/非常好”标签。

- [ ] **Step 2: 运行红灯测试**

Run: `npm test -- --run src/female/draft.test.ts src/female/FemaleSurveyApp.test.tsx src/App.test.tsx`  
Expected: FAIL。

- [ ] **Step 3: 实现流程**

复用 `src/hospital/components/SurveyShell.tsx`、`ModuleIntro.tsx` 和 `QuestionPage.tsx`，女性根类固定为 `hospital-survey female-survey`。`QuestionPage`在 `question.type === "scale"` 时渲染 `ScaleInput`，其余男性行为不变。欢迎页文案固定为“女性健康与功能状态评估”，说明40岁及以上、约6—8分钟、一题一页、自动保存。提交成功后只显示记录编号和安全边界。

- [ ] **Step 4: 实现视觉令牌**

```css
.female-survey {
  --female-plum: #2f173f;
  --female-iris: #7357e8;
  --female-coral: #ef6676;
  --female-gold: #d5a84b;
  --female-teal: #1f9f92;
  --female-ivory: #fffaf5;
}
```

为欢迎卡、选项卡、模块图标、生命周期标签、进度、医学安全态和完成态提供明确样式；文本对比度至少4.5:1，触控目标至少44px，`prefers-reduced-motion`禁用非必要动画。

- [ ] **Step 5: 运行测试、构建并提交**

Run: `npm test -- --run src/female/draft.test.ts src/female/FemaleSurveyApp.test.tsx src/App.test.tsx && npm run build:hospital-female`  
Expected: PASS。

```bash
git add src/female src/hospital/components/ScaleInput.tsx src/hospital/components/ScaleInput.test.tsx src/hospital/components/QuestionPage.tsx src/App.tsx src/App.test.tsx
git commit -m "feat: build hospital female survey experience"
```

### Task 6: 云函数版本化提交路由

**Files:**
- Modify: `src/domain/submission.ts`
- Modify: `src/domain/submission.test.ts`
- Modify: `functions/submitSurvey/index.js`（构建生成）

**Interfaces:**
- Produces: `supportedQuestionnaireVersions`包含 `female-health-v1.0`；女性分支调用 `validateFemaleSubmission`、`normalizeFemaleAnswers`、`assessFemaleSurvey`。

- [ ] **Step 1: 写失败测试**

```ts
await service.submit({
  questionnaireVersion: "female-health-v1.0",
  clientSubmissionId: "female-test-submission-0001",
  answers: validFemaleAnswers(),
});
expect(saved.session.questionnaireVersion).toBe("female-health-v1.0");
expect(saved.identity.phone).toBe("13800000000");
```

并断言女性无效条件答案、多选冲突、f53超限和f55越界在云函数边界被拒绝。

- [ ] **Step 2: 红灯测试**

Run: `npm test -- --run src/domain/submission.test.ts`  
Expected: FAIL，版本不支持。

- [ ] **Step 3: 实现显式版本分支**

不要再用“是否存在phone”判断男女版本。按 `questionnaireVersion` 分支：女性走女性校验/规范化/评估；男性走现有移动医院逻辑；诺玛元一走旧版逻辑。

- [ ] **Step 4: 测试和提交**

Run: `npm test -- --run src/domain/submission.test.ts && npm run build:functions`  
Expected: PASS。

```bash
git add src/domain/submission.ts src/domain/submission.test.ts functions/submitSurvey/index.js
git commit -m "feat: accept female survey submissions"
```

### Task 7: 女性企业微信可视化摘要

**Files:**
- Create: `functions/submitSurvey/src/female-wecom.ts`
- Create: `functions/submitSurvey/src/female-wecom.test.ts`
- Modify: `functions/submitSurvey/src/notification.ts`
- Modify: `functions/submitSurvey/src/notification.test.ts`

**Interfaces:**
- Produces: `buildFemaleWeComMarkdown(record)`；女性通知动作 `hospital_female_wecom_notification`；报告类型 `female`。

- [ ] **Step 1: 写失败测试**

断言Markdown包含姓名、完整测试手机号、f53最多三项、f5生命周期标签、f55自评、八维数量、时间和记录编号；不包含题号、未校验值或具体红旗答案。断言女性路由使用 `HOSPITAL_WECHAT_WEBHOOK_URL`，而非诺玛元一Webhook。

- [ ] **Step 2: 红灯测试**

Run: `npm test -- --run functions/submitSurvey/src/female-wecom.test.ts functions/submitSurvey/src/notification.test.ts`  
Expected: FAIL。

- [ ] **Step 3: 实现摘要和路由**

固定标题为 `### 🌺 建始民族医院｜女性健康问卷`。所有显示文本通过 `findFemaleQuestion` 的已知选项映射；f53最多三项。红旗状态只显示“需医务人员优先核实”。女性 `ResolvedWeComNotification.report.kind` 为 `female`。

- [ ] **Step 4: 测试与提交**

Run: `npm test -- --run functions/submitSurvey/src/female-wecom.test.ts functions/submitSurvey/src/notification.test.ts`  
Expected: PASS。

```bash
git add functions/submitSurvey/src/female-wecom.ts functions/submitSurvey/src/female-wecom.test.ts functions/submitSurvey/src/notification.ts functions/submitSurvey/src/notification.test.ts
git commit -m "feat: notify WeCom about female surveys"
```

### Task 8: 女性报告模型与三页PDF

**Files:**
- Create: `functions/submitSurvey/src/female-report-model.ts`
- Create: `functions/submitSurvey/src/female-report-model.test.ts`
- Create: `functions/submitSurvey/src/female-report-pdf.ts`
- Create: `functions/submitSurvey/src/female-report-pdf.test.ts`
- Create: `scripts/render-female-report-sample.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `buildFemaleClientReportModel(record)`、`renderFemaleClientReportPdf(model,fontPath)`、`femaleClientReportFilename(model)`。

- [ ] **Step 1: 写安全模型测试**

断言模型只映射已知f4/f5/f39/f40/f52/f53选项，未知值显示“未填写”；红旗只产生统一安全提示；筛查关注项不泄露未校验文本。

- [ ] **Step 2: 写PDF失败测试**

```ts
const pdf = await renderFemaleClientReportPdf(model, fontPath);
expect(await pageCount(pdf)).toBe(3);
expect(await text(pdf)).toContain("女性健康与功能状态评估报告");
expect(await text(pdf)).toContain("八维女性功能状态画像");
expect(await text(pdf)).toContain("筛查与后续路径");
```

- [ ] **Step 3: 运行红灯测试**

Run: `npm test -- --run functions/submitSurvey/src/female-report-model.test.ts functions/submitSurvey/src/female-report-pdf.test.ts`  
Expected: FAIL。

- [ ] **Step 4: 实现固定三页PDF**

页面1使用紫莓/鸢尾/珊瑚/金色的女性高级卡片；页面2排布八个状态卡；页面3展示宫颈、乳腺、结直肠筛查、生活方式和三步后续路径。每页有医院页眉、记录编号和页码；所有布局固定在A4安全区，禁止自动增加第4页。

- [ ] **Step 5: 生成样例、测试和提交**

Run: `npm test -- --run functions/submitSurvey/src/female-report-model.test.ts functions/submitSurvey/src/female-report-pdf.test.ts && npm run report:female-sample`  
Expected: PASS，并生成 `output/pdf/建始民族医院_女性健康评估报告_虚构女性用户_JS-FEMALE-VISUAL-TEST.pdf`。

```bash
git add functions/submitSurvey/src/female-report-model.ts functions/submitSurvey/src/female-report-model.test.ts functions/submitSurvey/src/female-report-pdf.ts functions/submitSurvey/src/female-report-pdf.test.ts scripts/render-female-report-sample.ts package.json package-lock.json
git commit -m "feat: render female client health reports"
```

### Task 9: 女性PDF交付与独立审计

**Files:**
- Create: `functions/submitSurvey/src/female-report-delivery.ts`
- Create: `functions/submitSurvey/src/female-report-delivery.test.ts`
- Modify: `functions/submitSurvey/src/notification-workflow.ts`
- Modify: `functions/submitSurvey/src/notification-workflow.test.ts`
- Modify: `functions/submitSurvey/src/index.ts`
- Modify: `functions/submitSurvey/index.js`

**Interfaces:**
- Produces: `deliverFemaleClientReport`；审计 `hospital_female_wecom_report_notification`；男女交付器按 `report.kind` 隔离。

- [ ] **Step 1: 写失败测试**

断言女性流程依次执行模型、渲染、上传、发送；女性摘要失败仍尝试PDF；PDF失败不抛出到提交接口；男性报告仍调用男性交付器；错误日志只有阶段和安全数字错误码。

- [ ] **Step 2: 红灯测试**

Run: `npm test -- --run functions/submitSurvey/src/female-report-delivery.test.ts functions/submitSurvey/src/notification-workflow.test.ts`  
Expected: FAIL。

- [ ] **Step 3: 实现分型工作流**

`notification.report.kind`只允许 `male | female`。默认依赖包含 `deliverMaleReport` 和 `deliverFemaleReport`；女性审计动作固定为 `hospital_female_wecom_report_notification`。`index.ts`继续只写入动作、状态和时间，不写Webhook或上游响应。

- [ ] **Step 4: 测试、打包和提交**

Run: `npm test -- --run functions/submitSurvey/src/female-report-delivery.test.ts functions/submitSurvey/src/notification-workflow.test.ts && npm run build:functions`  
Expected: PASS。

```bash
git add functions/submitSurvey/src/female-report-delivery.ts functions/submitSurvey/src/female-report-delivery.test.ts functions/submitSurvey/src/notification-workflow.ts functions/submitSurvey/src/notification-workflow.test.ts functions/submitSurvey/src/index.ts functions/submitSurvey/index.js
git commit -m "feat: deliver and audit female reports"
```

### Task 10: 可访问性、部署文档和三品牌回归

**Files:**
- Modify: `src/female/FemaleSurveyApp.tsx`
- Modify: `src/female/female-survey.css`
- Modify: `docs/cloudbase-deployment.md`

- [ ] **Step 1: 运行全量测试与构建**

Run: `npm test -- --run && npm run typecheck && npm run build:all`  
Expected: 所有测试、男性、女性、诺玛元一和云函数构建通过。

- [ ] **Step 2: 执行UI与可访问性检查**

检查欢迎页、普通单选、多选、条件题、医学安全题、滑块、错误态、完成页；验证键盘导航、焦点、ARIA、44px触控区、4.5:1对比度和减少动画设置。对确认的问题增加测试后修复。

- [ ] **Step 3: 更新部署文档**

记录女性构建命令、输出目录、生产链接、`female-health-v1.0`、同Webhook摘要+PDF、审计动作和部署顺序，不写环境变量值。

- [ ] **Step 4: 安全审计与提交**

Run: `npm audit --omit=dev && npm audit --omit=dev --prefix functions/submitSurvey && npm audit --omit=dev --prefix functions/adminSurvey && git diff --check`  
Expected: 三个生产依赖树0漏洞，diff无格式错误。

```bash
git add src/female docs/cloudbase-deployment.md
git commit -m "docs: document hospital female survey deployment"
```

### Task 11: PDF视觉QA与本地端到端验证

**Files:**
- Modify: `functions/submitSurvey/src/female-report-pdf.ts`
- Modify: `functions/submitSurvey/src/female-report-pdf.test.ts`
- Modify: `src/female/FemaleSurveyApp.tsx`
- Modify: `src/female/FemaleSurveyApp.test.tsx`
- Modify: `src/female/tokens.css`
- Modify: `src/female/female-survey.css`

- [ ] **Step 1: 生成并渲染女性PDF**

Run: `npm run report:female-sample && pdfinfo output/pdf/建始民族医院_女性健康评估报告_虚构女性用户_JS-FEMALE-VISUAL-TEST.pdf`  
Expected: 3页、A4、未加密。

- [ ] **Step 2: 渲染三页PNG并逐页检查**

使用PDF技能规定的渲染工具，检查黑块、中文字体、裁切、重叠、页码、对齐和信息层级。发现问题时先写回归测试，再修改PDF布局。

- [ ] **Step 3: 浏览器检查独立路径**

本地启动女性构建，检查手机宽度和桌面宽度；确认条件题、返回、恢复草稿、完成流程和男性/诺玛入口互不串线。

- [ ] **Step 4: 完整验证和提交修正**

Run: `npm test -- --run && npm run typecheck && npm run build:all && git diff --check`  
Expected: 全部通过。

如有视觉修正：

```bash
git add functions/submitSurvey/src/female-report-pdf.ts functions/submitSurvey/src/female-report-pdf.test.ts src/female
git commit -m "fix: polish hospital female survey visuals"
```

### Task 12: 腾讯云部署、企业微信验收、清理与GitHub交付

**Files:**
- No source changes expected after verification.

- [ ] **Step 1: 部署云函数**

Run: `npx -y -p @cloudbase/cli tcb fn deploy submitSurvey -e yuecheng-survey-d4fucklsf6b68aaf --force --json`  
Expected: `submitSurvey`部署成功，Active、Nodejs20.19、30秒。

- [ ] **Step 2: 部署女性静态目录**

Run: `npx -y -p @cloudbase/cli tcb hosting deploy dist-women-health-survey women-health-survey -e yuecheng-survey-d4fucklsf6b68aaf --json`  
Expected: 只把女性构建上传到 `/women-health-survey/`，不覆盖 `/health-survey/` 或 `/nuoma-yuanyi-survey/`。

- [ ] **Step 3: 线上页面冒烟测试**

打开女性生产链接，确认标题、样式、55题流程、条件逻辑、提交接口和完成页加载正常。

- [ ] **Step 4: 虚构端到端提交**

使用姓名“企业微信女性报告验收（虚构）”、手机号`13800000000`、无医学红旗但包含生命周期/睡眠/代谢变化信号的完整答案提交。记录确认编号和会话ID。

- [ ] **Step 5: 查询审计**

确认：

```text
hospital_female_wecom_notification        sent
hospital_female_wecom_report_notification sent
```

- [ ] **Step 6: 清理测试数据**

仅按该次 `clientSubmissionId` 精确查询会话ID，删除五个集合中的对应记录，再分别计数验证为0。企业微信群测试消息无法撤回，在交付说明中明确告知。

- [ ] **Step 7: 最终全量验证**

Run: `npm test -- --run && npm run typecheck && npm run build:all && npm audit --omit=dev && npm audit --omit=dev --prefix functions/submitSurvey && npm audit --omit=dev --prefix functions/adminSurvey && git diff --check`  
Expected: 测试0失败、三品牌构建通过、生产依赖0漏洞、工作树干净。

- [ ] **Step 8: 合并、推送和CI**

合并功能分支到 `main`，再次运行测试，推送 `origin main`，等待 `Verify health survey` GitHub Actions成功后清理受控工作树和功能分支。
