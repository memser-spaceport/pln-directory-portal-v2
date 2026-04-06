import { useRef } from 'react';
import isEmpty from 'lodash/isEmpty';
import { useRouter } from 'next/navigation';

import { IUserInfo } from '@/types/shared.types';
import { IFormatedTeamProject, ITeam } from '@/types/teams.types';

import { EVENTS, PAGE_ROUTES } from '@/utils/constants';

import { isTeamLeaderOrAdmin } from '@/components/page/team-details/utils/isTeamLeaderOrAdmin';
import { getAnalyticsProjectInfo, getAnalyticsTeamInfo, getAnalyticsUserInfo } from '@/utils/common.utils';

import { useTeamAnalytics } from '@/analytics/teams.analytics';

import {
  HeaderActionBtn,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
} from '@/components/common/profile/DetailsSection';
import Modal from '@/components/core/modal';

import { AllProjects } from './components/AllProjects';
import { TeamProjectCard } from './components/TeamProjectCard';

import s from './TeamProjectsView.module.scss';
import Image from 'next/image';

interface Props {
  team?: ITeam;
  userInfo?: IUserInfo;
  projects?: IFormatedTeamProject[];
  toggleIsEditMode: () => void;
  setProjectToEdit: (project?: IFormatedTeamProject) => void;
}

const PROJECTS_TO_SHOW = 3;

export function TeamProjectsView(props: Props) {
  const { team, userInfo, projects, toggleIsEditMode, setProjectToEdit } = props;

  const router = useRouter();
  const analytics = useTeamAnalytics();

  const allProjectsRef = useRef<HTMLDialogElement>(null);

  const canEdit = isTeamLeaderOrAdmin(userInfo, team?.id);
  const projectsNum = projects?.length ?? 0;

  const onEditProjectClicked = (project: IFormatedTeamProject) => {
    analytics.onTeamDetailProjectEditClicked(
      getAnalyticsUserInfo(userInfo),
      getAnalyticsTeamInfo(team),
      getAnalyticsProjectInfo(project),
    );

    setProjectToEdit(project);
    // router.push(`/projects/update/${project.uid}`);
  };

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

  const onProjectCardClicked = (project: IFormatedTeamProject) => {
    analytics.onTeamDetailProjectClicked(
      getAnalyticsTeamInfo(team),
      getAnalyticsUserInfo(userInfo),
      getAnalyticsProjectInfo(project),
    );
  };

  const noProjects = isEmpty(projects);

  return (
    <>
      <DetailsSectionHeader title={noProjects ? 'Projects' : `Projects (${projectsNum})`}>
        {canEdit && (
          <HeaderActionBtn onClick={toggleIsEditMode}>
            <Image loading="lazy" alt="edit" src="/icons/add-blue.svg" height={16} width={16} />
            Add New
          </HeaderActionBtn>
        )}
      </DetailsSectionHeader>

      {noProjects && (
        <DetailsSectionGreyContentContainer className={s.empty}>
          Add projects associated with this team.
        </DetailsSectionGreyContentContainer>
      )}

      {!noProjects && (
        <div className={s.projects}>
          {projects
            ?.slice(0, PROJECTS_TO_SHOW)
            .map((project: IFormatedTeamProject, index: number) => (
              <TeamProjectCard
                key={`${project} + ${index}`}
                onEditClicked={onEditProjectClicked}
                onCardClicked={onProjectCardClicked}
                url={`${PAGE_ROUTES.PROJECTS}/${project?.uid}`}
                hasProjectsEditAccess={canEdit}
                project={project}
              />
            ))}
        </div>
      )}

      {projectsNum > PROJECTS_TO_SHOW && (
        <div className={s.showAll} onClick={onSeeAllClickHandler}>
          Show All Projects
        </div>
      )}

      <Modal modalRef={allProjectsRef} onClose={onClosePopupClicked}>
        <AllProjects
          onEditClicked={(project: IFormatedTeamProject) => {
            onEditProjectClicked(project);

            if (allProjectsRef?.current) {
              allProjectsRef?.current?.close();
            }
          }}
          onCardClicked={onProjectCardClicked}
          hasProjectsEditAccess={canEdit}
          projects={projects || []}
        />
      </Modal>
    </>
  );
}
