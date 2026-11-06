'use client';

import clsx from 'clsx';
import { useState } from 'react';

import { useHomeAnalytics } from '@/analytics/home.analytics';
import { PortfolioPanel } from '@/components/page/explore-pl-network/PortfolioPanel/PortfolioPanel';
import type { PortfolioTeam } from '@/components/page/explore-pl-network/data/portfolio';

import s from './HomeV2.module.scss';

/**
 * Production `PortfolioPanel` (the islands map and its list), as Home shows it signed out and signed in. On phones the
 * map is about 3,000px of hexes, so Home clamps it to 640px under a fade with "Show the whole map".
 */
export function PortfolioMap({ teams }: { teams: PortfolioTeam[] }) {
  const [open, setOpen] = useState(false);
  const analytics = useHomeAnalytics();

  return (
    <div className={clsx(s.mapClamp, open && s.mapClampOpen)}>
      <PortfolioPanel teams={teams} />
      {!open && (
        <button
          type="button"
          className={s.mapMore}
          onClick={() => {
            setOpen(true);
            analytics.onSeeAllClicked({ section: 'map' });
          }}
        >
          Show the whole map
        </button>
      )}
    </div>
  );
}
