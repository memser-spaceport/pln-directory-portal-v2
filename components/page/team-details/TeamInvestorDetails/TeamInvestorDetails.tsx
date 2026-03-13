'use client';

import React, { useState } from 'react';
import { Tag } from '@/components/ui/Tag';

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

export function TeamInvestorDetails(props: Props) {
  const { team, userInfo, isLoggedIn } = props;
  const [editView, setEditView] = useState(false);

  const hasEditAccess = isTeamLeaderOrAdmin(userInfo, team?.id);
  const { investmentFocus, typicalCheckSize, investInFundTypes, investInStartupStages } = team?.investorProfile || {};
  const hasInvestorData =
    !!investmentFocus?.length || !!typicalCheckSize || !!investInFundTypes?.length || !!investInStartupStages?.length;

  useMobileNavVisibility(editView);

  if (!isLoggedIn) {
    return null;
  }

  const onEditFundDetailsClickHandler = () => {
    if (!hasEditAccess) return;
    setEditView(true);
  };

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
        {hasInvestorData ? (
          <>
            <InvestorProfileField label="Fund Type(s)">{getValueFromArray(investInFundTypes)}</InvestorProfileField>

            <InvestorProfileField label="Typical Check Size">
              {!!typicalCheckSize ? formatUSD.format(+(typicalCheckSize ?? 0)) : '-'}
            </InvestorProfileField>

            <InvestorProfileField label="Startup Stages">
              {getValueFromArray(investInStartupStages)}
            </InvestorProfileField>

            <InvestorProfileField label="Investment  Focus">{getValueFromArray(investmentFocus)}</InvestorProfileField>
          </>
        ) : (
          <Tag
            value={hasEditAccess ? 'Fund Details +' : 'Fund Details not provided'}
            className={s.emptyTag}
            callback={hasEditAccess ? onEditFundDetailsClickHandler : undefined}
          />
        )}
      </DetailsSectionGreyContentContainer>
    </DetailsSection>
  );
}
