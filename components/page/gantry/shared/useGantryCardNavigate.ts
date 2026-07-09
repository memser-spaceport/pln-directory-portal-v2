'use client';

import { useQueryStates } from 'nuqs';
import { useCallback, type KeyboardEvent, type MouseEvent } from 'react';
import { gantryDashboardParsers } from '@/app/gantry/dashboard/searchParams';

export function useGantryCardNavigate(uid: string) {
  const [, setParams] = useQueryStates(gantryDashboardParsers, {
    history: 'push',
    shallow: true,
  });

  const navigate = useCallback(() => {
    void setParams({ itemId: uid });
  }, [setParams, uid]);

  const onClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a')) return;
      navigate();
    },
    [navigate],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate();
      }
    },
    [navigate],
  );

  return {
    role: 'link' as const,
    tabIndex: 0,
    onClick,
    onKeyDown,
  };
}
