'use client';
// import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { HighlightsBar } from '@/components/core/navbar/components/HighlightsBar';

import s from './DemoDayBanner.module.scss';

/**
 * DemoDayBanner - Site-wide announcement banner
 * Shows different content based on the current route:
 * - PLAA pages: Shows PLAA-specific announcement
 * - DemoDay pages: Hidden (to avoid redundancy)
 * - Default: Hidden (return null)
 */
export function DemoDayBanner() {
  const pathname = usePathname();

  // Show PLAA announcement on alignment-asset pages
  if (pathname.includes('alignment-asset')) {
    return (
      <HighlightsBar variant="plaa">
        <div className={s.root}>
          Upcoming: Buyback Auction Q1 2026 - February 19-26
        </div>
      </HighlightsBar>
    );
  }

  // Hide banner on all other pages
  return null;

  // Default: DemoDay announcement (currently disabled)
  // return (
  //   <HighlightsBar>
  //     <div className={s.root}>
  //       Upcoming: PL_Genesis Accelerator Demo Day starts in January 2026.
  //       <Link href="/demoday" className={s.link}>
  //         Learn more
  //       </Link>
  //     </div>
  //   </HighlightsBar>
  // );
}
