'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { FounderPendingView } from '@/components/page/demo-day/FounderPendingView';
import { LoadingView } from '@/components/page/demo-day/components/LoadingView';

export default function FounderPage() {
  const router = useRouter();
  const { data } = useGetDemoDayState();

  useEffect(() => {
    if (data?.access !== 'FOUNDER') {
      router.replace('/demoday');
      return;
    }

    if (data?.status === 'NONE' || data?.status === 'COMPLETED') {
      router.replace('/demoday');
      return;
    }
  }, [data?.access, data?.status, router]);

  // Show loading state while checking access
  if (!data) {
    return <LoadingView />;
  }

  // If access is not FOUNDER, the useEffect will redirect
  if (data?.access !== 'FOUNDER') {
    return <LoadingView />;
  }

  return <FounderPendingView />;
}
