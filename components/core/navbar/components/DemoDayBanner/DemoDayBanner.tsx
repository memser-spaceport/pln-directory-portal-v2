'use client';
import Link from 'next/link';
import { format } from 'date-fns';
import { usePathname } from 'next/navigation';

import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';

import { HighlightsBar } from '@/components/core/navbar/components/HighlightsBar';

import s from './DemoDayBanner.module.scss';

export function DemoDayBanner() {
  const pathname = usePathname();
  const { data } = useGetDemoDayState();

  if (pathname.includes('demoday')) {
    return null;
  }

  const { date } = data || {};
  const dateToShow = date ? format(date, 'do MMM') : '23rd Oct.';

  return (
    <HighlightsBar>
      <div className={s.root}>
        PL F25 Demo day is taking place on {dateToShow}.{' '}
        <Link href="/demoday" className={s.link}>
          View more info.
        </Link>
      </div>
    </HighlightsBar>
  );
}
