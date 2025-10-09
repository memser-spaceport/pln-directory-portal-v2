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

  // Format date with ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const dateToShow = date
    ? (() => {
        const parsedDate = new Date(date);
        const month = format(parsedDate, 'MMMM');
        const day = parsedDate.getDate();
        const suffix = getOrdinalSuffix(day);
        return `${month} ${day}${suffix}`;
      })()
    : 'October 23rd';

  return (
    <HighlightsBar>
      <div className={s.root}>
        PL F25 Demo Day will take place {dateToShow}.{' '}
        <Link href="/demoday" className={s.link}>
          Learn more
        </Link>
      </div>
    </HighlightsBar>
  );
}
