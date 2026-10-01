'use client';

import { useCallback, useEffect, useState } from 'react';
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

const storageKey = (appUid: string) => `ai-app-comment-drafts:${appUid}`;
const MAX_NOTE = 5000;

function load(appUid: string): { drafts: CommentDraft[]; general: string } {
  if (typeof window === 'undefined') return { drafts: [], general: '' };
  try {
    const raw = window.localStorage.getItem(storageKey(appUid));
    const parsed = raw ? (JSON.parse(raw) as Stored) : null;
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.drafts)) return { drafts: [], general: '' };
    return {
      drafts: parsed.drafts.map((d) => ({
        ...d,
        bridgePinId: null,
        /* A crop that was still hosting when the page went away never will be. */
        cropState: d.cropState === 'pending' ? 'failed' : d.cropState,
      })),
      general: typeof parsed.general === 'string' ? parsed.general : '',
    };
  } catch {
    return { drafts: [], general: '' };
  }
}

let nextId = 1;
const newDraftId = () => `d-${Date.now().toString(36)}-${nextId++}`;

export function useCommentDrafts(appUid: string) {
  /* Read once per app; comment mode renders client-side only, after a click. */
  const [state, setState] = useState(() => ({ appUid, ...load(appUid) }));
  if (state.appUid !== appUid) setState({ appUid, ...load(appUid) });

  useEffect(() => {
    try {
      const key = storageKey(state.appUid);
      if (state.drafts.length === 0 && !state.general.trim()) {
        window.localStorage.removeItem(key);
        return;
      }
      const stored: Stored = {
        v: 1,
        drafts: state.drafts.map(({ bridgePinId: _bridgePinId, ...rest }) => rest),
        general: state.general,
      };
      window.localStorage.setItem(key, JSON.stringify(stored));
    } catch {
      /* Not kept in this browser (private mode, quota): the drafts still live in memory. */
    }
  }, [state]);

  const add = useCallback((draft: Omit<CommentDraft, 'id'>) => {
    const id = newDraftId();
    setState((s) => ({ ...s, drafts: [...s.drafts, { ...draft, note: draft.note.slice(0, MAX_NOTE), id }] }));
    return id;
  }, []);
  const update = useCallback((id: string, patch: Partial<Omit<CommentDraft, 'id'>>) => {
    setState((s) => ({ ...s, drafts: s.drafts.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  }, []);
  const remove = useCallback((ids: string[]) => {
    const gone = new Set(ids);
    setState((s) => ({ ...s, drafts: s.drafts.filter((d) => !gone.has(d.id)) }));
  }, []);
  const setGeneral = useCallback(
    (general: string) => setState((s) => ({ ...s, general: general.slice(0, MAX_NOTE) })),
    [],
  );
  const clear = useCallback(() => setState((s) => ({ ...s, drafts: [] })), []);

  return { drafts: state.drafts, general: state.general, add, update, remove, setGeneral, clear };
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
