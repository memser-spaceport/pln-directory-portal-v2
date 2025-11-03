'use client';

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { IMember, InvestorProfileType } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { ADMIN_ROLE, DEMO_DAY_ANALYTICS } from '@/utils/constants';
import { EditInvestorProfileForm } from '@/components/page/member-details/InvestorProfileDetails/components/EditInvestorProfileForm';
import { InvestorProfileView } from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import { ITeam } from '@/types/teams.types';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';

import s from './InvestorProfileDetails.module.scss';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
  showInvestorProfileOnMemberPage?: boolean;
}

/**
 * Determines if we need to show incomplete data warning
 * Only shows warning if showInvestorProfileOnMemberPage is null (not set)
 */
const shouldShowIncompleteDataWarning = (showInvestorProfileOnMemberPage?: boolean): boolean => {
  // Show warning only if the setting is null/undefined (not set yet)
  return showInvestorProfileOnMemberPage === null || showInvestorProfileOnMemberPage === undefined;
};

export const InvestorProfileDetails = ({
  isLoggedIn,
  userInfo,
  member,
  showInvestorProfileOnMemberPage,
}: Props) => {
  const [editView, setEditView] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const isAdmin = !!(userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE));
  const isOwner = userInfo?.uid === member.id;
  const isEditable = isOwner || isAdmin;

  // Analytics hooks
  const { onInvestorProfileEditStarted } = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();

  // Use the new function to determine if we should show incomplete data warning
  const showWarningUseCaseA = shouldShowIncompleteDataWarning(showInvestorProfileOnMemberPage);
  const showIncomplete = !editView && isOwner && showWarningUseCaseA;

  // Determine if user has any investor profile data for visibility logic
  const hasInvestorProfile = !!member?.investorProfile?.type;

  useMobileNavVisibility(editView);

  // Handle edit mode start
  const handleEditStart = () => {
    if (userInfo?.email) {
      // PostHog analytics
      onInvestorProfileEditStarted();

      // Custom analytics event
      const editStartedEvent: TrackEventDto = {
        name: DEMO_DAY_ANALYTICS.ON_INVESTOR_PROFILE_EDIT_STARTED,
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: `/members/${member.id}`,
          timestamp: new Date().toISOString(),
          currentInvestorProfileType: member?.investorProfile?.type || null,
          isProfileComplete: !shouldShowIncompleteDataWarning(showInvestorProfileOnMemberPage),
        },
      };

      reportAnalytics.mutate(editStartedEvent);
    }

    setEditView(true);
  };

  if (!isLoggedIn) {
    return null;
  }

  // user view, we hide section if no investor profile
  if (!isEditable && !hasInvestorProfile) {
    return null;
  }

  // Hide section if user clicked "Not an Investor"
  if (isHidden) {
    return null;
  }

  return (
    <div
      className={clsx(s.root, {
        [s.editView]: editView,
        [s.missingData]: showIncomplete,
      })}
    >
      {editView ? (
        <EditInvestorProfileForm onClose={() => setEditView(false)} member={member} userInfo={userInfo} />
      ) : (
        <InvestorProfileView
          investmentFocusAreas={member?.investorProfile?.investmentFocus}
          typicalCheckSize={member?.investorProfile?.typicalCheckSize}
          investInStartupStages={member?.investorProfile?.investInStartupStages}
          investInFundTypes={member?.investorProfile?.investInFundTypes}
          secRulesAccepted={member?.investorProfile?.secRulesAccepted}
          isLoggedIn={isLoggedIn}
          userInfo={userInfo}
          isEditable={isEditable}
          showIncomplete={showIncomplete}
          onEdit={handleEditStart}
          type={member.investorProfile?.type}
          member={member}
          onHideSection={() => setIsHidden(true)}
        />
      )}
    </div>
  );
};
