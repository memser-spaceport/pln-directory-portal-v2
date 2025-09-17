'use client';

import { FounderPendingView } from '@/components/page/demo-day/FounderPendingView';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { InvestorPendingView } from '@/components/page/demo-day/InvestorPendingView';
import { ActiveView } from '@/components/page/demo-day/ActiveView';

const FOUNDER_VIEWS: Record<string, ReactNode> = {
  upcoming: <FounderPendingView />,
  active: <ActiveView />,
  // completed: <FounderCompletedView />,
  // archived: <FounderArchivedView />,
};

const INVESTOR_VIEWS: Record<string, ReactNode> = {
  upcoming: <InvestorPendingView />,
  active: <ActiveView />,
  // completed: <FounderCompletedView />,
  // archived: <FounderArchivedView />,
};

function DemoDayPage() {
  const router = useRouter();
  const { data } = useGetDemoDayState();

  useEffect(() => {
    if (data?.access === 'NONE') {
      router.replace('/members');
    }
  }, [data?.access, router]);

  if (data?.access === 'NONE' || !data) {
    return null;
  }

  switch (data?.access) {
    case 'FOUNDER': {
      return FOUNDER_VIEWS[data?.status.toLowerCase()];
    }
    case 'INVESTOR': {
      return INVESTOR_VIEWS[data.status.toLowerCase()];
    }
    default: {
      return null;
    }
  }
}

export default DemoDayPage;
