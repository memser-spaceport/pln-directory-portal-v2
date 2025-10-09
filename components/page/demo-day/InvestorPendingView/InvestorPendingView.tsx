import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { useMember } from '@/services/members/hooks/useMember';
import { InvestorStepper } from './components/InvestorStepper';
import { useDemoDayPageViewAnalytics } from '@/hooks/usePageViewAnalytics';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { TrackEventDto, useReportAnalyticsEvent } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { DEMO_DAY_ANALYTICS } from '@/utils/constants';
import { LandingBase } from '../LandingBase';

export const InvestorPendingView = () => {
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));
  const router = useRouter();
  const { data } = useGetDemoDayState();
  const { data: memberData } = useMember(userInfo?.uid);

  // Analytics hooks
  const { onInvestorPendingViewGoToInvestorProfileButtonClicked } = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();

  // Function to check if investor profile is complete
  const isInvestorProfileComplete = useMemo(() => {
    if (!memberData?.memberInfo?.investorProfile) {
      return false;
    }

    const { investorProfile } = memberData.memberInfo;

    // Check if all required fields are populated
    // const hasInvestmentFocus = investorProfile.investmentFocus && investorProfile.investmentFocus.length > 0;
    const hasTypicalCheckSize = investorProfile.typicalCheckSize && investorProfile.typicalCheckSize > 0;
    // const hasSecRulesAccepted = investorProfile.secRulesAccepted === true;

    if (investorProfile.type === 'ANGEL') {
      return hasTypicalCheckSize;
    }

    if (investorProfile.type === 'ANGEL_AND_FUND') {
      return investorProfile.team && hasTypicalCheckSize;
    }

    return !!investorProfile.team;
  }, [memberData]);

  // Determine current step based on profile completion
  const currentStep = useMemo(() => {
    // Step 1: Invitation accepted (default - user is on the page)
    // Step 2: Complete investor profile (if profile is not complete)
    // Step 3: Demo Day access (if profile is complete)

    if (isInvestorProfileComplete) {
      return 2; // Profile complete, ready for Demo Day
    } else {
      return 1; // Need to complete profile
    }
  }, [isInvestorProfileComplete]);

  // Page view analytics - triggers only once on mount
  useDemoDayPageViewAnalytics(
    'onInvestorPendingViewPageOpened',
    DEMO_DAY_ANALYTICS.ON_INVESTOR_PENDING_VIEW_PAGE_OPENED,
    '/demoday',
    {
      currentStep: currentStep,
      isProfileComplete: isInvestorProfileComplete,
    },
  );

  const handleFillProfile = () => {
    if (!userInfo?.email) {
      return;
    }

    // Report button click analytics
    onInvestorPendingViewGoToInvestorProfileButtonClicked();

    const buttonClickEvent: TrackEventDto = {
      name: DEMO_DAY_ANALYTICS.ON_INVESTOR_PENDING_VIEW_GO_TO_INVESTOR_PROFILE_BUTTON_CLICKED,
      distinctId: userInfo.email,
      properties: {
        userId: userInfo.uid,
        userEmail: userInfo.email,
        userName: userInfo.name,
        path: '/demoday',
        timestamp: new Date().toISOString(),
        currentStep: currentStep,
        targetPath: `/members/${userInfo.uid}`,
      },
    };

    reportAnalytics.mutate(buttonClickEvent);

    router.push(`/members/${userInfo.uid}`);
  };

  return (
    <LandingBase>
      <InvestorStepper currentStep={currentStep} onFillProfile={handleFillProfile} />
    </LandingBase>
  );
};
