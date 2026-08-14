import { ArrowRight } from "lucide-react";
import type { AnswerValue, Question } from "../../domain/types";
import { ChoiceGroup } from "./ChoiceGroup";
import { IdentityInput } from "./IdentityInput";
import { ScaleInput } from "./ScaleInput";

export function QuestionPage({ question, value, error, date, onChange, onContinue, onAutoAdvance, submitting, isLast, updateMultiChoice }: {
  question: Question;
  value: AnswerValue | undefined;
  error?: string;
  date: string;
  onChange(value: AnswerValue): void;
  onContinue(): void;
  onAutoAdvance(): void;
  submitting?: boolean;
  isLast?: boolean;
  updateMultiChoice?(question: Question, selected: string[], optionValue: string): string[];
}) {
  const isChoice = question.type === "single" || question.type === "multi";
  const selectionCount = Array.isArray(value) ? value.length : 0;
  const belowMinimum = question.type === "multi" && Boolean(question.minSelections && selectionCount < question.minSelections);
  const requiresButton = !isChoice || question.type === "multi" || !question.autoAdvance || question.tone === "safety" || question.confirmRequired;
  const buttonLabel = submitting ? "正在安全提交…" : isLast ? "完成评估" : question.confirmRequired ? "确认并继续" : "继续";

  return (
    <section className={`question-page tone-${question.tone ?? "default"}`} aria-labelledby="current-question">
      <div className="question-copy">
        <p className="question-kicker">{question.tone === "safety" ? "医学安全信息" : "请根据真实感受选择"}</p>
        <h1 id="current-question" tabIndex={-1}>{question.prompt}</h1>
        {question.subtitle && <p className="question-subtitle">{question.subtitle}</p>}
      </div>

      {isChoice ? (
        <ChoiceGroup question={question} value={value} onChange={onChange} onAutoAdvance={onAutoAdvance} updateMultiChoice={updateMultiChoice} errorId={error ? `${question.id}-error` : undefined} />
      ) : question.type === "scale" ? (
        <ScaleInput value={value} onChange={onChange} error={error} errorId={error ? `${question.id}-error` : undefined} />
      ) : (
        <IdentityInput question={question} value={value} error={error} onChange={onChange} />
      )}

      {question.type === "phone" && <p className="automatic-date">填写日期 <strong>{date}</strong> · 系统自动记录</p>}
      {question.helper && <p className="question-helper" id={`${question.id}-helper`}>{question.helper}</p>}
      {question.type === "multi" && question.maxSelections && <p className="selection-status" aria-live="polite">已选择 {selectionCount} / {question.maxSelections}</p>}
      {question.tone === "safety" && value === "1" && <p className="safety-recorded" role="status">已记录。完成问卷后将由医务人员进一步确认。</p>}
      {error && isChoice && <p className="field-error" id={`${question.id}-error`} role="alert">{error}</p>}

      {requiresButton && (
        <div className="mobile-bottom-action">
          {belowMinimum && <span className="button-requirement">请完成选择后继续</span>}
          <button type="button" className="mobile-primary-button" disabled={submitting || belowMinimum} onClick={onContinue}>
            {buttonLabel} <ArrowRight aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
