import type { AnswerMap } from "./types";

const DEFAULT_DRAFT_KEY = "nuoma.health-survey.v1.draft";
const MAX_AGE_MS = 48 * 60 * 60 * 1000;

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): unknown;
  removeItem(key: string): unknown;
}

export interface SurveyDraft {
  answers: AnswerMap;
  sectionIndex: number;
  savedAt: number;
}

const browserStorage = (): DraftStorage | null =>
  typeof window === "undefined" ? null : window.localStorage;

export function saveDraft(
  answers: AnswerMap,
  sectionIndex: number,
  storage: DraftStorage | null = browserStorage(),
  now = Date.now(),
  key = DEFAULT_DRAFT_KEY,
) {
  storage?.setItem(key, JSON.stringify({ answers, sectionIndex, savedAt: now } satisfies SurveyDraft));
}

export function loadDraft(
  storage: DraftStorage | null = browserStorage(),
  now = Date.now(),
  key = DEFAULT_DRAFT_KEY,
): SurveyDraft | null {
  const raw = storage?.getItem(key);
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as SurveyDraft;
    if (!draft.savedAt || now - draft.savedAt > MAX_AGE_MS) {
      storage?.removeItem(key);
      return null;
    }
    return draft;
  } catch {
    storage?.removeItem(key);
    return null;
  }
}

export function clearDraft(storage: DraftStorage | null = browserStorage(), key = DEFAULT_DRAFT_KEY) {
  storage?.removeItem(key);
}
