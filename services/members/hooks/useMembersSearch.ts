'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

export interface MemberSearchResult {
  uid: string;
  name: string;
  image?: string;
  teamName?: string;
}

interface UseMembersSearchOptions {
  enabled?: boolean;
  debounceMs?: number;
  limit?: number;
}

export function useMembersSearch(searchTerm: string, options: UseMembersSearchOptions = {}) {
  const { enabled = true, debounceMs = 300, limit = 10 } = options;

  const [results, setResults] = useState<MemberSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debouncedSearch = useDebounce(searchTerm, debounceMs);

  useEffect(() => {
    if (!enabled || !debouncedSearch || debouncedSearch.length < 1) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();

    const fetchMembers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/members-search?search=${encodeURIComponent(debouncedSearch)}&page=1&limit=${limit}`,
          { signal: abortController.signal },
        );

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const data = await response.json();

        const formattedResults: MemberSearchResult[] =
          data.items?.map((member: any) => ({
            uid: member.id,
            name: member.name,
            image: member.profile || undefined,
            teamName: member.mainTeam?.name || undefined,
          })) || [];

        setResults(formattedResults);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        console.error('Failed to search members:', err);
        setError(err instanceof Error ? err : new Error('Search failed'));
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();

    return () => {
      abortController.abort();
    };
  }, [debouncedSearch, enabled, limit]);

  return { results, isLoading, error };
}
