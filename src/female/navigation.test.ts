import { describe, expect, it } from "vitest";
import { findFemaleQuestion } from "./surveyDefinition";
import {
  applyFemaleMultiChoice,
  getFemaleSurveyProgress,
  getVisibleFemalePages,
  pruneHiddenFemaleAnswers,
} from "./navigation";

describe("female survey navigation", () => {
  it("shows only the lifecycle follow-up that matches the menstrual state", () => {
    expect(getVisibleFemalePages({ f5: "0" }).some((page) => page.id === "f6")).toBe(true);
    expect(getVisibleFemalePages({ f5: "0" }).some((page) => page.id === "f8")).toBe(false);
    expect(getVisibleFemalePages({ f5: "4" }).some((page) => page.id === "f6")).toBe(false);
    expect(getVisibleFemalePages({ f5: "4" }).some((page) => page.id === "f8")).toBe(true);
  });

  it("removes answers for questions that became hidden", () => {
    expect(pruneHiddenFemaleAnswers({ f5: "4", f6: "2", f7: "1", f8: "0", f12: "1" })).toEqual({
      f5: "4",
      f8: "0",
      f12: "1",
    });
  });

  it("enforces none and unknown options as mutually exclusive", () => {
    const question = findFemaleQuestion("f11")!;
    expect(applyFemaleMultiChoice(question, ["0", "1"], "9")).toEqual(["9"]);
    expect(applyFemaleMultiChoice(question, ["9"], "0")).toEqual(["0"]);
    expect(applyFemaleMultiChoice(question, ["0"], "1")).toEqual(["0", "1"]);
    expect(applyFemaleMultiChoice(question, ["0", "1"], "0")).toEqual(["1"]);
  });

  it("reports progress across visible question pages only", () => {
    const pages = getVisibleFemalePages({ f5: "0" });
    expect(getFemaleSurveyProgress(pages, "f1")).toBeGreaterThan(0);
    expect(getFemaleSurveyProgress(pages, "f55")).toBe(100);
  });
});
