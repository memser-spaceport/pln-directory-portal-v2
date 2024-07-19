'use client';

import { Tooltip } from '@/components/core/tooltip/tooltip';
import { Tag } from '@/components/ui/tag';
import { IMember } from '@/types/members.types';
import { parseMemberLocation } from '@/utils/member.utils';
import MemberSkillList from './member-skill-list';

interface IMemberListView {
  member: IMember;
  isUserLoggedIn?: boolean;
}

const MemberListView = (props: IMemberListView) => {
  const member = props?.member;
  const isUserLoggedIn = props?.isUserLoggedIn;
  const profileUrl = member?.profile ?? '/icons/default_profile.svg';
  const role = member.mainTeam?.role || 'Contributor';
  const location = parseMemberLocation(member?.location);
  const skills = member?.skills ?? [];
  const isTeamLead = member?.teamLead;
  const isOpenToWork = member?.openToWork;
  const isBorder = isTeamLead || isOpenToWork;

  return (
    <>
      <div className="member-list-view">
        <img src={profileUrl} alt="user-profile" height={72} width={72} className="member-list-view__profile" />

        <div className="member-list-view__details-section">
          <div className="member-list-view__details-section__right">
            <div className="member-list-view__details-section__name-container">
              <h2 className="member-list-view__details-section__name-container__name">{member?.name}</h2>
              <div className="member-list-view__details-section__name-container__badges__desc">
                {isTeamLead && (
                  <Tooltip
                    asChild
                    trigger={<img loading="lazy" className="member-list-view__details-section__name-container__badges__team-lead" height={20} width={20} src="/icons/badge/team-lead.svg" />}
                    content={'Team Lead'}
                  />
                )}
                {isOpenToWork && (
                  <Tooltip
                    asChild
                    trigger={<img loading="lazy" className="member-list-view__details-section__name-container__badges__open-to-work" height={20} width={20} src="/icons/badge/open-to-work.svg" />}
                    content={'Open To Collaborate'}
                  />
                )}
              </div>
            </div>
            <div className="member-list-view__details-section__right__work-details">
              <div className="member-list-view__details-section__right__work-details__team">
                <p className="member-list-view__details-section__right__work-details__team-name">{member?.teams?.length > 0 ? member?.teams[0].name : '-'}</p>
                {member?.teams?.length > 2 && (
                  <Tooltip
                    asChild
                    trigger={
                      <button onClick={(e) => e.preventDefault()} className="member-list-view__details-section__right__work-details__tems-count">
                        +{(member?.teams?.length - 1).toString()}
                      </button>
                    }
                    content={
                      <>
                        {member?.teams?.slice(1, member?.teams?.length).map((team, index) => (
                          <div key={`${team} + ${index}`}>
                            {team?.name} {index === member?.teams?.slice(1, member?.teams?.length).length - 1 ? '' : ','}
                          </div>
                        ))}
                      </>
                    }
                  />
                )}
              </div>
              <div>
                <p className="member-list-view__details-section__right__work-detail__team__role">{role}</p>
              </div>
            </div>
            {isUserLoggedIn && (
              <>
                <div className="member-list-view__details-section__right__location">
                  {location ? (
                    <>
                      <img loading="lazy" src="/icons/location.svg" height={13} width={11} />
                      <p className="member-list-view__details-section__right__location__name">{location}</p>
                    </>
                  ) : (
                    '-'
                  )}
                </div>
              </>
            )}
          </div>

          {skills.length > 0 && (
            <div className="member-list-view__details-section__left">
              {(isTeamLead || isOpenToWork) && (
                <div className="member-list-view__details-section__name-container__badges__mob">
                  {isTeamLead && (
                    <Tooltip
                      asChild
                      trigger={<img loading="lazy" className="member-list-view__details-section__name-container__badges__team-lead" height={20} width={20} src="/icons/badge/team-lead.svg" />}
                      content={'Team Lead'}
                    />
                  )}
                  {isOpenToWork && (
                    <Tooltip
                      asChild
                      trigger={<img loading="lazy" className="member-list-view__details-section__name-container__badges__open-to-work" height={20} width={20} src="/icons/badge/open-to-work.svg" />}
                      content={'Open To Collaborat'}
                    />
                  )}
                </div>
              )}
              <MemberSkillList skills={skills} noOfSkillsToShow={3} />
            </div>
          )}
        </div>
      </div>

      <style jsx>
        {`
          .member-list-view {
            padding: 20px;
            display: flex;
            gap: 16px;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0px 4px 4px 0px #0f172a0a;
          }

          .member-list-view:hover {
            box-shadow: 0px 0px 0px 2px #156ff740;
          }

          .member-list-view:active {
            border-radius: 12px;
            outline-style: solid;
            outline-width: 1px;
            outline-offset: 0;
            outline-color: #156ff7;
            box-shadow: 0px 0px 0px 2px #156ff740;
          }

          .member-list-view__profile {
            border: 1px solid #e2e8f0;
            border-radius: 100%;
            width: 32px;
            height: 32px;
            position: absolute;
          }

          .member-list-view__details-section__right {
            display: flex;
            gap: 8px;
            flex-direction: column;
          }

          .member-list-view__details-section {
            display: flex;
            flex-direction: column;
            gap: 20px;
            width: 100%;
          }

          .member-list-view__details-section__name-container {
            display: flex;
            align-items: center;
            gap: 8px;
            padding-left: 40px;
          }

          .member-list-view__details-section__name-container__name {
            font-size: 18px;
            font-weight: 600;
            line-height: 28px;
            letter-spacing: 0em;
            text-align: left;
            color: #0f172a;
            max-width: 100px;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 250px;
            white-space: nowrap;
          }

          .member-list-view__details-section__name-container__badges__desc {
            display: none;
            gap: 5px;
            align-items: center;
          }

          .member-list-view__details-section__name-container__badges__mob {
            display: flex;
            align-items: center;
            gap: 5px;
            padding-top:4px;
          }

          .member-list-view__details-section__right__work-details {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .member-list-view__details-section__right__work-details__tems-count {
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
            align-items: center;
            justify-content: center;
          }

          .member-list-view__details-section__right__work-details__team {
            display: flex;
            gap: 4px;
            align-items: center;
          }

          .member-list-view__details-section__right__work-details__team-name {
            font-size: 14px;
            font-weight: 500;
            color: #000;
            max-width: 200px;
            height: 20px;
            overflow: hidden;
            display: inline-block;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            text-overflow: ellipsis;
            line-height: 20px;
          }

          .member-list-view__details-section__right__location {
            padding-top: 8px;
            width: fit-content;
            align-items: center;
            display: flex;
            height: 20px;
            gap: 7px;
          }

          .member-list-view__details-section__right__location__name {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            letter-spacing: 0px;
            max-width: 200px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            color: #475569;
          }

          .member-list-view__details-section__left {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .member-list-view__details-section__left__tags-container {
            display: flex;
            gap: 8px;
            height: 26px;
          }

          .member-list-view__details-section__right__work-detail__team__role {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            color: #000;
            max-width: 150px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }

          @media (min-width: 1024px) {
            .member-list-view__details-section__name-container {
              padding: unset;
            }

            .member-list-view__details-section__right {
              gap: 4px;
            }

            .member-list-view__details-section__name-container__name {
              max-width: 300px;
            }

            .member-list-view__details-section {
              flex-direction: row;
              justify-content: space-between;
            }

            .member-list-view__profile {
              width: 72px;
              height: 72px;
              position: unset;
            }

            .member-list-view__details-section__right__work-detail__team__role {
              max-width: 400px;
            }

            .member-list-view__details-section__name-container__badges__desc {
              display: flex;
              gap: 5px;
              align-items: center;
            }

            .member-list-view__details-section__name-container__badges__mob {
              display: none;
            }
          }
        `}
      </style>
    </>
  );
};

export default MemberListView;
