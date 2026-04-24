'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useDebounce } from 'react-use';
import { useJobsFilterStore } from '@/services/jobs/store';

export function SyncJobsParamsToUrl({ debounceTime = 0 }: { debounceTime?: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { params, _clearImmediate } = useJobsFilterStore();
  const isInitialLoad = useRef(true);
  const lastSyncedParams = useRef('');

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      lastSyncedParams.current = params.toString();
      return;
    }
  }, []);

  useDebounce(
    () => {
      if (isInitialLoad.current) return;

      const currentParamsString = params.toString();
      if (currentParamsString === lastSyncedParams.current) return;

      lastSyncedParams.current = currentParamsString;
      const newUrl = currentParamsString ? `?${currentParamsString}` : window.location.pathname;
      router.push(newUrl, { scroll: false });
    },
    _clearImmediate ? 0 : debounceTime,
    [params, _clearImmediate],
  );

  return null;
}
