import { useRef } from 'react';
import isEmpty from 'lodash/isEmpty';
import { useRouter } from 'next/navigation';

import { IUserInfo } from '@/types/shared.types';
import { IFormatedTeamProject, ITeam } from '@/types/teams.types';

import { EVENTS, PAGE_ROUTES } from '@/utils/constants';

import { isTeamLeaderOrAdmin } from '@/components/page/team-details/utils/isTeamLeaderOrAdmin';
import { getAnalyticsProjectInfo, getAnalyticsTeamInfo, getAnalyticsUserInfo } from '@/utils/common.utils';

import { useTeamAnalytics } from '@/analytics/teams.analytics';

import Modal from '@/components/core/modal';
import { EditButton } from '@/components/common/profile/EditButton';
import { DetailsSectionGreyContentContainer, DetailsSectionHeader } from '@/components/common/profile/DetailsSection';

import { AllProjects } from './components/AllProjects';
import { TeamProjectCard } from './components/TeamProjectCard';

import s from './TeamProjectsView.module.scss';

interface Props {
  team?: ITeam;
  userInfo?: IUserInfo;
  isLoggedIn: boolean;
  projects?: IFormatedTeamProject[];
  toggleIsEditMode: () => void;
}

export function TeamProjectsView(props: Props) {
  const { team, userInfo, projects, isLoggedIn, toggleIsEditMode } = props;

  const router = useRouter();
  const analytics = useTeamAnalytics();

  const allProjectsRef = useRef<HTMLDialogElement>(null);

  const canEdit = isTeamLeaderOrAdmin(userInfo, team?.id);

  const onEditProjectClicked = (project: IFormatedTeamProject) => {
    analytics.onTeamDetailProjectEditClicked(
      getAnalyticsUserInfo(userInfo),
      getAnalyticsTeamInfo(team),
      getAnalyticsProjectInfo(project),
    );
    router.push(`/projects/update/${project.uid}`);
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

  return (
    <>
      <DetailsSectionHeader title="Projects">
        {canEdit && <EditButton onClick={toggleIsEditMode} />}
      </DetailsSectionHeader>

      {!isEmpty(projects) && (
        <div className={s.projectsWeb}>
          {projects?.slice(0, 3).map((project: IFormatedTeamProject, index: number) => (
            <div key={`${project} + ${index}`} className={index < projects?.length - 1 ? s.projectBorder : undefined}>
              <TeamProjectCard
                onEditClicked={onEditProjectClicked}
                onCardClicked={onProjectCardClicked}
                url={`${PAGE_ROUTES.PROJECTS}/${project?.uid}`}
                hasProjectsEditAccess={canEdit}
                project={project}
              />
            </div>
          ))}
        </div>
      )}

      {isEmpty(projects) && (
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
          hasProjectsEditAccess={canEdit}
          projects={projects || []}
        />
      </Modal>
    </>
  );
}
