import { describe, expect, it } from "vitest";
import { validateStep } from "./validation";

describe("validateStep", () => {
  it("requires name, age, phone last four digits, and valid formats", () => {
    const errors = validateStep("identity", {
      name: " ", age: 30, phoneLast4: "12x4", date: "2026-08-13",
      workStatus: "0", topConcerns: ["0", "1", "2", "3"], mainChange: "疲劳",
    });

    expect(errors.name).toBeTruthy();
    expect(errors.age).toContain("40—55");
    expect(errors.phoneLast4).toContain("4位数字");
    expect(errors.topConcerns).toContain("最多选择3项");
  });

  it("reports unanswered required questions in a health section", () => {
    expect(validateStep("overall", { q1: "0", q2: "1" })).toEqual({ q3: "请选择一项" });
  });
});

