'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFilterStore } from '@/services/members/store';

export function FiltersHydrator({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const setAllParams = useFilterStore((s) => s.setAllParams);
  const [ready, setReady] = useState(false);
  const didInit = useRef(false);

  useLayoutEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      setAllParams(new URLSearchParams(window.location.search));
      setReady(true);
    }
  }, [setAllParams]);

  // Optional: listen to browser navigation (back/forward)
  useLayoutEffect(() => {
    if (!ready) return;
    setAllParams(new URLSearchParams(searchParams.toString()));
  }, [ready, searchParams, setAllParams]);

  if (!ready) return null;

  return <>{children}</>;
}
