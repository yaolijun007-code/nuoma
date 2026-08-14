import type { AnswerMap, AnswerValue } from "../domain/types";
import { getVisibleFemalePages } from "./navigation";
import type { FemaleQuestion } from "./surveyDefinition";

export type FemaleValidationErrors = Record<string, string>;

const isEmpty = (value: AnswerValue | undefined) =>
  value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);

function isValidDate(value: unknown) {
  const text = String(value ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const [year, month, day] = text.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateFemaleQuestion(question: FemaleQuestion, answers: AnswerMap): string | undefined {
  const value = answers[question.id];
  if (isEmpty(value)) {
    if (!question.required || question.allowSkip) return undefined;
    if (question.type === "multi") return `请至少选择${question.minSelections ?? 1}项`;
    return question.type === "text" || question.type === "phone" ? "请填写此项" : "请选择一项";
  }
  if (question.id === "f1" && !String(value).trim()) return "请填写姓名";
  if (question.type === "phone" && !/^1[3-9]\d{9}$/.test(String(value))) return "请输入有效的11位中国大陆手机号码";
  if (question.type === "date" && !isValidDate(value)) return "填写日期无效";
  if (question.type === "scale") {
    const score = Number(value);
    if (!Number.isInteger(score) || score < 0 || score > 10) return "请选择0—10之间的整数";
  }
  if (question.type === "multi") {
    if (!Array.isArray(value)) return "请选择至少一项";
    if (question.minSelections && value.length < question.minSelections) return `请至少选择${question.minSelections}项`;
    if (question.maxSelections && value.length > question.maxSelections) return `最多选择${question.maxSelections}项`;
    const exclusive = question.mutuallyExclusiveValues ?? [];
    if (value.some((item) => exclusive.includes(item)) && value.length > 1) return "“无”或“不清楚”不能与其他选项同时选择";
  }
  if (question.id === "f48" && Array.isArray(value)) {
    if (!value.some((item) => ["0", "1", "2"].includes(item))) return "请选择一项吸烟情况";
    if (!value.some((item) => ["3", "4", "5"].includes(item))) return "请选择一项饮酒情况";
    if (value.filter((item) => ["0", "1", "2"].includes(item)).length > 1) return "吸烟情况只能选择一项";
    if (value.filter((item) => ["3", "4", "5"].includes(item)).length > 1) return "饮酒情况只能选择一项";
  }
  return undefined;
}

export function validateFemaleSubmission(answers: AnswerMap): FemaleValidationErrors {
  const errors: FemaleValidationErrors = {};
  for (const page of getVisibleFemalePages(answers)) {
    if (page.kind !== "question") continue;
    const error = validateFemaleQuestion(page.question, answers);
    if (error) errors[page.id] = error;
  }
  return errors;
}
