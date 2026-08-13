import { describe, expect, it } from "vitest";
import { clearHospitalDraft, loadHospitalDraft, saveHospitalDraft } from "./draft";

describe("hospital mobile draft", () => {
  it("keeps the current page and answers for 48 hours", () => {
    saveHospitalDraft({ name: "测试客户", phone: "13800138000" }, "q20", "hospital-mobile-test", 1_000);
    expect(loadHospitalDraft("hospital-mobile-test", 2_000)).toMatchObject({ currentPageId: "q20", answers: { name: "测试客户" } });
    expect(loadHospitalDraft("hospital-mobile-test", 1_000 + 49 * 60 * 60 * 1_000)).toBeNull();
  });

  it("clears a submitted or restarted draft", () => {
    saveHospitalDraft({ q1: "2" }, "q1", "hospital-mobile-clear");
    clearHospitalDraft("hospital-mobile-clear");
    expect(loadHospitalDraft("hospital-mobile-clear")).toBeNull();
  });
});
