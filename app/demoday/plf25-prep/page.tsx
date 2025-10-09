'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';
import { ADMIN_ROLE } from '@/utils/constants';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { SyncParamsToUrl } from '@/components/core/SyncParamsToUrl';
import { FiltersHydrator } from '@/components/core/FiltersHydrator/FiltersHydrator';
import { Filters } from '@/components/page/demo-day/ActiveView/components/Filters';
import { AdminContent } from '@/components/page/demo-day/AdminView/components/AdminContent';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';

function DemoDayPrepPage() {
  const router = useRouter();
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));
  const isDirectoryAdmin = userInfo?.roles?.includes(ADMIN_ROLE);
  const { data } = useGetDemoDayState();
  const hasAccess = isDirectoryAdmin || data?.isDemoDayAdmin || data?.access === 'FOUNDER';

  useEffect(() => {
    // Redirect non-admins to regular demo day page
    if (!hasAccess) {
      router.replace('/demoday');
    }
  }, [hasAccess]);

  // Don't render anything for non-admins while redirecting
  if (!hasAccess) {
    return null;
  }

  return (
    <FiltersHydrator>
      <SyncParamsToUrl debounceTime={0} />
      <DashboardPagesLayout filters={<Filters />} content={<AdminContent isDirectoryAdmin={!!isDirectoryAdmin} />} />
    </FiltersHydrator>
  );
}

export default DemoDayPrepPage;
