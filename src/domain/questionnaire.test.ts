import { describe, expect, it } from "vitest";
import { maleHealthV1 } from "./questionnaire";

describe("maleHealthV1", () => {
  it("contains the complete versioned client questionnaire", () => {
    expect(maleHealthV1.version).toBe("male-health-v1.0");
    expect(maleHealthV1.sections).toHaveLength(12);

    const numbered = maleHealthV1.sections
      .flatMap((section) => section.questions)
      .filter((question) => question.number !== undefined);

    expect(numbered).toHaveLength(55);
    expect(new Set(numbered.map((question) => question.number)).size).toBe(55);
    expect(numbered.map((question) => question.number)).toEqual(
      Array.from({ length: 55 }, (_, index) => index + 1),
    );
  });

  it("requires the minimum identity fields for a public submission", () => {
    const identity = maleHealthV1.sections[0].questions;
    for (const id of ["name", "age", "phoneLast4"]) {
      expect(identity.find((question) => question.id === id)?.required).toBe(true);
    }
  });

  it("limits both three-choice questions", () => {
    const questions = maleHealthV1.sections.flatMap((section) => section.questions);
    expect(questions.find((question) => question.id === "topConcerns")?.maxSelections).toBe(3);
    expect(questions.find((question) => question.id === "twelveWeekGoals")?.maxSelections).toBe(3);
  });
});

