'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToggle } from 'react-use';
import clsx from 'clsx';

import { Button } from '@/components/common/Button';
import { LogosGrid } from '@/components/common/LogosGrid';
import { FAQ } from '@/components/page/demo-day/InvestorPendingView/components/FAQ';
import { TeamCard } from '@/components/common/LogosGrid/components/TeamCard';
import {
  faqCompletedItems,
  PRIVACY_POLICY_URL,
  TERMS_AND_CONDITIONS_URL,
  isNetworkPartnerDemoDaySlug,
  NETWORK_PARTNER_DEMO_DAY_FOOTER_DISCLAIMER,
} from '@/app/constants/demoday';
import teamsData from '@/components/common/LogosGrid/teams.json';

// Reuse the real completed-page styles so this prototype tracks production 1:1.
import s from '@/components/page/demo-day/DemodayCompletedView/DemodayCompletedView.module.scss';

import { mockCompletedDemoDay } from './mocks';
import wrap from './DemodayPastTeamsPrototype.module.scss';

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
    return <div className={wrap.page} />;
  }

  return (
    <div className={wrap.page}>
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
              <h2 className={s.label}>{displayTeams.length} Teams That Presented</h2>
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
                    displayTeams.map((team) => (
                      <TeamCard
                        key={team.uid}
                        team={{
                          uid: team.uid,
                          name: team.name,
                          logo: team.logo,
                          stage: team.stage,
                          website: team.website || '',
                          shortDescription: team.shortDescription,
                        }}
                      />
                    ))
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

const ArrowRight = ({ color = 'white', width = 22, height = 21 }: { color?: string; width?: number; height?: number }) => (
  <svg width={width} height={height} viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g>
      <path
        d="M18.5383 10.6631L12.9133 16.2881C12.7372 16.4642 12.4983 16.5631 12.2492 16.5631C12.0001 16.5631 11.7613 16.4642 11.5852 16.2881C11.409 16.1119 11.3101 15.8731 11.3101 15.624C11.3101 15.3749 11.409 15.136 11.5852 14.9599L15.6094 10.9373H4.125C3.87636 10.9373 3.6379 10.8385 3.46209 10.6627C3.28627 10.4869 3.1875 10.2484 3.1875 9.99977C3.1875 9.75113 3.28627 9.51267 3.46209 9.33686C3.6379 9.16104 3.87636 9.06227 4.125 9.06227H15.6094L11.5867 5.03727C11.4106 4.86115 11.3117 4.62228 11.3117 4.37321C11.3117 4.12414 11.4106 3.88527 11.5867 3.70915C11.7628 3.53303 12.0017 3.43408 12.2508 3.43408C12.4999 3.43408 12.7387 3.53303 12.9148 3.70915L18.5398 9.33414C18.6273 9.42136 18.6966 9.52498 18.7438 9.63907C18.7911 9.75315 18.8153 9.87544 18.8152 9.99892C18.815 10.1224 18.7905 10.2446 18.743 10.3586C18.6955 10.4726 18.6259 10.576 18.5383 10.6631Z"
        fill={color}
      />
    </g>
  </svg>
);
