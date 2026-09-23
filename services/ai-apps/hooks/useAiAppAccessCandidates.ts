'use client';

import { useQuery } from '@tanstack/react-query';

import { useDebounce } from '@/hooks/useDebounce';
import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { searchAiAppAccessCandidates } from '@/services/ai-apps/ai-apps.service';

const MIN_SEARCH_LENGTH = 2;

/** Debounced member search for the whitelist picker; idle below two characters. */
export function useAiAppAccessCandidates(uid: string, term: string) {
  const search = useDebounce(term.trim(), 300);
  const enabled = search.length >= MIN_SEARCH_LENGTH;

  const { data, isFetching } = useQuery({
    queryKey: [AiAppsQueryKeys.AI_APP_ACCESS_CANDIDATES, uid, search],
    queryFn: () => searchAiAppAccessCandidates(uid, search),
    enabled,
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
  });

  return {
    results: enabled ? (data ?? []) : [],
    // Covers the debounce gap too, so "No members found" never flashes mid-typing.
    isSearching: term.trim().length >= MIN_SEARCH_LENGTH && (isFetching || term.trim() !== search),
    isIdle: term.trim().length < MIN_SEARCH_LENGTH,
  };
}
