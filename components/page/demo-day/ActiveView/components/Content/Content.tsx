import React from 'react';
import s from '@/components/page/demo-day/FounderPendingView/FounderPendingView.module.scss';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import Link from 'next/link';
import { format } from 'date-fns-tz';
import { TeamsList } from '@/components/page/demo-day/ActiveView/components/TeamsList';
import { PageTitle } from '@/components/page/demo-day/PageTitle';
import { Alert } from '@/components/page/demo-day/shared/Alert';
import { MediaPreview } from '../../../FounderPendingView/components/MediaPreview';
import { PITCH_VIDEO_URL } from '@/utils/constants/team-constants';
import { IUserInfo } from '@/types/shared.types';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';

export const Content = () => {
  const { data } = useGetDemoDayState();
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));
  const { onActiveViewWelcomeVideoViewed } = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();

  const handleWelcomeVideoViewClicked = () => {
    if (userInfo?.email) {
      // PostHog analytics via hook
      onActiveViewWelcomeVideoViewed({
        videoUrl: PITCH_VIDEO_URL,
        pageContext: 'active-view',
      });

      // Direct API analytics event
      const welcomeVideoEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_WELCOME_VIDEO_VIEWED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          pageContext: 'active-view',
        },
      };

      reportAnalytics.mutate(welcomeVideoEvent);
    }
  };

  return (
    <div className={s.root}>
      <div className={s.eventHeader}>
        <div className={s.content}>
          <div className={s.headline}>
            {data?.isEarlyAccess && (
              <div
                style={{
                  margin: 'auto',
                  marginBottom: '12px',
                  fontSize: '24px',
                  color: '#798391',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                [Early Access]
              </div>
            )}
            <PageTitle size="small" showDate={false} />
          </div>

          <div className={s.stats}>
            <span>
              <CalendarIcon /> {data?.date ? format(data.date, 'dd MMM yyyy, hh:mm aa (zzz)') : ''}
            </span>
            &nbsp;&bull;&nbsp;
            <span>
              {data?.teamsCount} Team{(data?.teamsCount ?? 0) > 1 ? 's' : ''}
            </span>
            {data?.investorsCount && data?.investorsCount > 200 ? (
              <>
                &nbsp;&bull;&nbsp;
                <Link href={`/members?isInvestor=true`}>
                  {data?.investorsCount} Investor{(data?.investorsCount ?? 0) > 1 ? 's' : ''}
                  <LinkIcon />
                </Link>
              </>
            ) : null}
          </div>
          <div className={s.videoWrapper}>
            <MediaPreview
              url={PITCH_VIDEO_URL}
              type="video"
              title="Pitch Video"
              showMetadata={false}
              onView={handleWelcomeVideoViewClicked}
            />
          </div>
          {/*<ProfileContent pitchDeckUrl={PITCH_DECK_URL} videoUrl={PITCH_VIDEO_URL} />*/}

          <Alert>
            <p>
              Confidentiality notice: Materials presented here are confidential and are provided exclusively for your
              review. DO NOT copy, screenshot, share, or distribute to others. Any unauthorized disclosure will result
              in removal from the network.
            </p>
          </Alert>
        </div>
      </div>

      <TeamsList />
    </div>
  );
};

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14.625 1.96875H13.2188V1.6875C13.2188 1.46372 13.1299 1.24911 12.9716 1.09088C12.8134 0.932645 12.5988 0.84375 12.375 0.84375C12.1512 0.84375 11.9366 0.932645 11.7784 1.09088C11.6201 1.24911 11.5312 1.46372 11.5312 1.6875V1.96875H6.46875V1.6875C6.46875 1.46372 6.37986 1.24911 6.22162 1.09088C6.06339 0.932645 5.84878 0.84375 5.625 0.84375C5.40122 0.84375 5.18661 0.932645 5.02838 1.09088C4.87014 1.24911 4.78125 1.46372 4.78125 1.6875V1.96875H3.375C3.00204 1.96875 2.64435 2.11691 2.38063 2.38063C2.11691 2.64435 1.96875 3.00204 1.96875 3.375V14.625C1.96875 14.998 2.11691 15.3556 2.38063 15.6194C2.64435 15.8831 3.00204 16.0312 3.375 16.0312H14.625C14.998 16.0312 15.3556 15.8831 15.6194 15.6194C15.8831 15.3556 16.0312 14.998 16.0312 14.625V3.375C16.0312 3.00204 15.8831 2.64435 15.6194 2.38063C15.3556 2.11691 14.998 1.96875 14.625 1.96875ZM4.78125 3.65625C4.78125 3.88003 4.87014 4.09464 5.02838 4.25287C5.18661 4.41111 5.40122 4.5 5.625 4.5C5.84878 4.5 6.06339 4.41111 6.22162 4.25287C6.37986 4.09464 6.46875 3.88003 6.46875 3.65625H11.5312C11.5312 3.88003 11.6201 4.09464 11.7784 4.25287C11.9366 4.41111 12.1512 4.5 12.375 4.5C12.5988 4.5 12.8134 4.41111 12.9716 4.25287C13.1299 4.09464 13.2188 3.88003 13.2188 3.65625H14.3438V5.34375H3.65625V3.65625H4.78125ZM3.65625 14.3438V7.03125H14.3438V14.3438H3.65625ZM10.125 9C10.125 9.2225 10.059 9.44001 9.9354 9.62502C9.81179 9.81002 9.63609 9.95422 9.43052 10.0394C9.22495 10.1245 8.99875 10.1468 8.78052 10.1034C8.56229 10.06 8.36184 9.95283 8.20451 9.79549C8.04717 9.63816 7.94002 9.43771 7.89662 9.21948C7.85321 9.00125 7.87549 8.77505 7.96064 8.56948C8.04578 8.36391 8.18998 8.18821 8.37498 8.0646C8.55999 7.94098 8.7775 7.875 9 7.875C9.29837 7.875 9.58452 7.99353 9.79549 8.20451C10.0065 8.41548 10.125 8.70163 10.125 9ZM13.5 9C13.5 9.2225 13.434 9.44001 13.3104 9.62502C13.1868 9.81002 13.0111 9.95422 12.8055 10.0394C12.6 10.1245 12.3738 10.1468 12.1555 10.1034C11.9373 10.06 11.7368 9.95283 11.5795 9.79549C11.4222 9.63816 11.315 9.43771 11.2716 9.21948C11.2282 9.00125 11.2505 8.77505 11.3356 8.56948C11.4208 8.36391 11.565 8.18821 11.75 8.0646C11.935 7.94098 12.1525 7.875 12.375 7.875C12.6734 7.875 12.9595 7.99353 13.1705 8.20451C13.3815 8.41548 13.5 8.70163 13.5 9ZM6.75 12.375C6.75 12.5975 6.68402 12.815 6.5604 13C6.43679 13.185 6.26109 13.3292 6.05552 13.4144C5.84995 13.4995 5.62375 13.5218 5.40552 13.4784C5.18729 13.435 4.98684 13.3278 4.82951 13.1705C4.67217 13.0132 4.56502 12.8127 4.52162 12.5945C4.47821 12.3762 4.50049 12.15 4.58564 11.9445C4.67078 11.7389 4.81498 11.5632 4.99998 11.4396C5.18499 11.316 5.4025 11.25 5.625 11.25C5.92337 11.25 6.20952 11.3685 6.42049 11.5795C6.63147 11.7905 6.75 12.0766 6.75 12.375ZM10.125 12.375C10.125 12.5975 10.059 12.815 9.9354 13C9.81179 13.185 9.63609 13.3292 9.43052 13.4144C9.22495 13.4995 8.99875 13.5218 8.78052 13.4784C8.56229 13.435 8.36184 13.3278 8.20451 13.1705C8.04717 13.0132 7.94002 12.8127 7.89662 12.5945C7.85321 12.3762 7.87549 12.15 7.96064 11.9445C8.04578 11.7389 8.18998 11.5632 8.37498 11.4396C8.55999 11.316 8.7775 11.25 9 11.25C9.29837 11.25 9.58452 11.3685 9.79549 11.5795C10.0065 11.7905 10.125 12.0766 10.125 12.375ZM13.5 12.375C13.5 12.5975 13.434 12.815 13.3104 13C13.1868 13.185 13.0111 13.3292 12.8055 13.4144C12.6 13.4995 12.3738 13.5218 12.1555 13.4784C11.9373 13.435 11.7368 13.3278 11.5795 13.1705C11.4222 13.0132 11.315 12.8127 11.2716 12.5945C11.2282 12.3762 11.2505 12.15 11.3356 11.9445C11.4208 11.7389 11.565 11.5632 11.75 11.4396C11.935 11.316 12.1525 11.25 12.375 11.25C12.6734 11.25 12.9595 11.3685 13.1705 11.5795C13.3815 11.7905 13.5 12.0766 13.5 12.375Z"
      fill="#455468"
    />
  </svg>
);

const LinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14.344 4.5V11.8125C14.344 12.0363 14.2551 12.2509 14.0968 12.4091C13.9386 12.5674 13.724 12.6562 13.5002 12.6562C13.2764 12.6562 13.0618 12.5674 12.9036 12.4091C12.7454 12.2509 12.6565 12.0363 12.6565 11.8125V6.53906L5.09717 14.097C4.93866 14.2555 4.72368 14.3445 4.49951 14.3445C4.27535 14.3445 4.06036 14.2555 3.90185 14.097C3.74335 13.9384 3.6543 13.7235 3.6543 13.4993C3.6543 13.2751 3.74335 13.0601 3.90185 12.9016L11.4612 5.34375H6.18771C5.96394 5.34375 5.74933 5.25486 5.59109 5.09662C5.43286 4.93839 5.34396 4.72378 5.34396 4.5C5.34396 4.27622 5.43286 4.06161 5.59109 3.90338C5.74933 3.74514 5.96394 3.65625 6.18771 3.65625H13.5002C13.724 3.65625 13.9386 3.74514 14.0968 3.90338C14.2551 4.06161 14.344 4.27622 14.344 4.5Z"
      fill="#455468"
    />
  </svg>
);
