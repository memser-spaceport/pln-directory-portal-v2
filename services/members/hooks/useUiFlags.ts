import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { MembersQueryKeys } from '@/services/members/constants';
import { customFetch } from '@/utils/fetch-wrapper';

/**
 * A member's one-time UI callout dismissals, as a flat map of callout key to
 * `true`.
 *
 * An absent key means "not dismissed" — nothing ever writes `false`, so
 * `flags[key] === true` and `!flags[key]` are the only two states. `Partial` is
 * load-bearing: a bare `Record<string, true>` claims every key is present, and
 * TypeScript then narrows `!!flags[key]` to the constant `true`.
 */
export type UiFlags = Partial<Record<string, true>>;

const url = (uid: string) => `${process.env.DIRECTORY_API_URL}/v1/members/${uid}/ui-flags`;

async function fetcher(uid: string | undefined): Promise<UiFlags> {
  if (!uid) {
    return {};
  }

  const response = await customFetch(url(uid), { method: 'GET' }, true);

  if (!response?.ok) {
    throw new Error('Failed to fetch member UI flags');
  }

  return (await response.json()) ?? {};
}

/**
 * Reads the member's server-side callout dismissals.
 *
 * One query key for the whole map rather than one per callout, so the three
 * callouts — which live on three unrelated routes and know nothing about each
 * other — collapse into a single request per session through React Query's
 * deduplication. `staleTime: Infinity` is what keeps it at one: the answer only
 * changes when this tab changes it, and the mutation below writes it straight
 * into the cache.
 *
 * `enabled: !!uid` is load-bearing, not a tidy-up. `customFetch(..., true)`
 * with no refresh token calls `logoutUser()`, toasts and reloads the page, so
 * firing this for a signed-out visitor would be a visible bug rather than a
 * quiet no-op.
 */
export function useUiFlags(uid: string | undefined) {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_UI_FLAGS, uid],
    queryFn: () => fetcher(uid),
    enabled: !!uid,
    staleTime: Infinity,
    gcTime: Infinity,
    // A dismissal that failed to reach the server is re-pushed on the member's
    // next visit by the reconciliation in `useOneTimeCallout`, so there is
    // nothing here worth a retry storm.
    retry: 1,
  });
}

/**
 * Records a dismissal server-side.
 *
 * The PATCH merges, so sending one key never disturbs the others — but the
 * response is the full merged map, which is written straight into the cache so
 * a second callout on the same page sees the new state without refetching.
 *
 * `Content-Type` is set explicitly because `customFetch` sends none of its own.
 *
 * Failure is deliberately silent: no toast, no error surface. The local
 * IndexedDB flag has already been written by the time this runs, so the member
 * sees the callout close either way, and `useOneTimeCallout`'s upgrade write
 * retries the push on their next visit.
 */
export function useDismissUiFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uid, keys }: { uid: string; keys: string[] }) => {
      const body = Object.fromEntries(keys.map((key) => [key, true]));

      const response = await customFetch(
        url(uid),
        {
          method: 'PATCH',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        },
        true,
      );

      if (!response?.ok) {
        throw new Error('Failed to save member UI flags');
      }

      return (await response.json()) as UiFlags;
    },
    onSuccess: (flags, { uid }) => {
      queryClient.setQueryData([MembersQueryKeys.GET_UI_FLAGS, uid], flags);
    },
  });
}
