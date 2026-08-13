# Mobile Clinical Survey Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将建始民族医院版问卷重构为白色青绿、一题一页、配置化分支且兼容现有 CloudBase 业务链路的移动端正式产品。

**Architecture:** 保留现有 legacy 应用供诺玛元一构建使用，由根 `App` 按品牌选择新 `HospitalSurveyApp` 或旧应用。医院版使用独立页面定义与纯函数导航/归一化层；CloudBase 存储结构不变，在提交服务边界兼容新旧负载并异步发送企业微信通知。

**Tech Stack:** React 19、TypeScript 5.7、Vite 6、Vitest、Testing Library、CloudBase Node SDK、原生 CSS 与 Lucide SVG。

## Global Constraints

- 医院版一页只完成一个主要问题；普通单选约 190ms 后自动前进。
- 只有姓名和完整手机号需要手工输入；日期自动生成。
- 375px、390px、393px、430px优先，桌面内容最大宽度480px。
- 客户端不显示0—4分、医学规则、疾病判断或衰老总分。
- 白色和中性色约85%，品牌青绿约12%，其他辅助色约3%。
- 不引入大型UI或动画库；动效只使用 opacity、transform 和短时 transition。
- Q1—Q55医学含义、评分阈值和红旗处理保持不变。
- 诺玛元一现有路径、版本、草稿和视觉继续可构建运行。

---

### Task 1: 医院版页面定义与配置化导航

**Files:**
- Create: `src/hospital/surveyDefinition.ts`
- Create: `src/hospital/navigation.ts`
- Create: `src/hospital/navigation.test.ts`
- Modify: `src/domain/types.ts`

**Interfaces:**
- Produces: `hospitalSurvey`, `getVisibleSurveyPages(answers)`, `updateExclusiveSelection(question, selected, option)`、`pruneHiddenAnswers(answers)`。
- Consumes: 现有 `QuestionOption` 和 Q1—Q55选项语义。

- [ ] 先写失败测试，断言医院版包含十个模块、55个唯一题号，Q25/Q44/Q48条件页按配置出现，Q47/Q48互斥，最终目标选项来自 `topConcerns`。
- [ ] 运行 `npm test -- src/hospital/navigation.test.ts`，确认因模块不存在而失败。
- [ ] 实现带 `visibleWhen`、`exclusiveOption`、`optionsFromAnswerId`、`tone`、`autoAdvance` 的页面定义和纯函数导航。
- [ ] 再次运行定向测试，确认通过后提交 `feat: define mobile survey flow`。

### Task 2: 新旧答案校验与服务端归一化

**Files:**
- Create: `src/hospital/validation.ts`
- Create: `src/hospital/validation.test.ts`
- Create: `src/hospital/normalize.ts`
- Create: `src/hospital/normalize.test.ts`
- Modify: `src/domain/submission.ts`
- Modify: `src/domain/submission.test.ts`
- Modify: `functions/adminSurvey/src/index.ts`

**Interfaces:**
- Produces: `validateHospitalPage(page, answers)`、`validateHospitalSubmission(answers)`、`normalizeHospitalAnswers(answers)`。
- Normalized identity: `{ name, phone, phoneLast4, age: null }`；normalized health answers保留Q1—Q55和兼容空字段。

- [ ] 写手机号、必答页、敏感题跳过、Q47映射、旧字段空值和旧负载继续接受的失败测试。
- [ ] 运行定向测试确认失败原因是新校验/归一化API不存在。
- [ ] 实现医院负载识别、校验、白名单和归一化；旧医院与诺玛元一仍走现有校验。
- [ ] 更新管理员列表同时返回完整手机号与后4位，运行提交、管理和评估测试。
- [ ] 提交 `feat: normalize mobile survey submissions`。

### Task 3: 一题一页React交互

**Files:**
- Move current implementation to: `src/legacy/LegacySurveyApp.tsx`
- Create: `src/hospital/HospitalSurveyApp.tsx`
- Create: `src/hospital/HospitalSurveyApp.test.tsx`
- Create: `src/hospital/components/SurveyShell.tsx`
- Create: `src/hospital/components/SurveyHeader.tsx`
- Create: `src/hospital/components/QuestionPage.tsx`
- Create: `src/hospital/components/ChoiceGroup.tsx`
- Create: `src/hospital/components/IdentityInput.tsx`
- Create: `src/hospital/components/ModuleIntro.tsx`
- Create: `src/hospital/components/CompletionPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- `HospitalSurveyApp` consumes `SurveyBrand` and submits through现有 `submitSurvey`。
- `ChoiceGroup` receives a question/value and emits one answer; it never renders option score/value text.

- [ ] 写失败组件测试：克制首页、草稿恢复选择、姓名/手机号输入、单选自动前进、多选继续、返回保持答案、Q55不自动前进、完成页隐藏八维细节。
- [ ] 运行定向测试确认旧App无法满足一题一页。
- [ ] 将旧App原样移入legacy，仅让医院品牌进入新应用。
- [ ] 实现新组件、190ms自动前进、动态可见页、分支清理、焦点管理、键盘Enter和错误关联。
- [ ] 运行医院组件测试及原有品牌测试，提交 `feat: build one-question mobile experience`。

### Task 4: 医院版Design Tokens与移动端视觉

**Files:**
- Create: `src/hospital/tokens.css`
- Create: `src/hospital/mobile-survey.css`
- Modify: `index.html`
- Modify: `src/hospital/HospitalSurveyApp.test.tsx`

**Interfaces:**
- `tokens.css`定义颜色、间距、圆角、字体、阴影、时长和safe-area变量。
- `.hospital-survey`为全部新样式作用域，legacy CSS不受影响。

- [ ] 写结构测试断言选项具有非颜色Check状态、图标可隐藏、输入autocomplete/inputmode和安全区类名。
- [ ] 实现纯白主背景、480px内容列、56px触控卡、青绿选中态、橙色安全模块、十段进度和180ms页面进入动效。
- [ ] 加入 `prefers-reduced-motion`、`:focus-visible`、16px输入字号和 `env(safe-area-inset-bottom)`。
- [ ] 运行组件与无障碍相关测试，提交 `style: apply clinical microbiome design system`。

### Task 5: 医院版草稿恢复与完成流程

**Files:**
- Create: `src/hospital/draft.ts`
- Create: `src/hospital/draft.test.ts`
- Modify: `src/hospital/HospitalSurveyApp.tsx`
- Modify: `src/hospital/components/CompletionPage.tsx`

**Interfaces:**
- Produces: `saveHospitalDraft({ answers, currentPageId })`、`loadHospitalDraft()`、`clearHospitalDraft()`。

- [ ] 写48小时有效期、继续填写、重新开始、提交清除和失效分支清除测试并确认失败。
- [ ] 实现医院独立草稿键和恢复入口；自动日期每次新建时写入，恢复时保留原日期。
- [ ] 完成页展示五项采集清单、三步流程和红旗温和提示。
- [ ] 运行测试，提交 `feat: add resilient mobile draft flow`。

### Task 6: 企业微信通知适配与失败隔离

**Files:**
- Create: `functions/submitSurvey/src/wecom.ts`
- Create: `src/domain/wecom.test.ts`
- Modify: `functions/submitSurvey/src/index.ts`
- Modify: `scripts/build-functions.mjs`
- Modify: `docs/cloudbase-deployment.md`

**Interfaces:**
- `buildWeComMarkdown(record, sessionId)`返回医院品牌、脱敏手机号、人工复核级别和确认编号文案。
- `notifyWeCom(url, markdown)`失败只写审计日志，不回滚五表数据，也不向客户端泄露webhook信息。

- [ ] 写通知文案脱敏、红旗级别和无配置时跳过的失败测试。
- [ ] 实现无第三方依赖的HTTPS发送与超时；在新记录落库后异步通知并记录审计状态。
- [ ] 构建云函数并验证浏览器包不包含通知地址或服务端规则。
- [ ] 提交 `feat: notify hospital survey submissions`。

### Task 7: 全量测试、CloudBase验收与交付

**Files:**
- Modify: `README.md`
- Modify: `docs/cloudbase-deployment.md`
- Create: `docs/mobile-redesign-verification.md`

**Interfaces:**
- Deployment remains `/health-survey/` and `/api/submit-survey`。

- [ ] 运行 `npm test -- --run`、`npm run typecheck`、`npm run build:all`、`npm audit --omit=dev`。
- [ ] 本地启动医院版，在375、390、430、1440宽度完成首页、输入、单选、多选、返回修改、三类条件分支、男性活力、医学安全、完成页和刷新恢复测试。
- [ ] 部署医院静态资源和 `submitSurvey`；使用明确标注的虚构数据验证五集合、红旗与企业微信通知，再按精确ID清理测试记录。
- [ ] 复核公开URL资源状态、控制台错误、CORS、未认证管理接口401和两个云函数状态。
- [ ] 更新交付文档，提交、合并 `main`、推送GitHub并等待Actions通过。

