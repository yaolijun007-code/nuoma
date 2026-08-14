import type { AnswerMap } from "../domain/types";
import { femaleSurvey, type FemaleQuestion, type FemaleSurveyPage } from "./surveyDefinition";

function isVisible(question: FemaleQuestion, answers: AnswerMap) {
  const rule = question.visibleWhen;
  if (!rule) return true;
  const answer = answers[rule.questionId];
  if (rule.operator === "includes") return Array.isArray(answer) && rule.values.some((value) => answer.includes(value));
  if (rule.operator === "notEquals") return !rule.values.includes(String(answer ?? ""));
  return rule.values.includes(String(answer ?? ""));
}

export function getVisibleFemalePages(answers: AnswerMap): FemaleSurveyPage[] {
  return femaleSurvey.pages.filter((page) => page.kind === "intro" || isVisible(page.question, answers));
}

export function pruneHiddenFemaleAnswers(answers: AnswerMap): AnswerMap {
  const visibleIds = new Set(getVisibleFemalePages(answers).map((page) => page.id));
  const next = { ...answers };
  for (const page of femaleSurvey.pages) {
    if (page.kind === "question" && page.question.visibleWhen && !visibleIds.has(page.id)) delete next[page.id];
  }
  return next;
}

export function getFemaleSurveyProgress(pages: FemaleSurveyPage[], currentPageId: string) {
  const questions = pages.filter((page) => page.kind === "question");
  if (!questions.length) return 0;
  const pageIndex = pages.findIndex((page) => page.id === currentPageId);
  if (pageIndex < 0) return 0;
  const current = pages[pageIndex];
  const completedQuestions = pages.slice(0, pageIndex).filter((page) => page.kind === "question").length;
  const displayedQuestions = completedQuestions + (current.kind === "question" ? 1 : 0);
  return (displayedQuestions / questions.length) * 100;
}

export function applyFemaleMultiChoice(question: FemaleQuestion, selected: string[], optionValue: string): string[] {
  if (selected.includes(optionValue)) return selected.filter((value) => value !== optionValue);
  const exclusive = question.mutuallyExclusiveValues ?? [];
  if (exclusive.includes(optionValue)) return [optionValue];
  const withoutExclusive = selected.filter((value) => !exclusive.includes(value));
  if (question.maxSelections && withoutExclusive.length >= question.maxSelections) return withoutExclusive;
  return [...withoutExclusive, optionValue];
}
