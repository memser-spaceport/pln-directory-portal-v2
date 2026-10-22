'use client';

import React, { useEffect } from 'react';
import clsx from 'clsx';
import { SpvTopBar } from '@/components/page/spv-spotlight/SpvTopBar/SpvTopBar';
import { SpvFooter } from '@/components/page/spv-spotlight/SpvFooter/SpvFooter';
import { useExplorePlNetworkAnalytics, type ExploreTeamParams } from '@/analytics/explore-pl-network.analytics';
import { aileron } from './aileron';
import { EXPLORE_SUPPORT_EMAIL } from './data/content';
import type { PortfolioTeam } from './data/portfolio';
import { EditorialIntro } from './EditorialIntro/EditorialIntro';
import { PortfolioPanel } from './PortfolioPanel/PortfolioPanel';
import { ExploreLogoWall } from './ExploreLogoWall/ExploreLogoWall';
import s from './ExplorePlNetworkView.module.scss';

const teamParams = (logo: PortfolioTeam): ExploreTeamParams => ({
  logo_id: logo.id,
  team_uid: logo.uid ?? null,
  island: logo.island,
});

/**
 * Explore PL Network: the editorial landing for investors who don't know
 * Protocol Labs, linked from SPV Spotlight and usable as a fixed global URL.
 * Chromeless (see isBareRoute), on the completed Demo Day template: statement,
 * figures, focus areas and PL entities; the portfolio (logo islands map and a
 * list); the VC logo wall; footer. Static marketing copy; the portfolio
 * teams come merged from the Directory and the fallback file (page.tsx).
 */
export function ExplorePlNetworkView({ teams }: { teams: PortfolioTeam[] }) {
  const analytics = useExplorePlNetworkAnalytics();

  useEffect(() => {
    analytics.onPageViewed();
    // One page view per mount; the analytics object isn't stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={clsx(s.page, aileron.variable)}>
      <SpvTopBar label="Protocol Labs Network" />

      <div className={s.root}>
        <div className={s.content}>
          <EditorialIntro
            portfolioCount={teams.length}
            onEntityClicked={(entity) => analytics.onEntityClicked({ entity })}
          />

          <section id="portfolio" className={s.sectionTeams} aria-labelledby="explore-portfolio-title">
            <div className={s.subtitle}>
              <h2 id="explore-portfolio-title" className={s.label}>
                The portfolio
              </h2>
              <p className={s.supportingText}>
                {teams.length} teams across four focus areas, with Protocol Labs at the centre.
              </p>
            </div>

            <PortfolioPanel
              teams={teams}
              onViewChanged={(view) => analytics.onPortfolioViewChanged({ view })}
              onTileOpened={(logo) => analytics.onMapTileOpened(teamParams(logo))}
              onProfileClicked={(logo, source) => analytics.onTeamProfileClicked({ ...teamParams(logo), source })}
              onShowAllToggled={(expanded) => analytics.onListShowAllToggled({ expanded })}
            />
          </section>

          <section className={s.sectionPartners}>
            <ExploreLogoWall onShowAllToggled={(expanded) => analytics.onLogoWallShowAllToggled({ expanded })} />
          </section>

          <SpvFooter
            supportEmail={EXPLORE_SUPPORT_EMAIL}
            showLegalLinks={false}
            note={
              <>
                © {new Date().getFullYear()} Protocol Labs. Team information is provided by the teams. Protocol Labs
                does not endorse or recommend any investment, and is not a broker, dealer, or advisor.
              </>
            }
          />
        </div>
      </div>
    </div>
  );
}
