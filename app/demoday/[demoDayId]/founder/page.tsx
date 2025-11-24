'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { FounderPendingView } from '@/components/page/demo-day/FounderPendingView';

export default function FounderPage({ params }: { params: { demoDayId: string } }) {
  const router = useRouter();
  const { data } = useGetDemoDayState();

  useEffect(() => {
    if (data?.access !== 'FOUNDER') {
      router.replace(`/demoday/${params?.demoDayId}`);
      return;
    }

    if (data?.status === 'NONE' || data?.status === 'COMPLETED') {
      router.replace(`/demoday/${params?.demoDayId}`);
      return;
    }
  }, [data?.access, data?.status, router, params?.demoDayId]);

  // Show loading state while checking access
  if (!data) {
    return null;
  }

  // If access is not FOUNDER, the useEffect will redirect
  if (data?.access !== 'FOUNDER') {
    return null;
  }

  return <FounderPendingView />;
}
