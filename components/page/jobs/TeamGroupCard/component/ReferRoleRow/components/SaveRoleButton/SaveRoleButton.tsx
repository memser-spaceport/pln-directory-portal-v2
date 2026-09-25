'use client';

import clsx from 'clsx';

import { useJobsAnalytics, type JobSurface } from '@/analytics/jobs.analytics';
import type { IJobRole } from '@/types/jobs.types';
import { useToggleSavedJob } from '@/services/jobs/hooks/savedJobs/useToggleSavedJob';
import { SAVED_PARAM } from '@/services/jobs/savedParam';
import { useJobsFilterStore } from '@/services/jobs/store';
import { filterStateFromURL } from '@/utils/jobs.utils';
import { useLoginRedirect } from '@/components/core/login/utils';
import { toast } from '@/components/core/ToastContainer';
import { Button } from '@/components/common/Button';

import { BookmarkGlyph } from '../Icons';

// The share trigger's chrome, so Save reads as the same kind of control.
import rs from '../ReferMenu/ReferMenu.module.scss';
import s from './SaveRoleButton.module.scss';

interface SaveRoleButtonProps {
  role: IJobRole;
  teamId: string;
  source: JobSurface;
  memberUid: string | undefined;
  saved: boolean;
}

export function SaveRoleButton({ role, teamId, source, memberUid, saved }: SaveRoleButtonProps) {
  const goToLogin = useLoginRedirect();
  const toggleSaved = useToggleSavedJob();
  const analytics = useJobsAnalytics();
  const params = useJobsFilterStore((store) => store.params);
  const setParam = useJobsFilterStore((store) => store.setParam);
  const savedEvent = { job_id: role.uid, team_id: teamId, source };

  function onToggle() {
    if (!memberUid) {
      goToLogin();
      return;
    }

    toggleSaved.mutate(
      { roleUid: role.uid, saved },
      {
        onSuccess: () => {
          if (saved) {
            analytics.onJobUnsaved(savedEvent);
            return;
          }
          analytics.onJobSaved(savedEvent);
          toast.success(
            <>
              Saved.{' '}
              {/* `success`, not `primary`: the toast's own ink. Brand blue on
                  the green success surface is a third colour in a 14px line. */}
              <Button
                style="link"
                variant="success"
                size="s"
                underline
                onClick={() => {
                  analytics.onJobsSavedFilterApplied({ filter_state: filterStateFromURL(params) });
                  setParam(SAVED_PARAM, 'true');
                }}
              >
                View saved roles
              </Button>
            </>,
          );
        },
        onError: () => analytics.onJobSaveFailed({ ...savedEvent, action: saved ? 'unsave' : 'save' }),
      },
    );
  }

  return (
    <button
      type="button"
      className={clsx(rs.trigger, s.saveTrigger, { [s.saved]: saved })}
      aria-pressed={saved}
      aria-label={saved ? `Unsave ${role.roleTitle}` : `Save ${role.roleTitle}`}
      title={saved ? 'Saved' : 'Save'}
      onClick={onToggle}
    >
      <BookmarkGlyph filled={saved} />
    </button>
  );
}
