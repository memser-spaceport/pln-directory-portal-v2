'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useGetDemoDayReportLink } from '@/services/demo-day/hooks/useGetDemoDayReportLink';
import { DemoDayPageSkeleton } from '@/components/page/demo-day/DemoDayPageSkeleton';
import { useDemoDayPageViewAnalytics } from '@/hooks/usePageViewAnalytics';
import { useDemoDayPageLeaveAnalytics } from '@/hooks/usePageLeaveAnalytics';
import { useTimeOnPage } from '@/hooks/useTimeOnPage';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';

const PATH = '/demo-day-analytics';

export default function DemoDayAnalyticsPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useGetDemoDayReportLink();
  const userInfo = getParsedValue(Cookies.get('userInfo'));
  const reportAnalytics = useReportAnalyticsEvent();

  const analyticsReady = !isLoading && !!data?.url;
  const pageOpenedProps = useMemo(() => ({ reportUrl: data?.url }), [data?.url]);

  useDemoDayPageViewAnalytics(
    'onDemoDayAnalyticsPageOpened',
    DEMO_DAY_ANALYTICS.ON_DEMO_DAY_ANALYTICS_PAGE_OPENED,
    PATH,
    pageOpenedProps,
    { skip: !analyticsReady },
  );

  useDemoDayPageLeaveAnalytics(
    'onDemoDayAnalyticsPageLeft',
    DEMO_DAY_ANALYTICS.ON_DEMO_DAY_ANALYTICS_PAGE_LEFT,
    PATH,
    pageOpenedProps,
    { skip: !analyticsReady },
  );

  const onTimeReport = useCallback(
    (timeSpent: number, sessionId: string) => {
      if (!userInfo?.email) return;
      const timeOnPageEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_DEMO_DAY_ANALYTICS_TIME_ON_PAGE,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: PATH,
          timestamp: new Date().toISOString(),
          timeSpent,
          eventId: sessionId,
          reportUrl: data?.url,
        },
      };
      reportAnalytics.mutate(timeOnPageEvent);
    },
    [userInfo, reportAnalytics, data?.url],
  );

  useTimeOnPage({
    onTimeReport,
    reportInterval: 30000,
    enabled: analyticsReady && !!userInfo?.email,
  });

  useEffect(() => {
    if (isLoading) return;
    if (isError || !data?.url) {
      router.replace('/demoday');
    }
  }, [data, isLoading, isError, router]);

  if (isLoading) {
    return <DemoDayPageSkeleton />;
  }

  if (!data?.url) {
    return null;
  }

  return (
    <div style={{ height: 'calc(100vh - 85px)' }}>
      <iframe src={data.url} title="Demo Day Analytics" style={{ border: 'none', width: '100%', height: '100%' }} />
    </div>
  );
}
