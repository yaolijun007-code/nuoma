# Nuoma Yuanyi Survey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an independently branded “诺玛元一” copy of the current health survey without changing the existing hospital deployment or duplicating questionnaire logic.

**Architecture:** A typed brand registry supplies institution copy, questionnaire version, theme class, draft key, metadata, and Vite base path. The React application, local draft service, submission client, and CloudBase validator consume the selected brand while sharing the existing questionnaire schema and assessment engine. Two production builds deploy to separate CloudBase static paths.

**Tech Stack:** React 19, TypeScript 5, Vite 6, Vitest, Testing Library, CSS OKLCH tokens, CloudBase Node SDK and static hosting.

## Global Constraints

- Preserve the current `/health-survey/` deployment and “建始民族医院” presentation.
- Add `/nuoma-yuanyi-survey/` with company name “诺玛元一” and subtitle “生命健康管理”.
- Use questionnaire version `nuoma-yuanyi-male-health-v1.0` and a separate draft key.
- Keep all 55 numbered questions, validation, eight-domain assessment, red-flag behavior, identity separation and idempotency unchanged.
- Unknown brand builds and unknown questionnaire versions must fail closed.
- UI remains mobile-first, keyboard accessible, WCAG AA, gender-inclusive and free of external font requests.

---

### Task 1: Typed brand registry and isolated draft behavior

**Files:**
- Create: `src/brand.ts`
- Create: `src/brand.test.ts`
- Modify: `src/domain/draft.ts`
- Modify: `src/domain/draft.test.ts`

**Interfaces:**
- Produces: `SurveyBrand`, `brandRegistry`, `getSurveyBrand(id)`, `activeBrand`.
- Updates: `saveDraft(answers, sectionIndex, storage?, now?, key?)`, `loadDraft(storage?, now?, key?)`, `clearDraft(storage?, key?)`.

- [ ] **Step 1: Write failing brand and draft-isolation tests**

```ts
expect(getSurveyBrand("nuoma-yuanyi")).toMatchObject({
  organization: "诺玛元一",
  subtitle: "生命健康管理",
  questionnaireVersion: "nuoma-yuanyi-male-health-v1.0",
  draftKey: "nuoma.yuanyi.male-health.v1.draft",
  basePath: "/nuoma-yuanyi-survey/",
});
expect(() => getSurveyBrand("unknown")).toThrow("未知问卷品牌");
saveDraft({ q1: "1" }, 1, storage, 100, "brand-a");
expect(loadDraft(storage, 101, "brand-b")).toBeNull();
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/brand.test.ts src/domain/draft.test.ts`

Expected: FAIL because `src/brand.ts` and keyed draft parameters do not exist.

- [ ] **Step 3: Implement the registry and keyed draft API**

```ts
export type SurveyBrandId = "hospital" | "nuoma-yuanyi";
export interface SurveyBrand {
  id: SurveyBrandId;
  organization: string;
  subtitle: string;
  eyebrow: string;
  questionnaireVersion: string;
  draftKey: string;
  basePath: string;
  themeClass: string;
  pageTitle: string;
  pageDescription: string;
}

export const brandRegistry: Record<SurveyBrandId, SurveyBrand> = { /* exact two brand records from the design */ };
export function getSurveyBrand(id: string): SurveyBrand {
  const brand = brandRegistry[id as SurveyBrandId];
  if (!brand) throw new Error(`未知问卷品牌：${id}`);
  return brand;
}
export const activeBrand = getSurveyBrand(import.meta.env.VITE_SURVEY_BRAND || "hospital");
```

Draft functions use the passed `key`, defaulting to the existing hospital key so current callers remain compatible.

- [ ] **Step 4: Run focused and full tests and verify GREEN**

Run: `npm test -- src/brand.test.ts src/domain/draft.test.ts && npm test -- --run`

Expected: both focused files and the existing suite pass.

- [ ] **Step 5: Commit**

```bash
git add src/brand.ts src/brand.test.ts src/domain/draft.ts src/domain/draft.test.ts
git commit -m "feat: add isolated survey brand configuration"
```

### Task 2: Brand-aware interface and Nuoma visual system

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/components/BrandMark.tsx`
- Modify: `src/styles.css`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `activeBrand: SurveyBrand`.
- Produces: `App({ brand?: SurveyBrand })` for deterministic testing; root `data-brand` and `themeClass`; updated page metadata.

- [ ] **Step 1: Write failing UI branding tests**

```tsx
render(<App brand={brandRegistry["nuoma-yuanyi"]} />);
expect(screen.getByText("诺玛元一")).toBeInTheDocument();
expect(screen.getByText("生命健康管理")).toBeInTheDocument();
expect(screen.queryByText("建始民族医院")).not.toBeInTheDocument();
expect(document.documentElement).toHaveAttribute("data-survey-brand", "nuoma-yuanyi");
```

Add a compatibility test that renders `brandRegistry.hospital` and still finds “建始民族医院”.

- [ ] **Step 2: Run UI test and verify RED**

Run: `npm test -- src/App.test.tsx`

Expected: FAIL because `App` has no `brand` prop and hospital copy is hard-coded.

- [ ] **Step 3: Pass the brand through the UI**

```tsx
export default function App({ brand = activeBrand }: { brand?: SurveyBrand }) {
  useEffect(() => {
    document.documentElement.dataset.surveyBrand = brand.id;
    document.title = brand.pageTitle;
    return () => { delete document.documentElement.dataset.surveyBrand; };
  }, [brand]);
  // use brand.organization, brand.subtitle, brand.eyebrow,
  // brand.questionnaireVersion and brand.draftKey at existing call sites
}
```

`BrandMark` receives `variant={brand.id}` and renders the existing three-bar mark for hospital or an accessible decorative center-dot/orbit structure for Nuoma Yuanyi.

- [ ] **Step 4: Add scoped Nuoma Yuanyi design tokens and components**

```css
:root[data-survey-brand="nuoma-yuanyi"] {
  --ink: oklch(0.22 0.055 172);
  --ink-soft: oklch(0.43 0.045 170);
  --paper: oklch(0.985 0.012 92);
  --surface: oklch(1 0 0 / .9);
  --line: oklch(0.88 0.035 155);
  --violet: oklch(0.67 0.19 158);
  --violet-dark: oklch(0.45 0.15 162);
  --cyan: oklch(0.84 0.12 164);
  --coral: oklch(0.78 0.14 78);
  --safe: oklch(0.64 0.16 152);
  --danger: oklch(0.57 0.21 27);
  --shadow: 0 28px 90px oklch(0.25 0.08 165 / .16);
}
```

Override welcome background, hero, button, progress, selected options and result cards under `[data-survey-brand="nuoma-yuanyi"]`. Preserve focus rings and `prefers-reduced-motion`.

- [ ] **Step 5: Run UI tests, typecheck and build**

Run: `npm test -- src/App.test.tsx && npm run typecheck && npm run build`

Expected: PASS; hospital production build remains under `/health-survey/`.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/components/BrandMark.tsx src/styles.css src/main.tsx
git commit -m "feat: add Nuoma Yuanyi emerald brand experience"
```

### Task 3: Brand-specific builds and metadata

**Files:**
- Modify: `vite.config.ts`
- Modify: `src/domain/cloudbase-config.test.ts`
- Modify: `package.json`
- Create: `scripts/write-brand-html.mjs`
- Modify: `index.html`
- Modify: `README.md`

**Interfaces:**
- Produces: `npm run build:hospital`, `npm run build:nuoma-yuanyi`, and brand-specific `base` configuration.

- [ ] **Step 1: Write failing config tests**

```ts
expect(resolveBrandBase("hospital")).toBe("/health-survey/");
expect(resolveBrandBase("nuoma-yuanyi")).toBe("/nuoma-yuanyi-survey/");
expect(() => resolveBrandBase("unknown")).toThrow("未知问卷品牌");
```

- [ ] **Step 2: Run config tests and verify RED**

Run: `npm test -- src/domain/cloudbase-config.test.ts`

Expected: FAIL because `resolveBrandBase` is missing.

- [ ] **Step 3: Implement environment-driven base and scripts**

```ts
export const resolveBrandBase = (id = "hospital") => {
  if (id === "hospital") return "/health-survey/";
  if (id === "nuoma-yuanyi") return "/nuoma-yuanyi-survey/";
  throw new Error(`未知问卷品牌：${id}`);
};
export default defineConfig({ base: resolveBrandBase(process.env.VITE_SURVEY_BRAND), plugins: [react()] });
```

Package scripts set `VITE_SURVEY_BRAND` and distinct `--outDir` values. The HTML metadata script writes brand title and description before each build without external assets.

- [ ] **Step 4: Build both brands and inspect artifacts**

Run: `npm run build:hospital && npm run build:nuoma-yuanyi`

Expected: `dist-hospital/index.html` references `/health-survey/assets/`; `dist-nuoma-yuanyi/index.html` references `/nuoma-yuanyi-survey/assets/` and contains “诺玛元一”.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts src/domain/cloudbase-config.test.ts package.json scripts/write-brand-html.mjs index.html README.md
git commit -m "build: add independent Nuoma Yuanyi bundle"
```

### Task 4: Server version allowlist and end-to-end deployment

**Files:**
- Modify: `src/services/submission.ts`
- Modify: `src/domain/submission.ts`
- Modify: `src/domain/submission.test.ts`
- Modify: `functions/submitSurvey/src/index.ts`
- Regenerate: `functions/submitSurvey/index.js`
- Modify: `docs/cloudbase-deployment.md`

**Interfaces:**
- `submitSurvey(answers, clientSubmissionId, honeypot?, questionnaireVersion?)` sends the selected explicit version.
- Server allowlist accepts only `male-health-v1.0` and `nuoma-yuanyi-male-health-v1.0`.

- [ ] **Step 1: Write failing server allowlist tests**

```ts
const nuoma = { ...validPayload, questionnaireVersion: "nuoma-yuanyi-male-health-v1.0" };
await expect(service.submit(nuoma)).resolves.toMatchObject({ confirmationId: expect.any(String) });
expect(saved.session.questionnaireVersion).toBe("nuoma-yuanyi-male-health-v1.0");
await expect(service.submit({ ...validPayload, questionnaireVersion: "unknown" }))
  .rejects.toMatchObject({ code: "INVALID_PAYLOAD" });
```

- [ ] **Step 2: Run submission tests and verify RED**

Run: `npm test -- src/domain/submission.test.ts`

Expected: Nuoma Yuanyi version is rejected by the current single-version check.

- [ ] **Step 3: Implement explicit two-version allowlist**

```ts
export const supportedQuestionnaireVersions = new Set([
  "male-health-v1.0",
  "nuoma-yuanyi-male-health-v1.0",
]);
if (!payload.questionnaireVersion || !supportedQuestionnaireVersions.has(payload.questionnaireVersion)) {
  throw new SubmissionError("INVALID_PAYLOAD", "问卷版本不受支持");
}
```

Pass `brand.questionnaireVersion` from `App` into the client submission service.

- [ ] **Step 4: Run full verification**

Run: `npm test -- --run && npm run typecheck && npm run build:hospital && npm run build:nuoma-yuanyi && npm run build:functions && npm audit --omit=dev`

Expected: all tests and builds pass, production audit reports zero vulnerabilities.

- [ ] **Step 5: Deploy and smoke-test**

Run:

```bash
npx -y -p @cloudbase/cli tcb fn deploy submitSurvey -e yuecheng-survey-d4fucklsf6b68aaf --force
npx -y -p @cloudbase/cli tcb hosting deploy dist-nuoma-yuanyi nuoma-yuanyi-survey -e yuecheng-survey-d4fucklsf6b68aaf
```

Verify public HTML, JS and CSS return 200. Submit one fully fictional payload with the Nuoma version, confirm the session stores that version and all five documents share the same `sessionId`, then delete exactly those five fictional documents.

- [ ] **Step 6: Commit and push**

```bash
git add src functions docs README.md package.json package-lock.json vite.config.ts scripts index.html
git commit -m "feat: launch Nuoma Yuanyi survey"
git push origin main
gh run watch --repo yaolijun007-code/nuoma --exit-status
```

Expected: remote `main` matches local HEAD and GitHub Actions completes successfully.
