import { useMemberAnalytics } from '@/analytics/members.analytics';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { Tag } from '@/components/ui/tag';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { ITag, ITeam } from '@/types/teams.types';
import { getAnalyticsMemberInfo, getAnalyticsTeamInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import { Fragment } from 'react';

interface IMemberTeamCard {
  team: ITeam | undefined;
  isLoggedIn: boolean;
  role: string | undefined;
  tags: ITag[] | undefined;
  isMainTeam: boolean | undefined;
  url: string;
  userInfo: IUserInfo;
  member: IMember;
  isPopupOpen?: boolean;
}

const MemberDetailsTeamCard = (props: IMemberTeamCard) => {
  const team = props?.team;
  const isLoggedIn = props?.isLoggedIn;
  const logo = team?.logo ?? '/icons/team-default-profile.svg';
  const role = props?.role;
  const name = team?.name;
  const isMainTeam = props?.isMainTeam;
  const tags = props?.tags ?? [];
  const url = props?.url;
  const userInfo = props?.userInfo;
  const member = props?.member;
  const isPopupOpen = props?.isPopupOpen;
  const analytics = useMemberAnalytics();
  const noOfTagsToShow = 2;

  const onTeamClickHandler = () => {
    analytics.onTeamClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member), getAnalyticsTeamInfo(team));
  };

  return (
    <>
      <a href={url} target='_blank' className="member-team-card" onClick={() => onTeamClickHandler()}>
        <div className="member-team-card__profile-details">
          <div className="member-teamn-card__profile-details__profile-container">
            <img loading="lazy" alt="profile" src={logo} height={40} width={40} className="member-team-card__profile-details__profile" />
            {isMainTeam && (
              <Tooltip
                asChild
                trigger={
                  <div className="member-teamn-card__profile-details__profile-container__main-team-badge">
                    <img loading="lazy" alt="Main Team" src="/icons/badge/main-team.svg" />
                  </div>
                }
                content={'Main Team'}
              />
            )}
          </div>
          <div className="member-team-card__profile-details__name-and-role">
            <p className="member-team-card__profile-details__name-and-role__name">{name}</p>
            <p className="member-team-card__profile-details__name-and-role__role">{role}</p>
          </div>
        </div>

        <div className="member-team-card__tags-container">
          {tags?.map((tag: any, index: number) => (
            <Fragment key={`${tag} + ${index}`}>
              {index < noOfTagsToShow && (
                <Tooltip
                  asChild
                  trigger={
                    <div>
                      <Tag value={tag?.title} tagsLength={tags?.length} />
                    </div>
                  }
                  content={tag?.title}
                />
              )}
            </Fragment>
          ))}
          {tags?.length > noOfTagsToShow && (
            <Tooltip
              asChild
              trigger={
                <div>
                  <Tag variant="primary" value={'+' + (tags?.length - noOfTagsToShow).toString()}></Tag>{' '}
                </div>
              }
              content={
                <div>
                  {tags?.slice(noOfTagsToShow, tags?.length).map((tag: any, index: number) => (
                    <div key={`${tag} + ${tag} + ${index}`}>
                      {tag?.title} {index !== tags?.slice(noOfTagsToShow, tags?.length - 1)?.length ? ',' : ''}
                    </div>
                  ))}
                </div>
              }
            />
          )}
        </div>
        <button className="team-project-card__goto__btn">
          <img loading="lazy" alt="go-to" src="/icons/right-arrow-gray.svg" width={16} height={14} />
        </button>
      </a>

      <style jsx>
        {`
          .member-team-card {
            display: grid;
            align-items: center;
            grid-template-columns: 1fr 16px;
            padding: 16px;
          }

          .member-team-card:hover {
            background-color: #f8fafc;
          }

          .member-team-card__tags-container {
            grid-row: 2;
            margin-top: 12px;
          }

          .member-team-card__profile-details {
            display: flex;
            gap: 16px;
            align-items: center;
          }

          .member-team-card__profile-details__profile {
            border-radius: 8px;
            background-color: #e2e8f0;
            border: 1px solid #e2e8f0;
            object-fit: cover;
            object-position: center;
          }

          .member-teamn-card__profile-details__profile-container__main-team-badge {
            position: absolute;
            top: -6px;
            right: -6px;
          }

          .member-team-card__profile-details__name-and-role {
            display: flex;
            flex-direction: column;
            gap: 4px;
            width: 100%;
          }
          .member-team-card__profile-details__name-and-role__name {
            max-width: 80%;
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
            color: #000;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            letter-spacing: 0em;
            text-align: left;
          }

          .member-team-card__profile-details__name-and-role__role {
            font-size: 12px;
            font-weight: 400;
            line-height: 14px;
            letter-spacing: 0em;
            max-height: 28px;
            max-width: 80%;
            overflow: hidden;
            -webkit-line-clamp: 2;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            word-wrap: break-word;
            text-overflow: ellipsis;
            color: #475569;
            text-align: left;
          }

          .member-teamn-card__profile-details__profile-container {
            position: relative;
          }

          .member-team-card__tags-container {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .team-project-card__goto__btn {
            background: transparent;
          }

          @media (min-width: 1024px) {
            .member-team-card {
              grid-template-columns: ${isPopupOpen ? '1fr 16px' : '1fr 1fr 16px'};
            }

            .member-team-card__tags-container {
              grid-row: ${isPopupOpen ? '' : 'unset'};
              margin-top: ${isPopupOpen ? '' : 'unset'};
            }

            .member-team-card__profile-details__name-and-role__role {
              max-width: 256px;
            }
          }
        `}
      </style>
    </>
  );
};

export default MemberDetailsTeamCard;
