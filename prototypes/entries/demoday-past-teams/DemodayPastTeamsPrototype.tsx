'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToggle } from 'react-use';
import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import { LogosGrid } from '@/components/common/LogosGrid';
import { FAQ } from '@/components/page/demo-day/InvestorPendingView/components/FAQ';
import {
  faqCompletedItems,
  PRIVACY_POLICY_URL,
  TERMS_AND_CONDITIONS_URL,
  isNetworkPartnerDemoDaySlug,
  NETWORK_PARTNER_DEMO_DAY_FOOTER_DISCLAIMER,
} from '@/app/constants/demoday';
import teamsData from '@/components/common/LogosGrid/teams.json';

import { ArrowRight } from '@/components/page/demo-day/DemodayCompletedView/components/Icons';
import { PastTeamCard } from '@/components/page/demo-day/DemodayCompletedView/components/CompletedDemoDayTeamsList/components';

import { mockCompletedDemoDay } from './mocks';
import s from './DemodayPastTeamsPrototype.module.scss';
import { recentNewsCountByUid } from '@/prototypes/entries/demoday-past-teams/teamNews';

export default function DemodayPastTeamsPrototype() {
  // Client-only gate: several reused pieces (LogosGrid, FAQ) are interactive.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [showAllTeams, toggleShowAllTeams] = useToggle(false);

  const demoDayState = mockCompletedDemoDay;
  const supportEmail = demoDayState.supportEmail ?? 'pldemoday@protocol.ai';
  const isNetworkPartnerDemoDay = isNetworkPartnerDemoDaySlug(demoDayState.slugURL);

  // Static past-participant data — the same source the production section uses.
  const displayTeams = teamsData;

  if (!mounted) {
    return <div className={s.page} />;
  }

  return (
    <div className={s.page}>
      <div className={s.root}>
        <div className={s.content}>
          {/* Hero Section */}
          <section className={s.heroSection}>
            <div className={s.titleContainer}>
              <div className={s.overline}>
                <div className={s.badge}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="3.5" fill="#455468" />
                  </svg>
                  <span className={s.overlineText}>Completed</span>
                </div>
              </div>
              <div className={s.headline}>
                <h1 className={s.title}>{demoDayState.title}</h1>
                <p className={s.body} dangerouslySetInnerHTML={{ __html: demoDayState.description || '' }} />
              </div>
            </div>

            <div className={s.buttons}>
              <div className={s.linksWrapper}>
                <Link href="/demoday">
                  <Button size="l" style="fill" variant="primary">
                    View all Demo Days <ArrowRight />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Partners Section */}
          <section className={s.sectionPartners}>
            <div className={s.logosButtonContainer}>
              <LogosGrid source="completed" />
            </div>
          </section>

          {/* Teams Section — UN-HIDDEN (production wraps this in style={{ display: 'none' }}) */}
          <section className={s.sectionTeams}>
            <div className={s.subtitle}>
              <h2 className={s.label}>Participating teams ({displayTeams.length})</h2>
              <p className={s.supportingText}>Innovative startups across AI, web3, crypto, robotics, and neurotech</p>
            </div>
            <div className={s.cards}>
              <div
                className={clsx(s.cardsGridContainer, {
                  [s.expanded]: showAllTeams,
                })}
              >
                <div className={s.cardsGrid}>
                  {displayTeams.length > 0 ? (
                    displayTeams.map((team, i) => {
                      const { uid } = team;

                      return (
                        <PastTeamCard
                          key={uid}
                          team={{
                            isFollowing: i % 2 === 0,
                            newsCount: recentNewsCountByUid[uid],
                            uid: team.uid,
                            name: team.name,
                            logoUrl: team.logo,
                            shortDescription: team.shortDescription,
                          }}
                        />
                      );
                    })
                  ) : (
                    <div className={s.noTeams}>No teams available</div>
                  )}
                </div>
                <div className={s.bottomShadow} />
              </div>
              <Button size="s" style="border" onClick={toggleShowAllTeams}>
                Show {showAllTeams ? 'Less' : 'All'} Teams
              </Button>
            </div>
          </section>

          {/* FAQ Section */}
          <section className={s.sectionFaq}>
            <FAQ
              title="Frequently Asked Questions"
              items={faqCompletedItems}
              demoDaySlug={demoDayState.slugURL}
              subtitle={
                <p className={s.infoText}>
                  Reach out to us at{' '}
                  <a href={`mailto:${supportEmail}`} className={s.infoLink}>
                    {supportEmail}
                  </a>{' '}
                  for any other questions.
                </p>
              }
            />
          </section>

          {/* Footer */}
          <footer className={s.footer}>
            <div className={s.note}>
              © 2026 Protocol Labs Venture Studios.{' '}
              {isNetworkPartnerDemoDay
                ? NETWORK_PARTNER_DEMO_DAY_FOOTER_DISCLAIMER
                : 'All content is provided by the founders. Protocol Labs Demo Day organizers do not endorse or recommend any investment.'}
            </div>
            <div className={s.bottom}>
              <div className={s.links}>
                <a className={s.link} href={PRIVACY_POLICY_URL} target="_blank">
                  Privacy Policy
                </a>
                <a className={s.link} href={TERMS_AND_CONDITIONS_URL} target="_blank">
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
