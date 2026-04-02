import { ProjectOption } from '../types';

export function canUserEditProject(project: ProjectOption, userUid: string | undefined, userTeamUids: Set<string>): boolean {
  const { createdBy, maintainingTeamUid, contributingTeamUids } = project;

  if (createdBy === userUid) {
    return true;
  }

  if (maintainingTeamUid && userTeamUids.has(maintainingTeamUid)) {
    return true;
  }

  if (contributingTeamUids?.some((uid) => userTeamUids.has(uid))) {
    return true;
  }

  return false;
}
