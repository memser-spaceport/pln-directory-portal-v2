'use client';

import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { RaisingFunds } from '@/components/ui/raising-funds';
import { IUserInfo } from '@/types/shared.types';
import { IFormatedTeamProject, ITeam } from '@/types/teams.types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

/**
 * Props for the TeamProjectCard component.
 * @interface ITeamProjectCard
 * @property {IFormatedTeamProject} project - The project data to display.
 * @property {boolean} hasProjectsEditAccess - Whether the user has edit access to the project.
 * @property {string} url - The URL to the project details page.
 * @property {Function} onCardClicked - Callback when the card is clicked.
 * @property {Function} onEditClicked - Callback when the edit button is clicked.
 */
interface ITeamProjectCard {
  project: IFormatedTeamProject;
  hasProjectsEditAccess: boolean;
  url: string;
  onCardClicked: any;
  onEditClicked: any;
}

/**
 * TeamProjectCard displays a project card for a team, including logo, name, tagline, and edit/go-to actions.
 * Handles edit access, fundraising, and maintainer badges, and disables interaction for deleted projects.
 *
 * @component
 * @param {ITeamProjectCard} props - The props for the component.
 * @returns {JSX.Element} The rendered project card UI.
 */
const TeamProjectCard = (props: ITeamProjectCard) => {
  const project = props?.project;
  const logo = getLogo();
  const tagLine = project?.tagline ?? '';
  const name = project?.name ?? '';
  const lookingForFunding = project?.lookingForFunding;
  const url = props?.url;
  const callback = props?.onCardClicked;
  const onEditClicked = props?.onEditClicked;

  /**
   * Returns the appropriate logo URL for the project.
   * @private
   * @returns {string} Logo URL
   */
  function getLogo() {
    if (project?.isDeleted) {
      return '/icons/deleted-project-logo.svg';
    }

    if (project?.logo) {
      return project?.logo?.url;
    }
    return '/icons/default-project.svg';
  }

  return (
    <>
      {/* Main project card container */}
      <a target='_blank' onClick={() => callback(project)} href={url} className={`${project?.isDeleted ? 'deleted' : ''} team-project-card`} title={`${project?.isDeleted ? 'Project does not exist' : ''}`}>
        <div className="team-project-card__profilec">
          {/* Project logo */}
          <img loading="lazy" alt="team-logo" className="team-project-card__profilec__profile-logo" src={logo} height={40} width={40} />
          <div className="team-project-card__profilec__name-and-tagline">
            <div className="team-project-card__profilec__name-and-tagline__name-and-raising-funds">
              {/* Project name with tooltip */}
              <Tooltip asChild trigger={<h2 className="team-project-card__profilec__name-and-tagline__name">{name}</h2>} content={name} />
              {/* Maintainer badge if applicable */}
              {project?.isMaintainingProject && (
                <Tooltip
                  side="top"
                  asChild
                  trigger={
                    <div className="team-project-card__profilec__name-and-tagline__name-and-raising-funds__mtr">
                      <Image src="/icons/badge/maintainer.svg" alt="maintainer image" width={20} height={20} className="rounded" />{' '}
                    </div>
                  }
                  content={'Maintainer'}
                />
              )}
              {/* Raising Funds badge if applicable */}
              {lookingForFunding && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  className="team-project-card__goto__btn-section__web"
                >
                  <Tooltip
                    asChild
                    side="top"
                    trigger={
                      <div>
                        <RaisingFunds />{' '}
                      </div>
                    }
                    content={'Raising Funds'}
                  />
                </div>
              )}
            </div>
            {/* Project tagline with tooltip */}
            <Tooltip asChild trigger={<p className="team-project-card__profilec__name-and-tagline__tagline">{tagLine}</p>} content={tagLine} />
          </div>
        </div>
        <div className="team-project-card__goto">
          <div>
            {/* Edit button if user has access and project is not deleted */}
            {project?.hasEditAccess && !project?.isDeleted && (
              <div className="team-project-card__goto__options">
                <button
                  className="team-project-card__goto__options__edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onEditClicked(project);
                  }}
                >
                  <img loading="lazy" src="/icons/edit-black.svg" />
                </button>
              </div>
            )}
          </div>

          {/* Go-to button section */}
          <div className="team-project-card__goto__btn-section">
            <button className="team-project-card__goto__btn">
              <img loading="lazy" alt="go-to" src="/icons/right-arrow-gray.svg" width={16} height={16} />
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
            word-break: break-word;
            max-width: 100px;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
          }

          .team-project-card__profilec__name-and-tagline__tagline {
            color: #475569;
            font-size: 12px;
            font-weight: 400;
            word-break: break-word;
            white-space: wrap;
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

          .team-project-card__goto__btn {
            background: inherit;
          }

          .team-project-card__goto__btn-section {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .team-project-card__goto__btn-section__mob {
            display: flex;
            gap: 4px;
          }

          .team-project-card__profilec__name-and-tagline__name-and-raising-funds {
            display: flex;
            align-items: center;
            height: 20px;
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

          .team-project-card__profilec__name-and-tagline__name-and-raising-funds__mtr {
            height: 20px;
          }

          @media (min-width: 1024px) {
            .team-project-card {
              justify-content: space-between;
              flex-direction: row;
              align-items: center;
            }

            .team-project-card__profilec__name-and-tagline__name {
              max-width: 250px;
            }

            .team-project-card__goto__btn-section__web {
              display: flex;
              height: 20px;
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
