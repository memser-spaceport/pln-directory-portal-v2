'use client';

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { FAQ } from '@/components/page/demo-day/InvestorPendingView/components/FAQ';
import { PRIVACY_POLICY_URL, TERMS_AND_CONDITIONS_URL } from '@/app/constants/demoday';
// Same template as the SPV Spotlight page it is opened from: the completed
// Demo Day root, sheet, partners / FAQ sections, footer and section titles.
import d from '@/components/page/demo-day/DemodayCompletedView/DemodayCompletedView.module.scss';
import t from '@/components/page/demo-day/DemodayCompletedView/components/CompletedDemoDayTeamsList/CompletedDemoDayTeamsList.module.scss';
import { SpvLogos } from '../spv-spotlight/SpvLogos';
import spv from '../spv-spotlight/SpvSpotlight.module.scss';
import { PortfolioPanel } from './PortfolioPanel';
import { SpvNavBar } from '../spv-spotlight/SpvNavBar';
import { PORTFOLIO, type PortfolioLogo } from './islands';
import { TEAM_INFO } from './teamInfo';
import { EXPLORE_COPY, exploreFaqItems } from './mocks';
import { EditorialIntro } from './EditorialSections';
import { VisualContext, VisualHero } from './VisualSections';
import s from './ExplorePlNetwork.module.scss';

/**
 * "Explore PL Network" — the separate landing an SPV Spotlight links to, for
 * investors who don't know Protocol Labs (2026-09-28 sync). Chromeless like
 * the deal page, and more than a bare team list: what PL is, the portfolio,
 * who PL teams have raised from, and an FAQ.
 *
 * The portfolio is marketing's logo islands (logo-islands.vercel.app) with its
 * real 284 logos — that is the "grid" Anuj meant — rebuilt to look like the
 * site, its own category row and year strip included (IslandsMap). Ours on
 * top: the name card links to the team's directory profile, and a List view
 * scans names.
 *
 * Two directions for the 2026-09-29 sync, as two prototype entries sharing this
 * page (explore-pl-network = Editorial, explore-pl-network-visual = Visual);
 * both keep the logo wall, FAQ and footer below:
 * - Editorial (EditorialSections): official, typographic, links to PL Capital,
 *   PL R&D, PLVS and the rest; the portfolio section (cube / islands / list).
 * - Visual (VisualSections): the logo cube as a full-width dark hero, then
 *   General Info beside a PL video. No portfolio section: the hero is the
 *   portfolio (the user, 2026-09-29), so the hero has to say it is clickable.
 */

export type Direction = 'editorial' | 'visual';

// The team's production profile when teamInfo.ts matched it to a directory uid; otherwise
// production team search by marketing's name.
const directoryUrl = (logo: PortfolioLogo) => {
  const uid = TEAM_INFO[logo.id]?.uid;
  return uid ? `https://os.pl.xyz/teams/${uid}` : `https://os.pl.xyz/teams?searchBy=${encodeURIComponent(logo.name)}`;
};

export function ExplorePlNetworkPage({ direction }: { direction: Direction }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={spv.page} />;

  return (
    <div className={spv.page}>
      <SpvNavBar
        label="PL Network"
        supportEmail={EXPLORE_COPY.supportEmail}
        tone={direction === 'visual' ? 'dark' : 'light'}
      />

      {direction === 'visual' && <VisualHero onOpenProfile={directoryUrl} />}

      <div className={clsx(d.root, spv.root, { [s.rootAfterHero]: direction === 'visual' })}>
        <div className={d.content}>
          {direction === 'editorial' ? <EditorialIntro /> : <VisualContext />}

          {direction === 'editorial' && (
            <section id="portfolio" className={t.sectionTeams}>
              <div className={t.subtitle}>
                <h2 className={t.label}>The portfolio</h2>
                <p className={t.supportingText}>
                  {PORTFOLIO.length} teams across four focus areas, with Protocol Labs at the centre.
                </p>
              </div>

              <PortfolioPanel onOpenProfile={directoryUrl} />
            </section>
          )}

          <section className={d.sectionPartners}>
            <div className={d.logosButtonContainer}>
              <SpvLogos />
            </div>
          </section>

          <section className={d.sectionFaq}>
            <FAQ
              title="Questions investors ask"
              items={exploreFaqItems}
              subtitle={
                <p className={d.infoText}>
                  Reach out to us at{' '}
                  <a href={`mailto:${EXPLORE_COPY.supportEmail}`} className={d.infoLink}>
                    {EXPLORE_COPY.supportEmail}
                  </a>{' '}
                  for any other questions.
                </p>
              }
            />
          </section>

          <footer className={d.footer}>
            <div className={d.note}>
              © 2026 Protocol Labs. Team information is provided by the teams. Protocol Labs does not endorse or
              recommend any investment, and is not a broker, dealer, or advisor.
            </div>
            <div className={d.bottom}>
              <div className={d.links}>
                <a className={d.link} href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
                <a className={d.link} href={TERMS_AND_CONDITIONS_URL} target="_blank" rel="noopener noreferrer">
                  Terms & Conditions
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

// The Editorial direction; the Visual one is its own entry (ExplorePlNetworkVisualPrototype).
export default function ExplorePlNetworkPrototype() {
  return <ExplorePlNetworkPage direction="editorial" />;
}
