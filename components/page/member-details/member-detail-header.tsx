'use client';

import { useMemberAnalytics } from '@/analytics/members.analytics';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { Tag } from '@/components/ui/tag';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { ADMIN_ROLE, PAGE_ROUTES } from '@/utils/constants';
import { parseMemberLocation } from '@/utils/member.utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect } from 'react';

interface IMemberDetailHeader {
  member: IMember;
  userInfo: IUserInfo;
  isLoggedIn: boolean;
}
const MemberDetailHeader = (props: IMemberDetailHeader) => {
  const member = props?.member;
  const name = member?.name ?? '';
  const isLoggedIn = props?.isLoggedIn;
  const profile = member?.profile ?? '/icons/default_profile.svg';
  const role = member?.mainTeam?.role || 'Contributor';
  const location = parseMemberLocation(member?.location);
  const isTeamLead = member?.teamLead;
  const isOpenToWork = member?.openToWork;
  const skills = member?.skills;
  const userInfo = props?.userInfo;
  const router = useRouter();

  const mainTeam = member?.mainTeam;
  const otherTeams = member.teams
    .filter((team) => team.id !== mainTeam?.id)
    .map((team) => team.name)
    .sort();

  const isOwner = userInfo?.uid === member.id;
  const isAdmin = userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE);
  const editUrl = isAdmin && !isOwner ? `${PAGE_ROUTES.SETTINGS}/members?id=${member?.id}` : `${PAGE_ROUTES.SETTINGS}/profile`;

  const analytics = useMemberAnalytics();

  const onEditProfileClick = () => {
    if (isOwner) {
      analytics.onMemberEditBySelf(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member));
    } else if (isAdmin) {
      analytics.onMemberEditByAdmin(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member));
    }
  };

  useEffect(() => {
    triggerLoader(false);
  }, [router]);

  return (
    <>
      <div className="header">
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
              <Link legacyBehavior passHref href={editUrl}>
                <a href={editUrl} className="header__detials__edit-and-notification__edit" onClick={onEditProfileClick}>
                  <img loading="lazy" alt="Edit" src="/icons/edit.svg" />
                  <span className="header__detials__edit-and-notification__edit__txt--mob">Edit</span>
                  <span className="header__detials__edit-and-notification__edit__txt--desc">Edit Profile</span>
                </a>
              </Link>
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
          padding: 16px 16px 24px 16px;
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
          font-size: 16px;
          font-weight: 700;
          line-height: 32px;
          max-width: 200px;
          cursor: default;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          letter-spacing: 0em;
          color: #0f172a;
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
          color: #000;
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
          color: #000;
        }

        .header__details__notice__button {
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header__detials__edit-and-notification__edit {
          color: #156ff7;
          font-size: 15px;
          line-height: 24px;
          display: flex;
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          font-weight: 600;
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
            padding: 20px;
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
