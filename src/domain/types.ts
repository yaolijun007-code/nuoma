export type AnswerValue = string | string[] | number | null;
export type AnswerMap = Record<string, AnswerValue>;

export type QuestionType = "single" | "multi" | "text" | "phone" | "date" | "number";

export interface VisibilityRule {
  questionId: string;
  operator: "equals" | "notEquals" | "includes";
  values: string[];
}

export interface QuestionOption {
  value: string;
  label: string;
  score?: number;
}

export interface Question {
  id: string;
  number?: number;
  prompt: string;
  type: QuestionType;
  options?: QuestionOption[];
  required?: boolean;
  minSelections?: number;
  maxSelections?: number;
  helper?: string;
  subtitle?: string;
  placeholder?: string;
  visibleWhen?: VisibilityRule;
  exclusiveOption?: string;
  optionsFromAnswerId?: string;
  autoAdvance?: boolean;
  allowSkip?: boolean;
  confirmRequired?: boolean;
  tone?: "default" | "safety";
  layout?: "stack" | "grid";
  autocomplete?: string;
}

export interface QuestionnaireSection {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface QuestionnaireDefinition {
  version: string;
  title: string;
  audience: string;
  estimatedMinutes: string;
  sections: QuestionnaireSection[];
}

export type AssessmentLevel = "stable" | "signal" | "evaluate" | "clinical_priority";

export interface AssessmentDomain {
  id: string;
  title: string;
  level: AssessmentLevel;
  reasons: string[];
  recommendation: string;
}

export interface AssessmentResult {
  domains: AssessmentDomain[];
  hasRedFlag: boolean;
  redFlags: string[];
}
