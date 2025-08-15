'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFilterStore } from '@/services/members/store';

export function InitFiltersFromUrl() {
  const searchParams = useSearchParams();
  const setAllParams = useFilterStore((s) => s.setAllParams);

  useEffect(() => {
    // Copy current URL params into the store
    const paramsCopy = new URLSearchParams(searchParams.toString());
    setAllParams(paramsCopy);
  }, [searchParams, setAllParams]);

  return null;
}
