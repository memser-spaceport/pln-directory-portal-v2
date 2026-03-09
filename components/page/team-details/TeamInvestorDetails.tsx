import React from 'react';

import { ITeam } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';

import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { InvestorProfileView } from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView';

interface Props {
  team: ITeam;
  userInfo: IUserInfo;
  isLoggedIn: boolean;
}

export function TeamInvestorDetails(props: Props) {
  const { team, userInfo, isLoggedIn } = props;

  return (
    <DetailsSection>
      <InvestorProfileView
        investmentFocusAreas={team?.investorProfile?.investmentFocus}
        typicalCheckSize={team?.investorProfile?.typicalCheckSize}
        isLoggedIn={isLoggedIn}
        userInfo={userInfo}
        isEditable={false}
        showIncomplete={false}
        secRulesAccepted
        investInStartupStages={team?.investorProfile?.investInStartupStages}
        investInFundTypes={team?.investorProfile?.investInFundTypes}
        type="ANGEL"
        hideHeader
      />
    </DetailsSection>
  );
}
