'use client';

import { useEffect, useMemo, useState } from 'react';

export interface ILocationSubscription {
  uid: string;
  entityUid: string;
  isActive?: boolean;
}

export interface IMyLocationSubscriptions {
  subscriptions: ILocationSubscription[];
  isUnavailable: boolean;
}

interface IUseLocationFollowStateArgs {
  locationUid: string;
  /** The viewer's own subscriptions, read from `/member-subscriptions/me`. */
  mySubscriptions: IMyLocationSubscriptions | undefined;
  /** Whether the viewer appears in the public follower list. Fallback only. */
  isInPublicFollowerList: boolean;
}

/**
 * Owns "does the viewer follow this location, and which rows would an unfollow
 * have to cancel?".
 *
 * The public follower list cannot answer either question for a member who is
 * not yet approved — the API filters them out of it — so the answer comes from
 * the viewer's own subscriptions instead. The public list is used only as a
 * fallback while the `/me` endpoint rolls out, which is what `isUnavailable`
 * signals.
 *
 * There can be more than one row per location: `MemberSubscription` has no
 * unique constraint, so members who clicked Follow repeatedly before the API
 * became idempotent have duplicates. Unfollow has to cancel all of them or the
 * button flips back to Following on the next load.
 */
export const useLocationFollowState = ({
  locationUid,
  mySubscriptions,
  isInPublicFollowerList,
}: IUseLocationFollowStateArgs) => {
  const isSelfReadUnavailable = mySubscriptions?.isUnavailable ?? true;

  /* Reduced to a stable string so a parent re-rendering with an equal-but-new
     props object does not clobber the state set by a just-completed follow. */
  const serverUidsKey = useMemo(
    () =>
      (mySubscriptions?.subscriptions ?? [])
        .filter((subscription) => subscription.entityUid === locationUid && subscription.isActive !== false)
        .map((subscription) => subscription.uid)
        .join(','),
    [mySubscriptions, locationUid],
  );

  const [activeUids, setActiveUids] = useState<string[]>(() => (serverUidsKey ? serverUidsKey.split(',') : []));

  // Re-sync whenever the server actually answers differently (router.refresh, navigation).
  useEffect(() => {
    setActiveUids(serverUidsKey ? serverUidsKey.split(',') : []);
  }, [serverUidsKey]);

  return {
    isFollowing: activeUids.length > 0 || (isSelfReadUnavailable && isInPublicFollowerList),
    /** Every subscription an unfollow must deactivate. */
    activeUids,
    /** True while the self read cannot answer, so callers keep the old list-derived path. */
    isSelfReadUnavailable,
    /** Record a subscription the viewer just created. */
    onFollowed: (uid: string | undefined) => setActiveUids(uid ? [uid] : []),
    onUnfollowed: () => setActiveUids([]),
  };
};
