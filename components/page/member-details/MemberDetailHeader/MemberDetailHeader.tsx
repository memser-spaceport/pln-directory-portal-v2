'use client';

import clsx from 'clsx';
import { Fragment } from 'react';
import Link from 'next/link';

import { ADMIN_ROLE } from '@/utils/constants';

import { parseMemberLocation } from '@/utils/member.utils';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo } from '@/utils/common.utils';

import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useRecommendationLinkAnalyticsReport } from '@/services/members/hooks/useRecommendationLinkAnalyticsReport';

import { Tag } from '@/components/ui/tag';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import CustomTooltip from '@/components/ui/Tooltip/Tooltip';
import { EditButton } from '@/components/page/member-details/components/EditButton';

import { shouldShowInvestorTag } from './utils/shouldShowInvestorTag';

import s from './MemberDetailHeader.module.scss';

interface IMemberDetailHeader {
  member: IMember;
  userInfo: IUserInfo;
  isLoggedIn: boolean;
  onEdit: () => void;
}

export const MemberDetailHeader = (props: IMemberDetailHeader) => {
  const member = props?.member;
  const name = member?.name ?? '';
  const isLoggedIn = props?.isLoggedIn;
  const role = member?.mainTeam?.role || 'Contributor';
  const location = parseMemberLocation(member?.location);
  const isTeamLead = member?.teamLead;
  const isOpenToWork = member?.openToWork;
  const skills = member?.skills;
  const userInfo = props?.userInfo;
  const { onEdit } = props;

  const showInvestorTag = shouldShowInvestorTag(member);

  const mainTeam = member?.mainTeam;
  const otherTeams = member.teams
    ?.filter((team) => team.id !== mainTeam?.id)
    .map((team) => team.name)
    .sort();

  const isOwner = userInfo?.uid === member.id;
  const isAdmin = userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE);
  const defaultAvatarImage = useDefaultAvatar(member?.name);
  const profile = member?.profile ?? defaultAvatarImage;
  const analytics = useMemberAnalytics();
  const hasMissingRequiredData = !member?.name || !member?.email;
  const showIncomplete = hasMissingRequiredData && isLoggedIn && isOwner;

  useRecommendationLinkAnalyticsReport(member);

  const onEditProfileClick = () => {
    if (isOwner) {
      analytics.onMemberEditBySelf(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member));
    } else if (isAdmin) {
      analytics.onMemberEditByAdmin(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member));
    }

    onEdit();
  };

  return (
    <>
      <div className={clsx(s.header)}>
        <div className={s.headerProfile}>
          <img loading="lazy" className={s.headerProfileImg} src={profile} alt="project image" />
        </div>

        <div className={s.headerDetails}>
          <div>
            <div className={s.specificsHdr}>
              <CustomTooltip trigger={<h1 className={s.specificsName}>{name}</h1>} content={name} />
            </div>
            <div className={s.roleAndLocation}>
              {member?.teams?.[0]?.name && (
                <>
                  <div className={s.teams}>
                    <CustomTooltip
                      trigger={
                        <p className={s.teamsName}>
                          {' '}
                          {member?.teams?.length > 0 ? (
                            <Link href={`/teams/${mainTeam?.id}`} target="_blank" className={s.teamLink}>
                              {mainTeam?.name} <LinkIcon />
                            </Link>
                          ) : (
                            ''
                          )}{' '}
                        </p>
                      }
                      content={member?.teams?.length > 0 ? mainTeam?.name : ''}
                    />
                    {member?.teams?.length > 1 && (
                      <CustomTooltip
                        forceTooltip
                        trigger={
                          <button onClick={(e) => e.preventDefault()} className={s.moreTeamsButton}>
                            +{(member?.teams?.length - 1).toString()}
                          </button>
                        }
                        content={
                          <>
                            {otherTeams?.map((team: any, index: number) => (
                              <div key={`${team} + ${index}`}>
                                {team}
                                {index === member?.teams?.slice(1, member?.teams?.length).length - 1 ? '' : ','}
                              </div>
                            ))}
                          </>
                        }
                      />
                    )}
                  </div>
                  <div className={clsx(s.divider, s.desktopOnly)} />
                </>
              )}
              <CustomTooltip trigger={<p className={s.role}>{role}</p>} content={role} />
              {isLoggedIn && (
                <>
                  <div className={s.divider} />
                  <div className={s.location}>
                    <LocationIcon />
                    <p className={s.locationName}>{location}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            {isLoggedIn && (isAdmin || isOwner) && (
              <EditButton onClick={onEditProfileClick} incomplete={showIncomplete} />
            )}
          </div>
        </div>

        <div className={s.tags}>
          {showInvestorTag && <div className={s.investorTag}>Investor</div>}

          {isOpenToWork && (
            <div className={s.funds}>
              <span className={s.fundsLabel}>Open to Collaborate</span>
            </div>
          )}

          {isTeamLead && (
            <div className={s.funds}>
              <span className={s.fundsLabel}>Team lead</span>
            </div>
          )}

          {skills?.map((skill: any, index: number) => (
            <Fragment key={`${skill} + ${index}`}>
              {index < 3 && (
                <CustomTooltip
                  trigger={
                    <div>
                      <Tag value={skill?.title} tagsLength={skills?.length} />
                    </div>
                  }
                  content={skill?.title}
                />
              )}
            </Fragment>
          ))}
          {skills?.length > 3 && (
            <CustomTooltip
              forceTooltip
              trigger={
                <div>
                  <Tag variant="primary" value={'+' + (skills?.length - 3).toString()}></Tag>{' '}
                </div>
              }
              content={
                <div>
                  {skills
                    ?.slice(3, skills?.length)
                    .map((skill) => skill?.title)
                    .join(',|')
                    .split('|')
                    .map((skill) => <div key={skill}>{skill}</div>)}
                </div>
              }
            />
          )}
        </div>
      </div>
    </>
  );
};

const LinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_6093_44054)">
      <path
        d="M14.3437 4.5V11.8125C14.3437 12.0363 14.2548 12.2509 14.0966 12.4091C13.9384 12.5674 13.7237 12.6562 13.5 12.6562C13.2762 12.6562 13.0616 12.5674 12.9033 12.4091C12.7451 12.2509 12.6562 12.0363 12.6562 11.8125V6.53906L5.09692 14.097C4.93841 14.2555 4.72343 14.3445 4.49927 14.3445C4.2751 14.3445 4.06012 14.2555 3.90161 14.097C3.7431 13.9384 3.65405 13.7235 3.65405 13.4993C3.65405 13.2751 3.7431 13.0601 3.90161 12.9016L11.4609 5.34375H6.18747C5.96369 5.34375 5.74908 5.25486 5.59085 5.09662C5.43261 4.93839 5.34372 4.72378 5.34372 4.5C5.34372 4.27622 5.43261 4.06161 5.59085 3.90338C5.74908 3.74514 5.96369 3.65625 6.18747 3.65625H13.5C13.7237 3.65625 13.9384 3.74514 14.0966 3.90338C14.2548 4.06161 14.3437 4.27622 14.3437 4.5Z"
        fill="#1B4DFF"
      />
    </g>
    <defs>
      <filter
        id="filter0_d_6093_44054"
        x="-2"
        y="-1"
        width="22"
        height="22"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="1" />
        <feGaussianBlur stdDeviation="1" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.054902 0 0 0 0 0.0588235 0 0 0 0 0.0666667 0 0 0 0.06 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_6093_44054" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_6093_44054" result="shape" />
      </filter>
    </defs>
  </svg>
);

const LocationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 4.6875C9.32013 4.6875 8.65552 4.88911 8.09023 5.26682C7.52493 5.64454 7.08434 6.1814 6.82416 6.80953C6.56399 7.43765 6.49591 8.12881 6.62855 8.79562C6.76119 9.46243 7.08858 10.0749 7.56932 10.5557C8.05006 11.0364 8.66257 11.3638 9.32938 11.4964C9.99619 11.6291 10.6874 11.561 11.3155 11.3008C11.9436 11.0407 12.4805 10.6001 12.8582 10.0348C13.2359 9.46948 13.4375 8.80487 13.4375 8.125C13.4365 7.21363 13.074 6.33989 12.4295 5.69546C11.7851 5.05103 10.9114 4.68853 10 4.6875ZM10 9.6875C9.69097 9.6875 9.38887 9.59586 9.13192 9.42417C8.87497 9.25248 8.6747 9.00845 8.55644 8.72294C8.43818 8.43743 8.40723 8.12327 8.46752 7.82017C8.52781 7.51708 8.67663 7.23866 8.89515 7.02014C9.11367 6.80163 9.39208 6.65281 9.69517 6.59252C9.99827 6.53223 10.3124 6.56318 10.5979 6.68144C10.8835 6.7997 11.1275 6.99997 11.2992 7.25692C11.4709 7.51387 11.5625 7.81597 11.5625 8.125C11.5625 8.5394 11.3979 8.93683 11.1049 9.22985C10.8118 9.52288 10.4144 9.6875 10 9.6875ZM10 0.9375C8.09439 0.939568 6.26742 1.69748 4.91995 3.04495C3.57248 4.39242 2.81457 6.21939 2.8125 8.125C2.8125 14.1687 9.19063 18.7031 9.4625 18.893C9.62005 19.0032 9.8077 19.0624 10 19.0624C10.1923 19.0624 10.3799 19.0032 10.5375 18.893C11.7455 18.0027 12.8508 16.9808 13.8328 15.8461C16.0273 13.3258 17.1875 10.6539 17.1875 8.125C17.1854 6.21939 16.4275 4.39242 15.08 3.04495C13.7326 1.69748 11.9056 0.939568 10 0.9375ZM12.4453 14.5867C11.7004 15.4424 10.8822 16.2313 10 16.9445C9.1178 16.2313 8.29958 15.4424 7.55469 14.5867C6.25 13.0758 4.6875 10.7273 4.6875 8.125C4.6875 6.71604 5.24721 5.36478 6.2435 4.36849C7.23978 3.37221 8.59104 2.8125 10 2.8125C11.409 2.8125 12.7602 3.37221 13.7565 4.36849C14.7528 5.36478 15.3125 6.71604 15.3125 8.125C15.3125 10.7273 13.75 13.0758 12.4453 14.5867Z"
      fill="#455468"
    />
  </svg>
);
