'use client';

import { useEffect, useMemo, useState } from 'react';

import { DirectoryMember } from '../types';

/**
 * The referral draft and send — **mock-backed in this folder**.
 *
 * The job-board copy of the modal calls the real API (`GET .../referral-draft`,
 * `POST .../referrals`), which needs a real job-opening uid and a session; this
 * board's roles and viewers are invented, so on this entry the draft could only
 * ever error and the send could only ever fail — two dead ends on the demo path.
 * Here the note is composed from the same mocked records the pickers serve, and
 * the send resolves after a beat. Both keep the live hooks' shapes so the modal
 * body reads the same in both trees.
 */

const DRAFT_DELAY_MS = 450;
const SEND_DELAY_MS = 600;

const listOut = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/** The backend's job, approximated: a note from both members' records and the role.
 *  One paragraph of intro first — the modal inserts its how-you-know slot after the
 *  first paragraph break, so the greeting and the ask stay together above it. */
function composeReferralNote(member: DirectoryMember, roleTitle: string, teamName: string): string {
  const first = member.name.split(' ')[0];
  const skills = (member.skills ?? []).slice(0, 3);
  const why = skills.length ? ` Their work on ${listOut(skills)} is a close match for what this role asks.` : '';
  return [
    `Hi — I'd like to refer ${member.name} for the ${roleTitle} role at ${teamName}.`,
    `${first} is ${member.title}${member.team ? ` at ${member.team}` : ''}.${why}`,
    `Happy to connect you two — ${first} knows this note is on its way.`,
  ].join('\n\n');
}

interface UseJobReferralDraftInput {
  referredMember: DirectoryMember | null;
  roleTitle: string;
  teamName: string;
  enabled: boolean;
}

export function useJobReferralDraft({ referredMember, roleTitle, teamName, enabled }: UseJobReferralDraftInput) {
  // A beat of pretend latency, so "Drafting your note…" shows the way it would live.
  // No resets: staleness is derived by comparing uids, so a re-picked member gets
  // their note back instantly — the same shape as the live hook's query cache.
  const [settledUid, setSettledUid] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !referredMember?.uid) return;
    const timer = setTimeout(() => setSettledUid(referredMember.uid), DRAFT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [enabled, referredMember?.uid]);

  const data = useMemo(() => {
    if (!referredMember || settledUid !== referredMember.uid) return undefined;
    return { note: composeReferralNote(referredMember, roleTitle, teamName) };
  }, [settledUid, referredMember, roleTitle, teamName]);

  return {
    data,
    isFetching: enabled && !!referredMember?.uid && settledUid !== referredMember.uid,
    isError: false,
  };
}

interface SendCallbacks {
  onSuccess?: (result: { uid: string }) => void;
  onError?: (error: unknown) => void;
}

export function useCreateJobReferral(_jobUid: string) {
  const [isPending, setIsPending] = useState(false);

  const mutate = (_payload: unknown, callbacks?: SendCallbacks) => {
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      callbacks?.onSuccess?.({ uid: `mock-referral-${Date.now()}` });
    }, SEND_DELAY_MS);
  };

  return { mutate, isPending };
}
