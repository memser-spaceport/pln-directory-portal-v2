'use client';
import { usePathname } from 'next/navigation';

import { HighlightsBar } from '@/components/core/navbar/components/HighlightsBar';

import s from './PlaaBanner.module.scss';

/**
 * PlaaBanner - Announcement banner for alignment-asset pages only
 * Shows PLAA-specific announcements on alignment-asset routes
 */
export function PlaaBanner() {
  const pathname = usePathname();

  // Show banner only on alignment-asset pages
  if (!pathname.includes('alignment-asset')) {
    return null;
  }

  return (
    <HighlightsBar variant="plaa">
      <div className={s.root}>
        Upcoming: Buyback Auction Q1 2026 - February 19-26
      </div>
    </HighlightsBar>
  );
}

