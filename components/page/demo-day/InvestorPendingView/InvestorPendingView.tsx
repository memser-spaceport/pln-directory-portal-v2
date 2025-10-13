import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { useMember } from '@/services/members/hooks/useMember';
import { useGetEngagement } from '@/services/demo-day/hooks/useGetEngagement';
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
  const { data: engagementData } = useGetEngagement();

  // Analytics hooks
  const { onInvestorPendingViewGoToInvestorProfileButtonClicked, onInvestorPendingViewAddToCalendarButtonClicked } =
    useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();

  // Function to check if investor profile is complete
  const isInvestorProfileComplete = useMemo(() => {
    if (!memberData?.memberInfo?.investorProfile) {
      return false;
    }

    const { investorProfile, teamMemberRoles } = memberData.memberInfo;
    const investmentTeams = teamMemberRoles?.filter((tmr: { investmentTeam: boolean }) => tmr.investmentTeam) ?? [];

    // Check if all required fields are populated
    // const hasInvestmentFocus = investorProfile.investmentFocus && investorProfile.investmentFocus.length > 0;
    const hasTypicalCheckSize = investorProfile.typicalCheckSize && investorProfile.typicalCheckSize > 0;
    // const hasSecRulesAccepted = investorProfile.secRulesAccepted === true;

    if (investorProfile.type === 'ANGEL') {
      return hasTypicalCheckSize;
    }

    if (investorProfile.type === 'ANGEL_AND_FUND') {
      return investmentTeams.length > 0 && hasTypicalCheckSize;
    }

    return !!investmentTeams.length;
  }, [memberData]);

  // Determine current step based on profile completion and calendar added
  const currentStep = useMemo(() => {
    // Step 0: Invitation accepted (default - user is on the page)
    // Step 1: Complete investor profile (if profile is not complete)
    // Step 2: Add to calendar (if profile is complete but calendar not added)
    // Step 3: Demo Day access (if profile is complete and calendar added)

    if (!isInvestorProfileComplete) {
      return 1; // Need to complete profile
    }

    if (isInvestorProfileComplete && !engagementData?.calendarAdded) {
      return 2; // Profile complete, need to add to calendar
    }

    return 3; // Profile complete and calendar added, ready for Demo Day
  }, [isInvestorProfileComplete, engagementData?.calendarAdded]);

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

    // Open in new tab
    window.open(`/members/${userInfo.uid}`, '_blank');
  };

  const handleAddToCalendar = () => {
    if (!userInfo?.email) {
      return;
    }

    // Report button click analytics
    onInvestorPendingViewAddToCalendarButtonClicked();

    const buttonClickEvent: TrackEventDto = {
      name: DEMO_DAY_ANALYTICS.ON_INVESTOR_PENDING_VIEW_ADD_TO_CALENDAR_BUTTON_CLICKED,
      distinctId: userInfo.email,
      properties: {
        userId: userInfo.uid,
        userEmail: userInfo.email,
        userName: userInfo.name,
        path: '/demoday',
        timestamp: new Date().toISOString(),
        currentStep: currentStep,
      },
    };

    reportAnalytics.mutate(buttonClickEvent);
  };

  return (
    <LandingBase>
      <InvestorStepper
        currentStep={currentStep}
        onFillProfile={handleFillProfile}
        onAddToCalendar={handleAddToCalendar}
      />
    </LandingBase>
  );
};
