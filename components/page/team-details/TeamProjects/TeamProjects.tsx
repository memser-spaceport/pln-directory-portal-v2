'use client';
import { useState } from 'react';
import isEmpty from 'lodash/isEmpty';
import { useToggle } from 'react-use';

import { IUserInfo } from '@/types/shared.types';
import { IFormatedTeamProject, ITeam } from '@/types/teams.types';

import { DetailsSection } from '@/components/common/profile/DetailsSection';

import { isTeamLeaderOrAdmin } from '../utils/isTeamLeaderOrAdmin';

import { TeamProjectsView } from './components/TeamProjectsView';
import { TeamProjectsAddProject } from './components/TeamProjectsAddProject';
import { TeamProjectsEditProject } from './components/TeamProjectsEditProject';
import { useCurrentUserStore } from '@/services/auth/store';

interface Props {
  projects: IFormatedTeamProject[] | undefined;
  hasProjectsEditAccess: boolean;
  team: ITeam | undefined;
  isLoggedIn: boolean;
}

export function TeamProjects(props: Props) {
  const { team, projects = [] } = props;

  const { currentUser } = useCurrentUserStore();

  const [isEditMode, toggleIsEditMode] = useToggle(false);
  const [projectToEdit, setProjectToEdit] = useState<IFormatedTeamProject>();

  if (isEmpty(projects) && team?.isFund && !isTeamLeaderOrAdmin(currentUser, team?.id)) {
    return null;
  }

  return (
    <DetailsSection editView={isEditMode || !!projectToEdit}>
      {!isEditMode && !projectToEdit && (
        <TeamProjectsView
          team={team}
          projects={projects}
          userInfo={currentUser}
          toggleIsEditMode={toggleIsEditMode}
          setProjectToEdit={setProjectToEdit}
        />
      )}

      {isEditMode && !projectToEdit && (
        <TeamProjectsAddProject
          team={team!}
          projects={projects}
          userInfo={currentUser}
          toggleIsEditMode={toggleIsEditMode}
        />
      )}

      {projectToEdit && (
        <TeamProjectsEditProject
          project={projectToEdit}
          team={team!}
          returnToViewMode={() => setProjectToEdit(undefined)}
        />
      )}
    </DetailsSection>
  );
}
