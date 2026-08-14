import { describe, expect, it } from "vitest";
import { femaleModules, femaleSurvey, findFemaleQuestion } from "./surveyDefinition";

describe("hospital female survey definition", () => {
  it("contains the complete 55-question V1.0 instrument", () => {
    expect(femaleSurvey.version).toBe("female-health-v1.0");
    expect(femaleModules).toHaveLength(10);
    const questions = femaleSurvey.pages.filter((page) => page.kind === "question");
    expect(questions).toHaveLength(55);
    expect(questions.map((page) => page.id)).toEqual(Array.from({ length: 55 }, (_, index) => `f${index + 1}`));
  });

  it("encodes lifecycle conditions and private-answer behavior", () => {
    expect(findFemaleQuestion("f5")?.options).toHaveLength(8);
    expect(findFemaleQuestion("f6")?.visibleWhen).toEqual({ questionId: "f5", operator: "equals", values: ["0", "1", "2"] });
    expect(findFemaleQuestion("f7")?.visibleWhen).toEqual({ questionId: "f5", operator: "equals", values: ["0", "1", "2"] });
    expect(findFemaleQuestion("f8")?.visibleWhen).toEqual({ questionId: "f5", operator: "equals", values: ["4"] });
    expect(findFemaleQuestion("f35")).toMatchObject({ required: false, allowSkip: true });
  });

  it("encodes limits, scale, safety and mutually exclusive choices", () => {
    expect(findFemaleQuestion("f53")).toMatchObject({ type: "multi", minSelections: 1, maxSelections: 3 });
    expect(findFemaleQuestion("f55")?.type).toBe("scale");
    expect(findFemaleQuestion("f55")?.required).toBe(true);
    expect(findFemaleQuestion("f11")?.mutuallyExclusiveValues).toEqual(["9", "10"]);
    expect(findFemaleQuestion("f31")?.mutuallyExclusiveValues).toEqual(["5"]);
    expect(findFemaleQuestion("f24")?.signalByValue?.["3"]).toBe("safety");
    expect(findFemaleQuestion("f44")?.signalByValue?.["2"]).toBe("safety");
  });
});
