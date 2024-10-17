'use client';

import { Tooltip } from '@/components/core/tooltip/tooltip';
import { Tag } from '@/components/ui/tag';
import { IUserInfo } from '@/types/shared.types';
import { ITag, ITeam } from '@/types/teams.types';
import { ADMIN_ROLE } from '@/utils/constants';
import { getTechnologyImage } from '@/utils/team.utils';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';
import About from './about';
import Technologies from './technologies';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { getAnalyticsTeamInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';

interface ITeamDetails {
  team: ITeam;
  userInfo: IUserInfo | undefined;
}

const TeamDetails = (props: ITeamDetails) => {
  const params = useParams();
  const team = props?.team;
  const logo = team?.logo ?? '/icons/team-default-profile.svg';
  const teamName = team?.name ?? '';
  const tags = team?.industryTags ?? [];
  const userInfo = props?.userInfo;
  const teamId = params?.id;
  const about = team?.longDescription ?? '';
  const technologies = team?.technologies?.map((item) => ({ name: item?.title, url: getTechnologyImage(item?.title) })) ?? [];
  const hasTeamEditAccess = getHasTeamEditAccess();

  const [isTechnologyPopup, setIsTechnologyPopup] = useState(false);
  const analytics = useTeamAnalytics();

  const router = useRouter();

  const onTagCountClickHandler = () => {
    setIsTechnologyPopup(!isTechnologyPopup);
  };

  function getHasTeamEditAccess() {
    try {
      if (userInfo?.roles?.includes(ADMIN_ROLE) || userInfo?.leadingTeams?.includes(team?.id)) {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  const onEditTeamClickHandler = () => {
    if (userInfo?.roles?.includes(ADMIN_ROLE)) {
      analytics.onEditTeamByAdmin(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
    } else {
      analytics.onEditTeamByLead(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
    }
    triggerLoader(true);
    router.push(`/settings/teams?id=${team?.id}`);
  };

  useEffect(() => {
    triggerLoader(false);
  }, [router]);

  return (
    <>
      <div className="team-details">
        {/* Name and about section */}
        <div className="team-details__profile">
          <div className="team-details__profile__logo-tags-container">
            <img loading="lazy" alt="team-profile" className="team-details__profile__logo-tags-container__team-logo" src={logo} />
            <div className="team-details__profile__logo-tags-container__name-tagcontainer">
              <Tooltip asChild trigger={<h1 className="team-details__profile__logo-tags-container__name-tagcontainer__team-name">{teamName}</h1>} content={teamName} />
              <div className="team-details__profile__logo-tags-container__name-tagcontainer__tags">
                {/* Tags Mobile */}
                <div className="team-details__profile__logo-tags-container__name-tagcontainer__tags__mobile">
                  {tags?.map((tag: ITag, index: number) => (
                    <Fragment key={`${tag} + ${index}`}>
                      {index < 3 && (
                        <div>
                          {
                            <Tooltip
                              asChild
                              trigger={
                                <div>
                                  <Tag value={tag?.title} variant="primary" tagsLength={tags?.length} />{' '}
                                </div>
                              }
                              content={tag?.title}
                            />
                          }
                        </div>
                      )}
                    </Fragment>
                  ))}
                  {tags?.length > 3 && (
                    <Tooltip
                      asChild
                      trigger={
                        <div>
                          <Tag callback={onTagCountClickHandler} variant="primary" value={'+' + (tags?.length - 3).toString()} />{' '}
                        </div>
                      }
                      content={
                        <div>
                          {tags?.slice(3, tags?.length).map((tag, index) => (
                            <div key={`${tag} + ${tag} + ${index}`}>
                              {tag?.title} {index !== tags?.slice(3, tags?.length - 1)?.length ? ',' : ''}
                            </div>
                          ))}
                        </div>
                      }
                    />
                  )}
                </div>
                {/* Tags web */}
                <div className="team-details__profile__logo-tags-container__name-tagcontainer__tags__web">
                  {tags?.map((tag: ITag, index: number) => (
                    <Fragment key={`${tag} + ${index}`}>
                      {index < 5 && (
                        <div>
                          <Tooltip
                            asChild
                            trigger={
                              <div>
                                <Tag value={tag?.title} />{' '}
                              </div>
                            }
                            content={tag?.title}
                          />
                        </div>
                      )}
                    </Fragment>
                  ))}
                  {tags?.length > 5 && (
                    <Tooltip
                      asChild
                      trigger={
                        <div>
                          <Tag callback={onTagCountClickHandler} variant="primary" value={'+' + (tags?.length - 5).toString()} />
                        </div>
                      }
                      content={
                        <div>
                          {tags?.slice(5, tags?.length).map((tag, index) => (
                            <div key={`${tag} + ${tag} + ${index}`}>
                              {tag?.title} {index !== tags?.slice(3, tags?.length - 1)?.length ? ',' : ''}
                            </div>
                          ))}
                        </div>
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {hasTeamEditAccess && (
            <button className="team-details__profile__edit" onClick={onEditTeamClickHandler}>
              <Image src="/icons/edit.svg" alt="Edit" height={16} width={16} />
              Edit Team
            </button>
          )}

          {/* <button className="team-details__profile__notification">
            <img loading="lazy" alt="notification" src="/icons/notification.svg" height={40} width={40} />
          </button> */}
        </div>

        {/* About */}
        <About team={team} userInfo={userInfo} about={about} hasTeamEditAccess={hasTeamEditAccess}/>

        {/* Technology */}
        <Technologies technologies={technologies} team={team} userInfo={userInfo} />
      </div>

      <style jsx>
        {`
            .team-details {
                display: flex;
                flex-direction: column;
                gap: 24px;
                background: #fff;
                padding: 16px 16px 16px 16px;
                border-radius: 0px 8px;
                background: #FFF;
                box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
            }

            .team-details__profile {
                display: flex;
                width: 100%;
                justify-content: space-between;

            }

            .team-details__profile__logo-tags-container {
                display: flex;
                gap: 8px;
                width: 80%;
            }

            .team-details__profile__logo-tags-container__team-logo {
                height: 48px;
                border: 1px solid #CBD5E1;
                border-radius: 4px;
                background-color: #e2e8f0;
                width: 48px;
            }

            .team-details__profile__logo-tags-container__name-tagcontainer {
                display: flex;
                flex-direction: column;
                gap: 8px; 
            }

            .team-details__profile__logo-tags-container__name-tagcontainer__team-name  {
                color: #0F172A;
                font-size: 16px;
                font-weight: 700;
                overflow: hidden;
                display: -webkit-box;
                width: fit-content;
                max-width: 200px;
                -webkit-line-clamp: 1;
                -webkit-box-orient: vertical;
                text-overflow: ellipsis;
            }

            .team-details__profile__logo-tags-container__name-tagcontainer__tags__mobile {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .team-details__profile__logo-tags-container__name-tagcontainer__tags__web {
              display: none;
            }

            .team-details__profile__notification {
                border-radius: 24px;
                border:none;
                height: 40px;
                width: 40px;
                background-color: inherit;
            }

            .team-details__profile__edit {
            display: flex;
            font-size: 14px;
            font-weight: 500;
            color: #156FF7;
            align-items: center;
            height: fit-content;
            background: none;
            border: none;
            white-space: nowrap;
            gap: 8px;}

            @media(min-width: 1024px) {
              .team-details {
                border-radius: 8px;
                background: #FFF;
                padding: 20px;
                box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
              }

              .team-details__profile__logo-tags-container {
                gap: 24px;
              }
              
              .team-details__profile__logo-tags-container__name-tagcontainer {
                gap: 12px;
            }

              .team-details__profile__logo-tags-container__name-tagcontainer__team-name {
                font-size: 24px;
                max-width: 300px;
                line-height: 32px;
              }

              .team-details__profile__logo-tags-container__name-tagcontainer__tags__mobile {
                display: none;
            }

            .team-details__profile__logo-tags-container__team-logo {
              height: 80px;
              width: 80px;
            }

            .team-details__profile__logo-tags-container__name-tagcontainer__tags__web {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
            }
            .`}
      </style>
    </>
  );
};

export default TeamDetails;
