'use client';

import { useMutation, useQuery } from '@tanstack/react-query';

import type { IJobReferralRecipient } from '@/types/jobs.types';

import { JobsQueryKey } from '../constants';
import { createJobReferral, fetchJobReferralDraft } from '../jobs.service';

interface UseJobReferralDraftInput {
  jobUid: string;
  /** The member being referred. No draft exists until one is picked. */
  referredMemberUid: string | undefined;
  enabled?: boolean;
}

/**
 * The server-composed note for the refer modal.
 *
 * Keyed on both uids because the draft states facts about the pair — the note names
 * the referred member and closes with the referrer's own title and company. Not
 * cached beyond the session: a member's bio or role can change between two referrals,
 * and the draft is cheap.
 */
export function useJobReferralDraft(input: UseJobReferralDraftInput) {
  const { jobUid, referredMemberUid, enabled = true } = input;

  return useQuery({
    queryKey: [JobsQueryKey.ReferralDraft, jobUid, referredMemberUid],
    queryFn: () => fetchJobReferralDraft(jobUid, referredMemberUid as string),
    enabled: enabled && !!jobUid && !!referredMemberUid,
    staleTime: 0,
    gcTime: 0,
    // Refetching on focus would silently replace a note the referrer is editing.
    refetchOnWindowFocus: false,
  });
}

export function useCreateJobReferral(jobUid: string) {
  return useMutation({
    mutationFn: (payload: { referredMemberUid: string; recipients: IJobReferralRecipient[]; note: string }) =>
      createJobReferral(jobUid, payload),
  });
}
