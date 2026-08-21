'use client';

import { useEffect } from 'react';
import { skipToken, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { IFeedCommentCountsResponse } from '@/types/feed.types';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { feedQueryKeys } from '../constants';
import { getFeedCommentCounts } from '../feed.service';

interface RequestLedger {
  /** Uids already asked about — the thing that keeps each surface's request to
   *  its own share of the shared entry. */
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
 * Fills the shared comment-counts entry for a set of uids, INCREMENTALLY.
 *
 * ONE cache entry per session (stable key — never derived from the visible
 * subset, which would mint a new key per tab/search/pagination change and make
 * the mutation's count patch untargetable). What varies is not the key but how
 * much of it is filled in: each caller asks only for the uids nobody has asked
 * for yet, and the response is MERGED in.
 *
 * Incremental because the uid universe is not one set fixed at session start.
 * /home's comes from the SSR groups prop, a team profile's from its rail, and
 * the team's archive grows another 20 per page. A single fetch-once query would
 * be filled by whichever surface mounted first and, at `staleTime: Infinity`,
 * never refetch — so visiting a team profile and then clicking through to /home
 * would leave every feed story without a count for the rest of the session.
 *
 * Merging (rather than the replace a plain query does) also means a response
 * landing late can't wipe values written from elsewhere: forum-post counts
 * seeded from the posts response (useFeedSocial) and counts the viewer just
 * bumped by commenting both survive on their own terms — see the merge order
 * below.
 */
export function useFeedCommentCounts({ uids, enabled }: { uids: string[]; enabled: boolean }) {
  const queryClient = useQueryClient();
  // The effect's dependency AND its payload. The array identity churns on every
  // parent render while its contents don't, so depending on the array would
  // re-run this constantly; joining gives a value that changes only when the
  // uids do, and reading the uids back out of it beats carrying the array in a
  // ref (which this repo's react-hooks/refs rule rightly won't allow to be
  // written during render).
  const uidsKey = uids.join('|');

  useEffect(() => {
    if (!enabled) return;
    const ledger = requestLedger(queryClient);

    // The entry can be garbage-collected once no observer is mounted (leaving a
    // team profile, say). A ledger outliving the data it describes would suppress
    // every future request and leave the counts permanently blank, so the two are
    // dropped together — but only once an answer has actually landed and nothing
    // is still in flight, or a surface mounting beside an outstanding request
    // would read the not-yet-filled entry as a dropped one and ask all over
    // again. An empty object is a real answer — every uid at zero — and
    // deliberately resets nothing.
    if (
      ledger.filled &&
      ledger.pending === 0 &&
      queryClient.getQueryData(feedQueryKeys.commentCounts()) === undefined
    ) {
      ledger.requested.clear();
      ledger.filled = false;
    }

    const missing = uidsKey.split('|').filter((uid) => uid && !ledger.requested.has(uid));
    if (missing.length === 0) return;
    // Claimed BEFORE the await: two surfaces mounting in the same tick must not
    // both post the same uids. Released again if the request fails, so a later
    // mount can retry rather than inheriting a permanent gap.
    missing.forEach((uid) => ledger.requested.add(uid));
    ledger.pending += 1;

    // Token is optional (signed-out visitors see news counts) but improves the
    // response: fp_ counts are only included for viewers with forum.read.
    getFeedCommentCounts(missing, getCookiesFromClient().authToken)
      .then((counts) => {
        ledger.filled = true;
        queryClient.setQueryData<IFeedCommentCountsResponse>(feedQueryKeys.commentCounts(), (old) => ({
          ...counts,
          // Old wins: anything already in the entry was written by something
          // fresher than a request we sent before it — a comment the viewer just
          // posted, a thread's authoritative reconciliation, a forum-post seed.
          // We only ask for uids nobody has asked for, so a collision here is
          // exactly that race and nothing else.
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

  // Observe only (skipToken) — the effect above owns the fetching. Returned so
  // callers can react to the entry filling in.
  return useQuery<IFeedCommentCountsResponse, Error>({
    queryKey: feedQueryKeys.commentCounts(),
    queryFn: skipToken,
  });
}

// Per-button observer: subscribes to the single counts entry with `select`, so
// a count bump re-renders exactly the buttons whose value changed — never the
// feed. Fetching is owned by useFeedCommentCounts (skipToken = observe only).
// `undefined` means "count unknown" — render nothing, never "0".
export function useFeedCommentCount(uid: string): number | undefined {
  const { data } = useQuery<IFeedCommentCountsResponse, Error, number | undefined>({
    queryKey: feedQueryKeys.commentCounts(),
    queryFn: skipToken,
    select: (counts) => counts[uid],
  });
  return data;
}
