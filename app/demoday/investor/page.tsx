'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { InvestorPendingView } from '@/components/page/demo-day/InvestorPendingView';
import { LoadingView } from '@/components/page/demo-day/components/LoadingView';

export default function InvestorPage() {
  const router = useRouter();
  const { data } = useGetDemoDayState();

  useEffect(() => {
    if (data?.access !== 'INVESTOR') {
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

  // If access is not INVESTOR, the useEffect will redirect
  if (data?.access !== 'INVESTOR') {
    return <LoadingView />;
  }

  return <InvestorPendingView />;
}
