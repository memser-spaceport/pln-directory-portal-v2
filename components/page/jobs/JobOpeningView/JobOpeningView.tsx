'use client';

import { PAGE_ROUTES } from '@/utils/constants';
import { SHOW_JOB_BOARD_APPLY } from '@/services/jobs/constants';
import { canSeeOriginalPosting } from '@/services/jobs/job-board-viewer';
import { useRoleApplication } from '@/services/jobs/hooks/useJobApplications';
import type { IJobTeamGroup } from '@/types/jobs.types';
import type { IUserInfo } from '@/types/shared.types';
import { BackButton } from '@/components/ui/BackButton';
import { JobDetailPane } from '@/components/page/jobs/JobDetailPane/JobDetailPane';
import { useJobApplySurface } from '@/components/page/jobs/hooks/useJobApplySurface';
import { ReferRoleRow } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow';

import s from './JobOpeningView.module.scss';

interface JobOpeningViewProps {
  group: IJobTeamGroup;
  userInfo: IUserInfo | undefined;
  isLoggedIn: boolean;
}

export function JobOpeningView({ group, userInfo, isLoggedIn }: JobOpeningViewProps) {
  const role = group.roles[0];
  const team = group.team;
  const surface = useJobApplySurface({
    enabled: SHOW_JOB_BOARD_APPLY,
    source: 'job-board',
    isLoggedIn,
    userInfo,
    groups: [group],
    isLoading: false,
    deepLink: false,
  });
  const application = useRoleApplication(role?.uid ?? '', {
    memberUid: surface.applyProps?.memberUid,
    enabled: !!surface.applyProps && !!role,
  });

  if (!role) return null;

  return (
    <div className={s.page}>
      <BackButton to={PAGE_ROUTES.JOBS} forceTo />
      <article className={s.article}>
        <JobDetailPane
          role={role}
          team={team}
          applied={!!application}
          appliedAt={application?.appliedAt}
          source="job-board"
          showOriginalPosting={canSeeOriginalPosting({ isLoggedIn, userInfo })}
        />
        {surface.applyProps && (
          <div className={s.actions}>
            <ReferRoleRow
              role={role}
              teamId={team.uid}
              teamName={team.name}
              team={team}
              currentUser={userInfo ?? null}
              source="job-board"
              apply={{
                onApply: surface.applyProps.onApply,
                memberUid: surface.applyProps.memberUid,
              }}
            />
          </div>
        )}
      </article>
      {surface.controller}
    </div>
  );
}
