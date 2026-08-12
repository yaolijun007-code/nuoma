import type { AnswerMap } from "./types";

const DRAFT_KEY = "nuoma.health-survey.v1.draft";
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
) {
  storage?.setItem(DRAFT_KEY, JSON.stringify({ answers, sectionIndex, savedAt: now } satisfies SurveyDraft));
}

export function loadDraft(
  storage: DraftStorage | null = browserStorage(),
  now = Date.now(),
): SurveyDraft | null {
  const raw = storage?.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as SurveyDraft;
    if (!draft.savedAt || now - draft.savedAt > MAX_AGE_MS) {
      storage?.removeItem(DRAFT_KEY);
      return null;
    }
    return draft;
  } catch {
    storage?.removeItem(DRAFT_KEY);
    return null;
  }
}

export function clearDraft(storage: DraftStorage | null = browserStorage()) {
  storage?.removeItem(DRAFT_KEY);
}

