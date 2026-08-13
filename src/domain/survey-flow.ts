import { maleHealthV1 } from "./questionnaire";
import type { AnswerMap, Question } from "./types";

export type SurveyNavigationMode = "sections" | "questions";

export interface SurveyPage {
  id: string;
  navigationMode: SurveyNavigationMode;
  sectionId: string;
  sectionTitle: string;
  eyebrow: string;
  description?: string;
  primaryQuestionId: string;
  questions: Question[];
}

const companionOwnerById = {
  workStatusOther: "workStatus",
  topConcernsOther: "topConcerns",
  q25Food: "q25",
  q44Drink: "q44",
  q48Details: "q48",
  twelveWeekGoalsOther: "twelveWeekGoals",
} as const;

const companionIdByOwner = Object.fromEntries(
  Object.entries(companionOwnerById).map(([companionId, ownerId]) => [ownerId, companionId]),
) as Record<string, string>;

const companionIds = new Set(Object.keys(companionOwnerById));

export function createSurveyPages(mode: SurveyNavigationMode): SurveyPage[] {
  if (mode === "sections") {
    return maleHealthV1.sections.map((section) => ({
      id: section.id,
      navigationMode: mode,
      sectionId: section.id,
      sectionTitle: section.title,
      eyebrow: section.eyebrow,
      description: section.description,
      primaryQuestionId: section.questions[0].id,
      questions: section.questions,
    }));
  }

  return maleHealthV1.sections.flatMap((section) =>
    section.questions
      .filter((question) => !companionIds.has(question.id))
      .map((question) => {
        const companionId = companionIdByOwner[question.id];
        const companion = companionId
          ? section.questions.find((candidate) => candidate.id === companionId)
          : undefined;
        return {
          id: `${section.id}-${question.id}`,
          navigationMode: mode,
          sectionId: section.id,
          sectionTitle: section.title,
          eyebrow: section.eyebrow,
          description: section.description,
          primaryQuestionId: question.id,
          questions: companion ? [question, companion] : [question],
        } satisfies SurveyPage;
      }),
  );
}

function companionIsVisible(id: string, answers: AnswerMap) {
  switch (id) {
    case "workStatusOther":
      return answers.workStatus === "5";
    case "topConcernsOther":
      return Array.isArray(answers.topConcerns) && answers.topConcerns.includes("12");
    case "q25Food":
      return answers.q25 === "3" || answers.q25 === "4";
    case "q44Drink":
      return typeof answers.q44 === "string" && answers.q44 !== "0" && answers.q44 !== "";
    case "q48Details":
      return Array.isArray(answers.q48) && answers.q48.some((value) => value !== "10");
    case "twelveWeekGoalsOther":
      return Array.isArray(answers.twelveWeekGoals) && answers.twelveWeekGoals.includes("13");
    default:
      return true;
  }
}

export function visibleQuestionsForPage(page: SurveyPage, answers: AnswerMap): Question[] {
  if (page.navigationMode === "sections") return page.questions;
  return page.questions.filter((question) => !companionIds.has(question.id) || companionIsVisible(question.id, answers));
}

