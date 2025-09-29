import React from 'react';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { SyncParamsToUrl } from '@/components/core/SyncParamsToUrl';
import { FiltersHydrator } from '@/components/core/FiltersHydrator/FiltersHydrator';
import { Filters } from './components/Filters';
import { Content } from './components/Content';
import { useDemoDayPageViewAnalytics } from '@/hooks/usePageViewAnalytics';
import { useTimeOnPage } from '@/hooks/useTimeOnPage';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';

export const ActiveView = () => {
  const { data: demoDayData } = useGetDemoDayState();
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

  // Analytics hooks
  const { onActiveViewTimeOnPage } = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();

  // Page view analytics - triggers only once on mount
  useDemoDayPageViewAnalytics(
    'onActiveViewPageOpened',
    'active_view_page_opened',
    '/demoday',
    {
      demoDayTitle: demoDayData?.title,
      demoDayDate: demoDayData?.date,
      demoDayStatus: demoDayData?.status,
      teamsCount: demoDayData?.teamsCount,
      investorsCount: demoDayData?.investorsCount,
    }
  );

  // Time on page tracking
  useTimeOnPage({
    onTimeReport: (timeSpent) => {
      if (userInfo?.email) {
        // PostHog analytics
        onActiveViewTimeOnPage({ timeSpent });

        // Custom analytics event
        const timeOnPageEvent: TrackEventDto = {
          name: 'active_view_time_on_page',
          distinctId: userInfo.email,
          properties: {
            userId: userInfo.uid,
            userEmail: userInfo.email,
            userName: userInfo.name,
            path: '/demoday',
            timestamp: new Date().toISOString(),
            timeSpent: timeSpent,
            demoDayTitle: demoDayData?.title,
            teamsCount: demoDayData?.teamsCount,
          },
        };

        reportAnalytics.mutate(timeOnPageEvent);
      }
    },
    reportInterval: 30000, // Report every 30 seconds
  });

  return (
    <FiltersHydrator>
      <SyncParamsToUrl debounceTime={0} />
      <DashboardPagesLayout filters={<Filters />} content={<Content />} />
    </FiltersHydrator>
  );
};
