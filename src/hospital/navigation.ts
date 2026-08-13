import type { AnswerMap, Question } from "../domain/types";
import { findHospitalQuestion, hospitalSurvey, type HospitalSurveyPage } from "./surveyDefinition";

function isVisible(question: Question, answers: AnswerMap) {
  const rule = question.visibleWhen;
  if (!rule) return true;
  const answer = answers[rule.questionId];
  if (rule.operator === "includes") return Array.isArray(answer) && rule.values.some((value) => answer.includes(value));
  if (rule.operator === "notEquals") return !rule.values.includes(String(answer ?? ""));
  return rule.values.includes(String(answer ?? ""));
}

function withDynamicOptions(page: HospitalSurveyPage, answers: AnswerMap): HospitalSurveyPage {
  if (page.kind !== "question" || !page.question.optionsFromAnswerId) return page;
  const source = findHospitalQuestion(page.question.optionsFromAnswerId);
  const selected = answers[page.question.optionsFromAnswerId];
  const values = Array.isArray(selected) ? selected : [];
  return {
    ...page,
    question: {
      ...page.question,
      options: source?.options?.filter((option) => values.includes(option.value)) ?? [],
    },
  };
}

export function getVisibleSurveyPages(answers: AnswerMap): HospitalSurveyPage[] {
  return hospitalSurvey.pages
    .filter((page) => page.kind === "intro" || isVisible(page.question, answers))
    .map((page) => withDynamicOptions(page, answers));
}

export function getSurveyProgress(pages: HospitalSurveyPage[], currentPageId: string) {
  const total = pages.filter((page) => page.kind === "question").length;
  if (!total) return 0;
  const pageIndex = pages.findIndex((page) => page.id === currentPageId);
  if (pageIndex < 0) return 0;
  const completed = pages.slice(0, pageIndex).filter((page) => page.kind === "question").length;
  const current = pages[pageIndex]?.kind === "question" ? 1 : 0;
  return Math.min(100, ((completed + current) / total) * 100);
}

export function pruneHiddenAnswers(answers: AnswerMap): AnswerMap {
  const visibleIds = new Set(getVisibleSurveyPages(answers).map((page) => page.id));
  const conditionalIds = hospitalSurvey.pages
    .filter((page) => page.kind === "question" && page.question.visibleWhen)
    .map((page) => page.id);
  const next = { ...answers };
  for (const id of conditionalIds) if (!visibleIds.has(id)) delete next[id];
  return next;
}

export function updateExclusiveSelection(question: Question, selected: string[], optionValue: string): string[] {
  if (selected.includes(optionValue)) return selected.filter((value) => value !== optionValue);
  if (question.exclusiveOption === optionValue) return [optionValue];
  const withoutExclusive = selected.filter((value) => value !== question.exclusiveOption);
  if (question.maxSelections && withoutExclusive.length >= question.maxSelections) return withoutExclusive;
  return [...withoutExclusive, optionValue];
}
