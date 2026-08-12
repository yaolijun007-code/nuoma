# Health Survey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a premium public health questionnaire with 55 numbered questions, eight-domain assessment, medical red-flag handling, draft recovery, and a CloudBase submission backend.

**Architecture:** A Vite/React/TypeScript SPA renders a versioned question schema and stores an expiring local draft. Pure domain modules validate answers and calculate non-diagnostic status cards; a CloudBase HTTP function repeats validation and persists separated identity, answer, and result records.

**Tech Stack:** React 19, TypeScript 5, Vite 7, Vitest, Testing Library, Zod, CloudBase Node SDK, CSS with OKLCH tokens.

## Global Constraints

- Public link; no respondent registration or login.
- Name, age, and phone last four digits are required.
- Do not produce an aging score, body age, or disease diagnosis.
- Questions 49–55 answering yes force `clinical_priority`.
- UI must be mobile-first, vivid, premium, gender-inclusive, keyboard accessible, and WCAG AA.
- Internal rules remain server-side in production.

---

### Task 1: Project foundation and questionnaire schema

**Files:** Create `package.json`, `src/domain/types.ts`, `src/domain/questionnaire.ts`, `src/domain/questionnaire.test.ts`, and tool configuration.

**Interfaces:** Produces `QuestionnaireDefinition`, `Question`, `AnswerMap`, and `maleHealthV1`.

- [ ] Write a failing test asserting version `male-health-v1.0`, 55 uniquely numbered questions, 12 visible sections, and required identity fields.
- [ ] Run `npm test -- src/domain/questionnaire.test.ts` and confirm the module is missing.
- [ ] Implement the types and complete questionnaire configuration.
- [ ] Re-run the focused test and confirm it passes.
- [ ] Commit the schema and test.

### Task 2: Validation, drafts, and assessment rules

**Files:** Create `src/domain/validation.ts`, `src/domain/draft.ts`, `src/domain/assessment.ts` and corresponding tests.

**Interfaces:** Produces `validateStep(sectionId, answers)`, `saveDraft`, `loadDraft`, `clearDraft`, and `assessSurvey(answers): AssessmentResult`.

- [ ] Write failing tests for required identity fields, three-selection limits, draft expiry, sleep/metabolic/male-health/urology/muscle/gut/stress triggers, and all seven red flags.
- [ ] Run the focused tests and verify expected missing-export failures.
- [ ] Implement the minimum pure functions to pass.
- [ ] Re-run focused and full tests.
- [ ] Commit the domain behavior.

### Task 3: Survey interface

**Files:** Create `src/App.tsx`, `src/components/*`, `src/styles.css`, `src/main.tsx`, and component tests.

**Interfaces:** Consumes `maleHealthV1`, validation, draft, and assessment; produces the welcome, wizard, review, and result states.

- [ ] Write failing interaction tests for start, selection, validation, back/next navigation, draft restore, and result rendering.
- [ ] Run the tests and confirm the UI is absent.
- [ ] Implement semantic controls, keyboard focus, live error announcements, responsive cards, and the spectrum progress rail.
- [ ] Re-run tests, typecheck, and build.
- [ ] Commit the customer flow.

### Task 4: CloudBase submission backend

**Files:** Create `functions/submitSurvey/*`, `cloudbaserc.json`, `.env.example`, and backend tests.

**Interfaces:** Accepts `POST { questionnaireVersion, identity, answers, clientSubmissionId, honeypot }`; returns `{ confirmationId, assessment }`.

- [ ] Write failing tests for payload rejection, honeypot rejection, idempotency, separated persistence, and red-flag response.
- [ ] Implement dependency-injected persistence and CloudBase adapters.
- [ ] Run backend and full tests.
- [ ] Document exact CloudBase collections, indexes, permissions, and environment variables.
- [ ] Commit backend code.

### Task 5: Protected management surface

**Files:** Create `src/admin/*`, `functions/adminSurvey/*`, and authorization tests.

**Interfaces:** Produces authenticated list/detail/status/export endpoints; consumes CloudBase identity and `admin` role claims.

- [ ] Write failing authorization and red-flag ordering tests.
- [ ] Implement the protected API and responsive management screens.
- [ ] Run focused tests and verify unauthenticated requests are rejected.
- [ ] Commit management functionality.

### Task 6: Quality and deployment

**Files:** Create `.github/workflows/ci.yml`, `README.md`, and deployment documentation.

**Interfaces:** CI runs `npm ci`, `npm test`, `npm run typecheck`, and `npm run build`; CloudBase serves `dist` and deploys functions through CLI.

- [ ] Add CI and secret-free sample configuration.
- [ ] Run tests, typecheck, build, and accessibility smoke checks locally.
- [ ] Inspect mobile and desktop screenshots; correct verified layout defects.
- [ ] Deploy to environment `yuecheng-survey-d4fucklsf6b68aaf` after verifying the target and authentication.
- [ ] Smoke-test the public URL and confirm a test record reaches the correct collections.
- [ ] Remove test health data, commit, and push `main` to GitHub.

