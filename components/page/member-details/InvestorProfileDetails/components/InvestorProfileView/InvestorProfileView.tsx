'use client';

import React from 'react';
import { clsx } from 'clsx';
import { IUserInfo } from '@/types/shared.types';
import { EditButton } from '@/components/common/profile/EditButton';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { InvestmentDetailsSection, InvestorPromptBanner, FundTeamCard } from './components';
import { IMember, InvestorProfileType } from '@/types/members.types';

import s from './InvestorProfileView.module.scss';

interface Props {
  isLoggedIn: boolean;
  userInfo: IUserInfo;
  isEditable: boolean;
  showIncomplete: boolean;
  onEdit?: () => void;
  typicalCheckSize: string | undefined;
  investmentFocusAreas: string[] | undefined;
  investInStartupStages: string[] | undefined;
  investInFundTypes: string[] | undefined;
  secRulesAccepted: boolean | undefined;
  isInvestViaFund?: boolean;
  type: InvestorProfileType | undefined;
  member?: IMember;
  hideHeader?: boolean;
  onHideSection?: () => void;
  isInvestor?: boolean | null;
  signUpSource?: string;
}

export const InvestorProfileView = (props: Props) => {
  const {
    typicalCheckSize,
    investmentFocusAreas,
    investInStartupStages,
    investInFundTypes,
    secRulesAccepted,
    isInvestViaFund,
    isLoggedIn,
    isEditable,
    showIncomplete,
    onEdit,
    type,
    member,
    hideHeader,
    onHideSection,
    isInvestor,
    signUpSource,
  } = props;

  const investmentTeams = member?.teams.filter((team) => team.investmentTeam) ?? [];
  const showFundTeams = (type === 'ANGEL_AND_FUND' || type === 'FUND') && investmentTeams.length > 0;
  const showEmptyFundState = type === 'FUND' && !investmentTeams.length;
  const showDirectInvestments = type === 'ANGEL' || type === 'ANGEL_AND_FUND' || !type;
  const showDirectHeader =
    !hideHeader && (!!typicalCheckSize || !!investInStartupStages?.length || !!investmentFocusAreas?.length);

  return (
    <>
      <InvestorPromptBanner
        member={member}
        isInvestor={isInvestor}
        signUpSource={signUpSource}
        isInvestViaFund={isInvestViaFund}
        secRulesAccepted={secRulesAccepted}
        showIncomplete={showIncomplete}
        onEdit={onEdit}
        onHideSection={onHideSection}
      />

      <div
        className={clsx(s.root, {
          [s.missingData]: showIncomplete && isLoggedIn,
        })}
      >
        <DetailsSectionHeader title="Investor Details">
          {isEditable && onEdit && <EditButton onClick={onEdit} />}
        </DetailsSectionHeader>

        <div className={s.content}>
          {showFundTeams && (
            <div className={s.block}>
              <div className={s.blockTitle}>Investment through fund(s)</div>
              {investmentTeams.map((team) => (
                <FundTeamCard key={team.id} team={team} isEditable={isEditable} />
              ))}
            </div>
          )}

          {showEmptyFundState && (
            <div className={s.block}>
              <InvestmentDetailsSection isEditable={isEditable} />
            </div>
          )}

          {showDirectInvestments && (
            <div className={s.block}>
              {showDirectHeader && <div className={s.blockTitle}>Direct Investments</div>}
              <InvestmentDetailsSection
                typicalCheckSize={typicalCheckSize}
                investmentFocusAreas={investmentFocusAreas}
                investInStartupStages={investInStartupStages}
                investInFundTypes={investInFundTypes}
                secRulesAccepted={secRulesAccepted}
                isEditable={isEditable}
                onEdit={onEdit}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
