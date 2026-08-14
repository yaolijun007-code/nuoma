import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Clock3, Flower2, Save, ShieldCheck, Sparkles } from "lucide-react";
import type { SurveyBrand } from "../brand";
import type { AnswerMap, AnswerValue, AssessmentResult } from "../domain/types";
import { clearHospitalDraft, loadHospitalDraft, saveHospitalDraft } from "../hospital/draft";
import { CompletionPage } from "../hospital/components/CompletionPage";
import { ModuleIntro } from "../hospital/components/ModuleIntro";
import { QuestionPage } from "../hospital/components/QuestionPage";
import { SurveyShell } from "../hospital/components/SurveyShell";
import { submitSurvey } from "../services/submission";
import { applyFemaleMultiChoice, getFemaleSurveyProgress, getVisibleFemalePages, pruneHiddenFemaleAnswers } from "./navigation";
import { femaleModules } from "./surveyDefinition";
import { validateFemaleQuestion } from "./validation";
import "../hospital/tokens.css";
import "../hospital/mobile-survey.css";
import "./female-survey.css";

type Phase = "welcome" | "survey" | "complete";
const today = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

export function FemaleSurveyApp({ brand }: { brand: SurveyBrand }) {
  const restored = useMemo(() => loadHospitalDraft(brand.draftKey), [brand.draftKey]);
  const [hasDraft, setHasDraft] = useState(Boolean(restored));
  const [phase, setPhase] = useState<Phase>("welcome");
  const [consent, setConsent] = useState(false);
  const [answers, setAnswers] = useState<AnswerMap>(restored?.answers ?? { f3: today() });
  const answersRef = useRef(answers);
  const [currentPageId, setCurrentPageId] = useState(restored?.currentPageId ?? "f1");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [confirmationId, setConfirmationId] = useState("");
  const [clientSubmissionId] = useState(() => globalThis.crypto?.randomUUID?.() ?? `web-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const pages = useMemo(() => getVisibleFemalePages(answers), [answers]);
  const page = pages.find((item) => item.id === currentPageId) ?? pages[0];
  const module = femaleModules.find((item) => item.id === page?.moduleId) ?? femaleModules[0];
  const questionPages = pages.filter((item) => item.kind === "question");
  const questionIndex = Math.max(0, questionPages.findIndex((item) => item.id === currentPageId));
  const progress = getFemaleSurveyProgress(pages, currentPageId);
  const safetyTone = page?.kind === "question" ? page.question.tone : undefined;

  useEffect(() => { answersRef.current = answers; }, [answers]);
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
    if (phase === "survey") saveHospitalDraft(answers, currentPageId, brand.draftKey);
  }, [answers, brand.draftKey, currentPageId, phase]);
  useEffect(() => {
    if (phase !== "survey") return;
    window.scrollTo({ top: 0 });
    window.setTimeout(() => document.querySelector<HTMLElement>(".page-enter h1")?.focus(), 0);
  }, [currentPageId, phase]);

  const advanceFrom = async (pageId: string, currentAnswers = answersRef.current) => {
    const visible = getVisibleFemalePages(currentAnswers);
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
      clearHospitalDraft(brand.draftKey);
      setHasDraft(false);
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
      const nextError = validateFemaleQuestion(page.question, answersRef.current);
      if (nextError) { setError(nextError); return; }
    }
    void advanceFrom(page.id);
  };

  const updateAnswer = (id: string, value: AnswerValue) => {
    const next = pruneHiddenFemaleAnswers({ ...answersRef.current, [id]: value });
    answersRef.current = next;
    setAnswers(next);
    setError("");
  };

  const goBack = () => {
    if (!page) return;
    const visible = getVisibleFemalePages(answersRef.current);
    const index = visible.findIndex((item) => item.id === page.id);
    if (index <= 0) { setPhase("welcome"); return; }
    setCurrentPageId(visible[index - 1].id);
    setError("");
  };

  const restart = () => {
    clearHospitalDraft(brand.draftKey);
    const initialAnswers = { f3: today() };
    answersRef.current = initialAnswers;
    setAnswers(initialAnswers);
    setCurrentPageId("f1");
    setConsent(false);
    setHasDraft(false);
    setError("");
  };

  if (phase === "complete" && result) return (
    <div className="hospital-survey female-survey completion-shell"><CompletionPage hasRedFlag={result.hasRedFlag} confirmationId={confirmationId} variant="female" /></div>
  );

  if (phase === "welcome") return (
    <main className="hospital-survey female-survey female-welcome">
      <div className="female-aurora female-aurora-one" aria-hidden="true" />
      <div className="female-aurora female-aurora-two" aria-hidden="true" />
      <header className="welcome-brand female-brand">
        <div className="clinical-brand-mark" aria-hidden="true"><Flower2 /></div>
        <div><strong>建始民族医院</strong><span>衰老与健康管理中心</span></div>
      </header>
      <section className="welcome-content">
        <div className="lifecycle-emblem" aria-hidden="true">
          <span className="emblem-orbit orbit-one" /><span className="emblem-orbit orbit-two" /><Flower2 />
        </div>
        <p className="welcome-kicker">WOMEN'S HEALTH · FUNCTIONAL PROFILE</p>
        <h1 aria-label="女性健康与功能状态评估">女性健康与<br /><em>功能状态评估</em></h1>
        <p className="welcome-description">面向40岁及以上女性，了解近期身体感受、女性生命周期、功能状态与生活方式，为体检选择和后续健康管理提供参考。</p>
        <div className="welcome-facts">
          <span><Clock3 aria-hidden="true" />约8—10分钟</span>
          <span><Sparkles aria-hidden="true" />55个轻量问题</span>
          <span><Save aria-hidden="true" />自动保存</span>
        </div>
        <p className="welcome-guidance">除特别说明外，请根据过去4周的真实感受填写，无需参考既往体检结果。</p>
        {hasDraft ? (
          <div className="resume-panel">
            <strong>检测到未完成的女性健康评估</strong>
            <span>可从上次保存的位置继续填写。</span>
            <button type="button" className="mobile-primary-button" onClick={() => setPhase("survey")}>继续填写 <ArrowRight aria-hidden="true" /></button>
            <button type="button" className="mobile-secondary-button" onClick={restart}>重新开始</button>
          </div>
        ) : (
          <>
            <label className="hospital-consent">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
              <span>我已了解本问卷用于健康评估参考，并同意按院方隐私说明提交信息。</span>
            </label>
            <button type="button" className="mobile-primary-button" disabled={!consent} onClick={() => setPhase("survey")}>开始评估 <ArrowRight aria-hidden="true" /></button>
          </>
        )}
        <p className="welcome-privacy"><ShieldCheck aria-hidden="true" />健康信息将按院内要求安全保存</p>
      </section>
      <footer>上海诺玛元一生物科技发展有限公司 · 技术支持</footer>
    </main>
  );

  if (!page) return null;
  return (
    <SurveyShell pageId={page.id} moduleId={page.moduleId} moduleTitle={safetyTone === "safety" ? "医学安全信息" : module.title} progress={progress} tone={safetyTone} onBack={goBack} modules={femaleModules}>
      {page.kind === "intro" ? (
        <ModuleIntro title={page.title} description={page.description} icon={page.icon} onContinue={continueCurrent} />
      ) : (
        <QuestionPage
          question={page.question}
          value={answers[page.id]}
          error={error}
          date={String(answers.f3 ?? today())}
          onChange={(value) => updateAnswer(page.id, value)}
          onContinue={continueCurrent}
          onAutoAdvance={() => void advanceFrom(page.id, answersRef.current)}
          updateMultiChoice={applyFemaleMultiChoice}
          submitting={submitting}
          isLast={questionIndex === questionPages.length - 1}
        />
      )}
      <div className="bot-field" aria-hidden="true"><label htmlFor="website">网站</label><input id="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} /></div>
      {submitError && <div className="mobile-submit-error" role="alert">{submitError}</div>}
    </SurveyShell>
  );
}
