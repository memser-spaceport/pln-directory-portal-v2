"use client";

// import { IProjectView } from "../../../../../../types";

const ProjectGridView = (props: any) => {
  //props
  const project = props?.project;
  const viewType = props?.viewType;

  //variables
  const profile = project?.logo ?? "/icons/project-default.svg";
  const projectName = project?.name;
  const description = project?.description;
  const maintainerLogo = project?.maintainingTeam?.logo?.url ?? "/icons/project-default.svg";
  const maintainerName = project?.maintainingTeam?.name;
  const lookingForFunding = project?.lookingForFunding;

  return (
    <>
      <div className="projectgrid">
        <div className="projectgrid__profile">
          <img className="projectgrid__profile__img" alt="profile" src={profile} />
          {lookingForFunding && <img className="projectgrid__profile__fund" alt="profile" src="/icons/raising-fund-indicator.svg" />}
        </div>
        <div className="projectgrid__detail">
          <div className="projectgrid__detail__cn">
            <h2 className="projectgrid__detail__cn__name">{projectName}</h2>
            <p className="projectgrid__detail__cn__desc">{description}</p>
          </div>
          <div className="projectgrid__maintainer">
            <img className="projectgrid__maintainer__img" alt="img" src={maintainerLogo} />
            <div className="projectgrid__maintainer__cn">
              <p className="projectgrid__maintainer__cn__name">{maintainerName}</p>
              <p className="projectgrid__maintainer__cn__title">Maintainer</p>
            </div>
          </div>
        </div>
      </div>
      <style jsx>
        {`
          .projectgrid {
            margin-bottom: 8px;
            width: 289px;
            height: 285px;
            background-color: #fff;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
          }

          .projectgrid:hover {
              box-shadow: 0px 0px 0px 2px #156FF740;
          }

          .projectgrid__profile {
            position: relative;
            height: 64px;
            border-radius: 12px 12px 0px 0px;
            border-bottom: 1px solid #e2e8f0;
            background: linear-gradient(180deg, #fff 0%, #e2e8f0 205.47%);
          }

          .projectgrid__profile__img {
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

          .projectgrid__profile__fund{
            position: absolute;
            top: 10px;
            right:98px;
          }

          .projectgrid__detail {
            padding: 0 20px 20px 20px;
            margin-top: 38px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }

          .projectgrid__detail__cn {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
          }

          .projectgrid__detail__cn__name{
            color: #0F172A;
            font-size: 18px;
            font-weight: 600;
            line-height: 28px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            text-overflow: ellipsis;
          }

          .projectgrid__detail__cn__desc {
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

          .projectgrid__maintainer {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .projectgrid__maintainer__cn__name{
            font-weight:500;
            font-size: 13px;
            line-height: 20px;
            color: #0F172A;
            text-align: left;
          }
          .projectgrid__maintainer__cn__title{
            font-weight:500;
            font-size: 13px;
            line-height: 20px;
            color: #94A3B8;
            text-align: left;
          }

          .projectgrid__maintainer__img{
            height: 36px;
            width: 36px;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
            background-color: #e2e8f0;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }
        `}
      </style>
    </>
  );
};

export default ProjectGridView;
