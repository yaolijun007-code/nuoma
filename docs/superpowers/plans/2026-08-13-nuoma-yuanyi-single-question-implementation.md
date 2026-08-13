# Nuoma Yuanyi Single-Question Survey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert only the Nuoma Yuanyi survey into an accessible one-primary-question-per-page flow while preserving the hospital survey and all submission semantics.

**Architecture:** Add a pure survey-flow module that derives either section pages or grouped question pages from the existing questionnaire definition. App navigation consumes those pages, validates only visible questions, and renders a brand-specific compact stage. Conditional companion inputs remain attached to their primary page.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Vite, CSS, Tencent CloudBase.

## Global Constraints

- Only `nuoma-yuanyi` uses question pages; `hospital` keeps section pages.
- Submission payload, questionnaire version, assessment rules, and CloudBase collections remain unchanged.
- Companion inputs never become standalone pages.
- Single choice does not auto-advance.
- Current-page errors must be announced and focus must move to the invalid page control.
- Use the existing palette and do not add dependencies.

---

### Task 1: Derive Brand-Specific Survey Pages

**Files:**
- Create: `src/domain/survey-flow.ts`
- Create: `src/domain/survey-flow.test.ts`
- Modify: `src/brand.ts`
- Modify: `src/brand.test.ts`

**Interfaces:**
- Produces: `createSurveyPages(mode: SurveyNavigationMode): SurveyPage[]`
- Produces: `visibleQuestionsForPage(page: SurveyPage, answers: AnswerMap): Question[]`
- `SurveyPage` exposes `id`, `sectionId`, `sectionTitle`, `eyebrow`, `description`, and `questions`.

- [ ] **Step 1: Write failing tests** proving Nuoma question mode creates one primary question per page, groups all six companion inputs with their owner, applies companion visibility rules, and hospital mode returns the original 12 sections.
- [ ] **Step 2: Run `npm test -- src/domain/survey-flow.test.ts src/brand.test.ts`** and verify failures describe the missing navigation API.
- [ ] **Step 3: Implement the minimal typed page builder and add `navigationMode: "sections" | "questions"` to each brand.** Question mode must return exactly 64 pages and use the companion-owner map `{ workStatusOther: "workStatus", topConcernsOther: "topConcerns", q25Food: "q25", q44Drink: "q44", q48Details: "q48", twelveWeekGoalsOther: "twelveWeekGoals" }`.
- [ ] **Step 4: Re-run the targeted tests** and expect all to pass.
- [ ] **Step 5: Commit** with `feat: add single-question survey flow`.

### Task 2: Validate Only the Current Question Page

**Files:**
- Modify: `src/domain/validation.ts`
- Modify: `src/domain/validation.test.ts`

**Interfaces:**
- Produces: `validateQuestions(questionIds: string[], answers: AnswerMap): ValidationErrors`
- Preserves: `validateStep(sectionId: string, answers: AnswerMap): ValidationErrors`

- [ ] **Step 1: Write failing tests** proving name-only validation does not report age or phone errors, age validation still enforces 40—55, and full identity section validation remains unchanged.
- [ ] **Step 2: Run `npm test -- src/domain/validation.test.ts`** and verify the new test fails because `validateQuestions` does not exist.
- [ ] **Step 3: Extract shared validation by explicit question IDs and make `validateStep` delegate to it.**
- [ ] **Step 4: Re-run the validation tests** and expect all to pass.
- [ ] **Step 5: Commit** with `refactor: support question-page validation`.

### Task 3: Render and Navigate the Nuoma Question Stage

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/components/QuestionField.tsx`
- Modify: `src/brand.ts`

**Interfaces:**
- App consumes `createSurveyPages`, `visibleQuestionsForPage`, and `validateQuestions`.
- `QuestionField` accepts `focusTarget?: boolean` to expose a programmatic focus destination without changing native input semantics.

- [ ] **Step 1: Write failing component tests** proving Nuoma initially renders only “姓名”, advances to “年龄” after valid input, reports `2 / 64`, reveals a companion input on its owner page, and hospital still renders the full identity section.
- [ ] **Step 2: Run `npm test -- src/App.test.tsx`** and verify failures show multiple Nuoma questions are still visible.
- [ ] **Step 3: Replace section-index navigation with derived page navigation, preserve brand-specific draft storage, focus the new page, and retain submission behavior.**
- [ ] **Step 4: Re-run App and full tests** and expect all to pass.
- [ ] **Step 5: Commit** with `feat: render Nuoma survey one question at a time`.

### Task 4: Create the Compact Single-Question Visual Layout

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Styles target `[data-survey-brand="nuoma-yuanyi"] .single-question-*` and do not alter hospital layout.

- [ ] **Step 1: Add the single-question stage styles**: compact context label, generous whitespace, restrained card, full-width options, bottom navigation, visible focus, and responsive behavior.
- [ ] **Step 2: Run `npm run typecheck && npm run build:all`** and expect successful dual-brand builds.
- [ ] **Step 3: Inspect desktop and 390×844 mobile layouts in the browser**, verify one primary question is visible, navigation is reachable, no horizontal scrolling occurs, and focus/error states are visible.
- [ ] **Step 4: Commit** with `style: simplify Nuoma single-question experience`.

### Task 5: Deploy and Verify

**Files:**
- Modify: `README.md`
- Modify: `docs/cloudbase-deployment.md`

**Interfaces:**
- Deploys `dist-nuoma-yuanyi` to `/nuoma-yuanyi-survey/`.

- [ ] **Step 1: Run `npm test -- --run && npm run typecheck && npm run build:all && npm audit --omit=dev`.**
- [ ] **Step 2: Deploy the Nuoma static build to Tencent CloudBase without replacing `/health-survey/`.**
- [ ] **Step 3: Verify the live page, assets, navigation, conditional companions, refresh recovery, and one fictional end-to-end submission; delete all fictional records afterward.**
- [ ] **Step 4: Push `main`, wait for GitHub Actions, and confirm local and remote commit hashes match.**
