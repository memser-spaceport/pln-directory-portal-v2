'use client';

import Link from 'next/link';
import isEmpty from 'lodash/isEmpty';
import React, { useMemo, useState } from 'react';

import { useGetDemoDaysList } from '@/services/demo-day/hooks/useGetDemoDaysList';
import { Button } from '@/components/common/Button';
import { DemoDayCardSkeleton } from '@/components/common/DemoDayCard';

import { IUserInfo } from '@/types/shared.types';
import { IMember } from '@/types/members.types';
import { LogosGrid } from '@/components/common/LogosGrid';
import { FAQ } from '@/components/page/demo-day/InvestorPendingView/components/FAQ';
import { faqCompletedItems } from '@/app/constants/demoday';
import { DEMODAY_PRIVACY_URL, DEMODAY_TERMS_URL } from '@/components/page/sign-up/components/SignupWizard/constants';
import { SubscribeSection } from './components/SubscribeSection';
import { TabsWithCards } from '@/components/page/demo-day/DemoDayListPage/components/TabsWithCards';

import { EditIcon } from './components/Icons';

import s from './DemoDayListPage.module.scss';

type Props = {
  isLoggedIn?: boolean;
  userInfo?: IUserInfo;
  memberData?: IMember | null;
};

export const DemoDayListPage = ({ isLoggedIn, userInfo, memberData }: Props) => {
  const { data: demoDays, isLoading } = useGetDemoDaysList();

  // Find demo days with REGISTRATION_OPEN or ACTIVE status
  const applicableDemoDays = demoDays?.filter((dd) => dd.status === 'REGISTRATION_OPEN' || dd.status === 'ACTIVE');

  const toHighlightSlug =
    applicableDemoDays?.find((dd) => dd.status === 'ACTIVE')?.slugURL ??
    applicableDemoDays?.find((dd) => dd.status === 'REGISTRATION_OPEN')?.slugURL;

  return (
    <div className={s.root}>
      <div className={s.content}>
        {/* Hero Section */}
        <section className={s.heroSection}>
          <div id="demodays-section" className={s.section1}>
            <div className={s.title}>
              {/* <div className={s.overline}>
                <div className={s.dot} />
                <span className={s.overlineText}>UPCOMING DEMO DAY</span>
                <span className={s.break}>•</span>
                <span className={s.overlineText}>DEC 10, 2025</span>
              </div> */}
              <div className={s.headline}>
                <h1 className={s.headlineTitle}>PL Demo Day</h1>
                <p className={s.headlineBody}>
                  PL Demo Days are virtual events featuring top, pre-selected teams from the PL network. Accredited
                  investors review pitches asynchronously, with 1-click options to connect and invest.
                </p>
              </div>
            </div>
            <div className={s.buttons} style={{ display: 'none' }}>
              <div className={s.links}>
                {isLoggedIn && userInfo && (
                  <Link target="_blank" href={`/members/${userInfo?.uid}?backTo=/demoday`} className={s.linkButton}>
                    Keep your profile updated <EditIcon />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Subscribe Section */}
          {applicableDemoDays?.length === 0 && <SubscribeSection isLoggedIn={isLoggedIn} userInfo={userInfo} />}

          {/* Cards Section */}
          <div className={s.section2}>
            <TabsWithCards loading={isLoading} demoDays={demoDays || []} highlightSlug={toHighlightSlug} />
          </div>
        </section>

        {/* Partners Section */}
        <section className={s.sectionPartners}>
          <div className={s.logosButtonContainer}>
            <LogosGrid source="completed" />
          </div>
        </section>

        {/* FAQ Section */}
        <section className={s.sectionFaq}>
          <FAQ
            title="Frequently Asked Questions"
            items={faqCompletedItems}
            demoDaySlug={null}
            subtitle={
              <div className={s.infoText}>
                Reach out to us on{' '}
                <a href="mailto:pldemoday@protocol.ai" className={s.infoLink}>
                  pldemoday@protocol.ai
                </a>{' '}
                for any other questions.
              </div>
            }
          />
        </section>

        {/* Footer */}
        <footer className={s.footer}>
          <div className={s.bottom}>
            <p className={s.labelText}>
              © 2026 Protocol Labs. All content is provided by the founders. Protocol Labs Demo Day organizers do not
              endorse or recommend any investment.
            </p>
            <div className={s.footerButtons}>
              <Link href={DEMODAY_PRIVACY_URL} className={s.footerLink} target="_blank">
                Privacy Policy
              </Link>
              <Link href={DEMODAY_TERMS_URL} className={s.footerLink} target="_blank">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
