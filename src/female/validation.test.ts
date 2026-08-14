import { describe, expect, it } from "vitest";
import { findFemaleQuestion } from "./surveyDefinition";
import { validateFemaleQuestion, validateFemaleSubmission } from "./validation";

const validAnswers = () => {
  const answers: Record<string, string | string[] | number> = {};
  for (let index = 1; index <= 55; index += 1) answers[`f${index}`] = "0";
  answers.f1 = "李女士";
  answers.f2 = "13800138000";
  answers.f3 = "2026-08-14";
  answers.f11 = ["9"];
  answers.f26 = ["7"];
  answers.f30 = ["6"];
  answers.f31 = ["5"];
  answers.f33 = ["0"];
  answers.f45 = ["6"];
  answers.f47 = ["0"];
  answers.f48 = ["0", "3"];
  answers.f49 = ["13"];
  answers.f50 = ["11"];
  answers.f51 = ["7"];
  answers.f53 = ["0", "1", "4"];
  answers.f55 = 8;
  return answers;
};

describe("female survey validation", () => {
  it("validates identity, date and health scale", () => {
    expect(validateFemaleQuestion(findFemaleQuestion("f1")!, { f1: "   " })).toBeTruthy();
    expect(validateFemaleQuestion(findFemaleQuestion("f2")!, { f2: "123" })).toContain("11位");
    expect(validateFemaleQuestion(findFemaleQuestion("f3")!, { f3: "2026-02-30" })).toContain("日期");
    expect(validateFemaleQuestion(findFemaleQuestion("f55")!, { f55: 11 })).toContain("0—10");
  });

  it("permits the private question to be skipped", () => {
    expect(validateFemaleQuestion(findFemaleQuestion("f35")!, {})).toBeUndefined();
  });

  it("validates multi-choice limits and smoking plus alcohol categories", () => {
    expect(validateFemaleQuestion(findFemaleQuestion("f53")!, { f53: [] })).toContain("至少");
    expect(validateFemaleQuestion(findFemaleQuestion("f53")!, { f53: ["0", "1", "2", "3"] })).toContain("最多");
    expect(validateFemaleQuestion(findFemaleQuestion("f48")!, { f48: ["0", "1"] })).toContain("饮酒");
    expect(validateFemaleQuestion(findFemaleQuestion("f48")!, { f48: ["0", "3"] })).toBeUndefined();
  });

  it("validates all visible required questions and ignores hidden branches", () => {
    const answers = validAnswers();
    answers.f5 = "4";
    delete answers.f6;
    delete answers.f7;
    answers.f8 = "0";
    expect(validateFemaleSubmission(answers)).toEqual({});

    delete answers.f12;
    expect(validateFemaleSubmission(answers).f12).toBeTruthy();
  });
});
