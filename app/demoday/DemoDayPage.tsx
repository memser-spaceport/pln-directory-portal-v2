'use client';

import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo } from 'react';
import { Landing } from '@/components/page/demo-day/Landing';
import { useMember } from '@/services/members/hooks/useMember';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';
import { LoadingView } from '@/components/page/demo-day/components/LoadingView';

const COMMON_VIEWS: Record<string, ReactNode> = {
  upcoming: <Landing />,
  active: <Landing />,
};

export function DemoDayPage() {
  const router = useRouter();
  const { data } = useGetDemoDayState();
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));
  const { data: memberData } = useMember(userInfo?.uid);

  const isInvestorProfileComplete = useMemo(() => {
    if (!memberData?.memberInfo?.investorProfile) {
      return false;
    }

    const { investorProfile, teamMemberRoles } = memberData.memberInfo;
    const investmentTeams = teamMemberRoles?.filter((tmr: { investmentTeam: boolean }) => tmr.investmentTeam) ?? [];

    const hasTypicalCheckSize = investorProfile.typicalCheckSize && investorProfile.typicalCheckSize > 0;

    if (investorProfile.type === 'ANGEL') {
      return hasTypicalCheckSize;
    }

    if (investorProfile.type === 'ANGEL_AND_FUND') {
      return investmentTeams.length > 0 && hasTypicalCheckSize;
    }

    return !!investmentTeams.length;
  }, [memberData]);

  const redirectLogic = useMemo(() => {
    // Conditions that should redirect to /members
    if (data?.access === 'none' && data?.status === 'NONE') {
      return { isRedirect: true, redirectTo: '/members' };
    }

    if (data?.access === 'none' && data?.status === 'COMPLETED') {
      return { isRedirect: true, redirectTo: '/members' };
    }

    if ((data?.access === 'FOUNDER' || data?.access === 'INVESTOR') && data?.status === 'NONE') {
      return { isRedirect: true, redirectTo: '/members' };
    }

    // Conditions that should redirect to specific routes
    if (data?.access === 'none') {
      // Show landing page - no redirect
      return { isRedirect: false, redirectTo: null };
    }

    if (data?.access === 'FOUNDER' && data?.status === 'UPCOMING') {
      return { isRedirect: true, redirectTo: '/demoday/founder' };
    }

    if (data?.access === 'INVESTOR' && data?.status === 'UPCOMING') {
      return { isRedirect: true, redirectTo: '/demoday/investor' };
    }

    if (data?.access === 'FOUNDER' && data?.status === 'ACTIVE') {
      return { isRedirect: true, redirectTo: '/demoday/active' };
    }

    if (data?.access === 'INVESTOR' && data?.status === 'ACTIVE') {
      if (isInvestorProfileComplete) {
        return { isRedirect: true, redirectTo: '/demoday/active' };
      } else {
        return { isRedirect: true, redirectTo: '/demoday/investor' };
      }
    }

    return { isRedirect: false, redirectTo: null };
  }, [data?.access, data?.status, isInvestorProfileComplete]);

  useEffect(() => {
    if (redirectLogic.isRedirect && redirectLogic.redirectTo) {
      router.replace(redirectLogic.redirectTo);
    }
  }, [redirectLogic, router]);

  if (!data || redirectLogic.isRedirect) {
    return <LoadingView />;
  }

  return COMMON_VIEWS[data?.status.toLowerCase()];
}
