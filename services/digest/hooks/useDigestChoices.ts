'use client';

import { useCallback, useRef, useState } from 'react';

import { toast } from '@/components/core/ToastContainer';
import { saveDigestChoice } from '@/services/digest/digest.service';
import type { DigestChoice, DigestStory } from '@/services/digest/digest.types';

/** Where a story's confirmation shows: `top` for the email landing, `under` the buttons for a press on the page. */
export type DigestReceiptPlace = 'top' | 'under';

export const DIGEST_UNDONE_TOAST = 'Undone. Your preferences haven’t changed.';
export const DIGEST_SAVE_FAILED_TOAST = 'We couldn’t save that. Please try again.';

type ChoiceMap = Record<string, DigestChoice | null>;

/**
 * More / Less / Undo on the digest page (LAB-3264). Local state, not React Query: it is per story, starts from
 * the server render and is never shared. A press shows at once; the confirmation shows after the save. A failed
 * save goes back to the last saved state with an error toast. When presses overlap on one story, only the
 * latest request's answer is applied.
 *
 * The token is held in a closure only: never stored, never put in a query key or an event.
 */
export function useDigestChoices(token: string, stories: DigestStory[]) {
  const [choices, setChoices] = useState<ChoiceMap>(() =>
    Object.fromEntries(stories.map((story) => [story.uid, story.choice])),
  );
  const [receipts, setReceipts] = useState<Record<string, DigestReceiptPlace>>({});
  const saved = useRef<ChoiceMap>(Object.fromEntries(stories.map((story) => [story.uid, story.choice])));
  const latest = useRef<Record<string, number>>({});

  const send = useCallback(
    async (uid: string, next: DigestChoice | null, receipt: DigestReceiptPlace | null): Promise<boolean> => {
      const request = (latest.current[uid] ?? 0) + 1;
      latest.current[uid] = request;
      setChoices((current) => ({ ...current, [uid]: next }));
      setReceipts(({ [uid]: _dropped, ...rest }) => rest);
      try {
        const response = await saveDigestChoice(token, uid, next ?? 'none');
        if (latest.current[uid] !== request) return false;
        saved.current[uid] = response.choice;
        setChoices((current) => ({ ...current, [uid]: response.choice }));
        if (response.choice && receipt) setReceipts((current) => ({ ...current, [uid]: receipt }));
        if (!response.choice) toast.success(DIGEST_UNDONE_TOAST);
        return true;
      } catch {
        if (latest.current[uid] !== request) return false;
        setChoices((current) => ({ ...current, [uid]: saved.current[uid] ?? null }));
        toast.error(DIGEST_SAVE_FAILED_TOAST);
        return false;
      }
    },
    [token],
  );

  /** A press on a button. Pressing the active one undoes it. Returns the choice after the press. */
  const press = useCallback(
    (uid: string, kind: DigestChoice): DigestChoice | null => {
      const next = choices[uid] === kind ? null : kind;
      void send(uid, next, 'under');
      return next;
    },
    [choices, send],
  );

  const undo = useCallback((uid: string) => void send(uid, null, null), [send]);

  /** The choice from an email More / Less link: saved once, confirmed at the top of the card. */
  const land = useCallback((uid: string, kind: DigestChoice) => send(uid, kind, 'top'), [send]);

  return { choices, receipts, press, undo, land };
}
