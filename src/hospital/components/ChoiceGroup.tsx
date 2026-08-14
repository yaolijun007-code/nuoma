import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import type { AnswerValue, Question } from "../../domain/types";
import { updateExclusiveSelection } from "../navigation";

interface ChoiceGroupProps {
  question: Question;
  value: AnswerValue | undefined;
  onChange(value: AnswerValue): void;
  onAutoAdvance?(): void;
  updateMultiChoice?(question: Question, selected: string[], optionValue: string): string[];
  errorId?: string;
}

export function ChoiceGroup({ question, value, onChange, onAutoAdvance, updateMultiChoice = updateExclusiveSelection, errorId }: ChoiceGroupProps) {
  const timer = useRef<number | undefined>(undefined);
  const selected = Array.isArray(value) ? value : [];

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const chooseSingle = (optionValue: string) => {
    window.clearTimeout(timer.current);
    onChange(optionValue);
    if (question.autoAdvance && !question.confirmRequired && question.tone !== "safety") {
      timer.current = window.setTimeout(() => onAutoAdvance?.(), 190);
    }
  };

  return (
    <fieldset className={`choice-group ${question.layout === "grid" ? "choice-grid" : ""}`} aria-required={Boolean(question.required)} aria-invalid={Boolean(errorId)} aria-describedby={errorId}>
      <legend className="sr-only">{question.prompt}</legend>
      {question.options?.map((option) => {
        const checked = question.type === "single" ? value === option.value : selected.includes(option.value);
        const maxed = Boolean(question.type === "multi" && question.maxSelections && selected.length >= question.maxSelections);
        const disabled = maxed && !checked && option.value !== question.exclusiveOption;
        return (
          <label className={`choice-card ${checked ? "selected" : ""} ${disabled ? "disabled" : ""}`} key={option.value}>
            <input
              type={question.type === "single" ? "radio" : "checkbox"}
              name={question.id}
              value={option.value}
              checked={checked}
              disabled={disabled}
              onChange={() => {
                if (question.type === "single") chooseSingle(option.value);
                else onChange(updateMultiChoice(question, selected, option.value));
              }}
            />
            <span>{option.label}</span>
            <Check className="choice-check" aria-hidden="true" />
          </label>
        );
      })}
      {question.allowSkip && (
        <button type="button" className="skip-answer" onClick={() => chooseSingle("__skip__")}>暂不回答</button>
      )}
    </fieldset>
  );
}
