'use client';

import { FounderPendingView } from '@/components/page/demo-day/FounderPendingView';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { InvestorPendingView } from '@/components/page/demo-day/InvestorPendingView';
import { ActiveView } from '@/components/page/demo-day/ActiveView';

const COMMON_VIEWS: Record<string, ReactNode> = {
  upcoming: <div>LANDING</div>,
  active: <div>LANDING</div>,
};

const FOUNDER_VIEWS: Record<string, ReactNode> = {
  upcoming: <FounderPendingView />,
  active: <ActiveView />,
  completed: <div>STATISTICS</div>,
  // archived: <FounderArchivedView />,
};

const INVESTOR_VIEWS: Record<string, ReactNode> = {
  upcoming: <InvestorPendingView />,
  active: <ActiveView />,
  completed: <div>STATISTICS</div>,
  // archived: <FounderArchivedView />,
};

function DemoDayPage() {
  const router = useRouter();
  const { data } = useGetDemoDayState();

  // ***** access: 'none' & status: 'NONE' - немає сторінки і немає лінки в хедері
  // ***** access: 'none' & status: 'UPCOMING' - лендінг (чекаємо дизайн)
  // ***** access: 'none' & status: 'ACTIVE' - лендінг (чекаємо дизайн)
  // ***** access: 'none' & status: 'COMPLETED' - немає сторінки і немає лінки в хедері
  // ***** access: 'founder' | 'investor' & status: 'NONE' - немає сторінки і немає лінки в хедері
  // ***** access: 'investor' & status: 'UPCOMING' - новий дизайн з степами для інвестора
  // ***** access: 'founder' & status: 'UPCOMING' - все так як зараз але видаляємо відео і картинку для Demo Day зверху
  // ***** access: 'founder' | 'investor' & status: 'ACTIVE' - live demo day сторінка з списком команд
  // ***** access: 'investor' & status: 'COMPLETED' - сторінка статистики по демо дей (чекаємо дизайн)
  // access: 'founder' & status: 'COMPLETED' - сторінка статистики по демо дей (чекаємо дизайн)

  useEffect(() => {
    if (data?.access === 'none' && data?.status === 'NONE') {
      router.replace('/members');
    }

    if (data?.access === 'none' && data?.status === 'COMPLETED') {
      router.replace('/members');
    }

    if ((data?.access === 'FOUNDER' || data?.access === 'INVESTOR') && data?.status === 'NONE') {
      router.replace('/members');
    }
  }, [data?.access, data?.status, router]);

  if (
    !data ||
    (data?.access === 'none' && data?.status === 'NONE') ||
    (data?.access === 'none' && data?.status === 'COMPLETED') ||
    ((data?.access === 'FOUNDER' || data?.access === 'INVESTOR') && data?.status === 'NONE')
  ) {
    return null;
  }

  switch (data?.access) {
    case 'none': {
      return COMMON_VIEWS[data?.status.toLowerCase()];
    }
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
