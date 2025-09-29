'use client';

import React from 'react';
import { clsx } from 'clsx';
import { IUserInfo } from '@/types/shared.types';
import { EditButton } from '@/components/page/member-details/components/EditButton';
import { InvestmentDetailsSection } from './components';

import s from './InvestorProfileView.module.scss';
import { LinkIcon } from '@/components/page/member-details/InvestorProfileDetails/components/EditInvestorProfileForm/icons';
import Link from 'next/link';
import { IMember, InvestorProfileType } from '@/types/members.types';
import { ITeam } from '@/types/teams.types';
import { formatUSD } from '@/utils/formatUSD';
import { AddIcon } from '@storybook/icons';

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
}

const findPreferredTeam = (teams: ITeam[] | undefined): ITeam | undefined => {
  if (!teams || teams.length === 0) return undefined;

  // First priority: Find fund team
  const fundTeam = teams.find((team) => team.isFund);
  if (fundTeam) return fundTeam;

  // Second priority: Find main team
  const mainTeam = teams.find((team) => team.mainTeam);
  if (mainTeam) return mainTeam;

  // Fallback: Return first team
  return teams[0];
};

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
}: Props) => {
  const fundTeam = findPreferredTeam(member?.teams);

  return (
    <>
      {showIncomplete && (
        <div className={s.incompleteStrip}>
          <span>
            <AlertIcon />
          </span>{' '}
          Add investor details to be eligible for demo day participation
        </div>
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
          <div className={s.section}>
            {type === 'ANGEL_AND_FUND' && (
              <div className={s.sectionContent}>
                {typicalCheckSize ||
                investmentFocusAreas?.length ||
                investInStartupStages?.length ||
                investInFundTypes?.length ||
                isEditable ? (
                  <>
                    <InvestmentDetailsSection
                      typicalCheckSize={typicalCheckSize}
                      investmentFocusAreas={investmentFocusAreas}
                      investInStartupStages={investInStartupStages}
                      investInFundTypes={investInFundTypes}
                      secRulesAccepted={secRulesAccepted}
                      isEditable={isEditable}
                      onEdit={onEdit}
                    />
                    <div className={s.divider} />
                  </>
                ) : null}
                <>
                  <div>
                    {fundTeam ? (
                      <Link href={`/teams/${fundTeam?.id}`} className={s.ctaLink}>
                        <div className={s.infoSectionContent}>
                          <span className={s.keywordsLabel}>I invest through: </span> <b>{fundTeam?.name}</b>{' '}
                          <LinkIcon />
                        </div>
                      </Link>
                    ) : (
                      <Link href="/teams/add" className={s.infoSectionContent}>
                        Submit a Fund <LinkIcon />
                      </Link>
                    )}
                  </div>
                </>
              </div>
            )}
            {type === 'FUND' && (
              <>
                <div>
                  {fundTeam ? (
                    <Link href={`/teams/${fundTeam?.id}`} className={s.ctaLink}>
                      <div className={s.infoSectionContent}>
                        <span className={s.keywordsLabel}>I invest through: </span> <b>{fundTeam?.name}</b> <LinkIcon />
                      </div>
                    </Link>
                  ) : (
                    <div className={s.keywordsWrapper}>
                      <span className={s.keywordsLabel}>I invest through:</span>
                      <span className={s.badgesWrapper}>
                        {typicalCheckSize && secRulesAccepted ? (
                          <div className={s.badge}>{formatUSD.format(+typicalCheckSize)}</div>
                        ) : (
                          <button
                            type="button"
                            className={s.addKeywordsBadge}
                            onClick={() => {
                              onEdit?.();
                            }}
                          >
                            <AddIcon /> Add
                          </button>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
            {type === 'ANGEL' && (
              <InvestmentDetailsSection
                typicalCheckSize={typicalCheckSize}
                investmentFocusAreas={investmentFocusAreas}
                investInStartupStages={investInStartupStages}
                investInFundTypes={investInFundTypes}
                secRulesAccepted={secRulesAccepted}
                isEditable={isEditable}
                onEdit={onEdit}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.59375 5.90625C7.59375 5.68375 7.65973 5.46624 7.78335 5.28123C7.90697 5.09623 8.08267 4.95203 8.28823 4.86689C8.4938 4.78174 8.72 4.75946 8.93823 4.80287C9.15646 4.84627 9.35691 4.95342 9.51425 5.11075C9.67158 5.26809 9.77873 5.46854 9.82214 5.68677C9.86555 5.905 9.84327 6.1312 9.75812 6.33677C9.67297 6.54234 9.52878 6.71804 9.34377 6.84165C9.15876 6.96527 8.94126 7.03125 8.71875 7.03125C8.42038 7.03125 8.13424 6.91272 7.92326 6.70175C7.71228 6.49077 7.59375 6.20462 7.59375 5.90625ZM16.5938 9C16.5938 10.5019 16.1484 11.9701 15.314 13.2189C14.4796 14.4676 13.2936 15.441 11.906 16.0157C10.5184 16.5905 8.99158 16.7408 7.51854 16.4478C6.04549 16.1548 4.69242 15.4316 3.63041 14.3696C2.56841 13.3076 1.84517 11.9545 1.55217 10.4815C1.25916 9.00842 1.40954 7.48157 1.98429 6.094C2.55905 4.70642 3.53236 3.52044 4.78114 2.68603C6.02993 1.85162 7.4981 1.40625 9 1.40625C11.0133 1.40848 12.9435 2.20925 14.3671 3.63287C15.7907 5.0565 16.5915 6.9867 16.5938 9ZM14.9063 9C14.9063 7.83185 14.5599 6.68994 13.9109 5.71866C13.2619 4.74739 12.3395 3.99037 11.2602 3.54334C10.181 3.09631 8.99345 2.97934 7.84775 3.20724C6.70205 3.43513 5.64966 3.99765 4.82365 4.82365C3.99765 5.64965 3.43513 6.70205 3.20724 7.84775C2.97935 8.99345 3.09631 10.181 3.54334 11.2602C3.99037 12.3394 4.74739 13.2619 5.71867 13.9109C6.68994 14.5599 7.83186 14.9062 9 14.9062C10.5659 14.9046 12.0672 14.2818 13.1745 13.1745C14.2818 12.0672 14.9046 10.5659 14.9063 9ZM9.84375 11.5791V9.28125C9.84375 8.90829 9.69559 8.5506 9.43187 8.28688C9.16815 8.02316 8.81046 7.875 8.4375 7.875C8.23824 7.8747 8.04531 7.94494 7.89287 8.07326C7.74043 8.20158 7.63833 8.37972 7.60464 8.57611C7.57095 8.7725 7.60786 8.97447 7.70882 9.14626C7.80978 9.31805 7.96828 9.44857 8.15625 9.51469V11.8125C8.15625 12.1855 8.30441 12.5431 8.56813 12.8069C8.83186 13.0706 9.18954 13.2188 9.5625 13.2188C9.76176 13.219 9.9547 13.1488 10.1071 13.0205C10.2596 12.8922 10.3617 12.714 10.3954 12.5176C10.4291 12.3213 10.3921 12.1193 10.2912 11.9475C10.1902 11.7757 10.0317 11.6452 9.84375 11.5791Z"
      fill="#D97706"
    />
  </svg>
);
