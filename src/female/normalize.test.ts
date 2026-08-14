import { describe, expect, it } from "vitest";
import { validFemaleAnswers } from "../test/femaleAnswers";
import { normalizeFemaleAnswers } from "./normalize";

describe("normalizeFemaleAnswers", () => {
  it("separates identity and health answers and maps the age band", () => {
    const answers = validFemaleAnswers();
    answers.f4 = "3";
    const normalized = normalizeFemaleAnswers(answers);
    expect(normalized.identity).toEqual({
      name: "虚构女性用户",
      phone: "13800000000",
      phoneLast4: "0000",
      age: 57,
    });
    expect(normalized.healthAnswers).not.toHaveProperty("f1");
    expect(normalized.healthAnswers).not.toHaveProperty("f2");
    expect(normalized.healthAnswers.f3).toBe("2026-08-14");
  });

  it("prunes hidden lifecycle answers and preserves a skipped private answer", () => {
    const answers = validFemaleAnswers();
    answers.f5 = "4";
    answers.f6 = "3";
    answers.f7 = "4";
    answers.f8 = "0";
    answers.f35 = "__skip__";
    const normalized = normalizeFemaleAnswers(answers);
    expect(normalized.healthAnswers).not.toHaveProperty("f6");
    expect(normalized.healthAnswers).not.toHaveProperty("f7");
    expect(normalized.healthAnswers.f8).toBe("0");
    expect(normalized.healthAnswers.f35).toBeNull();
    expect(normalized.healthAnswers.sensitiveAnswers).toEqual({ f35: { answered: false, value: null } });
  });

  it("drops unknown fields", () => {
    const answers = validFemaleAnswers();
    answers.untrusted = "value";
    expect(normalizeFemaleAnswers(answers).healthAnswers).not.toHaveProperty("untrusted");
  });
});
