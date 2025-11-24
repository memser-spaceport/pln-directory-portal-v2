import React, { PropsWithChildren, ReactNode } from 'react';

import { faqItems } from '@/app/constants/demoday';

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
}

export function LandingBase(props: PropsWithChildren<LandingBaseProps>) {
  const { children, initialDemoDayState, countdown, information } = props;

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
            <a href="mailto:pldemoday@protocol.ai" className={s.email}>
              pldemoday@protocol.ai
            </a>
          </div>

          <LogosGrid />
          <FAQ items={faqItems} />

          <Footer />
        </div>
      </div>
    </div>
  );
}
