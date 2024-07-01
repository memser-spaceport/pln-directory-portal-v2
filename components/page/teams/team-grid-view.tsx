"use client";

import { ITag, ITeam } from "@/types/teams.types";
import { VIEW_TYPE_OPTIONS } from "@/utils/constants";
import { Fragment } from "react";
import { Tooltip } from "../../core/tooltip/tooltip";
import { Tag } from "../../ui/tag";

interface ITeamGridView {
  team: ITeam;
  viewType: string;
}
const TeamGridView = (props: ITeamGridView) => {
  const team = props?.team;
  const profile = team?.logo ?? "/icons/team-default-profile.svg";
  const teamName = team?.name;
  const description = team?.shortDescription;
  const tags = team?.industryTags ?? [];

  return (
    <>
      <div className="team-grid">
        <div className="team-grid__profile-container">
          <img loading="lazy" className="team-grid__profile-container__profile" alt="profile" src={profile} />
        </div>
        <div className="team-grid__details-container">
          <div className="team-grid__details-container__team-detail">
            <h2 className="team-grid__details-container__team-detail__team-name">{teamName}</h2>
            <p className="team-grid__details-container__team-detail__team-desc">{description}</p>
          </div>

          <div className="team-grid__details-container__tagscontainer">
            {tags?.map((tag: ITag, index: number) => (
              <Fragment key={`${tag} + ${index}`}>
                {index < 3 && <Tooltip asChild trigger={<div><Tag value={tag?.title} variant="primary" tagsLength={tags?.length} /> </div>} content={tag?.title} />}
              </Fragment>
            ))}
            {tags?.length > 3 && (
              <Tooltip
              asChild
                trigger={<div><Tag variant="primary" value={"+" + (tags?.length - 3).toString()}></Tag> </div>}
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
          .team-grid {
            margin-bottom: 8px;
            width: 289px;
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
            height: 64px;
            border-radius: 12px 12px 0px 0px;
            border-bottom: 1px solid #e2e8f0;
            background: linear-gradient(180deg, #fff 0%, #e2e8f0 205.47%);
          }

          .team-grid__profile-container__profile {
            height: 72px;
            width: 72px;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
            position: absolute;
            background-color: #e2e8f0;
            right: 0;
            left: 0;
            margin: auto;
            top: 20px;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }

          .team-grid__details-container {
            padding: 0 20px 20px 20px;
            margin-top: 38px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }

          .team-grid__details-container__team-detail {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
          }

          .team-grid__details-container__team-detail__team-name {
            color: #0f172a;
            font-size: 18px;
            font-weight: 600;
            line-height: 28px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            text-overflow: ellipsis;
          }

          .team-grid__details-container__team-detail__team-desc {
            color: #475569;
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            height: 60px;
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

          @media (min-width: 1024px) {
            .team-grid__details-container__tagscontainer {
              margin-left: 0;
            }
          }
        `}
      </style>
    </>
  );
};

export default TeamGridView;
