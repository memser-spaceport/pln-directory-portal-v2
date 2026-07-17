'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useGetTeamPitch } from '@/services/team-pitch/hooks/useGetTeamPitch';
import { PitchViewSkeleton } from '@/components/page/pitch/PitchViewSkeleton';
import { getTeamSpotlightPath } from '@/services/team-pitch/constants';
import { useCurrentUserStore } from '@/services/auth/store';

export default function SpotlightAnalyticsReportPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { currentUser, isHydrated } = useCurrentUserStore();
  const canFetch = isHydrated && !!currentUser?.uid;
  const { data, isLoading, isError, isFetched } = useGetTeamPitch(slug, canFetch);

  const analyticsReportUrl = data?.teamProfile?.analyticsReportUrl;
  const isWaiting = !isHydrated || (canFetch && (isLoading || !isFetched));

  useEffect(() => {
    if (!slug || isWaiting) return;

    if (!currentUser?.uid || isError || !analyticsReportUrl) {
      router.replace(getTeamSpotlightPath(slug));
    }
  }, [analyticsReportUrl, canFetch, currentUser?.uid, isError, isWaiting, router, slug]);

  if (isWaiting) {
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
