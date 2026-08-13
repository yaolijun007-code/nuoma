import { describe, expect, it } from "vitest";
import { createSurveyPages, visibleQuestionsForPage } from "./survey-flow";

describe("survey flow", () => {
  it("creates 64 one-primary-question pages and keeps companions with their owners", () => {
    const pages = createSurveyPages("questions");

    expect(pages).toHaveLength(64);
    expect(pages[0]).toMatchObject({ primaryQuestionId: "name", sectionId: "identity" });
    expect(pages.at(-1)).toMatchObject({ primaryQuestionId: "singleImprovement", sectionId: "goals" });
    expect(pages.find((page) => page.primaryQuestionId === "workStatus")?.questions.map(({ id }) => id))
      .toEqual(["workStatus", "workStatusOther"]);
    expect(pages.find((page) => page.primaryQuestionId === "topConcerns")?.questions.map(({ id }) => id))
      .toEqual(["topConcerns", "topConcernsOther"]);
    expect(pages.find((page) => page.primaryQuestionId === "q25")?.questions.map(({ id }) => id))
      .toEqual(["q25", "q25Food"]);
    expect(pages.find((page) => page.primaryQuestionId === "q44")?.questions.map(({ id }) => id))
      .toEqual(["q44", "q44Drink"]);
    expect(pages.find((page) => page.primaryQuestionId === "q48")?.questions.map(({ id }) => id))
      .toEqual(["q48", "q48Details"]);
    expect(pages.find((page) => page.primaryQuestionId === "twelveWeekGoals")?.questions.map(({ id }) => id))
      .toEqual(["twelveWeekGoals", "twelveWeekGoalsOther"]);
  });

  it("preserves the 12 hospital section pages", () => {
    const pages = createSurveyPages("sections");

    expect(pages).toHaveLength(12);
    expect(pages[0]).toMatchObject({ id: "identity", primaryQuestionId: "name" });
    expect(pages[0].questions).toHaveLength(9);
  });

  it("reveals companion questions only when their owner answer requires details", () => {
    const pages = createSurveyPages("questions");
    const visibleIds = (primaryQuestionId: string, answers: Record<string, string | string[] | number>) => {
      const page = pages.find((candidate) => candidate.primaryQuestionId === primaryQuestionId);
      if (!page) throw new Error(`Missing page ${primaryQuestionId}`);
      return visibleQuestionsForPage(page, answers).map(({ id }) => id);
    };

    expect(visibleIds("workStatus", { workStatus: "0" })).toEqual(["workStatus"]);
    expect(visibleIds("workStatus", { workStatus: "5" })).toEqual(["workStatus", "workStatusOther"]);
    expect(visibleIds("topConcerns", { topConcerns: ["12"] })).toEqual(["topConcerns", "topConcernsOther"]);
    expect(visibleIds("q25", { q25: "2" })).toEqual(["q25"]);
    expect(visibleIds("q25", { q25: "3" })).toEqual(["q25", "q25Food"]);
    expect(visibleIds("q44", { q44: "0" })).toEqual(["q44"]);
    expect(visibleIds("q44", { q44: "2" })).toEqual(["q44", "q44Drink"]);
    expect(visibleIds("q48", { q48: ["10"] })).toEqual(["q48"]);
    expect(visibleIds("q48", { q48: ["0", "3"] })).toEqual(["q48", "q48Details"]);
    expect(visibleIds("twelveWeekGoals", { twelveWeekGoals: ["13"] })).toEqual(["twelveWeekGoals", "twelveWeekGoalsOther"]);
  });
});
