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

interface Props {
  projects: IFormatedTeamProject[] | undefined;
  hasProjectsEditAccess: boolean;
  userInfo: IUserInfo | undefined;
  team: ITeam | undefined;
  isLoggedIn: boolean;
}

export function TeamProjects(props: Props) {
  const { team, projects = [], userInfo } = props;

  const [isEditMode, toggleIsEditMode] = useToggle(false);
  const [projectToEdit, setProjectToEdit] = useState<IFormatedTeamProject>();

  if (isEmpty(projects) && team?.isFund && !isTeamLeaderOrAdmin(userInfo, team?.id)) {
    return null;
  }

  return (
    <DetailsSection editView={isEditMode || !!projectToEdit}>
      {!isEditMode && !projectToEdit && (
        <TeamProjectsView
          team={team}
          projects={projects}
          userInfo={userInfo}
          toggleIsEditMode={toggleIsEditMode}
          setProjectToEdit={setProjectToEdit}
        />
      )}

      {isEditMode && !projectToEdit && (
        <TeamProjectsAddProject team={team!} projects={projects} userInfo={userInfo} toggleIsEditMode={toggleIsEditMode} />
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
