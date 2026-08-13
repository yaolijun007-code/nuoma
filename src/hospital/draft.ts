import type { AnswerMap } from "../domain/types";

const MAX_AGE_MS = 48 * 60 * 60 * 1000;

interface HospitalDraft {
  answers: AnswerMap;
  currentPageId: string;
  savedAt: number;
}

const getStorage = () => typeof window === "undefined" ? null : window.localStorage;

export function saveHospitalDraft(answers: AnswerMap, currentPageId: string, key: string, now = Date.now()) {
  getStorage()?.setItem(key, JSON.stringify({ answers, currentPageId, savedAt: now } satisfies HospitalDraft));
}

export function loadHospitalDraft(key: string, now = Date.now()): HospitalDraft | null {
  const storage = getStorage();
  const raw = storage?.getItem(key);
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as Partial<HospitalDraft>;
    if (!draft.savedAt || now - draft.savedAt > MAX_AGE_MS || !draft.answers || typeof draft.answers !== "object" || typeof draft.currentPageId !== "string") {
      storage?.removeItem(key);
      return null;
    }
    return draft as HospitalDraft;
  } catch {
    storage?.removeItem(key);
    return null;
  }
}

export function clearHospitalDraft(key: string) {
  getStorage()?.removeItem(key);
}
