'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ElementDescriptor } from '@/ai-apps-bridge/protocol';
import type { AiAppEnvironment, FeedbackPinInput } from '@/services/ai-app-feedback/ai-app-feedback.service';
import {
  ANNOTATION_ATTR,
  hasAnyAnnotation,
  serializeAnnotations,
  type AnnotationState,
} from '../screenshot-feedback/types';
import { PIN_CROP_CLASS } from './pinsHtml';

/*
 * Comment mode's unsent comments (prototype DraftsPanel), kept per app in this
 * browser so a reload or a misclick never costs three marked-up comments. Only
 * what can be stored is: the element as the bridge described it, the click
 * point, the hosted crop URL and its marks. The bridge's id for the element is
 * this page load's alone, so a restored draft has no marker until it is sent.
 */

export type CommentDraft = {
  id: string;
  note: string;
  element: ElementDescriptor;
  point: { ox: number; oy: number } | null;
  env: AiAppEnvironment;
  /** Hosted crop; null while hosting, or if the crop failed. */
  cropUrl: string | null;
  cropState: 'pending' | 'done' | 'failed';
  annotations: AnnotationState | null;
  /** The bridge's id for the element on this page load (not stored). */
  bridgePinId: string | null;
};

type Stored = { v: 1; drafts: Omit<CommentDraft, 'bridgePinId'>[]; general: string };
type Snapshot = { drafts: CommentDraft[]; general: string };

const storageKey = (appUid: string) => `ai-app-comment-drafts:${appUid}`;
const MAX_NOTE = 5000;
const EMPTY: Snapshot = { drafts: [], general: '' };

/** What this browser holds for the app; null when storage can't be read at all. */
function read(appUid: string): Snapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(appUid));
    const parsed = raw ? (JSON.parse(raw) as Stored) : null;
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.drafts)) return EMPTY;
    return {
      drafts: parsed.drafts.map((d) => ({ ...d, bridgePinId: null })),
      general: typeof parsed.general === 'string' ? parsed.general : '',
    };
  } catch {
    return null;
  }
}

/** False when the browser wouldn't keep it (private mode, quota). */
function write(appUid: string, snapshot: Snapshot): boolean {
  try {
    const key = storageKey(appUid);
    if (snapshot.drafts.length === 0 && !snapshot.general.trim()) {
      window.localStorage.removeItem(key);
      return true;
    }
    const stored: Stored = {
      v: 1,
      drafts: snapshot.drafts.map(({ bridgePinId: _bridgePinId, ...rest }) => rest),
      general: snapshot.general,
    };
    window.localStorage.setItem(key, JSON.stringify(stored));
    return true;
  } catch {
    return false;
  }
}

/**
 * The stored drafts as this tab shows them. Only the tab that took a crop can
 * finish hosting it, so a crop still pending that this tab isn't making reads
 * as failed (its own tab's update flips it to done if it lands). The bridge's
 * id for an element is this page load's, so it is kept from this tab's copy.
 */
function adopt(stored: Snapshot, local: Snapshot): Snapshot {
  const mine = new Map(local.drafts.map((d) => [d.id, d]));
  return {
    general: stored.general,
    drafts: stored.drafts.map((d) => {
      const own = mine.get(d.id);
      return {
        ...d,
        bridgePinId: own?.bridgePinId ?? null,
        cropState: d.cropState === 'pending' && own?.cropState !== 'pending' ? 'failed' : d.cropState,
      };
    }),
  };
}

let nextId = 1;
const newDraftId = () => `d-${Date.now().toString(36)}-${nextId++}`;

/*
 * The same app open in two tabs shares one stored list. Each change is applied
 * to what is stored right now, not to this tab's copy, and the other tabs pick
 * it up from the `storage` event — so sending (or clearing) in one tab removes
 * only what it sent, never the comments queued in another.
 */
export function useCommentDrafts(appUid: string) {
  /* Read once per app; comment mode renders client-side only, after a click. */
  const [state, setState] = useState(() => ({ appUid, ...adopt(read(appUid) ?? EMPTY, EMPTY) }));
  if (state.appUid !== appUid) setState({ appUid, ...adopt(read(appUid) ?? EMPTY, EMPTY) });

  /* The latest snapshot for the change handlers, which may run several times before a render. */
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);

  /* Once a write fails the stored list is stale, and this tab's copy is the truth. */
  const storageKept = useRef(true);

  const commit = useCallback((change: (snapshot: Snapshot) => Snapshot) => {
    const local = latest.current;
    const stored = storageKept.current ? read(local.appUid) : null;
    const next = change(stored ? adopt(stored, local) : local);
    storageKept.current = write(local.appUid, next);
    latest.current = { appUid: local.appUid, ...next };
    setState(latest.current);
  }, []);

  useEffect(() => {
    const key = storageKey(appUid);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key && event.key !== null) return;
      const local = latest.current;
      if (local.appUid !== appUid) return;
      latest.current = { appUid, ...adopt(read(appUid) ?? EMPTY, local) };
      setState(latest.current);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [appUid]);

  const add = useCallback(
    (draft: Omit<CommentDraft, 'id'>) => {
      const id = newDraftId();
      commit((s) => ({ ...s, drafts: [...s.drafts, { ...draft, note: draft.note.slice(0, MAX_NOTE), id }] }));
      return id;
    },
    [commit],
  );
  const update = useCallback(
    (id: string, patch: Partial<Omit<CommentDraft, 'id'>>) => {
      commit((s) => ({ ...s, drafts: s.drafts.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
    },
    [commit],
  );
  const remove = useCallback(
    (ids: string[]) => {
      const gone = new Set(ids);
      commit((s) => ({ ...s, drafts: s.drafts.filter((d) => !gone.has(d.id)) }));
    },
    [commit],
  );
  const setGeneral = useCallback(
    (general: string) => commit((s) => ({ ...s, general: general.slice(0, MAX_NOTE) })),
    [commit],
  );
  /** After sending the whole-app comment: clears it unless it was rewritten meanwhile (here or in another tab). */
  const clearGeneral = useCallback(
    (sent: string) => commit((s) => (s.general === sent ? { ...s, general: '' } : s)),
    [commit],
  );
  /** Clear in the dock: drops the comments this tab is showing, not ones queued since in another tab. */
  const clear = useCallback(() => {
    const shown = new Set(latest.current.drafts.map((d) => d.id));
    commit((s) => ({ ...s, drafts: s.drafts.filter((d) => !shown.has(d.id)) }));
  }, [commit]);

  return { drafts: state.drafts, general: state.general, add, update, remove, setGeneral, clearGeneral, clear };
}

export type CommentDrafts = ReturnType<typeof useCommentDrafts>;

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function paragraphs(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/**
 * The readable text of one pinned comment, for the feedback list and the
 * agent's HTML: what was said, where (selector · page), and the element's crop
 * with any marks on it. The pin itself travels as data alongside.
 */
export function commentHtml(draft: Pick<CommentDraft, 'note' | 'element' | 'cropUrl' | 'annotations'>): string {
  const where = [`<code>${escapeHtml(draft.element.selector)}</code>`, escapeHtml(draft.element.page.path)].join(' · ');
  const marks =
    draft.annotations && hasAnyAnnotation(draft.annotations)
      ? ` ${ANNOTATION_ATTR}="${serializeAnnotations(draft.annotations)}"`
      : '';
  const crop = draft.cropUrl
    ? `<p><img src="${escapeHtml(draft.cropUrl)}" alt="${escapeHtml(`Pin: ${draft.note.trim() || draft.element.tag}`.slice(0, 200))}" class="${PIN_CROP_CLASS}"${marks}></p>`
    : '';
  return `${paragraphs(draft.note) || '<p>(no comment)</p>'}<p>${where}</p>${crop}`;
}

/** A comment about the whole app: no pin. */
export function generalCommentHtml(text: string): string {
  return paragraphs(text);
}

/** The pin as POST /:uid/feedback stores it: one pin per comment, so always n = 1. */
export function draftToPinInput(draft: CommentDraft): FeedbackPinInput {
  const { element } = draft;
  return {
    n: 1,
    env: draft.env,
    pagePath: element.page.path.startsWith('/') ? element.page.path : `/${element.page.path}`,
    pageQuery: null,
    selector: element.selector,
    tag: element.tag,
    text: element.text,
    role: element.role,
    ariaLabel: element.ariaLabel,
    component: element.component,
    source: element.source,
    rect: element.rect,
    viewportW: Math.max(1, Math.round(element.page.viewportW)),
    viewportH: Math.max(1, Math.round(element.page.viewportH)),
    note: draft.note.trim(),
    cropUrl: draft.cropUrl,
    ...(draft.point ? { ox: draft.point.ox, oy: draft.point.oy } : {}),
  };
}
