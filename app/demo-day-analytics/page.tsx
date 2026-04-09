'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetDemoDayReportLink } from '@/services/demo-day/hooks/useGetDemoDayReportLink';
import { DemoDayPageSkeleton } from '@/components/page/demo-day/DemoDayPageSkeleton';

export default function DemoDayAnalyticsPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useGetDemoDayReportLink();

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
      <iframe
        src={data.url}
        title="Demo Day Analytics"
        style={{ border: 'none', width: '100%', height: '100%' }}
      />
    </div>
  );
}
