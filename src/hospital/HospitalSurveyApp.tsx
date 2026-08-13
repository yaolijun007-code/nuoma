import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowRight, Check, Clock3, Save, ShieldCheck } from "lucide-react";
import type { SurveyBrand } from "../brand";
import type { AnswerMap, AnswerValue, AssessmentResult } from "../domain/types";
import { submitSurvey } from "../services/submission";
import { getVisibleSurveyPages, pruneHiddenAnswers } from "./navigation";
import { hospitalModules } from "./surveyDefinition";
import { validateHospitalQuestion } from "./validation";
import { CompletionPage } from "./components/CompletionPage";
import { ModuleIntro } from "./components/ModuleIntro";
import { QuestionPage } from "./components/QuestionPage";
import { SurveyShell } from "./components/SurveyShell";

type Phase = "welcome" | "survey" | "complete";
const today = () => new Date().toISOString().slice(0, 10);

export function HospitalSurveyApp({ brand }: { brand: SurveyBrand }) {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [consent, setConsent] = useState(false);
  const [answers, setAnswers] = useState<AnswerMap>({ date: today() });
  const answersRef = useRef(answers);
  const [currentPageId, setCurrentPageId] = useState("intro:identity");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [confirmationId, setConfirmationId] = useState("");
  const [clientSubmissionId] = useState(() => globalThis.crypto?.randomUUID?.() ?? `web-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const headingRef = useRef<HTMLElement | null>(null);

  const pages = useMemo(() => getVisibleSurveyPages(answers), [answers]);
  const page = pages.find((item) => item.id === currentPageId) ?? pages[0];
  const module = hospitalModules.find((item) => item.id === page?.moduleId) ?? hospitalModules[0];
  const questionPages = pages.filter((item) => item.kind === "question");
  const questionIndex = Math.max(0, questionPages.findIndex((item) => item.id === currentPageId));
  const progress = questionPages.length ? Math.min(100, ((questionIndex + (page?.kind === "question" ? 1 : 0)) / questionPages.length) * 100) : 0;
  const safetyTone = page?.kind === "question" ? page.question.tone : page?.tone;
  const moduleTitle = safetyTone === "safety" ? "医学安全信息" : module.title;

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => {
    document.documentElement.dataset.surveyBrand = brand.id;
    document.title = brand.pageTitle;
    return () => { delete document.documentElement.dataset.surveyBrand; };
  }, [brand]);
  useEffect(() => {
    if (phase !== "survey") return;
    window.scrollTo({ top: 0 });
    window.setTimeout(() => {
      headingRef.current = document.querySelector<HTMLElement>(".page-enter h1");
      headingRef.current?.focus();
    }, 0);
  }, [currentPageId, phase]);

  const advanceFrom = async (pageId: string, currentAnswers = answersRef.current) => {
    const visible = getVisibleSurveyPages(currentAnswers);
    const index = visible.findIndex((item) => item.id === pageId);
    const next = visible[index + 1];
    if (next) {
      setCurrentPageId(next.id);
      setError("");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const submitted = await submitSurvey(currentAnswers, clientSubmissionId, honeypot, brand.questionnaireVersion);
      setResult(submitted.assessment);
      setConfirmationId(submitted.confirmationId);
      setPhase("complete");
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const continueCurrent = () => {
    if (!page) return;
    if (page.kind === "question") {
      const nextError = validateHospitalQuestion(page.question, answersRef.current);
      if (nextError) { setError(nextError); return; }
    }
    void advanceFrom(page.id);
  };

  const updateAnswer = (id: string, value: AnswerValue) => {
    const next = pruneHiddenAnswers({ ...answersRef.current, [id]: value });
    answersRef.current = next;
    setAnswers(next);
    setError("");
  };

  const goBack = () => {
    if (!page) return;
    const visible = getVisibleSurveyPages(answersRef.current);
    const index = visible.findIndex((item) => item.id === page.id);
    if (index <= 0) { setPhase("welcome"); return; }
    setCurrentPageId(visible[index - 1].id);
    setError("");
  };

  if (phase === "complete" && result) return <div className="hospital-survey"><CompletionPage hasRedFlag={result.hasRedFlag} confirmationId={confirmationId} /></div>;

  if (phase === "welcome") return (
    <main className="hospital-survey hospital-welcome">
      <header className="welcome-brand">
        <div className="clinical-brand-mark" aria-hidden="true"><Activity /></div>
        <div><strong>建始民族医院</strong><span>衰老与健康管理中心</span></div>
      </header>
      <section className="welcome-content">
        <p className="welcome-kicker">CLINICAL MICROBIOME · MALE</p>
        <h1>男性健康与功能状态评估</h1>
        <p className="welcome-description">帮助我们了解您近期的身体感受、生活方式和功能变化，并与微生态检测结果及已有健康资料进行综合分析。</p>
        <div className="welcome-facts">
          <span><Clock3 aria-hidden="true" />约6—8分钟</span>
          <span><Check aria-hidden="true" />一题一页</span>
          <span><Save aria-hidden="true" />自动保存</span>
        </div>
        <p className="welcome-guidance">请按照过去4周的真实感受选择，无需根据既往体检结果作答。</p>
        <label className="hospital-consent">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          <span>我已了解本问卷用于健康评估参考，并同意按院方隐私说明提交信息。</span>
        </label>
        <button type="button" className="mobile-primary-button" disabled={!consent} onClick={() => setPhase("survey")}>开始评估 <ArrowRight aria-hidden="true" /></button>
        <p className="welcome-privacy"><ShieldCheck aria-hidden="true" />健康信息将按院内要求安全保存</p>
      </section>
      <footer>上海诺玛元一生物科技发展有限公司 · 技术支持</footer>
    </main>
  );

  if (!page) return null;
  return (
    <SurveyShell pageId={page.id} moduleId={page.moduleId} moduleTitle={moduleTitle} progress={progress} tone={safetyTone} onBack={goBack}>
      {page.kind === "intro" ? (
        <ModuleIntro title={page.title} description={page.description} tone={page.tone} onContinue={continueCurrent} />
      ) : (
        <QuestionPage
          question={page.question}
          value={answers[page.id]}
          error={error}
          date={String(answers.date ?? today())}
          onChange={(value) => updateAnswer(page.id, value)}
          onContinue={continueCurrent}
          onAutoAdvance={() => void advanceFrom(page.id, answersRef.current)}
          submitting={submitting}
          isLast={questionIndex === questionPages.length - 1}
        />
      )}
      <div className="bot-field" aria-hidden="true"><label htmlFor="website">网站</label><input id="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} /></div>
      {submitError && <div className="mobile-submit-error" role="alert">{submitError}</div>}
    </SurveyShell>
  );
}
