'use client';

import type { ReactNode } from 'react';

import s from './FeedScrollers.module.scss';

interface MobileScrollRowProps {
  title: string;
  children: ReactNode;
}

/**
 * The shell both sub-desktop rail rows share.
 *
 * Below 1200px the grid drops the rail's column and the sidebar stacks under
 * the *whole* feed — which puts Teams-to-follow roughly three screens down,
 * i.e. nowhere. Lifting them means a horizontal row, and the scroll mechanics
 * (snap, hidden scrollbar, the right-edge mask that makes the next card peek)
 * live here rather than in each row, so there is one copy of them.
 *
 * `tabIndex={0}` on the scroll container: an overflow region that isn't
 * keyboard-focusable can't be scrolled by keyboard at all, and the cards inside
 * are focusable but the row itself needs to be reachable for arrow-key
 * scrolling. Paired with the group role + label so it's announced as one unit.
 */
export function MobileScrollRow({ title, children }: MobileScrollRowProps) {
  return (
    <section className={s.scroller} aria-label={title}>
      <h3 className={s.title}>{title}</h3>
      <div className={s.row} role="group" aria-label={`${title}, scrollable`} tabIndex={0}>
        {children}
      </div>
    </section>
  );
}
