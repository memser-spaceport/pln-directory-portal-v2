'use client';

import { Tooltip } from '@/components/core/tooltip/tooltip';
import { getRemainingTags, getTagsLabel } from '@/services/projects.service';
import { Option } from '@/types/shared.types';
import Image from 'next/image';
import { Fragment } from 'react';

const ProjectListView = (props: any) => {
  //props
  const project = props?.project;
  const tags = project?.tags?.length ? getTagsLabel(project.tags) : [];
  const tagsCountToShow = 2;

  //variables
  const profile = project?.logo ?? '/icons/project-default.svg';
  const projectName = project?.name;
  const description = project?.tagline;
  const lookingForFunding = project?.lookingForFunding;
  const maintainerLogo = project?.maintainingTeam?.logo?.url ?? '/icons/project-default.svg';
  const maintainerName = project?.maintainingTeam?.name;

  return (
    <>
      <>
        <div className="projectlist">
          <div className="projectlistt__profile">
            <Image alt="profile" height={72} width={72} layout="intrinsic" loading="eager" priority={true} className="projectlist__profile__img" src={profile} />
          </div>
          <div className="projectlist__details">
            <div className="projectlist__details__cn">
              <div className="projectlist__details__cn__name">
                <h2 className="projectlist__details__cn__name__text">{projectName}</h2>
                {lookingForFunding && (
                  <Tooltip
                    side="top"
                    asChild
                    trigger={<img className="projectlist__details__cn__name__fund" alt="Raising funds" src="/icons/raising-fund-indicator.svg" />}
                    content={'Raising Funds'}
                  />
                )}
              </div>

              <p className="projectlist__details__cn__desc">{description}</p>
            </div>

            <div className="projectlist__details__right__container">
              <div className="projectlist__details__right__container__tags">
                {tags.slice(0, tagsCountToShow).map((tag: Option, index: number) => (
                  <Fragment key={tag.label}>
                  <Tooltip
                    asChild
                    trigger={
                      <div key={index} className="projectlist__details__right__container__tags__tag">
                    <span className="projectlist__details__right__container__tags__tag__text">{tag.label}</span>
                  </div>
                    }
                    content={tag?.label}
                  />
                </Fragment>
                  
                ))}
                {tags.length > tagsCountToShow && (
                  <Tooltip
                    asChild
                    trigger={
                      <div className="projectlist__details__right__container__tags__tag">
                    <span className="projectlist__details__right__container__tags__tag__text">+{tags.length - tagsCountToShow}</span>
                  </div>
                    }
                    content={getRemainingTags(tags,tagsCountToShow)}
                  />
                )}
              </div>
              <div className='projectlist__details__maintainer'>
              <p className="projectlist__details__maintainer__cn__title">Maintainer</p>
              <Image alt="maintainer" height={20} width={20} layout="intrinsic" loading="eager" priority={true} className="projectlist__details__maintainer__img" src={maintainerLogo} />
              <p className="projectlist__details__maintainer__cn__name">{maintainerName}</p>
              </div>
            </div>

            {/* <div className="projectlist__details__maintainer">
              <Image alt="maintainer" height={36} width={36} layout="intrinsic" loading="eager" priority={true} className="projectlist__details__maintainer__img" src={maintainerLogo} />

              <div className="projectlist__details__maintainer__cn">
                <p className="projectlist__details__maintainer__cn__name">{maintainerName}</p>
                <p className="projectlist__details__maintainer__cn__title">Maintainer</p>
              </div>
            </div> */}
          </div>
        </div>
        <style jsx>
          {`
            .projectlist {
              background-color: #fff;
              display: flex;
              border-radius: 12px;
              width: inherit;
              padding: 20px;
              gap: 8px;
              height: 158px;
              border: 1px solid #fff;
              box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
            }

            .projectlist:hover {
              box-shadow: 0px 0px 0px 2px #156ff740;
            }

            .projectlist:active {
              border-radius: 12px;
              outline-style: solid;
              outline-width: 1px;
              outline-offset: 0;
              outline-color: #156ff7;
              box-shadow: 0px 0px 0px 2px #156ff740;
            }

            .projectlistt__profile {
              position: relative;
            }

            .projectlist__details {
              align-items: center;
              // text-align: left;
              justify-content: space-between;
              display: flex !important;
              width: 100%;
              gap: 16px;
            }

            .projectlist__details__cn {
              width: 100%;
            }

            .projectlist__details__cn__name {
              display: flex;
              align-items: center;
              position: relative;
              justify-content: space-between;
            }

            .projectlist__details__cn__name__text {
              color: #0f172a;
              font-size: 18px;
              font-weight: 600;
              line-height: 28px;
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 1;
              -webkit-box-orient: vertical;
              text-overflow: ellipsis;
              word-break: break-word;
            }

            .projectlist__details__cn__desc {
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
              // margin-left: -39px;
              word-break: break-word;
            }

            .projectlist__details__right__container {
              display: flex;
              gap: 16px;
              flex-direction: column;
              width: 100%;
            }

            .projectlist__details__right__container__tags {
              display: flex;
              gap: 8px;
            }

            .projectlist__details__right__container__tags__tag {
              padding: 6px 12px 6px 12px;
              border-radius: 24px;
              background: #f1f5f9;
            }
            .projectlist__details__right__container__tags__tag__text {
              max-width: 100px;
              width: max-content;
              overflow: hidden;
              display: -webkit-box;
              -webkit-line-clamp: 1;
              -webkit-box-orient: vertical;
              text-overflow: ellipsis;
              word-break: break-word;
              font-size: 12px;
              font-weight: 500;
              line-height: 14px;
              text-align: left;
              text-underline-position: from-font;
              text-decoration-skip-ink: none;
              color: #475569;
            }

            .projectlist__details__maintainer {
              display: none;
            }

            .projectlist__details {
              align-items: center;
              text-align: left;
              justify-content: space-between;
              width: 100%;
              display: unset;
              gap: 16px;
              flex-direction: column;
            }
            
            @media (min-width: 768px) {
            .projectlist__details {
              flex-direction: row;
          }
              .projectlist {
                height: 112px;
              }

              .projectlist__details__right__container {
                width: max-content;
              }

              .projectlist__details__maintainer {
                display: flex;
                align-items: center;
                gap: 8px;
              }

              .projectlist__details__maintainer__cn__name {
                font-weight: 500;
                max-width: 140px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-size: 13px;
                line-height: 20px;
                color: #0f172a;
                text-align: left;
              }
              .projectlist__details__maintainer__cn__title {
                font-weight: 500;
                font-size: 13px;
                line-height: 20px;
                color: #94a3b8;
                text-align: left;
              }
          }

            @media (min-width: 1024px) {
              .projectlist__details {
                gap: 20px;
                max-height: 72px;
              }

              .projectlist {
                gap: 16px;
              }

              .projectlist__details__cn {
                display: flex;
                flex-direction: column;
                gap: 4px;
              }

              .projectlist__details__cn__name__text {
                width: unset;
                padding-top: 4px;
              }
              .projectlist__details__cn__name__fund {
                position: absolute;
                top: -10px;
                left: -30px;
              }

              .projectlist__details__cn__name {
                padding-top: 0px;
              }

              .projectlist__details__cn__desc {
                margin-top: 0;
                margin-left: 0;
              }

              .projectlist__details__cn__name__text {
                width: 70%;
              }

              .projectlist__details__cn__desc {
                width: 70%;
              }
              .projectlist__maintainer {
              }


              

              .projectlist__details {
                display: flex;
              }
            }
          `}
        </style>
      </>
    </>
  );
};

export default ProjectListView;
