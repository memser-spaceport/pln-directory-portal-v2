'use client';

import React, { useEffect } from 'react';
import clsx from 'clsx';
import { FAQ } from '@/components/page/demo-day/InvestorPendingView/components/FAQ';
import { SpvTopBar } from '@/components/page/spv-spotlight/SpvTopBar/SpvTopBar';
import { SpvFooter, spvFooterLinkClassName } from '@/components/page/spv-spotlight/SpvFooter/SpvFooter';
import { useExplorePlNetworkAnalytics, type ExploreTeamParams } from '@/analytics/explore-pl-network.analytics';
import { aileron } from './aileron';
import { EXPLORE_FAQ_ITEMS, EXPLORE_SUPPORT_EMAIL, PL_CAPITAL_URL } from './data/content';
import { PORTFOLIO, type PortfolioLogo } from './data/islands';
import { TEAM_INFO } from './data/teamInfo';
import { EditorialIntro } from './EditorialIntro/EditorialIntro';
import { PortfolioPanel } from './PortfolioPanel/PortfolioPanel';
import { ExploreLogoWall } from './ExploreLogoWall/ExploreLogoWall';
import s from './ExplorePlNetworkView.module.scss';

const teamParams = (logo: PortfolioLogo): ExploreTeamParams => ({
  logo_id: logo.id,
  team_uid: TEAM_INFO[logo.id]?.uid ?? null,
  island: logo.island,
});

/**
 * Explore PL Network: the editorial landing for investors who don't know
 * Protocol Labs, linked from SPV Spotlight and usable as a fixed global URL.
 * Chromeless (see isBareRoute), on the completed Demo Day template: statement,
 * figures, focus areas and PL entities; the portfolio (logo islands map and a
 * list); the VC logo wall; FAQ; footer. Static marketing data for v1.
 */
export function ExplorePlNetworkView() {
  const analytics = useExplorePlNetworkAnalytics();

  useEffect(() => {
    analytics.onPageViewed();
    // One page view per mount; the analytics object isn't stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={clsx(s.page, aileron.variable)}>
      <SpvTopBar label="PL Network" supportEmail={EXPLORE_SUPPORT_EMAIL} />

      <div className={s.root}>
        <div className={s.content}>
          <EditorialIntro onEntityClicked={(entity) => analytics.onEntityClicked({ entity })} />

          <section id="portfolio" className={s.sectionTeams} aria-labelledby="explore-portfolio-title">
            <div className={s.subtitle}>
              <h2 id="explore-portfolio-title" className={s.label}>
                The portfolio
              </h2>
              <p className={s.supportingText}>
                {PORTFOLIO.length} teams across four focus areas, with Protocol Labs at the centre.
              </p>
            </div>

            <PortfolioPanel
              onViewChanged={(view) => analytics.onPortfolioViewChanged({ view })}
              onTileOpened={(logo) => analytics.onMapTileOpened(teamParams(logo))}
              onProfileClicked={(logo, source) => analytics.onTeamProfileClicked({ ...teamParams(logo), source })}
              onShowAllToggled={(expanded) => analytics.onListShowAllToggled({ expanded })}
            />
          </section>

          <section className={s.sectionPartners}>
            <ExploreLogoWall onShowAllToggled={(expanded) => analytics.onLogoWallShowAllToggled({ expanded })} />
          </section>

          <section className={s.sectionFaq}>
            <FAQ
              title="Questions investors ask"
              items={EXPLORE_FAQ_ITEMS}
              subtitle={
                <p className={s.infoText}>
                  Reach out to us at{' '}
                  <a href={`mailto:${EXPLORE_SUPPORT_EMAIL}`} className={s.infoLink}>
                    {EXPLORE_SUPPORT_EMAIL}
                  </a>{' '}
                  for any other questions.
                </p>
              }
            />
          </section>

          <SpvFooter
            supportEmail={EXPLORE_SUPPORT_EMAIL}
            note={
              <>
                © {new Date().getFullYear()} Protocol Labs. Team information is provided by the teams. Protocol Labs
                does not endorse or recommend any investment, and is not a broker, dealer, or advisor. Investments
                referenced on this page are made through{' '}
                <a href={PL_CAPITAL_URL} className={spvFooterLinkClassName} target="_blank" rel="noopener noreferrer">
                  PL Capital
                </a>
                .
              </>
            }
          />
        </div>
      </div>
    </div>
  );
}
