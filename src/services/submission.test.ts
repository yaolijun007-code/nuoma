import { afterEach, describe, expect, it, vi } from "vitest";
import { submitSurvey } from "./submission";

describe("submitSurvey", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends the selected brand questionnaire version", async () => {
    vi.stubEnv("VITE_SUBMIT_ENDPOINT", "https://example.test/api/submit");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ confirmationId: "JS-TEST", assessment: { domains: [], hasRedFlag: false, redFlags: [] } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await submitSurvey({}, "550e8400-e29b-41d4-a716-446655440000", "", "nuoma-yuanyi-male-health-v1.0");

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({ questionnaireVersion: "nuoma-yuanyi-male-health-v1.0" });
  });
});
