import { maleHealthV1 } from "./questionnaire";
import type { AnswerMap, AnswerValue } from "./types";

export type ValidationErrors = Record<string, string>;

const isEmpty = (value: AnswerValue | undefined) =>
  value === undefined || value === "" || (Array.isArray(value) && value.length === 0);

const questionById = new Map(
  maleHealthV1.sections.flatMap((section) => section.questions).map((question) => [question.id, question]),
);

export function validateQuestions(questionIds: string[], answers: AnswerMap): ValidationErrors {
  const errors: ValidationErrors = {};
  for (const questionId of questionIds) {
    const question = questionById.get(questionId);
    if (!question) {
      errors[questionId] = "问卷题目不存在";
      continue;
    }
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
  if (questionIds.includes("name") && !name) errors.name = "请填写姓名";
  if (questionIds.includes("age") && (!Number.isInteger(age) || age < 40 || age > 55)) errors.age = "请输入40—55之间的整数年龄";
  if (questionIds.includes("phoneLast4") && !/^\d{4}$/.test(phoneLast4)) errors.phoneLast4 = "请输入手机号后4位数字";

  return errors;
}

export function validateStep(sectionId: string, answers: AnswerMap): ValidationErrors {
  const section = maleHealthV1.sections.find((item) => item.id === sectionId);
  if (!section) return { _section: "问卷步骤不存在" };
  return validateQuestions(section.questions.map(({ id }) => id), answers);
}
