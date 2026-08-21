'use client';

import { useEffect } from 'react';
import { skipToken, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { ITeamNewsCountsResponse } from '@/types/team-news.types';
import { teamNewsCountsQueryKey } from '../constants';
import { getTeamNewsCounts } from '../team-news.service';

interface RequestLedger {
  /** Team uids already asked about — what keeps each surface's request to its
   *  own share of the shared entry. */
  requested: Set<string>;
  /** Requests still in flight. An empty entry with a request outstanding is a
   *  question waiting for its answer, not a dropped cache. */
  pending: number;
  /** Whether an answer has ever landed in the entry. Without it, "the entry is
   *  empty" can't be told apart from "the entry was never filled". */
  filled: boolean;
}

// Per QueryClient (never module-global) so a test's fresh client — or a second
// client anywhere — starts from nothing rather than inheriting another's ledger.
const ledgers = new WeakMap<QueryClient, RequestLedger>();

function requestLedger(queryClient: QueryClient): RequestLedger {
  let ledger = ledgers.get(queryClient);
  if (!ledger) {
    ledger = { requested: new Set<string>(), pending: 0, filled: false };
    ledgers.set(queryClient, ledger);
  }
  return ledger;
}

/**
 * Fills the shared team-news-counts entry for a set of team uids, INCREMENTALLY.
 *
 * A near-verbatim port of useFeedCommentCounts, because the problem is the same
 * one: a single cache entry read by several surfaces, none of which knows the
 * whole uid universe at mount. Here that universe grows as the reader scrolls —
 * the teams grid and the job board both page in more teams — so each caller asks
 * only for the uids nobody has asked for yet and MERGES the answer in. A query
 * keyed by the visible set would mint a fresh entry per page and re-request
 * every team already counted.
 *
 * Two honest differences from the comment-counts original, both simplifications:
 *
 *  - No auth token. The endpoint takes none; the count is identical for every
 *    viewer, signed in or not.
 *  - Nothing else writes to this entry. Comment counts race a comment mutation
 *    and a forum-post seed, which is what makes their merge order load-bearing.
 *    Here the effect below is the only writer, and claim-before-await means two
 *    surfaces cannot ask for the same uid — so a collision is close to
 *    impossible. The merge is kept anyway: it is what makes the entry
 *    incremental, which is the whole point. The order just costs nothing.
 *
 * Because `queryFn` is skipToken, this entry NEVER refetches for the life of the
 * session — there is no staleTime to tune. A reader's session on a listing page
 * runs to minutes while news ingestion runs hours apart, so the staleness is
 * real but far below the resolution of the thing being counted.
 */
export function useTeamNewsCounts({ uids, enabled }: { uids: string[]; enabled: boolean }) {
  const queryClient = useQueryClient();
  // The effect's dependency AND its payload. The array identity churns on every
  // parent render while its contents don't, so depending on the array would
  // re-run this constantly; joining gives a value that changes only when the
  // uids do, and reading them back out of it beats carrying the array in a ref
  // (which this repo's react-hooks/refs rule rightly won't allow to be written
  // during render).
  const uidsKey = uids.join('|');

  useEffect(() => {
    if (!enabled) return;
    const ledger = requestLedger(queryClient);

    // The entry can be garbage-collected once no observer is mounted (navigating
    // off the teams grid, say). A ledger outliving the data it describes would
    // suppress every future request and leave the chips permanently blank, so the
    // two are dropped together — but only once an answer has actually landed and
    // nothing is still in flight, or a surface mounting beside an outstanding
    // request would read the not-yet-filled entry as a dropped one and ask all
    // over again. An empty object is a real answer — no team has posted recently
    // — and deliberately resets nothing.
    if (ledger.filled && ledger.pending === 0 && queryClient.getQueryData(teamNewsCountsQueryKey()) === undefined) {
      ledger.requested.clear();
      ledger.filled = false;
    }

    const missing = uidsKey.split('|').filter((uid) => uid && !ledger.requested.has(uid));
    if (missing.length === 0) return;
    // Claimed BEFORE the await: the grid and the job board mounting in the same
    // tick must not both post the same uids. Released again if the request
    // fails, so a later mount can retry rather than inheriting a permanent gap —
    // which is why getTeamNewsCounts throws instead of resolving to {}.
    missing.forEach((uid) => ledger.requested.add(uid));
    ledger.pending += 1;

    getTeamNewsCounts(missing)
      .then((counts) => {
        ledger.filled = true;
        queryClient.setQueryData<ITeamNewsCountsResponse>(teamNewsCountsQueryKey(), (old) => ({
          ...counts,
          ...old,
        }));
      })
      .catch(() => {
        missing.forEach((uid) => ledger.requested.delete(uid));
      })
      .finally(() => {
        ledger.pending -= 1;
      });
    // uidsKey, not uids: same uids in a new array must not re-run this.
  }, [uidsKey, enabled, queryClient]);

  // Observe only (skipToken) — the effect above owns the fetching.
  return useQuery<ITeamNewsCountsResponse, Error>({
    queryKey: teamNewsCountsQueryKey(),
    queryFn: skipToken,
  });
}

// Per-chip observer: subscribes to the single counts entry with `select`, so a
// team's count landing re-renders exactly that chip and not the whole grid.
// Fetching is owned by useTeamNewsCounts (skipToken = observe only).
//
// `undefined` means "count unknown", 0 means "nothing recent". The chip renders
// nothing either way — but the two are not the same wire state, and a caller
// that ever wants to tell them apart needs them kept distinct here.
export function useTeamNewsCount(teamUid: string): number | undefined {
  const { data } = useQuery<ITeamNewsCountsResponse, Error, number | undefined>({
    queryKey: teamNewsCountsQueryKey(),
    queryFn: skipToken,
    select: (counts) => counts[teamUid],
  });
  return data;
}
