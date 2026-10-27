'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { SHOW_NEWS_PREFERENCES } from '@/utils/news-categories';
import { TeamNewsQueryKeys } from '../constants';
import { getNewsTopicSlugList } from '../team-news.service';

const EMPTY: ReadonlySet<string> = new Set();

/**
 * The focus-area slugs that make a news tag a topic (LAB-3003). One request per
 * session, and none while the news-preferences flag is off. Empty until loaded.
 */
export function useNewsTopicSlugs(): ReadonlySet<string> {
  const { data } = useQuery({
    queryKey: [TeamNewsQueryKeys.TOPIC_SLUGS],
    queryFn: getNewsTopicSlugList,
    enabled: SHOW_NEWS_PREFERENCES,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
  return useMemo(() => (Array.isArray(data) ? new Set(data) : EMPTY), [data]);
}
