import React, { PropsWithChildren } from 'react';

import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';

import { CountdownComponent } from '@/components/common/Countdown';

import s from './LandingBase.module.scss';
import LoginBtn from '@/components/core/navbar/login-btn';
import { LogosGrid } from '@/components/common/LogosGrid';
import { InvestorStepper } from '@/components/page/demo-day/InvestorPendingView/components/InvestorStepper';
import { FAQ } from '@/components/page/demo-day/InvestorPendingView/components/FAQ';
import { faqItems } from '@/app/constants/demoday';

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

            {/* Headline section */}
            <div className={s.headline}>
              <h1 className={s.title}>PL F25 Demo Day</h1>
              <p className={s.description}>
                An invite-only event for accredited investors, featuring 25 emerging <br />
                <a href="https://www.protocol.ai/" className={s.link}>
                  Protocol Labs Network
                </a>{' '}
                teams in rapid-fire demos. <b>October 23, 2025</b>.
              </p>
            </div>
          </div>

          {children}

          <LogosGrid />
          <FAQ items={faqItems} />
        </div>
      </div>
    </div>
  );
}
