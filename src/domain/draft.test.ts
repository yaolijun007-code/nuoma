import { describe, expect, it } from "vitest";
import { clearDraft, loadDraft, saveDraft } from "./draft";

const memoryStorage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  };
};

describe("survey draft", () => {
  it("loads an unexpired draft and removes an expired draft", () => {
    const storage = memoryStorage();
    saveDraft({ q1: "2" }, 3, storage, 1_000);
    expect(loadDraft(storage, 2_000)).toMatchObject({ answers: { q1: "2" }, sectionIndex: 3 });
    expect(loadDraft(storage, 1_000 + 49 * 60 * 60 * 1000)).toBeNull();
  });

  it("clears the draft after submission", () => {
    const storage = memoryStorage();
    saveDraft({ q1: "2" }, 1, storage, 1_000);
    clearDraft(storage);
    expect(loadDraft(storage, 2_000)).toBeNull();
  });

  it("keeps drafts for different brands isolated", () => {
    const storage = memoryStorage();
    saveDraft({ q1: "1" }, 1, storage, 100, "hospital-draft");
    saveDraft({ q1: "4" }, 4, storage, 100, "nuoma-draft");

    expect(loadDraft(storage, 101, "hospital-draft")).toMatchObject({ answers: { q1: "1" }, sectionIndex: 1 });
    expect(loadDraft(storage, 101, "nuoma-draft")).toMatchObject({ answers: { q1: "4" }, sectionIndex: 4 });

    clearDraft(storage, "nuoma-draft");
    expect(loadDraft(storage, 101, "nuoma-draft")).toBeNull();
    expect(loadDraft(storage, 101, "hospital-draft")).not.toBeNull();
  });
});
