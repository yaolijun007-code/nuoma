import type { AnswerMap, AnswerValue, Question } from "../domain/types";
import { getVisibleSurveyPages } from "./navigation";

export type HospitalValidationErrors = Record<string, string>;

const isEmpty = (value: AnswerValue | undefined) =>
  value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);

export function validateHospitalQuestion(question: Question, answers: AnswerMap): string | undefined {
  const value = answers[question.id];
  if (question.required && isEmpty(value)) return question.type === "text" || question.type === "phone" ? "请填写此项" : "请选择一项";
  if (question.type === "phone" && !/^1[3-9]\d{9}$/.test(String(value ?? ""))) return "请输入有效的11位中国大陆手机号码";
  if (question.id === "name" && !String(value ?? "").trim()) return "请填写姓名";
  if (question.type === "multi" && Array.isArray(value)) {
    if (question.minSelections && value.length < question.minSelections) return `请至少选择${question.minSelections}项`;
    if (question.maxSelections && value.length > question.maxSelections) return `最多选择${question.maxSelections}项`;
  }
  if (question.optionsFromAnswerId) {
    const source = answers[question.optionsFromAnswerId];
    if (!Array.isArray(source) || !source.includes(String(value ?? ""))) return "请选择前面已关注的一项";
  }
  return undefined;
}

export function validateHospitalSubmission(answers: AnswerMap): HospitalValidationErrors {
  const errors: HospitalValidationErrors = {};
  for (const page of getVisibleSurveyPages(answers)) {
    if (page.kind !== "question") continue;
    const error = validateHospitalQuestion(page.question, answers);
    if (error) errors[page.id] = error;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(answers.date ?? ""))) errors.date = "填写日期无效";
  return errors;
}
