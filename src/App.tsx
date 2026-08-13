import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Clock3, HeartPulse, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "./components/BrandMark";
import { QuestionField } from "./components/QuestionField";
import { ResultView } from "./components/ResultView";
import { clearDraft, loadDraft, saveDraft } from "./domain/draft";
import { createSurveyPages, visibleQuestionsForPage } from "./domain/survey-flow";
import type { AnswerMap, AnswerValue, AssessmentResult } from "./domain/types";
import { validateQuestions, validateStep, type ValidationErrors } from "./domain/validation";
import { submitSurvey } from "./services/submission";
import { activeBrand, type SurveyBrand } from "./brand";
import "./styles.css";

type Phase = "welcome" | "survey" | "result";

const today = () => new Date().toISOString().slice(0, 10);

export default function App({ brand = activeBrand }: { brand?: SurveyBrand }) {
  const pages = useMemo(() => createSurveyPages(brand.navigationMode), [brand.navigationMode]);
  const restored = useMemo(() => loadDraft(undefined, undefined, brand.draftKey), [brand.draftKey]);
  const [phase, setPhase] = useState<Phase>("welcome");
  const [consent, setConsent] = useState(false);
  const [pageIndex, setPageIndex] = useState(Math.min(restored?.sectionIndex ?? 0, pages.length - 1));
  const [answers, setAnswers] = useState<AnswerMap>(restored?.answers ?? { date: today() });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [confirmationId, setConfirmationId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [clientSubmissionId] = useState(() => globalThis.crypto?.randomUUID?.() ?? `web-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const page = pages[pageIndex];
  const visibleQuestions = visibleQuestionsForPage(page, answers);
  const progress = ((pageIndex + 1) / pages.length) * 100;
  const isQuestionMode = brand.navigationMode === "questions";

  useEffect(() => {
    if (phase === "survey") saveDraft(answers, pageIndex, undefined, undefined, brand.draftKey);
  }, [answers, brand.draftKey, pageIndex, phase]);

  useEffect(() => {
    document.documentElement.dataset.surveyBrand = brand.id;
    document.documentElement.classList.add(brand.themeClass);
    document.title = brand.pageTitle;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    description?.setAttribute("content", brand.pageDescription);
    return () => {
      delete document.documentElement.dataset.surveyBrand;
      document.documentElement.classList.remove(brand.themeClass);
    };
  }, [brand]);

  useEffect(() => {
    if (phase === "survey") headingRef.current?.focus();
  }, [pageIndex, phase]);

  const setAnswer = (id: string, value: AnswerValue) => {
    setAnswers((current) => ({ ...current, [id]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const goNext = async () => {
    const nextErrors = isQuestionMode
      ? validateQuestions(visibleQuestions.map(({ id }) => id), answers)
      : validateStep(page.sectionId, answers);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      window.setTimeout(() => {
        const first = Object.keys(nextErrors)[0];
        document.querySelector<HTMLElement>(`#field-${first} input`)?.focus();
      }, 0);
      return;
    }
    setErrors({});
    if (pageIndex < pages.length - 1) {
      setPageIndex((index) => index + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const submitted = await submitSurvey(answers, clientSubmissionId, honeypot, brand.questionnaireVersion);
      setResult(submitted.assessment);
      setConfirmationId(submitted.confirmationId);
      clearDraft(undefined, brand.draftKey);
      setPhase("result");
      window.scrollTo({ top: 0 });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === "result" && result) return <ResultView result={result} confirmationId={confirmationId} />;

  if (phase === "welcome") {
    return (
      <main className="welcome-shell">
        <div className="ambient ambient-one" aria-hidden="true" />
        <div className="ambient ambient-two" aria-hidden="true" />
        <header className="institution">
          <BrandMark variant={brand.id} />
          <div><strong>{brand.organization}</strong><span>{brand.subtitle}</span></div>
        </header>

        <section className="welcome-card">
          <div className="spectrum-orbit" aria-hidden="true"><HeartPulse /></div>
          <p className="eyebrow">{brand.eyebrow}</p>
          <h1><span>读懂身体正在发生的</span><br /><em>细微变化</em></h1>
          <p className="welcome-lead">一份面向40—55岁男性的功能状态问卷。用真实体感，为后续检测选择与12周健康管理提供参考。</p>
          <div className="fact-row">
            <span><Clock3 aria-hidden="true" />约6—8分钟</span>
            <span><Sparkles aria-hidden="true" />{isQuestionMode ? "64个轻量问题" : "12个简短步骤"}</span>
            <span><LockKeyhole aria-hidden="true" />健康信息受保护</span>
          </div>
          {restored && <div className="restore-note">检测到48小时内的未完成记录，开始后将从上次位置继续。</div>}
          <label className="consent-row">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>我已阅读并理解：本问卷用于健康评估参考，不替代医学诊断；我同意按{brand.consentOwner}隐私说明提交信息。</span>
          </label>
          <button className="primary-button" disabled={!consent} onClick={() => setPhase("survey")}>
            开始填写 <ArrowRight aria-hidden="true" />
          </button>
          <p className="privacy-line"><ShieldCheck aria-hidden="true" />姓名与健康答案分开保存，公开页面无法查询他人记录。</p>
        </section>
      </main>
    );
  }

  return (
    <div className={`survey-shell ${isQuestionMode ? "single-question-shell" : ""}`}>
      <header className="survey-header">
        <div className="survey-brand"><BrandMark variant={brand.id} /><span>{brand.organization}</span></div>
        <span className="step-count" aria-live="polite" aria-atomic="true">{pageIndex + 1} / {pages.length}</span>
        <div className="progress-track" aria-label={`问卷进度 ${Math.round(progress)}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className={`survey-main ${isQuestionMode ? "single-question-main" : ""}`}>
        <section className={`section-intro ${isQuestionMode ? "single-question-context" : ""}`}>
          <p className="eyebrow">{isQuestionMode ? page.sectionTitle : page.eyebrow}</p>
          <h1 ref={headingRef} tabIndex={-1}>{isQuestionMode ? page.questions[0].prompt : page.sectionTitle}</h1>
          {!isQuestionMode && (page.sectionId === "identity" ? brand.identityDescription : page.description) && (
            <p>{page.sectionId === "identity" ? brand.identityDescription : page.description}</p>
          )}
        </section>

        {Object.keys(errors).length > 0 && <div className="error-summary" role="alert"><strong>还有内容需要完成</strong><span>请检查下方标记的项目。</span></div>}

        <form onSubmit={(event) => { event.preventDefault(); void goNext(); }} noValidate>
          <div className="bot-field" aria-hidden="true">
            <label htmlFor="website">网站</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
          </div>
          <div className={`questions-stack ${isQuestionMode ? "single-question-stage" : ""}`}>
            {visibleQuestions.map((question, questionIndex) => (
              <QuestionField
                key={question.id}
                question={question}
                value={answers[question.id]}
                error={errors[question.id]}
                hidePrompt={isQuestionMode && questionIndex === 0}
                onChange={(value) => setAnswer(question.id, value)}
              />
            ))}
          </div>
          <nav className="form-actions" aria-label="问卷步骤">
            <button type="button" className="secondary-button" disabled={pageIndex === 0} onClick={() => { setErrors({}); setPageIndex((index) => Math.max(0, index - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <ArrowLeft aria-hidden="true" /> {isQuestionMode ? "上一题" : "上一步"}
            </button>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? "正在安全提交…" : pageIndex === pages.length - 1 ? "完成评估" : isQuestionMode ? "下一题" : "下一步"} <ArrowRight aria-hidden="true" />
            </button>
          </nav>
          {submitError && <div className="error-summary submit-error" role="alert"><strong>暂时无法提交</strong><span>{submitError}</span></div>}
        </form>
        <p className="autosave">已在本机自动保存 · 提交后将清除本地草稿</p>
      </main>
    </div>
  );
}
