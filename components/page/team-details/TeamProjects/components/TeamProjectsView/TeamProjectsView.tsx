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
import {
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
  HeaderActionBtn,
} from '@/components/common/profile/DetailsSection';

import { AllProjects } from './components/AllProjects';
import { TeamProjectCard } from './components/TeamProjectCard';

import s from './TeamProjectsView.module.scss';
import Image from 'next/image';

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

  const noProjects = isEmpty(projects);

  return (
    <>
      <DetailsSectionHeader title={noProjects ? 'Projects' : `Projects (${projects?.length})`}>
        {canEdit && (
          <HeaderActionBtn onClick={toggleIsEditMode}>
            <Image loading="lazy" alt="edit" src="/icons/add-blue.svg" height={16} width={16} />
            Add New
          </HeaderActionBtn>
        )}
      </DetailsSectionHeader>

      {noProjects && (
        <DetailsSectionGreyContentContainer className={s.empty}>
          Add project experience & contribution details.
        </DetailsSectionGreyContentContainer>
      )}

      {!noProjects && (
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
