'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function useJobsParamsUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const push = useCallback(
    (params: URLSearchParams) => {
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === '') params.delete(key);
      else params.set(key, value);
      push(params);
    },
    [searchParams, push],
  );

  const toggleMulti = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const list = params.getAll(key);
      const nextList = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      params.delete(key);
      for (const v of nextList) params.append(key, v);
      push(params);
    },
    [searchParams, push],
  );

  const setMulti = useCallback(
    (key: string, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(key);
      for (const v of values) params.append(key, v);
      push(params);
    },
    [searchParams, push],
  );

  const clearAll = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  return { setParam, toggleMulti, setMulti, clearAll };
}
