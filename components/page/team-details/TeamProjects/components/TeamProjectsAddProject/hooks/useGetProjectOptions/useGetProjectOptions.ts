import { useMemo } from 'react';

import { IUserInfo } from '@/types/shared.types';
import { IFormatedTeamProject } from '@/types/teams.types';
import { MultiSelectOption } from '@/components/form/FormMultiSelect';

import { isAdminUser } from '@/utils/user/isAdminUser';
import { useMember } from '@/services/members/hooks/useMember';
import { useMemberFormOptions } from '@/services/members/hooks/useMemberFormOptions';

import { ProjectOption } from './types';

import { canUserEditProject } from './utils/canUserEditProject';

interface Input {
  userInfo?: IUserInfo;
  projects: IFormatedTeamProject[];
}

export function useGetProjectOptions(input: Input) {
  const { userInfo, projects } = input;

  const { data: formOptions } = useMemberFormOptions();
  const { data: memberData } = useMember(userInfo?.uid);

  const isAdmin = isAdminUser(userInfo);
  const existingProjectUids = useMemo(() => new Set(projects.map((p) => p.uid)), [projects]);

  const userTeamUids = useMemo(() => {
    const teamUids = (memberData?.memberInfo?.teamMemberRoles ?? []).map((role: any) => role.teamUid).filter(Boolean);
    return new Set<string>(teamUids);
  }, [memberData?.memberInfo?.teamMemberRoles]);

  const options: MultiSelectOption[] = useMemo(() => {
    const projectsRaw: ProjectOption[] = formOptions?.projects ?? [];
    return projectsRaw
      .filter((item) => {
        if (existingProjectUids.has(item.projectUid)) {
          return false;
        }
        return isAdmin || canUserEditProject(item, userInfo?.uid, userTeamUids);
      })
      .map((item) => ({
        value: item.projectUid,
        label: item.projectName,
        image: item.projectLogo,
      }));
  }, [formOptions?.projects, existingProjectUids, isAdmin, userInfo?.uid, userTeamUids]);

  return options;
}
