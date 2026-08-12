import { maleHealthV1 } from "./questionnaire";
import type { AnswerMap, AnswerValue } from "./types";

export type ValidationErrors = Record<string, string>;

const isEmpty = (value: AnswerValue | undefined) =>
  value === undefined || value === "" || (Array.isArray(value) && value.length === 0);

export function validateStep(sectionId: string, answers: AnswerMap): ValidationErrors {
  const section = maleHealthV1.sections.find((item) => item.id === sectionId);
  if (!section) return { _section: "问卷步骤不存在" };

  const errors: ValidationErrors = {};
  for (const question of section.questions) {
    const value = answers[question.id];
    if (question.required && isEmpty(value)) {
      errors[question.id] = question.type === "text" || question.type === "number" || question.type === "date"
        ? "请填写此项"
        : "请选择一项";
      continue;
    }
    if (question.maxSelections && Array.isArray(value) && value.length > question.maxSelections) {
      errors[question.id] = `最多选择${question.maxSelections}项`;
    }
  }

  const name = String(answers.name ?? "").trim();
  const age = Number(answers.age);
  const phoneLast4 = String(answers.phoneLast4 ?? "");
  if (sectionId === "identity") {
    if (!name) errors.name = "请填写姓名";
    if (!Number.isInteger(age) || age < 40 || age > 55) errors.age = "请输入40—55之间的整数年龄";
    if (!/^\d{4}$/.test(phoneLast4)) errors.phoneLast4 = "请输入手机号后4位数字";
  }

  return errors;
}

