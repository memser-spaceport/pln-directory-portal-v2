'use client';

import { Tooltip } from '@/components/core/tooltip/tooltip';
import { RaisingFunds } from '@/components/ui/raising-funds';
import { IFormatedTeamProject } from '@/types/teams.types';
import Image from 'next/image';

interface ITeamProjectCard {
  project: IFormatedTeamProject;
  hasProjectsEditAccess: boolean;
  url: string;
}
const TeamProjectCard = (props: ITeamProjectCard) => {
  const project = props?.project;
  const logo = getLogo();
  const tagLine = project?.tagline ?? '';
  const name = project?.name ?? '';
  const lookingForFunding = project?.lookingForFunding;
  const url = props?.url;

  function getLogo() {
    if (project?.isDeleted) {
      return '/icons/deleted-project-logo.svg';
    }

    if (project?.logo) {
      return project?.logo?.url;
    }
    return '/icons/team-detail-default-project-logo.svg';
  }

  return (
    <>
      <a href={url} className={`${project?.isDeleted ? 'deleted' : ''} team-project-card`} title={`${project?.isDeleted ? 'Project does not exist' : ''}`}>
        <div className="team-project-card__profilec">
          <img loading="lazy" alt="team-logo" className="team-project-card__profilec__profile-logo" src={logo} height={40} width={40} />
          <div className="team-project-card__profilec__name-and-tagline">
            <div className="team-project-card__profilec__name-and-tagline__name-and-raising-funds">
              <Tooltip asChild trigger={<h2 className="team-project-card__profilec__name-and-tagline__name">{name}</h2>} content={name} />
              {project?.isMaintainingProject && <Image src="/icons/badge/maintainer.svg" alt="maintainer image" width={20} height={20} className="rounded" />}
              {lookingForFunding && (
                <div className="team-project-card__goto__btn-section__web">
                  <RaisingFunds />
                </div>
              )}
            </div>
            <Tooltip asChild trigger={<p className="team-project-card__profilec__name-and-tagline__tagline">{tagLine}</p>} content={tagLine} />
          </div>
        </div>
        <div className="team-project-card__goto">
          <div>
            {project?.hasEditAccess && !project?.isDeleted && (
              <div className="team-project-card__goto__options">
                <button className="team-project-card__goto__options__edit">
                  <img loading="lazy" src="/icons/edit-black.svg" />
                </button>
                {/* <button className="team-project-card__goto__options__pin">
                  <img loading="lazy" src="/icons/pin-black.svg" />
                </button> */}
              </div>
            )}
          </div>

          <div className="team-project-card__goto__btn-section">
            {lookingForFunding && (
              <div className="team-project-card__goto__btn-section__mob">
                <RaisingFunds />
              </div>
            )}
            <button className="team-project-card__goto__btn">
              <img loading="lazy" alt="go-to" src="/icons/right-arrow-gray.svg" width={16} height={14} />
            </button>
          </div>
        </div>
      </a>

      <style jsx>
        {`
          .deleted {
            pointer-events: none;
          }

          .team-project-card {
            padding: 16px;
            gap: 16px;
            display: flex;
            cursor: pointer;
            justify-content: space-between;
            width: 100%;
            &:hover {
              background: linear-gradient(0deg, #f8fafc, #f8fafc), linear-gradient(0deg, #e2e8f0, #e2e8f0);
            }
          }

          .team-project-card__profilec {
            display: flex;
            gap: 16px;
          }

          .team-project-card__profilec__profile-logo {
            border-radius: 8px;
            background-color: #e2e8f0;
          }

          .team-project-card__profilec__name-and-tagline {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .team-project-card__profilec__name-and-tagline__name {
            color: #0f172a;
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
          }

          .team-project-card__profilec__name-and-tagline__tagline {
            color: #475569;
            font-size: 12px;
            font-weight: 400;
            line-height: 14px;
          }

          .team-project-card__goto {
            display: flex;
            align-items: center;
          }

          .team-project-card__goto__options {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .team-project-card__goto__btn-section {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .team-project-card__goto__btn-section__web {
            display: none;
          }

          .team-project-card__goto__btn-section__mob {
            display: flex;
            gap: 4px;
          }

          .team-project-card__profilec__name-and-tagline__name-and-raising-funds {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .team-project-card__goto__btn {
            border: none;
            background-color: inherit;
          }

          .team-project-card__goto__options__edit {
            background: #dbeafe;
            height: 24px;
            width: 24px;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 100%;
          }

          .team-project-card__goto__options__pin {
            background: #dbeafe;
            height: 24px;
            width: 24px;
            justify-content: center;
            align-items: center;
            border-radius: 100%;
          }

          @media (min-width: 1024px) {
            .team-project-card {
              justify-content: space-between;
              flex-direction: row;
              align-items: center;
            }

            .team-project-card__goto__btn-section__web {
              display: flex;
            }

            .team-project-card__goto__btn-section__mob {
              display: none;
            }

            .team-project-card__goto {
              width: fit-content;
              display: flex;
              gap: 8px;
              justify-content: space-between;
            }
          }
        `}
      </style>
    </>
  );
};

export default TeamProjectCard;
