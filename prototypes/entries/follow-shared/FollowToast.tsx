'use client';

import type { ReactNode } from 'react';
import { SuccessCircleIcon } from '@/components/icons';

import s from './FollowToast.module.scss';

/**
 * Green success notification shown after following. Fixed, bottom-center,
 * auto-dismissed by the parent (which controls whether it's rendered).
 */
export function FollowToast({ children }: { children: ReactNode }) {
  return (
    <div className={s.toast} role="status">
      <SuccessCircleIcon className={s.icon} width={18} height={18} />
      <span className={s.text}>{children}</span>
    </div>
  );
}
