/**
 * Unsent feedback, kept in this browser through reloads. A draft is named by the place it was
 * started: the app it is about and, inside the app, the screen. Its words go to localStorage, one
 * key per place. Its pictures — the screenshots with their marks, and images pasted into the text
 * as data URIs — go to IndexedDB under the same key, because two or three of them are more than
 * localStorage holds.
 *
 * Every read and write may fail (a private window, storage turned off). A failure means the draft
 * is not kept, never that the panel breaks.
 */
import type { AiAppFeedbackPriority, AiAppFeedbackReportKind } from '@/services/ai-app-feedback/constants';
import type { ScreenshotAttachment } from '../screenshot-feedback';

export const AI_APP_FEEDBACK_DRAFT_KEY = 'form-draft:ai-app-feedback';

export type DraftPlace = {
  appUid?: string;
  appName?: string;
  /** The app's own path, inside the app. */
  screen?: string;
};

export type NoteView = 'rich' | 'markdown';

export type DraftWords = {
  /**
   * The note as markdown, with each pasted data-URI image replaced by `draft-image:N` (the Nth
   * stored image). Quill HTML in a draft from before the views, which has no `view`.
   */
  message: string;
  /** The view the note was being written in. */
  view?: NoteView;
  app?: { label: string; value: string } | null;
  reportKind?: AiAppFeedbackReportKind;
  priority?: AiAppFeedbackPriority;
  place?: DraftPlace;
  /** Screenshots and text images kept in IndexedDB. */
  pictures?: number;
  startedAt?: number;
};

export type SavedDraft = DraftWords & { key: string; savedAt: number };

export type DraftPictures = {
  shots: ScreenshotAttachment[];
  images: string[];
};

/** Same envelope as `utils/formDraftStorage`, so a draft saved before pictures were kept still reads. */
type Envelope = { v: 1; savedAt: number; data: DraftWords };

export function feedbackDraftKey(place: DraftPlace): string {
  if (!place.appUid) return AI_APP_FEEDBACK_DRAFT_KEY;
  return `${AI_APP_FEEDBACK_DRAFT_KEY}:${place.appUid}${place.screen ? `:${place.screen}` : ''}`;
}

export function readFeedbackDraft(key: string): SavedDraft | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as Envelope;
    if (envelope?.v !== 1 || typeof envelope.savedAt !== 'number' || typeof envelope.data?.message !== 'string') {
      return null;
    }
    /* Drafts from before places were stored are per app, named by the key. */
    const place = envelope.data.place ?? (key === AI_APP_FEEDBACK_DRAFT_KEY ? {} : { appUid: key.split(':')[2] });
    return { ...envelope.data, place, key, savedAt: envelope.savedAt };
  } catch {
    return null;
  }
}

export function writeFeedbackDraft(key: string, words: DraftWords | null): void {
  try {
    if (words) {
      const envelope: Envelope = { v: 1, savedAt: Date.now(), data: words };
      window.localStorage.setItem(key, JSON.stringify(envelope));
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    /* not kept */
  }
}

/** Every draft in this browser, the latest first. */
export function listFeedbackDrafts(): SavedDraft[] {
  const drafts: SavedDraft[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key !== AI_APP_FEEDBACK_DRAFT_KEY && !key?.startsWith(`${AI_APP_FEEDBACK_DRAFT_KEY}:`)) continue;
      const draft = readFeedbackDraft(key);
      if (draft) drafts.push(draft);
    }
  } catch {
    /* nothing to list */
  }
  return drafts.sort((a, b) => b.savedAt - a.savedAt);
}

/* As an `<img>` or a markdown image: drafts from before the markdown note hold Quill HTML. */
const DATA_URI_IMAGE = /(<img\b[^>]*?\bsrc="|!\[[^\]]*\]\()(data:[^")\s]+)/gi;
const DRAFT_IMAGE = /<img\b[^>]*?\bsrc="draft-image:(\d+)"[^>]*>|!\[[^\]]*\]\(draft-image:(\d+)\)/gi;

/** Takes pasted images out of the text, so the words fit in localStorage. */
export function packTextImages(text: string): { message: string; images: string[] } {
  const images: string[] = [];
  const message = text.replace(DATA_URI_IMAGE, (_, open: string, src: string) => {
    images.push(src);
    return `${open}draft-image:${images.length - 1}`;
  });
  return { message, images };
}

/** Puts them back. An image that could not be read back is left out rather than shown broken. */
export function unpackTextImages(message: string, images: string[]): string {
  return message.replace(DRAFT_IMAGE, (tag, htmlIndex?: string, markdownIndex?: string) => {
    const index = htmlIndex ?? markdownIndex;
    const src = images[Number(index)];
    return src ? tag.replace(`draft-image:${index}`, src) : '';
  });
}

const STORE = 'pictures';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('ai-app-feedback-drafts', 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transact<T>(mode: IDBTransactionMode, act: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = act(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/* One transaction at a time, so a late save never overtakes a newer one or a discard, and a
   reopen waits for the write before it. */
let queue: Promise<unknown> = Promise.resolve();
function run<T>(mode: IDBTransactionMode, act: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const result = queue.then(() => transact(mode, act));
  queue = result.catch(() => undefined);
  return result;
}

export async function readFeedbackPictures(key: string): Promise<DraftPictures | null> {
  try {
    const kept = await run<DraftPictures | undefined>('readonly', (store) => store.get(key));
    return kept && Array.isArray(kept.shots) && Array.isArray(kept.images) ? kept : null;
  } catch {
    return null;
  }
}

export async function writeFeedbackPictures(key: string, pictures: DraftPictures | null): Promise<void> {
  try {
    if (pictures && (pictures.shots.length || pictures.images.length)) {
      await run('readwrite', (store) => store.put(pictures, key));
    } else {
      await run('readwrite', (store) => store.delete(key));
    }
  } catch {
    /* not kept */
  }
}

export function discardFeedbackDraft(key: string): void {
  writeFeedbackDraft(key, null);
  void writeFeedbackPictures(key, null);
}
