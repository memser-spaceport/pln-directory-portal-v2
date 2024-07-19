
"use client";

import { ITag, ITeam } from "@/types/teams.types";
import { Fragment } from "react";
import { Tooltip } from "../../core/tooltip/tooltip";
import { Tag } from "../../ui/tag";


interface ITeamListView {
  team: ITeam;
  viewType: string;
}
const TeamListView = (props: ITeamListView) => {
  const team = props?.team;
  const viewType = props?.viewType;
  const profile = team?.logo ?? "/icons/team-default-profile.svg";
  const teamName = team?.name;
  const description = team?.shortDescription;
  const tags = team?.industryTags ?? [];

  return (
    <>
      <div className="team-list">
        <div className="team-list__profile-container">
          <img className="team-list__profile-container__profile" alt="profile" src={profile} />
        </div>
        <div className="team-list__details-container">
          <div className="team-list__details-container__team-detail">
            <h2 className="team-list__details-container__team-detail__team-name">{teamName}</h2>
            <p className="team-list__details-container__team-detail__team-desc">{description}</p>
          </div>

          <div className="team-list__details-container__tagscontainer team-list__details-container__tagscontainer">
            {tags?.map((tag: ITag, index: number) => (
              <Fragment key={`${tag} + ${index}`}>
                {index < 3 && <div>{<Tooltip asChild trigger={<div><Tag value={tag?.title} variant="primary" tagsLength={tags?.length} /> </div>} content={tag?.title} />}</div>}
              </Fragment>
            ))}
            {tags?.length > 3 && (
              <Tooltip
              asChild
                trigger={<div><Tag variant="primary" value={"+" + (tags?.length - 3).toString()}></Tag></div>}
                content={
                  <div>
                    {tags?.slice(3, tags?.length).map((tag, index) => (
                      <div key={`${tag} + ${tag} + ${index}`}>
                        {tag?.title}{index !== tags?.slice(3, tags?.length - 1)?.length ? "," : ""}
                      </div>
                    ))}
                  </div>
                }
              />
            )}
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .team-list {
            background-color: #fff;
            display: flex;
            border-radius: 12px;
            width: inherit;
            padding: 20px;
            gap: 8px;
            border: 1px solid #fff;
            box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
          }

          .team-list:hover {
            box-shadow: 0px 0px 0px 2px #156ff740;
          }

          .team-list:active {
            border-radius: 12px;
            outline-style: solid;
            outline-width: 1px;
            outline-offset: 0;
            outline-color: #156ff7;
            box-shadow: 0px 0px 0px 2px #156ff740;
          }

          .team-list__profile-container__profile {
            height: 32px;
            width: 32px;
            background-color: #e2e8f0;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }

          .team-list__details-container {
            align-items: center;
            text-align: left;
            display: grid;
            width: 100%;
            gap: 16px;
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }

          .team-list__details-container__team-detail__team-name {
            color: #0f172a;
            font-size: 18px;
            font-weight: 600;
            line-height: 28px;
            padding-top: 4px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            text-overflow: ellipsis;
          }

          .team-list__details-container__team-detail__team-desc {
            color: #475569;
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-top: 5px;
            margin-left: -39px;
          }

          .team-list__details-container__tagscontainer {
            display: flex;
            gap: 8px;
            height: 26px;
            margin-left: -37px;
          }

          @media (min-width: 1024px) {
            .team-list__details-container {
              gap: 20px;
              max-height: 72px;
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .team-list {
              gap: 16px;
            }

            .team-list__details-container__team-detail {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }

            .team-list__details-container__team-detail__team-name {
              padding-top: 0px;
            }

            .team-list-container__team-detail__team-name {
              padding-top: 0;
            }

            .team-list__details-container__team-detail__team-desc {
              margin-top: 0;
              margin-left: 0;
            }

            .team-list__details-container__tagscontainer {
              justify-content: end;
              flex-wrap: wrap;
            }

            .team-list__profile-container__profile {
              height: 72px;
              width: 72px;
            }
          }
        `}
      </style>
    </>
  );
};

export default TeamListView;
