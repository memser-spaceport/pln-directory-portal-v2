'use client';
import Image from 'next/image';
import { useRef } from 'react';
import isEmpty from 'lodash/isEmpty';
import { useToggle } from 'react-use';
import { useRouter } from 'next/navigation';

import { IUserInfo } from '@/types/shared.types';
import { IFormatedTeamProject, ITeam } from '@/types/teams.types';

import { EVENTS } from '@/utils/constants';

import { getAnalyticsProjectInfo, getAnalyticsTeamInfo, getAnalyticsUserInfo } from '@/utils/common.utils';

import { useTeamAnalytics } from '@/analytics/teams.analytics';

import { DetailsSection } from '@/components/common/profile/DetailsSection';

import { isTeamLeaderOrAdmin } from '../utils/isTeamLeaderOrAdmin';

import { TeamProjectsEdit } from './components/TeamProjectsEdit';
import { TeamProjectsView } from './components/TeamProjectsView';

import s from './TeamProjects.module.scss';

interface Props {
  projects: IFormatedTeamProject[] | undefined;
  hasProjectsEditAccess: boolean;
  userInfo: IUserInfo | undefined;
  team: ITeam | undefined;
  isLoggedIn: boolean;
}

export function TeamProjects(props: Props) {
  const { team, projects = [], userInfo, isLoggedIn, hasProjectsEditAccess } = props;

  const [isEditMode, toggleIsEditMode] = useToggle(false);

  const allProjectsRef = useRef<HTMLDialogElement>(null);

  const router = useRouter();
  const analytics = useTeamAnalytics();

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
    <DetailsSection editView={isEditMode}>
      {isEditMode ? (
        <TeamProjectsEdit team={team!} projects={projects} toggleIsEditMode={toggleIsEditMode} />
      ) : (
        <TeamProjectsView
          team={team}
          projects={projects}
          userInfo={userInfo}
          isLoggedIn={isLoggedIn}
          toggleIsEditMode={toggleIsEditMode}
        />
      )}
    </DetailsSection>
  );

  return (
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
    </div>
  );
}
