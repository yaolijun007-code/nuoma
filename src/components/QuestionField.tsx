import type { AnswerValue, Question } from "../domain/types";

interface QuestionFieldProps {
  question: Question;
  value?: AnswerValue;
  error?: string;
  hidePrompt?: boolean;
  onChange(value: AnswerValue): void;
}

export function QuestionField({ question, value, error, hidePrompt = false, onChange }: QuestionFieldProps) {
  const errorId = `${question.id}-error`;
  const helperId = `${question.id}-helper`;
  const describedBy = [question.helper ? helperId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;

  if (question.type === "single" || question.type === "multi") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <fieldset className={`question-card ${error ? "has-error" : ""}`} id={`field-${question.id}`} aria-describedby={describedBy}>
        <legend className={hidePrompt ? "visually-hidden" : undefined}>
          {question.number && <span className="question-number">{String(question.number).padStart(2, "0")}</span>}
          <span>{question.prompt}</span>
          {question.required && <span className="required-mark" aria-label="必填">必填</span>}
        </legend>
        {question.helper && <p className="field-helper" id={helperId}>{question.helper}</p>}
        {question.type === "multi" && question.maxSelections && (
          <p className="selection-counter">已选 {selected.length} / {question.maxSelections}</p>
        )}
        <div className="option-grid">
          {question.options?.map((option) => {
            const checked = question.type === "single" ? value === option.value : selected.includes(option.value);
            return (
              <label className={`option-card ${checked ? "is-selected" : ""}`} key={option.value}>
                <input
                  type={question.type === "single" ? "radio" : "checkbox"}
                  name={question.id}
                  value={option.value}
                  checked={checked}
                  aria-invalid={Boolean(error)}
                  onChange={() => {
                    if (question.type === "single") return onChange(option.value);
                    if (checked) return onChange(selected.filter((item) => item !== option.value));
                    if (question.maxSelections && selected.length >= question.maxSelections) return;
                    onChange([...selected, option.value]);
                  }}
                />
                <span className="choice-index" aria-hidden="true">{option.score ?? "•"}</span>
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
        {error && <p className="field-error" id={errorId}>{error}</p>}
      </fieldset>
    );
  }

  const inputType = question.type === "number" ? "number" : question.type === "date" ? "date" : "text";
  return (
    <div className={`question-card text-question ${error ? "has-error" : ""}`} id={`field-${question.id}`}>
      <label className={hidePrompt ? "visually-hidden" : undefined} htmlFor={question.id}>
        {question.number && <span className="question-number">{String(question.number).padStart(2, "0")}</span>}
        <span>{question.prompt}</span>
        {question.required && <span className="required-mark">必填</span>}
      </label>
      {question.helper && <p className="field-helper" id={helperId}>{question.helper}</p>}
      <input
        id={question.id}
        type={inputType}
        value={String(value ?? "")}
        placeholder={question.placeholder}
        inputMode={question.id === "phoneLast4" || question.type === "number" ? "numeric" : undefined}
        maxLength={question.id === "phoneLast4" ? 4 : undefined}
        min={question.id === "age" ? 40 : undefined}
        max={question.id === "age" ? 55 : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        onChange={(event) => onChange(question.type === "number" ? Number(event.target.value) : event.target.value)}
      />
      {error && <p className="field-error" id={errorId}>{error}</p>}
    </div>
  );
}
