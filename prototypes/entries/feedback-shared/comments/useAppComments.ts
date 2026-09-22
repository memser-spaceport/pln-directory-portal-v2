'use client';

import { useCallback, useEffect, useState } from 'react';

import type { AiAppFeedbackStatus } from '@/services/ai-app-feedback/constants';

import type { AppComment, CommentAnchor } from './types';

const KEY = (appUid: string) => `ai-apps:comments:${appUid}`;

/**
 * Seeded threads so the author's view has something to triage on arrival. They
 * anchor to elements of the mocked app by CSS path, the way real pins would,
 * and their thumbnails are captured lazily the first time the thread opens.
 */
const SEED: Record<string, AppComment[]> = {
  'app-1': [
    {
      id: 'c-seed-1',
      appUid: 'app-1',
      authorUid: 'm-4',
      authorName: 'Daniel Singer',
      text: 'This opens a new tab for me. Could the draft show up right here so I can tweak it before sending?',
      status: 'NEW',
      minutesAgo: 60 * 5,
      shot: null,
      replies: [],
      anchor: 'body > div:nth-of-type(2) > div:nth-of-type(1) > a',
      ox: 0.5,
      oy: 0.5,
      x: 0,
      y: 0,
    },
    {
      id: 'c-seed-2',
      appUid: 'app-1',
      authorUid: 'm-6',
      authorName: 'Nina Chen',
      text: 'What goes into the match score? A hover breakdown would make me trust the 92%.',
      status: 'VIEWED',
      minutesAgo: 60 * 26,
      shot: null,
      replies: [
        {
          id: 'r-seed-1',
          authorUid: 'm-1',
          authorName: 'Polina Bublii',
          text: 'Good call — adding a breakdown on hover in the next deploy.',
          minutesAgo: 60 * 20,
        },
      ],
      anchor: 'body > div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(3)',
      ox: 0.7,
      oy: 0.4,
      x: 0,
      y: 0,
    },
  ],
};

function load(appUid: string): AppComment[] {
  try {
    const raw = sessionStorage.getItem(KEY(appUid));
    if (raw) return JSON.parse(raw) as AppComment[];
  } catch {
    /* private mode / quota — fall through to the seed */
  }
  return SEED[appUid] ?? [];
}

function persist(appUid: string, comments: AppComment[]) {
  try {
    sessionStorage.setItem(KEY(appUid), JSON.stringify(comments));
  } catch {
    /* thumbnails can exceed the quota in a long session; the in-memory copy still works */
  }
}

let nextId = 1;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${nextId++}`;

export interface Viewer {
  uid: string;
  name: string;
}

/**
 * Per-app comment store, kept in sessionStorage so leaving for the grid and
 * coming back finds the pins where they were. Stands in for production's
 * `/v1/ai-apps/:uid/feedback` rows.
 */
export function useAppComments(appUid: string, viewer: Viewer) {
  // Starts empty and hydrates in an effect: the route server-renders, and
  // sessionStorage only exists in the browser.
  const [comments, setComments] = useState<AppComment[]>([]);

  useEffect(() => {
    setComments(load(appUid));
  }, [appUid]);

  const update = useCallback(
    (fn: (prev: AppComment[]) => AppComment[]) =>
      setComments((prev) => {
        const next = fn(prev);
        persist(appUid, next);
        return next;
      }),
    [appUid],
  );

  const add = useCallback(
    (anchor: CommentAnchor, text: string, shot: string): AppComment => {
      const comment: AppComment = {
        ...anchor,
        id: newId('c'),
        appUid,
        authorUid: viewer.uid,
        authorName: viewer.name,
        text,
        status: 'NEW',
        minutesAgo: 0,
        shot,
        replies: [],
      };
      update((prev) => [...prev, comment]);
      return comment;
    },
    [appUid, update, viewer],
  );

  const reply = useCallback(
    (commentId: string, text: string) =>
      update((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                replies: [
                  ...c.replies,
                  { id: newId('r'), authorUid: viewer.uid, authorName: viewer.name, text, minutesAgo: 0 },
                ],
              }
            : c,
        ),
      ),
    [update, viewer],
  );

  const setStatus = useCallback(
    (commentId: string, status: AiAppFeedbackStatus) =>
      update((prev) => prev.map((c) => (c.id === commentId ? { ...c, status } : c))),
    [update],
  );

  const setShot = useCallback(
    (commentId: string, shot: string) =>
      update((prev) => prev.map((c) => (c.id === commentId && c.shot === null ? { ...c, shot } : c))),
    [update],
  );

  return { comments, add, reply, setStatus, setShot };
}
