'use client';

import { useRouter } from 'next/navigation';
import { useCallback, type KeyboardEvent, type MouseEvent } from 'react';

export function useGantryCardNavigate(uid: string) {
  const router = useRouter();

  const navigate = useCallback(() => {
    router.push(`/gantry/${uid}`);
  }, [router, uid]);

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
