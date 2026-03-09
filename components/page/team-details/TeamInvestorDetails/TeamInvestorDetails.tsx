import React from 'react';

import { ITeam } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';

import { formatUSD } from '@/utils/formatUSD';

import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
} from '@/components/common/profile/DetailsSection';
import { InvestorProfileField } from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView/components';

import { getValueFromArray } from './utils/getValueFromArray';

import s from './TeamInvestorDetails.module.scss';

interface Props {
  team: ITeam;
  userInfo: IUserInfo;
  isLoggedIn: boolean;
}

export function TeamInvestorDetails(props: Props) {
  const { team } = props;

  const { investmentFocus, typicalCheckSize, investInFundTypes, investInStartupStages } = team?.investorProfile || {};

  return (
    <DetailsSection>
      <DetailsSectionHeader title="Fund Details" />
      <DetailsSectionGreyContentContainer className={s.content}>
        <InvestorProfileField label="Fund Type(s)">{getValueFromArray(investInFundTypes)}</InvestorProfileField>

        <InvestorProfileField label="Typical Check Size">
          {!!typicalCheckSize ? formatUSD.format(+(typicalCheckSize ?? 0)) : '-'}
        </InvestorProfileField>

        <InvestorProfileField label="Startup Stages">{getValueFromArray(investInStartupStages)}</InvestorProfileField>

        <InvestorProfileField label="Investment  Focus">{getValueFromArray(investmentFocus)}</InvestorProfileField>
      </DetailsSectionGreyContentContainer>
    </DetailsSection>
  );
}
