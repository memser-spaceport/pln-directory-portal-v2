'use client';

import { useQuery } from '@tanstack/react-query';

import type { ITeamNewsPrompt } from '@/types/team-news.types';

import { TeamNewsQueryKeys } from '../constants';
import { NEWS_PROMPT_CANDIDATE_LIMIT, selectNewsPrompts } from '../newsPrompts';
import { getTeamNewsNewest } from '../team-news.service';

// Five minutes, as the header's new-news check: the prompts follow the news
// feed, and news does not land often enough to be worth more.
const NEWS_PROMPTS_STALE_TIME = 5 * 60_000;

/** "Try asking" prompts for the AI Search new-chat page, from the newest news stories. */
export function useTeamNewsPrompts() {
  return useQuery<ITeamNewsPrompt[], Error>({
    queryKey: [TeamNewsQueryKeys.AI_SEARCH_PROMPTS],
    queryFn: async () => selectNewsPrompts(await getTeamNewsNewest(NEWS_PROMPT_CANDIDATE_LIMIT)),
    staleTime: NEWS_PROMPTS_STALE_TIME,
    // The fetcher already turns failures into null (no prompts); the block is optional.
    retry: false,
  });
}
