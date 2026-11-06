'use client';

import clsx from 'clsx';

import { ExploreLogoWall } from '@/components/page/explore-pl-network/ExploreLogoWall/ExploreLogoWall';
import { aileron } from '@/components/page/explore-pl-network/aileron';
import type { PortfolioTeam } from '@/components/page/explore-pl-network/data/portfolio';
import explore from '@/components/page/explore-pl-network/ExplorePlNetworkView.module.scss';

import { EntitiesRow } from './EntitiesRow';
import { PortfolioMap } from './PortfolioMap';
import s from './HomeV2.module.scss';

/**
 * The signed-in network overview under "Browse by focus area" (LAB-3174 item 6, Polina's design 2026-11-06): one
 * full-bleed white band, as the signed-out page's, with the portfolio map ("Protocol Labs portfolio", Map and List),
 * the PL entities, and the investor logo wall linked to the backers' sites. The focus-area cards stay above it, on the
 * page ground.
 */
export function NetworkOverview({ portfolio }: { portfolio: PortfolioTeam[] }) {
  return (
    <div className={clsx(explore.root, s.whiteBand, s.overviewBand, aileron.variable)}>
      <div className={clsx(explore.content, s.whiteSheet)}>
        <section className={explore.sectionTeams} aria-labelledby="home-overview-portfolio-title">
          <div className={explore.subtitle}>
            <h2 id="home-overview-portfolio-title" className={explore.label}>
              Protocol Labs portfolio
            </h2>
            <p className={explore.supportingText}>
              {portfolio.length} teams across four focus areas, with Protocol Labs at the centre.
            </p>
          </div>
          <PortfolioMap teams={portfolio} />
        </section>

        <section className={clsx(explore.sectionTeams, s.storySection)} aria-labelledby="home-overview-entities-title">
          <div className={explore.subtitle}>
            <h2 id="home-overview-entities-title" className={explore.label}>
              Protocol Labs entities
            </h2>
          </div>
          <EntitiesRow />
        </section>

        <section className={clsx(explore.sectionPartners, s.storyEnd)}>
          <ExploreLogoWall linked />
        </section>
      </div>
    </div>
  );
}
