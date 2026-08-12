import { describe, expect, it } from "vitest";
import { assessSurvey } from "./assessment";
import type { AnswerMap } from "./types";

const complete = (overrides: AnswerMap = {}): AnswerMap => ({
  ...Object.fromEntries(Array.from({ length: 55 }, (_, index) => [`q${index + 1}`, "0"])),
  ...overrides,
});

const level = (answers: AnswerMap, id: string) =>
  assessSurvey(complete(answers)).domains.find((domain) => domain.id === id)?.level;

describe("assessSurvey", () => {
  it("keeps an all-low-risk response stable", () => {
    const result = assessSurvey(complete());
    expect(result.hasRedFlag).toBe(false);
    expect(result.domains.every((domain) => domain.level === "stable")).toBe(true);
  });

  it("triggers sleep screening without diagnosing apnea", () => {
    const result = assessSurvey(complete({ q12: "4" }));
    const sleep = result.domains.find((domain) => domain.id === "sleep");
    expect(sleep?.level).toBe("evaluate");
    expect(sleep?.recommendation).toContain("标准化睡眠风险评估");
    expect(sleep?.recommendation).not.toContain("诊断");
  });

  it("raises metabolic priority when two driver signals coexist", () => {
    expect(level({ q26: "4", q27: "3" }, "metabolism")).toBe("evaluate");
  });

  it("raises male vitality priority only with symptom and reserve combinations", () => {
    expect(level({ q35: "4", q36: "3", q5: "3" }, "maleUrology")).toBe("evaluate");
    expect(level({ q35: "4", q36: "3" }, "maleUrology")).toBe("signal");
  });

  it("raises urology, muscle, gut, and stress priorities from specified combinations", () => {
    expect(level({ q38: "2" }, "maleUrology")).toBe("evaluate");
    expect(level({ q30: "3", q32: "3" }, "muscle")).toBe("evaluate");
    expect(level({ q21: "3", q23: "3" }, "gut")).toBe("evaluate");
    expect(level({ q15: "3", q17: "4" }, "mind")).toBe("evaluate");
  });

  it.each([49, 50, 51, 52, 53, 54, 55])("makes safety question %i a clinical priority", (number) => {
    const result = assessSurvey(complete({ [`q${number}`]: "1" }));
    expect(result.hasRedFlag).toBe(true);
    expect(result.domains.every((domain) => domain.level === "clinical_priority")).toBe(true);
    expect(result.redFlags).toContain(`q${number}`);
  });
});

