'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useFilterStore } from '@/services/members/store';
import { useMemberAnalytics } from '@/analytics/members.analytics';

export function SyncParamsToUrl() {
  const router = useRouter();
  const { params } = useFilterStore();
  const { onMembersFiltersChange } = useMemberAnalytics();

  useEffect(() => {
    onMembersFiltersChange(params);

    router.push(`?${params.toString()}`, { scroll: false });
  }, [params, router]);

  return null;
}
