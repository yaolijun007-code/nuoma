import { describe, expect, it } from "vitest";
import { validHospitalAnswers } from "../test/hospitalAnswers";
import { normalizeHospitalAnswers } from "./normalize";

describe("hospital mobile answer normalization", () => {
  it("persists full phone, derives the last four digits, and keeps legacy empty fields", () => {
    const normalized = normalizeHospitalAnswers(validHospitalAnswers());
    expect(normalized.identity).toEqual({ name: "虚构用户", phone: "13800000000", phoneLast4: "0000", age: null });
    expect(normalized.healthAnswers).toMatchObject({
      workStatusOther: "",
      topConcernsOther: "",
      q25Food: "",
      q44Drink: "",
      q48Details: "",
      twelveWeekGoalsOther: "",
    });
    expect(normalized.healthAnswers).not.toHaveProperty("phone");
  });

  it("derives the legacy Q47 score while retaining selected foods", () => {
    const answers = validHospitalAnswers();
    answers.q47 = ["0", "1", "2"];
    const normalized = normalizeHospitalAnswers(answers);
    expect(normalized.healthAnswers.q47).toBe("2");
    expect(normalized.healthAnswers.q47Foods).toEqual(["0", "1", "2"]);
    expect(normalized.assessmentAnswers.q47).toBe("2");
  });

  it("records skipped sensitive answers without assigning a score", () => {
    const answers = validHospitalAnswers();
    answers.q35 = "__skip__";
    const normalized = normalizeHospitalAnswers(answers);
    expect(normalized.healthAnswers.q35).toBeNull();
    expect(normalized.healthAnswers.sensitiveAnswers).toMatchObject({ q35: { answered: false, value: null } });
    expect(normalized.assessmentAnswers.q35).toBeNull();
  });
});
