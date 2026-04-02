import { IFormatedTeamProject } from '@/types/teams.types';

export function getProjectLogo(project?: IFormatedTeamProject) {
  if (project?.isDeleted) {
    return '/icons/deleted-project-logo.svg';
  }
  if (project?.logo) {
    return project?.logo?.url;
  }
  return '/icons/default-project.svg';
}
