'use client';

import { Tooltip } from '@/components/core/tooltip/tooltip';

const ProjectGridView = (props: any) => {
  //props
  const project = props?.project;
  const viewType = props?.viewType;

  //variables
  const profile = project?.logo ?? '/icons/project-default.svg';
  const projectName = project?.name;
  const description = project?.tagline;
  const maintainerLogo = project?.maintainingTeam?.logo?.url ?? '/icons/team-default-profile.svg';
  const maintainerName = project?.maintainingTeam?.name;
  const lookingForFunding = project?.lookingForFunding;

  //methods
  const handleIconClick = (e:any) => {
    e.preventDefault();
    e.stopPropagation();
  }

  return (
    <>
      <div className="projectgrid">
        <div className="projectgrid__profile">
          <img className="projectgrid__profile__img" alt="profile" src={profile} />
          {lookingForFunding && <Tooltip side="top" asChild trigger={<img className="projectgrid__profile__fund" onClick={handleIconClick} alt="profile" src="/icons/raising-fund-indicator.svg" />} content={'Raising Funds'} />}
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
            width: 167.5px;
            height: 184px;
            background-color: #fff;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
          }

          .projectgrid:hover {
            box-shadow: 0px 0px 0px 2px #156ff740;
          }

          .projectgrid__profile {
            position: relative;
            height: 33px;
            border-radius: 12px 12px 0px 0px;
            border-bottom: 1px solid #e2e8f0;
            background: linear-gradient(180deg, #fff 0%, #e2e8f0 205.47%);
          }

          .projectgrid__profile__img {
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

          .projectgrid__detail {
            padding: 0 12px 12px 12px;
            margin-top: 15px;
            display: flex;
            flex-direction: column;
            text-align: center;
            gap: 8px;
          }

          .projectgrid__detail__cn {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .projectgrid__detail__cn__name {
            color: #0f172a;
            font-size: 12px;
            font-weight: 600;
            line-height: 22px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            text-overflow: ellipsis;
            word-break: break-word;
          }

          .projectgrid__detail__cn__desc {
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

          .projectgrid__maintainer {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .projectgrid__maintainer__cn__name {
            font-weight: 500;
            font-size: 12px;
            color: #0f172a;
            text-align: left;
            text-overflow: ellipsis;
            max-width: 106px;
            white-space: nowrap;
            overflow: hidden;
            display: inline-block;
            line-height: 18px;
          }

          .projectgrid__maintainer__cn__title {
            font-weight: 500;
            font-size: 11px;
            line-height: 20px;
            color: #94a3b8;
            text-align: left;
            line-height: 18px;
          }

          .projectgrid__maintainer__img {
            height: 28px;
            width: 28px;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
            background-color: #e2e8f0;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }

          .projectgrid__maintainer__cn {
            display: flex;
            flex-direction: column;
          }

          .projectgrid__profile__fund {
            display: block;
            position: absolute;
            top: 6px;
            right: 56px;
            height: 20px;
            width: 20px;
          }

          @media (min-width: 1024px) {
            .projectgrid {
              width: 289px;
              height: 285px;
            }

            .projectgrid__profile {
              height: 64px;
            }

            .projectgrid__detail__cn__name {
              font-size: 18px;
              line-height: 28px;
            }

            .projectgrid__profile__img {
              height: 72px;
              width: 72px;
              top: 20px;
            }

            .projectgrid__detail__cn {
              gap: 10px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 10px;
            }

            .projectgrid__detail {
              padding: 0 20px 20px 20px;
              margin-top: 38px;
              gap: 10px;
            }

            .projectgrid__detail__cn__desc {
              line-height: 20px;
              height: 60px;
              font-size: 14px;
            }

            .projectgrid__maintainer__img {
              height: 36px;
              width: 36px;
            }

            .projectgrid__maintainer__cn__name {
              font-size: 13px;
              line-height: 20px;
              max-width: 200px;
            }

            .projectgrid__maintainer__cn__title {
              font-size: 13px;
              line-height: 20px;
            }

            .projectgrid__profile__fund {
              display: block;
              position: absolute;
              top: 10px;
              right: 98px;
              height: 24px;
              width: 24px;
            }
          }
        `}
      </style>
    </>
  );
};

export default ProjectGridView;
