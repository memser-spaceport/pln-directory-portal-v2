export type FormDraftEnvelope<T> = {
  v: 1;
  savedAt: number;
  data: T;
};

export const FORM_DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function readFormDraft<T>(key: string, ttlMs = FORM_DRAFT_TTL_MS): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const envelope = JSON.parse(raw) as FormDraftEnvelope<T>;
    if (envelope.v !== 1 || typeof envelope.savedAt !== 'number' || envelope.data === undefined) {
      clearFormDraft(key);
      return null;
    }

    if (Date.now() - envelope.savedAt > ttlMs) {
      clearFormDraft(key);
      return null;
    }

    return envelope.data;
  } catch {
    clearFormDraft(key);
    return null;
  }
}

export function writeFormDraft<T>(key: string, data: T): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const envelope: FormDraftEnvelope<T> = { v: 1, savedAt: Date.now(), data };
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

export function clearFormDraft(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
