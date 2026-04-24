'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useJobsFilterStore } from '@/services/jobs/store';

export function JobsFiltersHydrator({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const setAllParams = useJobsFilterStore((s) => s.setAllParams);
  const [ready, setReady] = useState(false);
  const didInit = useRef(false);

  useLayoutEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      setAllParams(new URLSearchParams(window.location.search));
      setReady(true);
    }
  }, [setAllParams]);

  useLayoutEffect(() => {
    if (!ready) return;
    setAllParams(new URLSearchParams(searchParams.toString()));
  }, [ready, searchParams, setAllParams]);

  if (!ready) return null;

  return <>{children}</>;
}
