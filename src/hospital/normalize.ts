import type { AnswerMap } from "../domain/types";
import { pruneHiddenAnswers } from "./navigation";
import { findHospitalQuestion, hospitalSurvey } from "./surveyDefinition";

export interface NormalizedHospitalAnswers {
  identity: { name: string; phone: string; phoneLast4: string; age: null };
  healthAnswers: Record<string, unknown>;
  assessmentAnswers: AnswerMap;
}

const questionIds = new Set(
  hospitalSurvey.pages.filter((page) => page.kind === "question").map((page) => page.id),
);

function q47Score(value: unknown) {
  if (!Array.isArray(value) || value.includes("5")) return "4";
  const count = new Set(value).size;
  if (count >= 5) return "0";
  if (count === 4) return "1";
  if (count === 3) return "2";
  if (count >= 1) return "3";
  return "4";
}

function optionLabel(questionId: string, value: unknown) {
  return findHospitalQuestion(questionId)?.options?.find((option) => option.value === value)?.label ?? "";
}

export function normalizeHospitalAnswers(input: AnswerMap): NormalizedHospitalAnswers {
  const answers = pruneHiddenAnswers(input);
  const healthAnswers: Record<string, unknown> = {};
  for (const [id, value] of Object.entries(answers)) {
    if (questionIds.has(id) && id !== "name" && id !== "phone") healthAnswers[id] = value;
  }
  healthAnswers.date = String(answers.date ?? "");
  healthAnswers.workStatusOther = "";
  healthAnswers.topConcernsOther = "";
  healthAnswers.q25Food = "";
  healthAnswers.q44Drink = optionLabel("q44DrinkType", answers.q44DrinkType);
  healthAnswers.q48Details = "";
  healthAnswers.twelveWeekGoalsOther = "";

  const selectedFoods = Array.isArray(answers.q47) ? answers.q47 : [];
  const derivedQ47 = q47Score(selectedFoods);
  healthAnswers.q47Foods = selectedFoods;
  healthAnswers.q47 = derivedQ47;

  const sensitiveAnswers: Record<string, { answered: boolean; value: string | null }> = {};
  for (const id of ["q35", "q36", "q37"]) {
    const value = answers[id];
    if (value === "__skip__") {
      healthAnswers[id] = null;
      sensitiveAnswers[id] = { answered: false, value: null };
    } else {
      sensitiveAnswers[id] = { answered: true, value: String(value ?? "") };
    }
  }
  healthAnswers.sensitiveAnswers = sensitiveAnswers;

  const assessmentAnswers = Object.fromEntries(
    Object.entries(healthAnswers).filter(([, value]) => value === null || typeof value === "string" || typeof value === "number" || Array.isArray(value)),
  ) as AnswerMap;
  assessmentAnswers.q47 = derivedQ47;

  const phone = String(answers.phone ?? "");
  return {
    identity: { name: String(answers.name ?? "").trim().slice(0, 80), phone, phoneLast4: phone.slice(-4), age: null },
    healthAnswers,
    assessmentAnswers,
  };
}
