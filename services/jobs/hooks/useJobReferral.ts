'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import type { ICreateJobReferralPayload } from '@/types/jobs.types';

import { JobsQueryKey } from '../constants';
import { createJobReferral, fetchJobReferralDraft } from '../jobs.service';

interface UseJobReferralDraftInput {
  jobUid: string;
  /** The member being referred. No draft exists until one is picked. */
  referredMemberUid: string | undefined;
  /** The name of someone outside the network, when that is who is being referred. The
   *  server drafts from the name alone — it has no other record to read. Mutually
   *  exclusive with `referredMemberUid`; the modal guarantees that by construction,
   *  since the two arms are gated on which state the referee field is in. */
  referredName?: string | undefined;
  enabled?: boolean;
}

/**
 * The server-composed note for the refer modal.
 *
 * Keyed on the role and whoever the note is about, because the draft states facts about
 * the pair — it names the referred person and closes with the referrer's own title and
 * company. The member and the name get their own key slots so a uid and a name can never
 * land in the same one. Not cached beyond the session: a member's bio or role can change
 * between two referrals, and the draft is cheap.
 */
export function useJobReferralDraft(input: UseJobReferralDraftInput) {
  const { jobUid, referredMemberUid, referredName, enabled = true } = input;

  return useQuery({
    queryKey: [JobsQueryKey.ReferralDraft, jobUid, referredMemberUid ?? null, referredName ?? null],
    queryFn: () =>
      fetchJobReferralDraft(jobUid, referredMemberUid ? { memberUid: referredMemberUid } : { name: referredName! }),
    enabled: enabled && !!jobUid && (!!referredMemberUid || !!referredName),
    staleTime: 0,
    gcTime: 0,
    // Refetching on focus would silently replace a note the referrer is editing.
    refetchOnWindowFocus: false,
  });
}

export function useCreateJobReferral(jobUid: string) {
  return useMutation({
    mutationFn: (payload: ICreateJobReferralPayload) => createJobReferral(jobUid, payload),
  });
}
