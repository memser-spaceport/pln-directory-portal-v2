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
import { useUpdateInvestorSettings } from '@/services/members/hooks/useUpdateInvestorSettings';
import { useUpdateMemberInvestorSettings } from '@/services/members/hooks/useUpdateMemberInvestorSettings';

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
  onHideSection?: () => void;
  isInvestor?: boolean | null;
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
  onHideSection,
  isInvestor,
}: Props) => {
  const investmentTeams = member?.teams.filter((team) => team.investmentTeam) ?? [];
  const { mutate: updateMemberInvestorSettings } = useUpdateMemberInvestorSettings();

  const handleAddDetails = () => {
    if (!member?.id) return;

    const _payload = {
      isInvestor: true,
    };

    updateMemberInvestorSettings({
      uid: member.id,
      payload: _payload,
    });

    // Open edit form
    onEdit?.();
  };

  const handleNotAnInvestor = () => {
    if (!member?.id) return;

    const _payload = {
      isInvestor: false,
    };

    updateMemberInvestorSettings({
      uid: member.id,
      payload: _payload,
    });

    // Hide the section
    onHideSection?.();
  };

  return (
    <>
      {showIncomplete &&
        (isInvestor === null ? (
          <div className={s.incompleteWarning}>
            <div className={s.warningContent}>
              <div className={s.warningIcon}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9C1.5 13.14 4.86 16.5 9 16.5C13.14 16.5 16.5 13.14 16.5 9C16.5 4.86 13.14 1.5 9 1.5ZM9.75 12.75H8.25V11.25H9.75V12.75ZM9.75 9.75H8.25V5.25H9.75V9.75Z"
                    fill="#1B4DFF"
                  />
                </svg>
              </div>
              <div className={s.warningText}>
                Do you invest in startups? Add your investor details to receive demo day invites and deal flow intros.
              </div>
              <div className={s.warningButtons}>
                <button className={s.linkButton} onClick={handleAddDetails}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M7 3.28125V10.7188M3.28125 7H10.7188"
                      stroke="#1B4DFF"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Add Details
                </button>
                <button className={s.linkButton} onClick={handleNotAnInvestor}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M10.2812 3.71875L3.71875 10.2812M3.71875 3.71875L10.2812 10.2812"
                      stroke="#1B4DFF"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Not an Investor
                </button>
              </div>
            </div>
          </div>
        ) : (
          <DataIncomplete className={s.incompleteStrip}>
            Update investor details to be eligible for demo day participation.
          </DataIncomplete>
        ))}

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
