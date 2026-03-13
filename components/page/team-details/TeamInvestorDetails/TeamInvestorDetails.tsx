'use client';

import React, { useState } from 'react';

import { ITeam } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';

import { formatUSD } from '@/utils/formatUSD';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';

import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
} from '@/components/common/profile/DetailsSection';
import { EditButton } from '@/components/common/profile/EditButton';
import { InvestorProfileField } from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView/components';

import { isTeamLeaderOrAdmin } from '../utils/isTeamLeaderOrAdmin';

import { EditTeamInvestorDetailsForm } from './components/EditTeamInvestorDetailsForm';

import { getValueFromArray } from './utils/getValueFromArray';

import s from './TeamInvestorDetails.module.scss';

interface Props {
  team: ITeam;
  userInfo: IUserInfo;
  isLoggedIn: boolean;
}

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.5 8C13.5 8.13261 13.4473 8.25979 13.3536 8.35355C13.2598 8.44732 13.1326 8.5 13 8.5H8.5V13C8.5 13.1326 8.44732 13.2598 8.35355 13.3536C8.25979 13.4473 8.13261 13.5 8 13.5C7.86739 13.5 7.74021 13.4473 7.64645 13.3536C7.55268 13.2598 7.5 13.1326 7.5 13V8.5H3C2.86739 8.5 2.74021 8.44732 2.64645 8.35355C2.55268 8.25979 2.5 8.13261 2.5 8C2.5 7.86739 2.55268 7.74021 2.64645 7.64645C2.74021 7.55268 2.86739 7.5 3 7.5H7.5V3C7.5 2.86739 7.55268 2.74021 7.64645 2.64645C7.74021 2.55268 7.86739 2.5 8 2.5C8.13261 2.5 8.25979 2.55268 8.35355 2.64645C8.44732 2.74021 8.5 2.86739 8.5 3V7.5H13C13.1326 7.5 13.2598 7.55268 13.3536 7.64645C13.4473 7.74021 13.5 7.86739 13.5 8Z"
      fill="currentColor"
    />
  </svg>
);

export function TeamInvestorDetails(props: Props) {
  const { team, userInfo, isLoggedIn } = props;
  const [editView, setEditView] = useState(false);

  const hasEditAccess = isTeamLeaderOrAdmin(userInfo, team?.id);
  const { investmentFocus, typicalCheckSize, investInFundTypes, investInStartupStages } = team?.investorProfile || {};

  useMobileNavVisibility(editView);

  if (!isLoggedIn) {
    return null;
  }

  const onEditFundDetailsClickHandler = () => {
    if (!hasEditAccess) return;
    setEditView(true);
  };

  const emptyFieldContent = (label: string) =>
    hasEditAccess ? (
      <button type="button" className={s.addPill} onClick={onEditFundDetailsClickHandler}>
        <PlusIcon />
        <span>{label}</span>
      </button>
    ) : (
      '-'
    );

  if (editView) {
    return (
      <DetailsSection editView>
        <EditTeamInvestorDetailsForm team={team} onClose={() => setEditView(false)} />
      </DetailsSection>
    );
  }

  return (
    <DetailsSection>
      <DetailsSectionHeader title="Fund Details">
        {hasEditAccess && <EditButton onClick={() => setEditView(true)} />}
      </DetailsSectionHeader>
      <DetailsSectionGreyContentContainer className={s.content}>
        <InvestorProfileField label="Fund Type(s)">
          {investInFundTypes?.length ? getValueFromArray(investInFundTypes) : emptyFieldContent('Add fund types')}
        </InvestorProfileField>

        <InvestorProfileField label="Typical Check Size">
          {typicalCheckSize ? formatUSD.format(+(typicalCheckSize ?? 0)) : emptyFieldContent('Add typical check size')}
        </InvestorProfileField>

        <InvestorProfileField label="Startup Stages">
          {investInStartupStages?.length ? getValueFromArray(investInStartupStages) : emptyFieldContent('Add startup stages')}
        </InvestorProfileField>

        <InvestorProfileField label="Investment Focus">
          {investmentFocus?.length ? getValueFromArray(investmentFocus) : emptyFieldContent('Add investment focus')}
        </InvestorProfileField>
      </DetailsSectionGreyContentContainer>
    </DetailsSection>
  );
}
