'use client';

import { useQuery } from '@tanstack/react-query';
import { InvestorsQueryKeys } from '../constants';
import { getMasterProfile } from '../warm-intros-v2.service';

export function useMasterProfile(uid: string | null | undefined, opts: { enabled?: boolean } = {}) {
  const enabled = (opts.enabled ?? true) && !!uid;
  return useQuery({
    queryKey: [InvestorsQueryKeys.MASTER_PROFILE, uid],
    queryFn: () => getMasterProfile(uid!),
    enabled,
    staleTime: 60 * 1000,
  });
}
