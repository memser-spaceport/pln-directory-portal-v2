'use client';

import { useEffect, useMemo, useState } from 'react';

import { DirectoryMember, OutsidePerson } from '../types';

import { linkedinProfileUrl } from '../utils/linkedinProfileUrl';

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
 *
 * Someone outside the network is drafted here too, from the three facts the
 * referrer typed. The live endpoints have no such branch yet — see
 * `MockReferralPayload` for the shape they would need.
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

/** The same note for someone with no directory record. There is no title, team or
 *  skill list to draw a "why them" sentence from — the how-you-know slot the modal
 *  adds is where that comes from — so the second paragraph carries the two facts
 *  the hiring team can act on: how to reach them, and where to check who they are. */
function composeOutsideReferralNote(person: OutsidePerson, roleTitle: string, teamName: string): string {
  const name = person.name.trim();
  const first = name.split(' ')[0];
  return [
    `Hi — I'd like to refer ${name} for the ${roleTitle} role at ${teamName}.`,
    `${first} isn't in the PL network yet. You can reach them at ${person.email.trim()}, and their LinkedIn profile is ${linkedinProfileUrl(person.linkedin)}.`,
    `Happy to make the intro.`,
  ].join('\n\n');
}

interface UseJobReferralDraftInput {
  referredMember: DirectoryMember | null;
  /** The other kind of referee. Only one of the two is ever set. */
  referredPerson?: OutsidePerson | null;
  roleTitle: string;
  teamName: string;
  enabled: boolean;
}

/** What a draft is about, as one string, so a re-picked member (or a re-typed
 *  address) gets their note back instantly and any change re-drafts — the same
 *  shape as the live hook's query key. */
const draftKeyOf = (member: DirectoryMember | null, person: OutsidePerson | null | undefined): string | null => {
  if (member) return `member:${member.uid}`;
  if (person) return `outside:${person.name.trim()}|${person.email.trim().toLowerCase()}|${person.linkedin.trim()}`;
  return null;
};

export function useJobReferralDraft(input: UseJobReferralDraftInput) {
  const { referredMember, referredPerson, roleTitle, teamName, enabled } = input;
  const draftKey = draftKeyOf(referredMember, referredPerson);

  // A beat of pretend latency, so "Drafting your note…" shows the way it would live.
  // No resets: staleness is derived by comparing keys.
  const [settledKey, setSettledKey] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !draftKey) return;
    const timer = setTimeout(() => setSettledKey(draftKey), DRAFT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [enabled, draftKey]);

  const data = useMemo(() => {
    if (!draftKey || settledKey !== draftKey) return undefined;
    if (referredMember) return { note: composeReferralNote(referredMember, roleTitle, teamName) };
    if (referredPerson) return { note: composeOutsideReferralNote(referredPerson, roleTitle, teamName) };
    return undefined;
    // `draftKey` stands in for both records: it changes whenever either does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settledKey, draftKey, roleTitle, teamName]);

  return {
    data,
    isFetching: enabled && !!draftKey && settledKey !== draftKey,
    isError: false,
  };
}

/**
 * The proposal for `POST /job-openings/:uid/referrals`. Today it takes
 * `referredMemberUid` and nothing else can be referred; a referee outside the
 * network arrives as the three facts instead, with the LinkedIn value already
 * turned into a link. One or the other, never both.
 */
export type MockReferralPayload = {
  note: string;
  recipients: unknown[];
  includeReferredMember: boolean;
} & ({ referredMemberUid: string } | { referredPerson: OutsidePerson });

interface SendCallbacks {
  onSuccess?: (result: { uid: string }) => void;
  onError?: (error: unknown) => void;
}

export function useCreateJobReferral(_jobUid: string) {
  const [isPending, setIsPending] = useState(false);

  const mutate = (_payload: MockReferralPayload, callbacks?: SendCallbacks) => {
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      callbacks?.onSuccess?.({ uid: `mock-referral-${Date.now()}` });
    }, SEND_DELAY_MS);
  };

  return { mutate, isPending };
}
