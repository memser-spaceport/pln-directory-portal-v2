import React from 'react';
import s from './FounderPendingView.module.scss';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { Alert } from './components/Alert';
import { ProfileSection } from './components/ProfileSection';
import { TeamFundraisingCard } from '@/components/page/demo-day/InvestorPendingView/components/TeamFundraisingCard';
import { ProfileContent } from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileContent';
import { PITCH_DECK_URL, PITCH_VIDEO_URL } from '@/utils/constants/team-constants';
import { CountdownComponent } from '@/components/common/Countdown';

export const FounderPendingView = () => {
  const { data } = useGetDemoDayState();

  return (
    <div className={s.root}>
      <div className={s.eventHeader}>
        <div className={s.content}>
          {/* Countdown section */}
          <div className={s.countdownSection}>
            <CountdownComponent targetDate={data?.date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)} />
          </div>

          {/* Headline section */}
          <div className={s.headline}>
            <h1 className={s.title}>{data?.title || 'PL Demo Day'}</h1>
            <p className={s.description}>
              {data?.description ||
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}
            </p>
          </div>

          {/*<ProfileContent pitchDeckUrl={PITCH_DECK_URL} videoUrl={PITCH_VIDEO_URL} />*/}
        </div>
      </div>
      <Alert />
      <ProfileSection />
    </div>
  );
};
