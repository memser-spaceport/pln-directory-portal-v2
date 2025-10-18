'use client';

import React from 'react';
import { clsx } from 'clsx';
import { IUserInfo } from '@/types/shared.types';
import { EditButton } from '@/components/page/member-details/components/EditButton';
import { InvestmentDetailsSection, InvestorProfileField } from './components';

import s from './InvestorProfileView.module.scss';
import { LinkIcon } from '@/components/page/member-details/InvestorProfileDetails/components/EditInvestorProfileForm/icons';
import Link from 'next/link';
import { IMember, InvestorProfileType } from '@/types/members.types';
import { ITeam } from '@/types/teams.types';
import { formatUSD } from '@/utils/formatUSD';
import { DataIncomplete } from '@/components/page/member-details/DataIncomplete';

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
  type: InvestorProfileType | undefined;
  member?: IMember;
  hideHeader?: boolean;
}

export const InvestorProfileView = ({
  typicalCheckSize,
  investmentFocusAreas,
  investInStartupStages,
  investInFundTypes,
  secRulesAccepted,
  isLoggedIn,
  isEditable,
  showIncomplete,
  onEdit,
  type,
  member,
  hideHeader,
}: Props) => {
  const investmentTeams = member?.teams.filter((team) => team.investmentTeam) ?? [];

  return (
    <>
      {showIncomplete && (
        <DataIncomplete className={s.incompleteStrip}>
          Add investor details to be eligible for demo day participation
        </DataIncomplete>
      )}

      <div
        className={clsx(s.root, {
          [s.missingData]: showIncomplete && isLoggedIn,
        })}
      >
        <div className={s.header}>
          <h3 className={s.title}>Investor Profile</h3>
          {isEditable && onEdit && <EditButton onClick={onEdit} />}
        </div>

        <div className={s.content}>
          {(type === 'ANGEL_AND_FUND' || type === 'FUND') && investmentTeams?.length > 0 && (
            <div className={s.block}>
              <div className={s.blockTitle}>Investment through fund(s)</div>

              {investmentTeams.map((team) => {
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
                    {/*<div>params</div>*/}
                  </div>
                );
              })}
            </div>
          )}

          {type === 'FUND' && !investmentTeams?.length && (
            <div className={s.block}>
              <InvestmentDetailsSection isEditable={isEditable} />
            </div>
          )}

          {(type === 'ANGEL' || type === 'ANGEL_AND_FUND' || !type) && (
            <div className={s.block}>
              {!hideHeader && (
                <>
                  {typicalCheckSize || investInStartupStages?.length || investmentFocusAreas?.length ? (
                    <div className={s.blockTitle}>Direct Investments</div>
                  ) : null}
                </>
              )}
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
