'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { ActiveView } from '@/components/page/demo-day/ActiveView';
import { LoadingView } from '@/components/page/demo-day/components/LoadingView';

export default function ActivePage() {
  const router = useRouter();
  const { data } = useGetDemoDayState();

  useEffect(() => {
    if (data?.access === 'none' || data?.status !== 'ACTIVE') {
      router.replace('/demoday');
      return;
    }
  }, [data?.access, data?.status, router]);

  if (!data) {
    return <LoadingView />;
  }

  if (data?.access === 'none' || data?.status !== 'ACTIVE') {
    return <LoadingView />;
  }

  return <ActiveView />;
}
