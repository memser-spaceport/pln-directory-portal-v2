'use client';

import { useQueries } from '@tanstack/react-query';
import { InvestorsQueryKeys } from '../constants';
import { getMasterProfile } from '../warm-intros-v2.service';
import type { MasterProfileDetail } from '../warm-intros-v2.types';

/**
 * Batched MasterProfile fetch for a small, dynamic set of uids (e.g. every hop on
 * a path). Shares the same query key as `useMasterProfile`, so a profile already
 * cached from the drawer's own investor fetch is reused, not re-requested.
 */
export function useMasterProfiles(uids: string[], opts: { enabled?: boolean } = {}) {
  const enabled = opts.enabled ?? true;
  const results = useQueries({
    queries: uids.map((uid) => ({
      queryKey: [InvestorsQueryKeys.MASTER_PROFILE, uid],
      queryFn: () => getMasterProfile(uid),
      enabled: enabled && !!uid,
      staleTime: 60 * 1000,
    })),
  });

  const byUid = new Map<string, MasterProfileDetail | null | undefined>();
  uids.forEach((uid, i) => byUid.set(uid, results[i]?.data));
  return byUid;
}
