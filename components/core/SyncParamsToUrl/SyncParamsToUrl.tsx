'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useFilterStore } from '@/services/members/store';

export function SyncParamsToUrl() {
  const router = useRouter();
  const { params } = useFilterStore();

  useEffect(() => {
    router.push(`?${params.toString()}`, { scroll: false });
  }, [params, router]);

  return null;
}
