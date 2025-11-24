'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { HighlightsBar } from '@/components/core/navbar/components/HighlightsBar';

import s from './DemoDayBanner.module.scss';

export function DemoDayBanner() {
  const pathname = usePathname();

  if (pathname.includes('demoday')) {
    return null;
  }

  return (
    <HighlightsBar>
      <div className={s.root}>
        Upcoming: PL_Genesis Accelerator Demo Day starts December 10th.
        <Link href="/demoday" className={s.link}>
          Learn more
        </Link>
      </div>
    </HighlightsBar>
  );
}
