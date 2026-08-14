import type { AnswerMap } from "../domain/types";
import { pruneHiddenFemaleAnswers } from "./navigation";
import { femaleSurvey } from "./surveyDefinition";

export interface NormalizedFemaleAnswers {
  identity: { name: string; phone: string; phoneLast4: string; age: number | null };
  healthAnswers: Record<string, unknown>;
  assessmentAnswers: AnswerMap;
}

const questionIds = new Set(
  femaleSurvey.pages.filter((page) => page.kind === "question").map((page) => page.id),
);

const ageByBand: Record<string, number> = { "0": 42, "1": 47, "2": 52, "3": 57, "4": 62, "5": 67, "6": 70 };

export function normalizeFemaleAnswers(input: AnswerMap): NormalizedFemaleAnswers {
  const answers = pruneHiddenFemaleAnswers(input);
  const healthAnswers: Record<string, unknown> = {};
  for (const [id, value] of Object.entries(answers)) {
    if (questionIds.has(id) && id !== "f1" && id !== "f2") healthAnswers[id] = value;
  }

  const privateValue = answers.f35;
  if (privateValue === "__skip__" || privateValue === undefined || privateValue === null || privateValue === "") {
    healthAnswers.f35 = null;
    healthAnswers.sensitiveAnswers = { f35: { answered: false, value: null } };
  } else {
    healthAnswers.sensitiveAnswers = { f35: { answered: true, value: String(privateValue) } };
  }

  const assessmentAnswers = Object.fromEntries(
    Object.entries(healthAnswers).filter(([, value]) =>
      value === null || typeof value === "string" || typeof value === "number" || Array.isArray(value)),
  ) as AnswerMap;

  const phone = String(answers.f2 ?? "");
  return {
    identity: {
      name: String(answers.f1 ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 80),
      phone,
      phoneLast4: phone.slice(-4),
      age: ageByBand[String(answers.f4 ?? "")] ?? null,
    },
    healthAnswers,
    assessmentAnswers,
  };
}
