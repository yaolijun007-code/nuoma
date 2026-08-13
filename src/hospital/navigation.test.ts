import { describe, expect, it } from "vitest";
import { hospitalSurvey } from "./surveyDefinition";
import { getSurveyProgress, getVisibleSurveyPages, pruneHiddenAnswers, updateExclusiveSelection } from "./navigation";

describe("hospital mobile survey navigation", () => {
  it("organizes all 55 medical questions into ten modules", () => {
    expect(hospitalSurvey.modules).toHaveLength(10);
    const numbered = hospitalSurvey.pages
      .filter((page) => page.kind === "question")
      .map((page) => page.question)
      .filter((question) => question.number !== undefined);
    expect(numbered).toHaveLength(55);
    expect(new Set(numbered.map((question) => question.number)).size).toBe(55);
  });

  it("shows configured food, alcohol and antibiotic follow-ups only when triggered", () => {
    expect(getVisibleSurveyPages({}).some((page) => page.id === "q25Foods")).toBe(false);
    expect(getVisibleSurveyPages({ q25: "3" }).some((page) => page.id === "q25Foods")).toBe(true);
    expect(getVisibleSurveyPages({ q44: "0" }).some((page) => page.id === "q44DrinkType")).toBe(false);
    expect(getVisibleSurveyPages({ q44: "2" }).some((page) => page.id === "q44DrinkType")).toBe(true);
    expect(getVisibleSurveyPages({ q48: ["10"] }).some((page) => page.id === "q48AntibioticWhen")).toBe(false);
    expect(getVisibleSurveyPages({ q48: ["0"] }).some((page) => page.id === "q48AntibioticWhen")).toBe(true);
  });

  it("places each conditional page immediately after its trigger", () => {
    const visible = getVisibleSurveyPages({ q25: "3", q44: "2", q48: ["0"] }).map((page) => page.id);
    expect(visible.indexOf("q25Foods")).toBe(visible.indexOf("q25") + 1);
    expect(visible.indexOf("q44DrinkType")).toBe(visible.indexOf("q44") + 1);
    expect(visible.indexOf("q48AntibioticWhen")).toBe(visible.indexOf("q48") + 1);
  });

  it("removes answers for branches that become hidden", () => {
    expect(pruneHiddenAnswers({ q25: "0", q25Foods: ["0"], q44: "0", q44DrinkType: "1" }))
      .toEqual({ q25: "0", q44: "0" });
  });

  it("makes exclusive multi-choice options mutually exclusive", () => {
    const q47 = hospitalSurvey.pages
      .find((page) => page.kind === "question" && page.id === "q47");
    const q48 = hospitalSurvey.pages
      .find((page) => page.kind === "question" && page.id === "q48");
    if (!q47 || q47.kind !== "question" || !q48 || q48.kind !== "question") throw new Error("questions missing");

    expect(updateExclusiveSelection(q47.question, ["0", "1"], "5")).toEqual(["5"]);
    expect(updateExclusiveSelection(q47.question, ["5"], "2")).toEqual(["2"]);
    expect(updateExclusiveSelection(q48.question, ["0", "2"], "10")).toEqual(["10"]);
  });

  it("builds the final priority options from the selected concerns", () => {
    const page = getVisibleSurveyPages({ topConcerns: ["1", "4", "8"] })
      .find((item) => item.id === "singleImprovement");
    if (!page || page.kind !== "question") throw new Error("dynamic page missing");
    expect(page.question.options?.map((option) => option.label)).toEqual(["睡眠", "压力与情绪", "腰背或关节不适"]);
  });

  it("keeps accumulated progress on module introduction pages", () => {
    const pages = getVisibleSurveyPages({});
    expect(getSurveyProgress(pages, "intro:identity")).toBe(0);
    expect(getSurveyProgress(pages, "intro:energy")).toBeGreaterThan(0);
    expect(getSurveyProgress(pages, "intro:energy")).toBeGreaterThan(getSurveyProgress(pages, "q1"));
    expect(getSurveyProgress(pages, "singleImprovement")).toBe(100);
  });
});
