'use client';

import React, { useEffect } from 'react';
import { redirect } from 'next/navigation';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';
import { ADMIN_ROLE } from '@/utils/constants';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { SyncParamsToUrl } from '@/components/core/SyncParamsToUrl';
import { FiltersHydrator } from '@/components/core/FiltersHydrator/FiltersHydrator';
import { AdminFilters } from '@/components/page/demo-day/AdminView/components/AdminFilters';
import { AdminContent } from '@/components/page/demo-day/AdminView/components/AdminContent';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';

function DemoDayPrepPage({ params }: { params: { demoDayId: string } }) {
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));
  const isDirectoryAdmin = userInfo?.roles?.includes(ADMIN_ROLE);
  const { data } = useGetDemoDayState();

  // User has admin access if they are a directory admin OR a demo day admin (with correct host scope)
  const hasAdminAccess = isDirectoryAdmin || data?.isDemoDayAdmin;

  // User can view the prep page if they have admin access OR are a founder
  const hasAccess =
    data?.status === 'COMPLETED' ? isDirectoryAdmin : hasAdminAccess || data?.access === 'FOUNDER';

  useEffect(() => {
    // Redirect non-admins to regular demo day page
    if (!hasAccess && data) {
      redirect(`/demoday/${params.demoDayId}`);
    }
  }, [hasAccess, data, params?.demoDayId]);

  // Don't render anything for non-admins while redirecting
  if (!hasAccess) {
    return null;
  }

  return (
    <FiltersHydrator>
      <SyncParamsToUrl debounceTime={0} />
      <DashboardPagesLayout
        filters={<AdminFilters />}
        content={<AdminContent isDirectoryAdmin={!!hasAdminAccess} />}
      />
    </FiltersHydrator>
  );
}

export default DemoDayPrepPage;
