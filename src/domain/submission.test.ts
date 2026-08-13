import { describe, expect, it, vi } from "vitest";
import { createSubmissionService, SubmissionError } from "./submission";
import type { AnswerMap } from "./types";
import { validHospitalAnswers } from "../test/hospitalAnswers";

const validAnswers = (): AnswerMap => ({
  name: "张三", age: 45, phoneLast4: "0826", date: "2026-08-13",
  workStatus: "0", topConcerns: ["0", "1", "2"], mainChange: "恢复变慢",
  twelveWeekGoals: ["0", "5", "8"], singleImprovement: "睡得更好",
  ...Object.fromEntries(Array.from({ length: 55 }, (_, index) => [`q${index + 1}`, "0"])),
});

const payload = (overrides: Record<string, unknown> = {}) => ({
  questionnaireVersion: "male-health-v1.0",
  clientSubmissionId: "550e8400-e29b-41d4-a716-446655440000",
  honeypot: "",
  answers: validAnswers(),
  ...overrides,
});

describe("createSubmissionService", () => {
  it("rejects unsupported versions and bot-filled honeypots", async () => {
    const service = createSubmissionService({ find: vi.fn(), save: vi.fn() });
    await expect(service.submit(payload({ questionnaireVersion: "v0" }))).rejects.toBeInstanceOf(SubmissionError);
    await expect(service.submit(payload({ honeypot: "website" }))).rejects.toMatchObject({ code: "BOT_REJECTED" });
  });

  it("rejects incomplete health answers", async () => {
    const answers = validAnswers();
    delete answers.q55;
    const service = createSubmissionService({ find: vi.fn(), save: vi.fn() });
    await expect(service.submit(payload({ answers }))).rejects.toMatchObject({ code: "INVALID_PAYLOAD" });
  });

  it("rejects oversized and polluted payloads", async () => {
    const service = createSubmissionService({ find: vi.fn(), save: vi.fn() });
    const answers = validAnswers();
    answers.mainChange = "长".repeat(2001);
    await expect(service.submit(payload({ answers }))).rejects.toMatchObject({ code: "INVALID_PAYLOAD" });
  });

  it("returns an existing submission idempotently", async () => {
    const find = vi.fn().mockResolvedValue({ confirmationId: "JS-EXISTING", assessment: { domains: [], hasRedFlag: false, redFlags: [] } });
    const save = vi.fn();
    const service = createSubmissionService({ find, save });
    expect(await service.submit(payload())).toMatchObject({ confirmationId: "JS-EXISTING" });
    expect(save).not.toHaveBeenCalled();
  });

  it("separates identity, answers, and assessment before persistence", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const service = createSubmissionService({ find: vi.fn().mockResolvedValue(null), save });
    const response = await service.submit(payload());
    const record = save.mock.calls[0][0];

    expect(record.identity).toMatchObject({ name: "张三", age: 45, phoneLast4: "0826" });
    expect(record.healthAnswers.name).toBeUndefined();
    expect(record.assessment.hasRedFlag).toBe(false);
    expect(response.confirmationId).toMatch(/^JS-/);
  });

  it("accepts and persists the Nuoma Yuanyi questionnaire version", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const service = createSubmissionService({ find: vi.fn().mockResolvedValue(null), save });

    await service.submit(payload({ questionnaireVersion: "nuoma-yuanyi-male-health-v1.0" }));

    expect(save.mock.calls[0][0].session.questionnaireVersion).toBe("nuoma-yuanyi-male-health-v1.0");
  });

  it("returns clinical priority for any safety red flag", async () => {
    const save = vi.fn();
    const service = createSubmissionService({ find: vi.fn().mockResolvedValue(null), save });
    const answers = validAnswers();
    answers.q55 = "1";
    const response = await service.submit(payload({ answers }));
    expect(response.assessment.hasRedFlag).toBe(true);
    expect(response.assessment.domains.every((item) => item.level === "clinical_priority")).toBe(true);
  });

  it("accepts the mobile hospital payload without age and persists a searchable phone", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const service = createSubmissionService({ find: vi.fn().mockResolvedValue(null), save });
    await service.submit(payload({ answers: validHospitalAnswers() }));

    expect(save.mock.calls[0][0].identity).toEqual({ name: "虚构用户", phone: "13800000000", phoneLast4: "0000", age: null });
  });
});
