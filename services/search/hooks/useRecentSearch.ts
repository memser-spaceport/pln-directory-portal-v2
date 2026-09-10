import { useQuery } from '@tanstack/react-query';
import { SearchQueryKeys } from '@/services/search/constants';

/** Where the list lives. Shared so the three call sites cannot drift apart. */
export const RECENT_SEARCH_STORAGE_KEY = 'recentSearches';

/** How many searches are kept. Small on purpose: this is a shortcut, not a log. */
export const MAX_RECENT_SEARCHES = 3;

const norm = (term: string) => term.trim().toLowerCase();

/**
 * Record a search.
 *
 * The hard part is not storing the term, it is deciding that a term *is* a
 * search. Results here appear as you type and `Enter` asks the AI, so there is
 * no submit gesture to hang this on — the caller saves the debounced term, and
 * the ladder that produced it (`f`, `fi`, `fil`, `file`) arrives here as four
 * separate saves.
 *
 * So the ladder is collapsed rather than stored: a term absorbs the shorter
 * terms it grew out of, and a term already covered by a longer one is not a new
 * search at all. Without that, one typed query fills a three-item list on its
 * own, which is exactly what happened when this used to be called from inside
 * the search query's fetcher.
 *
 * Comparison is case-insensitive — `Filecoin` and `filecoin` are one search —
 * while the stored string keeps the casing the person actually typed.
 */
export function saveRecentSearch(term: string) {
  try {
    const next = term.trim();
    if (!next) {
      return;
    }

    const key = norm(next);
    const existing = JSON.parse(localStorage.getItem(RECENT_SEARCH_STORAGE_KEY) || '[]') as string[];

    /* Already covered by a longer search: `fil` typed after `filecoin` is a
       step backwards through the same query, not a new one. */
    if (existing.some((item) => norm(item) !== key && norm(item).startsWith(key))) {
      return;
    }

    /* Drops the terms this one grew out of — and, because a term is its own
       prefix, the exact duplicate too, which is what moves a repeat search back
       to the front instead of listing it twice. */
    const kept = existing.filter((item) => !key.startsWith(norm(item)));

    localStorage.setItem(RECENT_SEARCH_STORAGE_KEY, JSON.stringify([next, ...kept].slice(0, MAX_RECENT_SEARCHES)));
  } catch (e) {
    // Private mode, blocked storage: failing to remember a search must never
    // interfere with making one.
    console.error('Failed to save recent search', e);
  }
}

async function fetcher() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCH_STORAGE_KEY) || '[]') as string[];
  } catch (e) {
    console.error('Failed to get recent search', e);
  }
}

export function useRecentSearch() {
  return useQuery({
    queryKey: [SearchQueryKeys.GET_RECENT_SEARCH],
    queryFn: fetcher,
  });
}
