import React from 'react';
import Link from 'next/link';
import { ITeam } from '@/types/teams.types';
import { formatUSD } from '@/utils/formatUSD';
import { LinkIcon } from '@/components/page/member-details/InvestorProfileDetails/components/EditInvestorProfileForm/icons';
import { InvestorProfileField } from '../InvestorProfileField';

import s from './FundTeamCard.module.scss';

interface Props {
  team: ITeam;
  isEditable: boolean;
}

export const FundTeamCard = ({ team, isEditable }: Props) => {
  return (
    <div className={s.section} key={team.id}>
      <div className={s.teamInfo}>
        <img
          src={team.logo || '/images/demo-day/profile-placeholder.svg'}
          className={s.teamLogo}
          alt={team.name ?? 'Team Logo'}
        />
        <div className={s.teamCol}>
          <div className={s.teamName}>
            {team.name}{' '}
            <Link href={`/teams/${team.id}`} target="_blank">
              <LinkIcon className={s.linkIcon} />
            </Link>
          </div>
          <div className={s.teamTag}>Investment Fund</div>
        </div>
      </div>

      <div className={s.column}>
        {isEditable && (
          <InvestorProfileField label="Fund Type(s)">
            {!!team.investorProfile?.investInFundTypes?.length
              ? team.investorProfile?.investInFundTypes.join(', ')
              : '-'}
          </InvestorProfileField>
        )}
        <InvestorProfileField label="Typical Check Size">
          {!!team.investorProfile?.typicalCheckSize
            ? formatUSD.format(+(team.investorProfile?.typicalCheckSize ?? 0))
            : '-'}
        </InvestorProfileField>
      </div>
      <div className={s.column}>
        <InvestorProfileField label="Startup Stages">
          {!!team.investorProfile?.investInStartupStages.length
            ? team.investorProfile?.investInStartupStages.join(', ')
            : '-'}
        </InvestorProfileField>
        <InvestorProfileField label="Investment Focus">
          {!!team.investorProfile?.investmentFocus?.length
            ? team.investorProfile?.investmentFocus.join(', ')
            : '-'}
        </InvestorProfileField>
      </div>
    </div>
  );
};
