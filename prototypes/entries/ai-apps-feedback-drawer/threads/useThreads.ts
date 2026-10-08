'use client';

import { useCallback, useEffect, useState } from 'react';

import type { AiAppFeedbackStatus } from '@/services/ai-app-feedback/constants';
import type { AnnotationState } from '@/components/page/ai-apps/components/screenshot-feedback';

import type { AppComment, CommentAnchor } from '../../feedback-shared/comments/types';

/**
 * One comment thread: the shared `AppComment` (anchor, status, picture,
 * replies) plus the one thing a thread needs to stay readable after the app
 * changes under it: what the element *was*, in words, taken when it was clicked.
 */
export interface Thread extends AppComment {
  label: string;
  /**
   * What was drawn on the attached screenshot, in production's annotation
   * format (the feedback annotator's). `shot` is the screenshot itself:
   * '' = none attached, null = attached and not photographed yet.
   */
  annotations: AnnotationState | null;
  /** Ids of the comment (the thread's own id) and replies changed after posting — they read "Edited". */
  editedIds?: string[];
  /** Kind and Priority picked in the composer (2026-10-06), the feedback form's triage. */
  kind?: string;
  priority?: string;
}

/** The composer's triage, posted with the comment. */
export interface Triage {
  kind: string;
  priority: string;
}

/** A screenshot attached in the composer, with what was drawn on it. */
export interface Attachment {
  src: string;
  annotations: AnnotationState;
}

export interface PinTarget {
  anchor: CommentAnchor;
  label: string;
  shot: string | null;
}

const KEY = (appUid: string) => `ai-apps-feedback-drawer:threads:${appUid}`;

/**
 * Seeded on the Warm Intro Matcher (app-1). The anchors are CSS paths into that
 * app's mocked markup, the way the bridge would report them. The third one points
 * at an "Export CSV" button the current deploy no longer has, which is the case
 * the list has to survive: the element is gone, the conversation is not.
 */
const SEED: Record<string, Thread[]> = {
  'app-1': [
    {
      id: 't-seed-1',
      appUid: 'app-1',
      authorUid: 'm-4',
      authorName: 'Daniel Singer',
      text: 'This opens a new tab for me. Could the draft show up right here so I can tweak it before sending?',
      status: 'NEW',
      minutesAgo: 60 * 5,
      shot: '',
      annotations: null,
      replies: [],
      label: 'Link “Draft intro via Roneil Rumburg →”',
      anchor: 'body > div:nth-of-type(2) > div:nth-of-type(1) > a',
      ox: 0.5,
      oy: 0.5,
      x: 0,
      y: 0,
    },
    {
      id: 't-seed-2',
      appUid: 'app-1',
      authorUid: 'm-6',
      authorName: 'Nina Chen',
      text: 'What goes into the match score? A hover breakdown would make me trust the 92%.',
      status: 'VIEWED',
      minutesAgo: 60 * 26,
      // Attached, with a ring round the number; photographed on first open.
      shot: null,
      annotations: {
        version: 1,
        strokes: [],
        shapes: [
          { kind: 'ellipse', color: '#e5484d', width: 0.012, x: 0.03, y: 0.12, w: 0.42, h: 0.5 },
          { kind: 'arrow', color: '#e5484d', width: 0.012, x: 0.75, y: 0.85, w: -0.25, h: -0.35 },
        ],
        comments: [],
      },
      replies: [
        {
          id: 'r-seed-1',
          authorUid: 'm-1',
          authorName: 'Polina Bublii',
          text: 'Good call — adding a breakdown on hover in the next deploy.',
          minutesAgo: 60 * 20,
        },
      ],
      label: 'Card “92% match score”',
      anchor: 'body > div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(3)',
      ox: 0.7,
      oy: 0.4,
      x: 0,
      y: 0,
    },
    {
      id: 't-seed-3',
      appUid: 'app-1',
      authorUid: 'm-5',
      authorName: 'Priya Raman',
      text: 'Export only gives me names — can it include the path for each one?',
      status: 'IMPLEMENTED',
      minutesAgo: 60 * 24 * 6,
      // Sent before the element went away; nothing left to photograph now.
      shot: '',
      annotations: null,
      replies: [
        {
          id: 'r-seed-2',
          authorUid: 'm-1',
          authorName: 'Polina Bublii',
          text: 'Replaced the export with the path list on the card itself — no download needed.',
          minutesAgo: 60 * 24 * 2,
        },
      ],
      label: 'Button “Export CSV”',
      anchor: 'body > div:nth-of-type(2) > div:nth-of-type(1) > button.export',
      ox: 0.5,
      oy: 0.5,
      x: 0,
      y: 0,
    },
  ],
};

function load(appUid: string): Thread[] {
  try {
    const raw = sessionStorage.getItem(KEY(appUid));
    if (raw) return JSON.parse(raw) as Thread[];
  } catch {
    /* private mode — fall through to the seed */
  }
  return SEED[appUid] ?? [];
}

function persist(appUid: string, threads: Thread[]) {
  try {
    sessionStorage.setItem(KEY(appUid), JSON.stringify(threads));
  } catch {
    /* pictures can exceed the quota; the in-memory copy still works */
  }
}

let nextId = 1;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${nextId++}`;

export interface Viewer {
  uid: string;
  name: string;
}

/**
 * Per-app thread store in sessionStorage, standing in for production's
 * rows (a comments endpoint beside `/v1/ai-apps/:uid/feedback`). Its own key, so this prototype and the
 * `ai-apps` one never share pins.
 */
export function useThreads(appUid: string, viewer: Viewer) {
  // Hydrated in an effect: the route server-renders and sessionStorage is browser-only.
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    setThreads(load(appUid));
  }, [appUid]);

  const update = useCallback(
    (fn: (prev: Thread[]) => Thread[]) =>
      setThreads((prev) => {
        const next = fn(prev);
        persist(appUid, next);
        return next;
      }),
    [appUid],
  );

  const add = useCallback(
    (text: string, pin: PinTarget, attachment: Attachment | null, triage?: Triage): Thread => {
      const thread: Thread = {
        ...pin.anchor,
        id: newId('t'),
        appUid,
        authorUid: viewer.uid,
        authorName: viewer.name,
        text,
        status: 'NEW',
        minutesAgo: 0,
        shot: attachment?.src ?? '',
        annotations: attachment?.annotations ?? null,
        replies: [],
        label: pin.label,
        kind: triage?.kind,
        priority: triage?.priority,
      };
      update((prev) => [thread, ...prev]);
      return thread;
    },
    [appUid, update, viewer],
  );

  const reply = useCallback(
    (threadId: string, text: string) =>
      update((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                replies: [
                  ...t.replies,
                  { id: newId('r'), authorUid: viewer.uid, authorName: viewer.name, text, minutesAgo: 0 },
                ],
              }
            : t,
        ),
      ),
    [update, viewer],
  );

  /** Edit a comment or a reply — the thread's own id edits the first comment. */
  const editText = useCallback(
    (threadId: string, itemId: string, text: string) =>
      update((prev) =>
        prev.map((t) => {
          if (t.id !== threadId) return t;
          const editedIds = Array.from(new Set([...(t.editedIds ?? []), itemId]));
          if (itemId === t.id) return { ...t, text, editedIds };
          return { ...t, editedIds, replies: t.replies.map((r) => (r.id === itemId ? { ...r, text } : r)) };
        }),
      ),
    [update],
  );

  /** Deleting the first comment deletes the thread (its replies were answers to it). */
  const deleteThread = useCallback(
    (threadId: string) => update((prev) => prev.filter((t) => t.id !== threadId)),
    [update],
  );

  const deleteReply = useCallback(
    (threadId: string, replyId: string) =>
      update((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, replies: t.replies.filter((r) => r.id !== replyId) } : t)),
      ),
    [update],
  );

  const setStatus = useCallback(
    (threadId: string, status: AiAppFeedbackStatus) =>
      update((prev) => prev.map((t) => (t.id === threadId ? { ...t, status } : t))),
    [update],
  );

  const setShot = useCallback(
    (threadId: string, shot: string) =>
      update((prev) => prev.map((t) => (t.id === threadId && t.shot === null ? { ...t, shot } : t))),
    [update],
  );

  return { threads, add, reply, editText, deleteThread, deleteReply, setStatus, setShot };
}

export type ThreadStore = ReturnType<typeof useThreads>;
