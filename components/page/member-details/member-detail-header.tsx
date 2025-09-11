'use client';

import { useMemberAnalytics } from '@/analytics/members.analytics';
import { Tag } from '@/components/ui/tag';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import { ADMIN_ROLE } from '@/utils/constants';
import { parseMemberLocation } from '@/utils/member.utils';
import { Fragment } from 'react';
import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { useRecommendationLinkAnalyticsReport } from '@/services/members/hooks/useRecommendationLinkAnalyticsReport';
import { EditButton } from '@/components/page/member-details/components/EditButton';
import clsx from 'clsx';
import CustomTooltip from '@/components/ui/Tooltip/Tooltip';
import Link from 'next/link';

import s from './ProfileDetails/ProfileDetails.module.scss';

interface IMemberDetailHeader {
  member: IMember;
  userInfo: IUserInfo;
  isLoggedIn: boolean;
  onEdit: () => void;
}
const MemberDetailHeader = (props: IMemberDetailHeader) => {
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
  const hasInvestorProfile = !!member?.investorProfile?.secRulesAccepted;

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
      <div className={clsx('header')}>
        <div className="header__profile">
          <img loading="lazy" className="header__profile__img" src={profile} alt="project image" />
        </div>

        <div className="header__details">
          <div className="header__details__specifics">
            <div className="header__details__specifics__hdr">
              <CustomTooltip trigger={<h1 className="header__details__specifics__name">{name}</h1>} content={name} />
            </div>
            <div className="header__details__roleandlocation">
              {member?.teams?.[0]?.name && (
                <>
                  <div className="header__details__roleandlocation__teams">
                    <CustomTooltip
                      trigger={
                        <p className="header__details__roleandlocation__teams__name">
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
                  <div className="header__details__roleandlocation__location">
                    <LocationIcon />
                    <p className={s.locationName}>{location}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="header__details__notification">{isLoggedIn && (isAdmin || isOwner) && <EditButton onClick={onEditProfileClick} incomplete={showIncomplete} />}</div>
        </div>

        <div className="header__tags">
          {hasInvestorProfile && <div className={s.investorTag}>Investor</div>}

          {isOpenToWork && (
            <div className="header__tags__funds">
              <span className="header__tags__funds__text">Open to Collaborate</span>
            </div>
          )}

          {isTeamLead && (
            <div className="header__tags__funds">
              <span className="header__tags__funds__text">Team lead</span>
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
                  {skills?.slice(3, skills?.length).map((skill: any, index: number) => (
                    <div key={`${skill} + ${skill} + ${index}`}>
                      {skill?.title} {index !== skills?.slice(3, skills?.length - 1)?.length ? ',' : ''}
                    </div>
                  ))}
                </div>
              }
            />
          )}
        </div>
      </div>
      <style jsx>{`
        .header {
          display: grid;
          color: #000;
          grid-template-columns: 48px auto;
          column-gap: 8px;
          //padding: 16px 16px 24px 16px;
        }

        .header__missing_data {
          border-radius: 8px;
          border: 1px solid rgba(238, 189, 108, 0.25);
          background: linear-gradient(0deg, #fcfaed 0%, #fcfaed 100%), #fff;
          box-shadow:
            0 0 1px 0 rgba(255, 130, 14, 0.12),
            0 4px 4px 0 rgba(255, 130, 14, 0.04);
        }

        .header__profile {
          grid-row: span 2 / span 2;
        }

        .header__profile__img {
          width: 48px;
          height: 48px;
          border-radius: 100%;
          object-fit: cover;
          object-position: center;
        }

        .header__details {
          display: flex;
          gap: 10px;
          justify-content: space-between;
          grid-row: span 2 / span 2;
          grid-column: span 4 / span 4;
          margin-bottom: 16px;
        }

        .header__details__roleandlocation__teams {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .header__details__specifics__hdr {
          display: flex;
          align-items: center;
        }

        .header__details__specifics__name {
          font-size: 18px;
          font-weight: 700;
          line-height: 32px;
          max-width: 200px;
          cursor: default;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          letter-spacing: 0em;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header__details__roleandlocation {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
        }

        .header__details__roleandlocation__teams__name {
          font-size: 14px;
          font-weight: 500;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 20px;
          letter-spacing: 0px;
          text-align: center;
          padding-right: 4px;
        }

        .header__details__roleandlocation__teams__count {
          font-size: 10px;
          font-weight: 500;
          line-height: 12px;
          padding: 2px;
          background: #f1f5f9;
          border-radius: 100%;
          display: flex;
          color: #475569;
          min-height: 16px;
          min-width: 16px;
          cursor: default;
        }

        .header__details__roleandlocation__role {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          letter-spacing: 0px;
          text-align: left;
          color: #0f172a;
          padding-right: 24px;
          max-width: 200px;
          cursor: default;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .header__details__roleandlocation__location {
          display: flex;
          gap: 4px;
          padding-right: 24px;
          align-items: center;
        }

        .header__details__roleandlocation__location__name {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          letter-spacing: 0px;
          text-align: left;
          cursor: default;
          color: #475569;
        }

        .header__details__notice__button {
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header__detials__edit-and-notification__edit {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;

          color: #156ff7;
          text-align: center;
          font-feature-settings:
            'liga' off,
            'clig' off;
          font-size: 14px;
          font-style: normal;
          font-weight: 500;
        }
        .header__tags {
          grid-row: span 1 / span 1;
          grid-column: span 5 / span 5;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .header__tags__funds {
          height: 26px;
        }

        .header__tags__funds__text {
          font-size: 12px;
          font-weight: 500;
          line-height: 20px;
          letter-spacing: 0px;
          color: #475569;
        }

        .header__tags__funds {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background-color: #f1f5f9;
          border-radius: 56px;
          padding: 1px 8px;
        }

        .header__detials__edit-and-notification__edit__txt--mob {
          display: block;
        }

        .header__detials__edit-and-notification__edit__txt--desc {
          display: none;
        }

        @media (min-width: 1024px) {
          .header {
            // grid-template-columns: repeat(10, minmax(0, 1fr));
            grid-template-columns: 80px auto;
            column-gap: 24px;
            //padding: 20px;
          }

          .header__profile {
            grid-row: span 3 / span 3;
          }

          .header__profile__img {
            height: 80px;
            width: 80px;
          }

          .header__details {
            grid-row: span 2 / span 2;
            grid-column: 2 / auto;
            margin-bottom: unset;
          }

          .header__details__specifics__name {
            max-width: 300px;
          }

          .header__tags {
            grid-row: span 1 / span 1;
            grid-column: 2 / auto;
            border-top: unset;
            padding-top: 16px;
            margin-top: unset;
            padding: 16px 0px 0px 0px;
          }

          .header__detials__edit-and-notification__edit__txt--mob {
            display: none;
          }

          .header__detials__edit-and-notification__edit__txt--desc {
            display: block;
          }
        }
      `}</style>
    </>
  );
};

export default MemberDetailHeader;

const VerifiedIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M24 12.5625C24 13.4016 23.7984 14.1797 23.3953 14.8922C22.9922 15.6047 22.4531 16.1625 21.7734 16.5516C21.7922 16.6781 21.8016 16.875 21.8016 17.1422C21.8016 18.4125 21.375 19.4906 20.5312 20.3812C19.6828 21.2766 18.6609 21.7219 17.4656 21.7219C16.9313 21.7219 16.4203 21.6234 15.9375 21.4266C15.5625 22.1953 15.0234 22.8141 14.3156 23.2875C13.6125 23.7656 12.8391 24 12 24C11.1422 24 10.3641 23.7703 9.67031 23.3016C8.97188 22.8375 8.4375 22.2141 8.0625 21.4266C7.57969 21.6234 7.07344 21.7219 6.53437 21.7219C5.33906 21.7219 4.3125 21.2766 3.45469 20.3812C2.59687 19.4906 2.17031 18.4078 2.17031 17.1422C2.17031 17.0016 2.18906 16.8047 2.22188 16.5516C1.54219 16.1578 1.00313 15.6047 0.6 14.8922C0.201563 14.1797 0 13.4016 0 12.5625C0 11.6719 0.225 10.8516 0.670313 10.1109C1.11563 9.37031 1.71562 8.82188 2.46562 8.46563C2.26875 7.93125 2.17031 7.39219 2.17031 6.85781C2.17031 5.59219 2.59687 4.50937 3.45469 3.61875C4.3125 2.72812 5.33906 2.27812 6.53437 2.27812C7.06875 2.27812 7.57969 2.37656 8.0625 2.57344C8.4375 1.80469 8.97656 1.18594 9.68438 0.7125C10.3875 0.239062 11.1609 0 12 0C12.8391 0 13.6125 0.239063 14.3156 0.707813C15.0187 1.18125 15.5625 1.8 15.9375 2.56875C16.4203 2.37187 16.9266 2.27344 17.4656 2.27344C18.6609 2.27344 19.6828 2.71875 20.5312 3.61406C21.3797 4.50937 21.8016 5.5875 21.8016 6.85312C21.8016 7.44375 21.7125 7.97812 21.5344 8.46094C22.2844 8.81719 22.8844 9.36563 23.3297 10.1063C23.775 10.8516 24 11.6719 24 12.5625ZM11.4891 16.1766L16.4437 8.75625C16.5703 8.55938 16.6078 8.34375 16.5656 8.11406C16.5187 7.88438 16.4016 7.70156 16.2047 7.57969C16.0078 7.45312 15.7922 7.41094 15.5625 7.44375C15.3281 7.48125 15.1406 7.59375 15 7.79062L10.6359 14.3531L8.625 12.3469C8.44688 12.1687 8.24062 12.0844 8.01094 12.0938C7.77656 12.1031 7.575 12.1875 7.39688 12.3469C7.2375 12.5062 7.15781 12.7078 7.15781 12.9516C7.15781 13.1906 7.2375 13.3922 7.39688 13.5563L10.1578 16.3172L10.2938 16.425C10.4531 16.5328 10.6172 16.5844 10.7766 16.5844C11.0906 16.5797 11.3297 16.4484 11.4891 16.1766Z"
      fill="#3897F0"
    />
    <path
      d="M24 12.5625C24 13.4016 23.7984 14.1797 23.3953 14.8922C22.9922 15.6047 22.4531 16.1625 21.7734 16.5516C21.7922 16.6781 21.8016 16.875 21.8016 17.1422C21.8016 18.4125 21.375 19.4906 20.5312 20.3812C19.6828 21.2766 18.6609 21.7219 17.4656 21.7219C16.9313 21.7219 16.4203 21.6234 15.9375 21.4266C15.5625 22.1953 15.0234 22.8141 14.3156 23.2875C13.6125 23.7656 12.8391 24 12 24C11.1422 24 10.3641 23.7703 9.67031 23.3016C8.97188 22.8375 8.4375 22.2141 8.0625 21.4266C7.57969 21.6234 7.07344 21.7219 6.53437 21.7219C5.33906 21.7219 4.3125 21.2766 3.45469 20.3812C2.59687 19.4906 2.17031 18.4078 2.17031 17.1422C2.17031 17.0016 2.18906 16.8047 2.22188 16.5516C1.54219 16.1578 1.00313 15.6047 0.6 14.8922C0.201563 14.1797 0 13.4016 0 12.5625C0 11.6719 0.225 10.8516 0.670313 10.1109C1.11563 9.37031 1.71562 8.82188 2.46562 8.46563C2.26875 7.93125 2.17031 7.39219 2.17031 6.85781C2.17031 5.59219 2.59687 4.50937 3.45469 3.61875C4.3125 2.72812 5.33906 2.27812 6.53437 2.27812C7.06875 2.27812 7.57969 2.37656 8.0625 2.57344C8.4375 1.80469 8.97656 1.18594 9.68438 0.7125C10.3875 0.239062 11.1609 0 12 0C12.8391 0 13.6125 0.239063 14.3156 0.707813C15.0187 1.18125 15.5625 1.8 15.9375 2.56875C16.4203 2.37187 16.9266 2.27344 17.4656 2.27344C18.6609 2.27344 19.6828 2.71875 20.5312 3.61406C21.3797 4.50937 21.8016 5.5875 21.8016 6.85312C21.8016 7.44375 21.7125 7.97812 21.5344 8.46094C22.2844 8.81719 22.8844 9.36563 23.3297 10.1063C23.775 10.8516 24 11.6719 24 12.5625ZM11.4891 16.1766L16.4437 8.75625C16.5703 8.55938 16.6078 8.34375 16.5656 8.11406C16.5187 7.88438 16.4016 7.70156 16.2047 7.57969C16.0078 7.45312 15.7922 7.41094 15.5625 7.44375C15.3281 7.48125 15.1406 7.59375 15 7.79062L10.6359 14.3531L8.625 12.3469C8.44688 12.1687 8.24062 12.0844 8.01094 12.0938C7.77656 12.1031 7.575 12.1875 7.39688 12.3469C7.2375 12.5062 7.15781 12.7078 7.15781 12.9516C7.15781 13.1906 7.2375 13.3922 7.39688 13.5563L10.1578 16.3172L10.2938 16.425C10.4531 16.5328 10.6172 16.5844 10.7766 16.5844C11.0906 16.5797 11.3297 16.4484 11.4891 16.1766Z"
      fill="url(#paint0_linear_2837_12031)"
    />
    <defs>
      <linearGradient id="paint0_linear_2837_12031" x1="-1.32246" y1="11.9999" x2="21.4421" y2="4.36907" gradientUnits="userSpaceOnUse">
        <stop stop-color="#427DFF" />
        <stop offset="1" stop-color="#44D5BB" />
      </linearGradient>
    </defs>
  </svg>
);

const LinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_6093_44054)">
      <path
        d="M14.3437 4.5V11.8125C14.3437 12.0363 14.2548 12.2509 14.0966 12.4091C13.9384 12.5674 13.7237 12.6562 13.5 12.6562C13.2762 12.6562 13.0616 12.5674 12.9033 12.4091C12.7451 12.2509 12.6562 12.0363 12.6562 11.8125V6.53906L5.09692 14.097C4.93841 14.2555 4.72343 14.3445 4.49927 14.3445C4.2751 14.3445 4.06012 14.2555 3.90161 14.097C3.7431 13.9384 3.65405 13.7235 3.65405 13.4993C3.65405 13.2751 3.7431 13.0601 3.90161 12.9016L11.4609 5.34375H6.18747C5.96369 5.34375 5.74908 5.25486 5.59085 5.09662C5.43261 4.93839 5.34372 4.72378 5.34372 4.5C5.34372 4.27622 5.43261 4.06161 5.59085 3.90338C5.74908 3.74514 5.96369 3.65625 6.18747 3.65625H13.5C13.7237 3.65625 13.9384 3.74514 14.0966 3.90338C14.2548 4.06161 14.3437 4.27622 14.3437 4.5Z"
        fill="#1B4DFF"
      />
    </g>
    <defs>
      <filter id="filter0_d_6093_44054" x="-2" y="-1" width="22" height="22" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
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
