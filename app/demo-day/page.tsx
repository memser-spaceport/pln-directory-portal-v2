'use client';

import { FounderPendingView } from '@/components/page/demo-day/FounderPendingView';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { FounderActiveView } from '@/components/page/demo-day/FounderActiveView';

const FOUNDER_VIEWS: Record<string, ReactNode> = {
  pending: <FounderPendingView />,
  active: <FounderActiveView />,
  // completed: <FounderCompletedView />,
  // archived: <FounderArchivedView />,
};

const INVESTOR_VIEWS: Record<string, ReactNode> = {
  pending: <FounderPendingView />,
  active: <FounderActiveView />,
  // completed: <FounderCompletedView />,
  // archived: <FounderArchivedView />,
};

function DemoDayPage() {
  const router = useRouter();
  const { data } = useGetDemoDayState();

  // get info from BE:
  // access: none | founder | investor
  // date: string;
  // description: string;
  // title: string;
  // uid: string;
  // status: pending | active | completed | archived;
  //

  // based on status + access => differnet views

  useEffect(() => {
    if (data?.access === 'none') {
      router.replace('/members');
    }
  }, [data?.access, router]);

  if (data?.access === 'none' || !data) {
    return null;
  }

  switch (data?.access) {
    case 'founder': {
      return FOUNDER_VIEWS[data?.status];
    }
    case 'investor': {
      return INVESTOR_VIEWS[data.status];
    }
    default: {
      return null;
    }
  }
}

export default DemoDayPage;
