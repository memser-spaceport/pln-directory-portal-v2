'use client';

import type { ITeam } from '@/types/teams.types';

import { formatUSD } from '@/utils/formatUSD';

import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
} from '@/components/common/profile/DetailsSection';
import { InvestorProfileField } from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView/components';

import { getValueFromArray } from '@/components/page/team-details/TeamInvestorDetails/utils/getValueFromArray';

import s from '@/components/page/team-details/TeamInvestorDetails/TeamInvestorDetails.module.scss';

interface Props {
  team: ITeam;
}

/**
 * COPY-SIMPLIFY of production `TeamInvestorDetails`.
 * Production reads `useCurrentUserStore` + `useMobileNavVisibility` and renders
 * edit affordances + an empty-state "add" pill for leads. We hardcode the
 * read-only logged-in view, importing the clean `InvestorProfileField` leaf and
 * the production scss.
 */
export function TeamInvestorView({ team }: Props) {
  const { investmentFocus, typicalCheckSize, investInFundTypes, investInStartupStages } =
    team?.investorProfile || {};

  return (
    <DetailsSection>
      <DetailsSectionHeader title="Fund Details" />
      <DetailsSectionGreyContentContainer className={s.content}>
        <InvestorProfileField label="Fund Type(s)">
          {investInFundTypes?.length ? getValueFromArray(investInFundTypes) : '-'}
        </InvestorProfileField>

        <InvestorProfileField label="Typical Check Size">
          {typicalCheckSize ? formatUSD.format(+(typicalCheckSize ?? 0)) : '-'}
        </InvestorProfileField>

        <InvestorProfileField label="Startup Stages">
          {investInStartupStages?.length ? getValueFromArray(investInStartupStages) : '-'}
        </InvestorProfileField>

        <InvestorProfileField label="Investment Focus">
          {investmentFocus?.length ? getValueFromArray(investmentFocus) : '-'}
        </InvestorProfileField>
      </DetailsSectionGreyContentContainer>
    </DetailsSection>
  );
}
