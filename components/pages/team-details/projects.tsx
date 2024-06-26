'use client';

import { IUserInfo } from '@/types/shared.types';
import { IFormatedTeamProject, ITeam } from '@/types/teams.types';
import { PAGE_ROUTES } from '@/utils/constants';
import { Fragment, useState } from 'react';
import TeamProjectCard from './team-project-card';
import AllProjects from './all-projects';
import Modal from '@/components/core/modal';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { getAnalyticsProjectInfo, getAnalyticsTeamInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';

interface IProjects {
  projects: IFormatedTeamProject[] | undefined;
  hasProjectsEditAccess: boolean;
  userInfo: IUserInfo | undefined;
  team: ITeam | undefined;
}
const Projects = (props: IProjects) => {
  const userInfo = props?.userInfo;
  const team = props?.team;
  const projects = props?.projects ?? [];
  const hasProjectsEditAccess = props?.hasProjectsEditAccess;

  const [isSeeAll, setIsSeAll] = useState(false);

    const analytics = useTeamAnalytics();

  const onSeeAllClickHandler = () => {
    if (!isSeeAll) {
      analytics.onTeamDetailSeeAllProjectsClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
    }
    setIsSeAll(!isSeeAll);
  };

  const onProjectCardClicked = (project: any) => {
    triggerLoader(true);
    analytics.onTeamDetailProjectClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo), getAnalyticsProjectInfo(project));
  } 

  return (
    <>
      <div className="projects-container">
        <div className="projects-container__header">
          <h2 className="projects-container__header__title">Projects({projects?.length ? projects?.length : 0})</h2>
          <div className="projects-container__header__edit-and-seeallcontainer">
            {hasProjectsEditAccess && (
              <div className="projects-container__header__eidt-access">
                <button className="projects-container__header__eidt-access__edit-btn">
                  <img loading="lazy" alt="edit" src="/icons/add-blue.svg" height={16} width={16} />
                  <p>Add Project</p>
                </button>
              </div>
            )}
            {projects?.length > 3 && (
              <button className="project-container__header__seeall-btn" onClick={onSeeAllClickHandler}>
                See all
              </button>
            )}
          </div>
        </div>
        {/* Projects Mob*/}
        {/* {projects?.length !== 0 && (
          <div className="projects-container__projects-mob">
            {projects?.map((project: IFormatedTeamProject, index: number) => (
              <Fragment key={`${project} + ${index}`}>
                {index < 3 && (
                  <div className={`${index < projects?.length - 1 ? 'projects-container__projects__project__border-set' : ''}`}>
                    <TeamProjectCard url={`${PAGE_ROUTES.PROJECTS}/${project?.id}`} hasProjectsEditAccess={hasProjectsEditAccess} project={project} />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        )} */}

        {/* Projects Web*/}
        {projects?.length !== 0 && (
          <div className="projects-container__projects-web">
            {projects?.slice(0, 3).map((project: IFormatedTeamProject, index: number) => (
              <div key={`${project} + ${index}`} className={`${index < projects?.length - 1 ? 'projects-container__projects__project__border-set' : ''}`}>
                <TeamProjectCard onCardClicked={onProjectCardClicked} url={`${PAGE_ROUTES.PROJECTS}/${project?.uid}`} hasProjectsEditAccess={hasProjectsEditAccess} project={project} />
              </div>
            ))}
          </div>
        )}

        {projects?.length === 0 && (
          <div className="projects-container__empty__projects">
            {hasProjectsEditAccess ? (
              <p className="projects-container__empty__project__member-message">
                No projects added.&nbsp;
                <a href={PAGE_ROUTES.PROJECTS} className="projects-container__empty__project__member-message__link">
                  Click Here
                </a>
                &nbsp; to add a new project.
              </p>
            ) : (
              <p className="projects-container__empty__project__member-message">No Projects added yet.</p>
            )}
          </div>
        )}

        {isSeeAll && (
          <Modal onClose={onSeeAllClickHandler}>
            <AllProjects onCardClicked={onProjectCardClicked} hasProjectsEditAccess={hasProjectsEditAccess} projects={projects} />
          </Modal>
        )}
      </div>

      <style jsx>
        {`
          .projects-container {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
          }

          .projects-container__empty__projects {
            border-radius: 12px;
            background: #fff;
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
          }

          .project-container__header__seeall-btn {
            color: #156ff7;
            font-size: 14px;
            display: unset;
            font-weight: 500;
            line-height: 20px;
            border: none;
            background-color: #fff;
          }

          .projects-container__empty__project__member-message {
            color: #0f172a;
            font-size: 12px;
            font-weight: 400;
            line-height: 20px;
            color: #000;
            letter-spacing: 0.12px;
          }

          .projects-container__empty__project__member-message__link {
            color: #156ff7;
            font-size: 12px;
            font-weight: 500;
            line-height: 20px;
            letter-spacing: 0.12px;
          }

          .projects-container__header {
            display: flex;
            width: 100%;
            justify-content: space-between;
            align-items: center;
          }

          .projects-container__header__edit-and-seeallcontainer {
            display: flex;
            gap: 20px;
            align-items: center;
          }

          .projects-container__header__title {
            color: #64748b;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
          }

          .projects-container__header__eidt-access__edit-btn {
            display: flex;
            gap: 4px;
            align-items: center;
            color: #156ff7;
            font-size: 14px;
            font-weight: 500;
            border: none;
            background: #fff;
            line-height: 24px;
          }
            
          .projects-container__projects-mob {
            background-color: #fff;
            display: unset;
            border-radius: 8px;
            max-height: 372px;
            overflow: auto;
            background: #fff;
            border: 1px solid #e2e8f0;
            box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
          }

          .projects-container__projects__project__border-set {
            border-bottom: 1px solid #e2e8f0;
          }

          @media (min-width: 1024px) {
            .projects-container {
              padding: 20px;
            }

            .projects-container__projects-web {
              background-color: #fff;
              display: unset;
              border-radius: 8px;
              max-height: 300px;
              background: #fff;
              overflow: auto;
              border: 1px solid #e2e8f0;
              box-shadow: 0px 4px 4px 0px rgba(15, 23, 42, 0.04), 0px 0px 1px 0px rgba(15, 23, 42, 0.12);
            }

            .projects-container__projects-mob {
              display: none;
            }
          }
        `}
      </style>
    </>
  );
};

export default Projects;
