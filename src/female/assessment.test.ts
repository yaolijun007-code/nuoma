import { describe, expect, it } from "vitest";
import { validFemaleAnswers } from "../test/femaleAnswers";
import { assessFemaleSurvey } from "./assessment";

const level = (overrides: Record<string, string | string[] | number>, id: string) => {
  const answers = { ...validFemaleAnswers(), ...overrides };
  return assessFemaleSurvey(answers).domains.find((domain) => domain.id === id)?.level;
};

describe("assessFemaleSurvey", () => {
  it("keeps a response with no explicit signals stable", () => {
    const result = assessFemaleSurvey(validFemaleAnswers());
    expect(result.hasRedFlag).toBe(false);
    expect(result.domains).toHaveLength(8);
    expect(result.domains.every((domain) => domain.level === "stable")).toBe(true);
  });

  it("classifies one mild signal separately from moderate or repeated mild signals", () => {
    expect(level({ f13: "1" }, "sleep")).toBe("signal");
    expect(level({ f13: "2" }, "sleep")).toBe("evaluate");
    expect(level({ f13: "1", f14: "1" }, "sleep")).toBe("evaluate");
  });

  it("keeps screening timing as a separate attention list", () => {
    const result = assessFemaleSurvey({ ...validFemaleAnswers(), f39: "4", f40: "3", f52: "4" });
    expect(result.screeningAttention).toHaveLength(3);
    expect(result.domains.find((domain) => domain.id === "breastGynecology")?.level).toBe("stable");
  });

  it.each([
    ["f8", "1"],
    ["f23", "4"],
    ["f24", "1"],
    ["f31", ["0"]],
    ["f32", "4"],
    ["f33", ["5"]],
    ["f44", "1"],
  ])("turns safety answer %s into clinical priority", (id, value) => {
    const result = assessFemaleSurvey({ ...validFemaleAnswers(), [id]: value });
    expect(result.hasRedFlag).toBe(true);
    expect(result.redFlags).toContain(id);
    expect(result.domains.every((domain) => domain.level === "clinical_priority")).toBe(true);
    expect(result.domains[0].recommendation).not.toContain(id);
  });
});
