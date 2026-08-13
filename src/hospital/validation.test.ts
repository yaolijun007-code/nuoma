import { describe, expect, it } from "vitest";
import { validHospitalAnswers } from "../test/hospitalAnswers";
import { validateHospitalSubmission } from "./validation";

describe("hospital mobile submission validation", () => {
  it("requires a valid mainland China mobile number but no age", () => {
    const answers = validHospitalAnswers();
    answers.phone = "12800000000";
    const errors = validateHospitalSubmission(answers);
    expect(errors.phone).toContain("11位");
    expect(errors.age).toBeUndefined();
  });

  it("accepts sensitive questions explicitly skipped", () => {
    const answers = validHospitalAnswers();
    answers.q35 = "__skip__";
    answers.q36 = "__skip__";
    answers.q37 = "__skip__";
    expect(validateHospitalSubmission(answers)).toEqual({});
  });

  it("requires visible conditional answers and ignores hidden branches", () => {
    const answers = validHospitalAnswers();
    answers.q25 = "3";
    answers.q44 = "2";
    answers.q48 = ["0"];
    const errors = validateHospitalSubmission(answers);
    expect(errors).toMatchObject({ q25Foods: expect.any(String), q44DrinkType: expect.any(String), q48AntibioticWhen: expect.any(String) });

    answers.q25 = "0";
    answers.q44 = "0";
    answers.q48 = ["10"];
    expect(validateHospitalSubmission(answers)).toEqual({});
  });
});
