'use client';

import { ITeam } from '@/types/teams.types';
import TeamsTagsList from './teams-tags-list';

interface ITeamGridView {
  team: ITeam;
  viewType: string;
}
const TeamGridView = (props: ITeamGridView) => {
  const team = props?.team;
  const profile = team?.logo ?? '/icons/team-default-profile.svg';
  const teamName = team?.name;
  const description = team?.shortDescription;
  const tags = team?.industryTags ?? [];

  return (
    <>
      <div className="team-grid">
        <div className="team-grid__profile-container">
          <img loading="eager" className="team-grid__profile-container__profile" alt="profile" src={profile} />
        </div>
        <div className="team-grid__details-container">
          <div className="team-grid__details-container__team-detail">
            <h2 className="team-grid__details-container__team-detail__team-name">{teamName}</h2>
            <p className="team-grid__details-container__team-detail__team-desc">{description}</p>
          </div>

          <div>
            <div className="team-grid__tags__desc">
              <TeamsTagsList tags={tags} noOfTagsToShow={3} />
            </div>
            <div className="team-grid__tags__mob">
              <TeamsTagsList tags={tags} noOfTagsToShow={1} />
            </div>
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .team-grid {
            width: 167.5px;
            height: 168px;
            background-color: #fff;
            border-radius: 12px;
            box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
          }

          .team-grid:hover {
            box-shadow: 0px 0px 0px 2px #156ff740;
          }

          .team-grid:active {
            border-radius: 12px;
            outline-style: solid;
            outline-width: 1px;
            outline-offset: 0;
            outline-color: #156ff7;
            box-shadow: 0px 0px 0px 2px #156ff740;
          }

          .team-grid__profile-container {
            position: relative;
            height: 33px;
            border-radius: 12px 12px 0px 0px;
            border-bottom: 1px solid #e2e8f0;
            background: linear-gradient(180deg, #fff 0%, #e2e8f0 205.47%);
          }

          .team-grid__profile-container__profile {
            height: 36px;
            width: 36px;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
            position: absolute;
            background-color: #e2e8f0;
            right: 0;
            left: 0;
            margin: auto;
            top: 13px;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }

          .team-grid__details-container {
            padding: 0 12px 12px 12px;
            margin-top: 16px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            text-align: center;
          }

          .team-grid__details-container__team-detail {
            display: flex;
            flex-direction: column;
          }

          .team-grid__details-container__team-detail__team-name {
            color: #0f172a;
            font-size: 12px;
            font-weight: 600;
            line-height: 22px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            text-overflow: ellipsis;
          }

          .team-grid__details-container__team-detail__team-desc {
            color: #475569;
            font-size: 12px;
            font-weight: 400;
            line-height: 18px;
            height: 54px;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .team-grid__details-container__tagscontainer {
            display: flex;
            gap: 8px;
            height: 26px;
          }

          .team-grid__tags__mob {
            display: block;
          }
          .team-grid__tags__desc {
            display: none;
          }

          @media (min-width: 1024px) {
            .team-grid__details-container__tagscontainer {
              margin-left: 0;
            }

            .team-grid {
              width: 289px;
              height: 267px;
            }

            .team-grid__profile-container__profile {
              height: 72px;
              width: 72px;
              top: 20px;
            }

            .team-grid__details-container__team-detail__team-name {
              font-size: 18px;
              line-height: 28px;
            }

            .team-grid__profile-container {
              height: 64px;
            }

            .team-grid__details-container {
              padding: 0 20px 20px 20px;
              margin-top: 38px;
              gap: 10px;
            }

            .team-grid__details-container__team-detail {
              gap: 10px;
              border-bottom: 1px solid #e2e8f0;
            }

            .team-grid__details-container__team-detail__team-desc {
              font-size: 14px;
              height: 60px;
              line-height: 20px;
              margin-bottom: 10px;
            }

            .team-grid__tags__mob {
              display: none;
            }
            .team-grid__tags__desc {
              display: block;
            }
          }
        `}
      </style>
    </>
  );
};

export default TeamGridView;
