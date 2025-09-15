'use client';

import { FounderPendingView } from '@/components/page/demo-day/FounderPendingView';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { FounderActiveView } from '@/components/page/demo-day/FounderActiveView';
import { InvestorPendingView } from '@/components/page/demo-day/InvestorPendingView';
import { InvestorActiveView } from '@/components/page/demo-day/InvestorActiveView';
import { IUserInfo } from '@/types/shared.types';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';

const FOUNDER_VIEWS: Record<string, ReactNode> = {
  pending: <FounderPendingView />,
  active: <FounderActiveView />,
  // completed: <FounderCompletedView />,
  // archived: <FounderArchivedView />,
};

const INVESTOR_VIEWS: Record<string, ReactNode> = {
  pending: <InvestorPendingView />,
  active: <InvestorActiveView />,
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
    if (data?.access === 'NONE') {
      router.replace('/members');
    }
  }, [data?.access, router]);

  if (data?.access === 'NONE' || !data) {
    return null;
  }

  switch (data?.access) {
    case 'FOUNDER': {
      return FOUNDER_VIEWS[data?.status];
    }
    case 'INVESTOR': {
      return INVESTOR_VIEWS[data.status];
    }
    default: {
      return null;
    }
  }
}

export default DemoDayPage;
