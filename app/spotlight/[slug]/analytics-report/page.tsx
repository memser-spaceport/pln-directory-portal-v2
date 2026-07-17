'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useGetTeamPitch } from '@/services/team-pitch/hooks/useGetTeamPitch';
import { PitchViewSkeleton } from '@/components/page/pitch/PitchViewSkeleton';
import { getTeamSpotlightPath } from '@/services/team-pitch/constants';

export default function SpotlightAnalyticsReportPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { data, isLoading, isError } = useGetTeamPitch(slug);

  const analyticsReportUrl = data?.teamProfile?.analyticsReportUrl;

  useEffect(() => {
    if (isLoading || !slug) return;
    if (isError || !analyticsReportUrl) {
      router.replace(getTeamSpotlightPath(slug));
    }
  }, [analyticsReportUrl, isLoading, isError, router, slug]);

  if (isLoading) {
    return <PitchViewSkeleton />;
  }

  if (!analyticsReportUrl) {
    return null;
  }

  return (
    <div>
      <div style={{ height: 'calc(100vh - 85px)' }}>
        <iframe
          src={analyticsReportUrl}
          title="Spotlight Analytics Report"
          style={{ border: 'none', width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
