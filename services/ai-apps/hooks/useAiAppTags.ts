'use client';

import { useQuery } from '@tanstack/react-query';

import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { AiAppTag, AiAppTagsVocabulary, fetchAiAppTags } from '@/services/ai-apps/ai-apps.service';

const EMPTY: AiAppTag[] = [];

/** Controlled tag vocabulary. Static per deploy, so it is cached for the session. */
export function useAiAppTags() {
  const { data, isLoading } = useQuery<AiAppTagsVocabulary>({
    queryKey: [AiAppsQueryKeys.AI_APP_TAGS],
    queryFn: fetchAiAppTags,
    staleTime: Infinity,
  });

  const tags = data?.tags ?? EMPTY;

  return {
    tags,
    maxPerApp: data?.maxPerApp ?? 5,
    /** Falls back to the slug so an app tagged by a newer vocabulary still renders. */
    getLabel: (slug: string) => tags.find((tag) => tag.slug === slug)?.label ?? slug,
    isLoading,
  };
}
