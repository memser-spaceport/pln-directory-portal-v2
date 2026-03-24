'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useGetTeamFundraisingProfile } from '@/services/demo-day/hooks/useGetTeamFundraisingProfile';
import { useGetTeamsList } from '@/services/demo-day/hooks/useGetTeamsList';
import { DemoDayPageSkeleton } from '@/components/page/demo-day/DemoDayPageSkeleton';
import { useDemoDayPageViewAnalytics } from '@/hooks/usePageViewAnalytics';
import { useTimeOnPage } from '@/hooks/useTimeOnPage';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';

export default function AnalyticsReportPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useGetTeamFundraisingProfile();
  const { data: teamsList, isLoading: isTeamsListLoading } = useGetTeamsList();
  const params = useParams();
  const demoDayId = params?.demoDayId as string;
  const teamUid = params?.teamUid as string;
  const userInfo = getParsedValue(Cookies.get('userInfo'));
  const reportAnalytics = useReportAnalyticsEvent();

  const path = `/demoday/${demoDayId}/analytics-report/${teamUid}`;

  const teamName = useMemo(() => {
    if (!teamsList?.length || !teamUid) return undefined;
    const profile = teamsList.find((p) => p.teamUid === teamUid || p.team?.uid === teamUid);
    return profile?.team?.name;
  }, [teamsList, teamUid]);

  const analyticsReportPageOpenedProps = useMemo(
    () => ({
      demoDayId,
      teamUid,
      teamName,
    }),
    [demoDayId, teamUid, teamName],
  );

  useDemoDayPageViewAnalytics(
    'onAnalyticsReportPageOpened',
    DEMO_DAY_ANALYTICS.ON_ANALYTICS_REPORT_PAGE_OPENED,
    path,
    analyticsReportPageOpenedProps,
    { skip: isTeamsListLoading },
  );

  useTimeOnPage({
    onTimeReport: (timeSpent, sessionId) => {
      if (userInfo?.email) {
        const event: TrackEventDto = {
          name: DEMO_DAY_ANALYTICS.ON_ANALYTICS_REPORT_TIME_ON_PAGE,
          distinctId: userInfo.email,
          properties: {
            userId: userInfo.uid,
            userEmail: userInfo.email,
            userName: userInfo.name,
            path,
            timestamp: new Date().toISOString(),
            timeSpent,
            eventId: sessionId,
            demoDayId,
            teamUid,
          },
        };
        reportAnalytics.mutate(event);
      }
    },
    reportInterval: 30000,
  });

  useEffect(() => {
    if (isLoading || !demoDayId) return;
    if (isError || !data?.analyticsReportUrl) {
      router.replace(`/demoday/${demoDayId}`);
    }
  }, [data, isLoading, isError, router, demoDayId]);

  if (isLoading) {
    return <DemoDayPageSkeleton />;
  }

  if (!data?.analyticsReportUrl) {
    return null;
  }

  return (
    <div>
      <div style={{ height: 'calc(100vh - 85px)' }}>
        <iframe
          src={data.analyticsReportUrl}
          title="Demo Day Analytics Report"
          style={{ border: 'none', width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
