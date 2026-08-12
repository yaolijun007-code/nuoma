import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Clock3, HeartPulse, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "./components/BrandMark";
import { QuestionField } from "./components/QuestionField";
import { ResultView } from "./components/ResultView";
import { assessSurvey } from "./domain/assessment";
import { clearDraft, loadDraft, saveDraft } from "./domain/draft";
import { maleHealthV1 } from "./domain/questionnaire";
import type { AnswerMap, AnswerValue, AssessmentResult } from "./domain/types";
import { validateStep, type ValidationErrors } from "./domain/validation";
import "./styles.css";

type Phase = "welcome" | "survey" | "result";

const today = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const restored = useMemo(() => loadDraft(), []);
  const [phase, setPhase] = useState<Phase>("welcome");
  const [consent, setConsent] = useState(false);
  const [sectionIndex, setSectionIndex] = useState(restored?.sectionIndex ?? 0);
  const [answers, setAnswers] = useState<AnswerMap>(restored?.answers ?? { date: today() });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [confirmationId, setConfirmationId] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const section = maleHealthV1.sections[sectionIndex];
  const progress = ((sectionIndex + 1) / maleHealthV1.sections.length) * 100;

  useEffect(() => {
    if (phase === "survey") saveDraft(answers, sectionIndex);
  }, [answers, phase, sectionIndex]);

  useEffect(() => {
    if (phase === "survey") headingRef.current?.focus();
  }, [phase, sectionIndex]);

  const setAnswer = (id: string, value: AnswerValue) => {
    setAnswers((current) => ({ ...current, [id]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const goNext = () => {
    const nextErrors = validateStep(section.id, answers);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      window.setTimeout(() => {
        const first = Object.keys(nextErrors)[0];
        document.querySelector<HTMLElement>(`#field-${first} input`)?.focus();
      }, 0);
      return;
    }
    setErrors({});
    if (sectionIndex < maleHealthV1.sections.length - 1) {
      setSectionIndex((index) => index + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const assessment = assessSurvey(answers);
    setResult(assessment);
    setConfirmationId(`JS-${Date.now().toString(36).toUpperCase()}`);
    clearDraft();
    setPhase("result");
    window.scrollTo({ top: 0 });
  };

  if (phase === "result" && result) return <ResultView result={result} confirmationId={confirmationId} />;

  if (phase === "welcome") {
    return (
      <main className="welcome-shell">
        <div className="ambient ambient-one" aria-hidden="true" />
        <div className="ambient ambient-two" aria-hidden="true" />
        <header className="institution">
          <BrandMark />
          <div><strong>建始民族医院</strong><span>衰老与健康管理中心</span></div>
        </header>

        <section className="welcome-card">
          <div className="spectrum-orbit" aria-hidden="true"><HeartPulse /></div>
          <p className="eyebrow">MALE HEALTH · V1.0</p>
          <h1><span>读懂身体正在发生的</span><br /><em>细微变化</em></h1>
          <p className="welcome-lead">一份面向40—55岁男性的功能状态问卷。用真实体感，为后续检测选择与12周健康管理提供参考。</p>
          <div className="fact-row">
            <span><Clock3 aria-hidden="true" />约6—8分钟</span>
            <span><Sparkles aria-hidden="true" />12个简短步骤</span>
            <span><LockKeyhole aria-hidden="true" />健康信息受保护</span>
          </div>
          {restored && <div className="restore-note">检测到48小时内的未完成记录，开始后将从上次位置继续。</div>}
          <label className="consent-row">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>我已阅读并理解：本问卷用于健康评估参考，不替代医学诊断；我同意按院方隐私说明提交信息。</span>
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
    <div className="survey-shell">
      <header className="survey-header">
        <div className="survey-brand"><BrandMark /><span>建始民族医院</span></div>
        <span className="step-count">{sectionIndex + 1} / {maleHealthV1.sections.length}</span>
        <div className="progress-track" aria-label={`问卷进度 ${Math.round(progress)}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="survey-main">
        <section className="section-intro">
          <p className="eyebrow">{section.eyebrow}</p>
          <h1 ref={headingRef} tabIndex={-1}>{section.title}</h1>
          {section.description && <p>{section.description}</p>}
        </section>

        {Object.keys(errors).length > 0 && <div className="error-summary" role="alert"><strong>还有内容需要完成</strong><span>请检查下方标记的项目。</span></div>}

        <form onSubmit={(event) => { event.preventDefault(); goNext(); }} noValidate>
          <div className="questions-stack">
            {section.questions.map((question) => (
              <QuestionField key={question.id} question={question} value={answers[question.id]} error={errors[question.id]} onChange={(value) => setAnswer(question.id, value)} />
            ))}
          </div>
          <nav className="form-actions" aria-label="问卷步骤">
            <button type="button" className="secondary-button" disabled={sectionIndex === 0} onClick={() => setSectionIndex((index) => Math.max(0, index - 1))}>
              <ArrowLeft aria-hidden="true" /> 上一步
            </button>
            <button type="submit" className="primary-button">
              {sectionIndex === maleHealthV1.sections.length - 1 ? "完成评估" : "下一步"} <ArrowRight aria-hidden="true" />
            </button>
          </nav>
        </form>
        <p className="autosave">已在本机自动保存 · 提交后将清除本地草稿</p>
      </main>
    </div>
  );
}
