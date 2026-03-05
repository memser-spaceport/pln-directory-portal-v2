'use client';
import Image from 'next/image';
import { useRef } from 'react';
import isEmpty from 'lodash/isEmpty';
import { useRouter } from 'next/navigation';

import { IUserInfo } from '@/types/shared.types';
import { IFormatedTeamProject, ITeam } from '@/types/teams.types';

import { EVENTS, PAGE_ROUTES } from '@/utils/constants';

import { getAnalyticsProjectInfo, getAnalyticsTeamInfo, getAnalyticsUserInfo } from '@/utils/common.utils';

import { useTeamAnalytics } from '@/analytics/teams.analytics';

import Modal from '@/components/core/modal';

import { isTeamLeaderOrAdmin } from '../utils/isTeamLeaderOrAdmin';

import AllProjects from '../all-projects';
import TeamProjectCard from '../team-project-card';

import s from './Projects.module.scss';

interface Props {
  projects: IFormatedTeamProject[] | undefined;
  hasProjectsEditAccess: boolean;
  userInfo: IUserInfo | undefined;
  team: ITeam | undefined;
  isLoggedIn: boolean;
}

export const Projects = (props: Props) => {
  const userInfo = props?.userInfo;
  const team = props?.team;
  const projects = props?.projects ?? [];
  const hasProjectsEditAccess = props?.hasProjectsEditAccess;
  const isLoggedIn = props?.isLoggedIn;

  const allProjectsRef = useRef<HTMLDialogElement>(null);

  const analytics = useTeamAnalytics();
  const router = useRouter();

  const onSeeAllClickHandler = () => {
    analytics.onTeamDetailSeeAllProjectsClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
    if (allProjectsRef?.current) {
      allProjectsRef?.current?.showModal();
    }
  };

  const onClosePopupClicked = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.TEAM_DETAIL_ALL_PROJECTS_CLOSE, { detail: '' }));
    if (allProjectsRef?.current) {
      allProjectsRef?.current?.close();
    }
  };

  const onProjectCardClicked = (project: any) => {
    analytics.onTeamDetailProjectClicked(
      getAnalyticsTeamInfo(team),
      getAnalyticsUserInfo(userInfo),
      getAnalyticsProjectInfo(project),
    );
  };

  const onAddProjectClicked = () => {
    analytics.onTeamDetailAddProjectClicked(getAnalyticsUserInfo(userInfo), getAnalyticsTeamInfo(team));
    router.push('/projects/add');
  };

  const onEditProjectClicked = (project: any) => {
    analytics.onTeamDetailProjectEditClicked(
      getAnalyticsUserInfo(userInfo),
      getAnalyticsTeamInfo(team),
      getAnalyticsProjectInfo(project),
    );
    router.push(`/projects/update/${project.uid}`);
  };

  if (isEmpty(projects) && team?.isFund && !isTeamLeaderOrAdmin(userInfo, team?.id)) {
    return null;
  }

  return (
    <>
      <div className={s.root}>
        <div className={s.header}>
          <h2 className={s.title}>Projects ({projects?.length ? projects?.length : 0})</h2>
          <div className={s.headerActions}>
            {isLoggedIn && (
              <button className={s.addBtn} onClick={onAddProjectClicked}>
                <Image loading="lazy" alt="edit" src="/icons/add-blue.svg" height={16} width={16} />
                <p className={s.addBtnLabel}>Add Project</p>
              </button>
            )}
            {projects?.length > 3 && (
              <button className={s.seeAllBtn} onClick={onSeeAllClickHandler}>
                <p className={s.seeAllBtnLabel}>See All</p>
              </button>
            )}
          </div>
        </div>

        {projects?.length !== 0 && (
          <div className={s.projectsWeb}>
            {projects?.slice(0, 3).map((project: IFormatedTeamProject, index: number) => (
              <div key={`${project} + ${index}`} className={index < projects?.length - 1 ? s.projectBorder : undefined}>
                <TeamProjectCard
                  onEditClicked={onEditProjectClicked}
                  onCardClicked={onProjectCardClicked}
                  url={`${PAGE_ROUTES.PROJECTS}/${project?.uid}`}
                  hasProjectsEditAccess={hasProjectsEditAccess}
                  project={project}
                />
              </div>
            ))}
          </div>
        )}

        {projects?.length === 0 && (
          <div className={s.emptyProjects}>
            {isLoggedIn ? (
              <p className={s.emptyMessage}>
                No projects added.&nbsp;
                <a href={PAGE_ROUTES.PROJECTS} className={s.emptyLink}>
                  Click here
                </a>
                &nbsp;to add a new project.
              </p>
            ) : (
              <p className={s.emptyMessage}>No projects added.</p>
            )}
          </div>
        )}

        <Modal modalRef={allProjectsRef} onClose={onClosePopupClicked}>
          <AllProjects
            onEditClicked={onEditProjectClicked}
            onCardClicked={onProjectCardClicked}
            hasProjectsEditAccess={hasProjectsEditAccess}
            projects={projects}
          />
        </Modal>
      </div>
    </>
  );
};
