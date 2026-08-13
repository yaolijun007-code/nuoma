import type { AnswerValue, Question } from "../../domain/types";

export function IdentityInput({ question, value, error, onChange }: {
  question: Question;
  value: AnswerValue | undefined;
  error?: string;
  onChange(value: string): void;
}) {
  const errorId = `${question.id}-error`;
  return (
    <div className="identity-input">
      <label className="sr-only" htmlFor={question.id}>{question.prompt}</label>
      <input
        id={question.id}
        type={question.type === "phone" ? "tel" : "text"}
        inputMode={question.type === "phone" ? "numeric" : undefined}
        autoComplete={question.autocomplete}
        value={String(value ?? "")}
        maxLength={question.type === "phone" ? 11 : 80}
        placeholder={question.placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(question.type === "phone" ? event.target.value.replace(/\D/g, "").slice(0, 11) : event.target.value)}
      />
      {error && <p className="field-error" id={errorId}>{error}</p>}
    </div>
  );
}
