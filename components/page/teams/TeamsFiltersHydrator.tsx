'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTeamFilterStore } from '@/services/teams';

/**
 * TeamsFiltersHydrator
 *
 * Hydrates the Teams filter store from URL parameters on mount
 * and syncs with browser navigation (back/forward)
 */
export function TeamsFiltersHydrator({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const setAllParams = useTeamFilterStore((s) => s.setAllParams);
  const [ready, setReady] = useState(false);
  const didInit = useRef(false);

  useLayoutEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      setAllParams(new URLSearchParams(window.location.search));
      setReady(true);
    }
  }, [setAllParams]);

  // Listen to browser navigation (back/forward)
  useLayoutEffect(() => {
    if (!ready) return;
    setAllParams(new URLSearchParams(searchParams.toString()));
  }, [ready, searchParams, setAllParams]);

  if (!ready) return null;

  return <>{children}</>;
}
