
import React, { PropsWithChildren } from 'react';

import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';

import { faqItems } from '@/app/constants/demoday';

import { LogosGrid } from '@/components/common/LogosGrid';
import { PageTitle } from '@/components/page/demo-day/PageTitle';
import { CountdownComponent } from '@/components/common/Countdown';
import { FAQ } from '@/components/page/demo-day/InvestorPendingView/components/FAQ';

import s from './LandingBase.module.scss';

export function LandingBase(props: PropsWithChildren) {
  const { children } = props;

  const { data } = useGetDemoDayState();

  return (
    <div className={s.root}>
      <div className={s.eventHeader}>
        {/* Main content */}
        <div className={s.content}>
          <div className={s.mainContent}>
            {/* Countdown section */}
            <div className={s.countdownSection}>
              <CountdownComponent targetDate={data?.date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)} />
            </div>

            <PageTitle />
          </div>

          {children}

          <LogosGrid />
          <FAQ items={faqItems} />
        </div>
      </div>
    </div>
  );
}
