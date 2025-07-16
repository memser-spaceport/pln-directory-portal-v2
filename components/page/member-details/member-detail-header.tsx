'use client';

import { useMemberAnalytics } from '@/analytics/members.analytics';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { Tag } from '@/components/ui/tag';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { ADMIN_ROLE, PAGE_ROUTES } from '@/utils/constants';
import { parseMemberLocation } from '@/utils/member.utils';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect } from 'react';
import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { useRecommendationLinkAnalyticsReport } from '@/services/members/hooks/useRecommendationLinkAnalyticsReport';
import { EditButton } from '@/components/page/member-details/components/EditButton';
import clsx from 'clsx';

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
  const router = useRouter();

  const mainTeam = member?.mainTeam;
  const otherTeams = member.teams
    .filter((team) => team.id !== mainTeam?.id)
    .map((team) => team.name)
    .sort();

  const isOwner = userInfo?.uid === member.id;
  const isAdmin = userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE);
  const editUrl = isAdmin && !isOwner ? `${PAGE_ROUTES.SETTINGS}/members?id=${member?.id}` : `${PAGE_ROUTES.SETTINGS}/profile`;
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

  useEffect(() => {
    triggerLoader(false);
  }, [router]);

  return (
    <>
      <div className={clsx('header')}>
        <div className="header__profile">
          <img loading="lazy" className="header__profile__img" src={profile} alt="project image" />
        </div>

        <div className="header__details">
          <div className="header__details__specifics">
            <div className="header__details__specifics__hdr">
              <Tooltip asChild trigger={<h1 className="header__details__specifics__name">{name}</h1>} content={name} />
            </div>
            <div className="header__details__roleandlocation">
              {member?.teams[0]?.name && (
                <div className="header__details__roleandlocation__teams">
                  <Tooltip
                    asChild
                    trigger={<p className="header__details__roleandlocation__teams__name"> {member?.teams?.length > 0 ? mainTeam?.name : ''} </p>}
                    content={member?.teams?.length > 0 ? mainTeam?.name : ''}
                  />
                  {member?.teams?.length > 1 && (
                    <Tooltip
                      asChild
                      trigger={
                        <button onClick={(e) => e.preventDefault()} className="header__details__roleandlocation__teams__count">
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
              )}
              <Tooltip asChild trigger={<p className="header__details__roleandlocation__role">{role}</p>} content={role} />
              {isLoggedIn && (
                <div className="header__details__roleandlocation__location">
                  <img loading="lazy" src="/icons/location.svg" height={13} width={11} />
                  <p className="header__details__roleandlocation__location__name">{location}</p>
                </div>
              )}
            </div>
          </div>

          <div className="header__details__notification">
            {/* <button className="header__details__notice__button">
              <img loading="lazy" src="/icons/notification.svg" alt="notification icon" />
            </button> */}
            {isLoggedIn && (isAdmin || isOwner) && (
              <EditButton onClick={onEditProfileClick} incomplete={showIncomplete} />
              // <Link legacyBehavior passHref href={editUrl}>
              //   <a href={editUrl} className="header__detials__edit-and-notification__edit" onClick={onEditProfileClick}>
              //     <EditIcon /> Edit
              //   </a>
              // </Link>
            )}
          </div>
        </div>

        <div className="header__tags">
          {isOpenToWork && (
            <div className="header__tags__funds">
              <img loading="lazy" src="/icons/badge/open-to-work.svg" height={24} width={24} alt="open to work" />
              <span className="header__tags__funds__text">Open to Collaborate</span>
            </div>
          )}

          {isTeamLead && (
            <div className="header__tags__funds">
              <img loading="lazy" src="/icons/badge/team-lead.svg" alt="icon" height={24} width={24} />
              <span className="header__tags__funds__text">Team lead</span>
            </div>
          )}

          {skills?.map((skill: any, index: number) => (
            <Fragment key={`${skill} + ${index}`}>
              {index < 3 && (
                <Tooltip
                  asChild
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
            <Tooltip
              asChild
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
          padding-right: 24px;
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
          gap: 5px;
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
          padding: 1px 8px 1px 0px;
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
