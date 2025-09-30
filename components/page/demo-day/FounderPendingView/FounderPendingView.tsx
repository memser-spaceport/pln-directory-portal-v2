import React from 'react';
import s from './FounderPendingView.module.scss';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { Alert } from './components/Alert';
import { ProfileSection } from './components/ProfileSection';
import { CountdownComponent } from '@/components/common/Countdown';
import { useDemoDayPageViewAnalytics } from '@/hooks/usePageViewAnalytics';
import { PageTitle } from '@/components/page/demo-day/PageTitle';

export const FounderPendingView = () => {
  const { data } = useGetDemoDayState();

  // Page view analytics - triggers only once on mount
  useDemoDayPageViewAnalytics(
    'onFounderPendingViewPageOpened',
    'founder_pending_view_page_opened',
    '/demoday',
    {
      demoDayTitle: data?.title,
      demoDayDate: data?.date,
      demoDayStatus: data?.status,
    }
  );

  return (
    <div className={s.root}>
      <div className={s.eventHeader}>
        <div className={s.content}>
          {/* Countdown section */}
          <div className={s.countdownSection}>
            <CountdownComponent targetDate={data?.date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)} />
          </div>

          <PageTitle />

          {/*<ProfileContent pitchDeckUrl={PITCH_DECK_URL} videoUrl={PITCH_VIDEO_URL} />*/}
        </div>
      </div>
      <Alert />
      <ProfileSection />
    </div>
  );
};
