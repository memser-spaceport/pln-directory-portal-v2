'use client';

import type { ReactNode } from 'react';

import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import local from './Newsfeed.module.scss';

interface MobileScrollRowProps {
  title: string;
  children: ReactNode;
}

/**
 * The shell both sub-desktop rail rows share.
 *
 * Below 960px the rail stacks under the whole feed, so its modules are ~3 screens
 * down. Lifting them means a horizontal row, and the scroll mechanics — snap,
 * hidden scrollbar, the right-edge mask that makes the next card peek — are
 * copied from `../newsfeed-v0/NewsfeedV0.module.scss .mqaRow`. Keeping that copy
 * in exactly one place is the reason this wrapper exists rather than each row
 * repeating it.
 */
export function MobileScrollRow({ title, children }: MobileScrollRowProps) {
  return (
    <section className={local.railScroller} aria-label={title}>
      <h3 className={v0.railTitle}>{title}</h3>
      <div className={local.railScrollRow}>{children}</div>
    </section>
  );
}
