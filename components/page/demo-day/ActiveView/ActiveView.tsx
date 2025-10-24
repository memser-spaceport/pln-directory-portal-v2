'use client';

import React from 'react';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { SyncParamsToUrl } from '@/components/core/SyncParamsToUrl';
import { FiltersHydrator } from '@/components/core/FiltersHydrator/FiltersHydrator';
import { Filters } from './components/Filters';
import { Content } from './components/Content';
import { ConfidentialityModal } from './components/ConfidentialityModal';
import { useDemoDayPageViewAnalytics } from '@/hooks/usePageViewAnalytics';
import { useTimeOnPage } from '@/hooks/useTimeOnPage';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';
import { DemoDayState } from '@/app/actions/demo-day.actions';

interface ActiveViewProps {
  initialDemoDayState?: DemoDayState;
}

export const ActiveView = ({ initialDemoDayState }: ActiveViewProps) => {
  const { data: loadedDemoDayData } = useGetDemoDayState(initialDemoDayState);
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

  // Use initial data if available, otherwise use data from hook
  const demoDayData = loadedDemoDayData || initialDemoDayState;

  // Analytics hooks
  const reportAnalytics = useReportAnalyticsEvent();

  // Page view analytics - triggers only once on mount
  useDemoDayPageViewAnalytics(
    'onActiveViewPageOpened',
    DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_PAGE_OPENED,
    '/demoday/active',
    {
      demoDayTitle: demoDayData?.title,
      demoDayDate: demoDayData?.date,
      demoDayStatus: demoDayData?.status,
      teamsCount: demoDayData?.teamsCount,
      investorsCount: demoDayData?.investorsCount,
    },
  );

  // Time on page tracking
  useTimeOnPage({
    onTimeReport: (timeSpent, sessionId) => {
      if (userInfo?.email) {
        // Custom analytics event
        const timeOnPageEvent: TrackEventDto = {
          name: DEMO_DAY_ANALYTICS.ON_ACTIVE_VIEW_TIME_ON_PAGE,
          distinctId: userInfo.email,
          properties: {
            userId: userInfo.uid,
            userEmail: userInfo.email,
            userName: userInfo.name,
            path: '/demoday/active',
            timestamp: new Date().toISOString(),
            timeSpent: timeSpent,
            eventId: sessionId,
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

      {/* Confidentiality Modal - shows when confidentialityAccepted is false */}
      <ConfidentialityModal isOpen={demoDayData?.confidentialityAccepted === false} />
    </FiltersHydrator>
  );
};
