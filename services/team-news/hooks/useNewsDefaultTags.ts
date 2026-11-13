'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { MembersQueryKeys } from '@/services/members/constants';
import { SHOW_NEWS_PREFERENCES } from '@/utils/news-categories';
import { TeamNewsQueryKeys } from '../constants';
import { approveNewsDefaultTags, getNewsDefaultTags } from '../team-news.service';

const defaultTagsKey = (memberUid: string | undefined) => [TeamNewsQueryKeys.DEFAULT_TAGS, memberUid] as const;

/**
 * The signed-in member's default news tags, for the Home tag card (LAB-3250). One request per session, none for a
 * signed-out visitor or while News preferences is off. No data while loading and after a failure.
 */
export function useNewsDefaultTags(memberUid: string | undefined) {
  return useQuery({
    queryKey: defaultTagsKey(memberUid),
    queryFn: getNewsDefaultTags,
    enabled: SHOW_NEWS_PREFERENCES && Boolean(memberUid),
    staleTime: Infinity,
    retry: false,
  });
}

/**
 * Sends the member's answer to the tag card: no tags approves the default tags as shown, tags saves them as the
 * member's own. The response replaces the cached default tags, so the card hides itself; saved tags also refresh the
 * cached preferences.
 */
export function useApproveNewsDefaultTags(memberUid: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tags?: string[]) => approveNewsDefaultTags(tags),
    onSuccess: (data, tags) => {
      queryClient.setQueryData(defaultTagsKey(memberUid), data);
      if (tags) {
        queryClient.invalidateQueries({ queryKey: [MembersQueryKeys.GET_MEMBER_PREFERENCES] });
      }
    },
  });
}
