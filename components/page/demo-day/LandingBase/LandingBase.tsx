import React, { PropsWithChildren, ReactNode } from 'react';

import {
  faqItems,
  isNetworkPartnerDemoDaySlug,
  NETWORK_PARTNER_DEMO_DAY_FOOTER_DISCLAIMER,
} from '@/app/constants/demoday';

import { LogosGrid } from '@/components/common/LogosGrid';
import { PageTitle } from '@/components/page/demo-day/PageTitle';
import { FAQ } from '@/components/page/demo-day/InvestorPendingView/components/FAQ';
import { DemoDayState } from '@/app/actions/demo-day.actions';

import { Footer } from './components/Footer';

import s from './LandingBase.module.scss';

interface LandingBaseProps {
  initialDemoDayState?: DemoDayState;
  countdown?: ReactNode;
  information?: ReactNode;
  hideLogos?: boolean;
}

export function LandingBase(props: PropsWithChildren<LandingBaseProps>) {
  const { children, initialDemoDayState, countdown, information, hideLogos } = props;
  const supportEmail = initialDemoDayState?.supportEmail ?? 'pldemoday@protocol.ai';
  const demoDaySlug = initialDemoDayState?.slugURL;
  const isNetworkPartnerDemoDay = isNetworkPartnerDemoDaySlug(demoDaySlug);

  return (
    <div className={s.root}>
      <div className={s.eventHeader}>
        {/* Main content */}
        <div className={s.content}>
          <div className={s.mainContent}>
            {countdown}
            <PageTitle initialDemoDayState={initialDemoDayState} />
            {information}
          </div>

          {children}

          <div className={s.reachOut}>
            Questions? Contact us at{' '}
            <a href={`mailto:${supportEmail}`} className={s.email}>
              {supportEmail}
            </a>
          </div>

          {!hideLogos && <LogosGrid demoDaySlug={demoDaySlug} />}

          <FAQ
            items={faqItems}
            demoDaySlug={demoDaySlug}
            subtitle={
              isNetworkPartnerDemoDay ? (
                <p className={s.faqReachOut}>
                  Reach out to us at{' '}
                  <a href={`mailto:${supportEmail}`} className={s.email}>
                    {supportEmail}
                  </a>{' '}
                  for any other questions.
                </p>
              ) : undefined
            }
          />

          <Footer disclaimer={isNetworkPartnerDemoDay ? NETWORK_PARTNER_DEMO_DAY_FOOTER_DISCLAIMER : undefined} />
        </div>
      </div>
    </div>
  );
}
