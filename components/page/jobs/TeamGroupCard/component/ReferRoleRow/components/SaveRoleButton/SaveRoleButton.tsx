'use client';

import clsx from 'clsx';

import type { IJobRole } from '@/types/jobs.types';
import { useSavedScopeStore } from '@/services/jobs/saved-scope.store';
import { useToggleSavedJob } from '@/services/jobs/hooks/savedJobs/useToggleSavedJob';
import { useLoginRedirect } from '@/components/core/login/utils';
import { toast } from '@/components/core/ToastContainer';
import { Button } from '@/components/common/Button';

import { BookmarkGlyph } from '../Icons';

// The share trigger's chrome, so Save reads as the same kind of control.
import rs from '../ReferMenu/ReferMenu.module.scss';
import s from './SaveRoleButton.module.scss';

interface SaveRoleButtonProps {
  role: IJobRole;
  memberUid: string | undefined;
  saved: boolean;
}

export function SaveRoleButton({ role, memberUid, saved }: SaveRoleButtonProps) {
  const goToLogin = useLoginRedirect();
  const toggleSaved = useToggleSavedJob();
  const setSavedScope = useSavedScopeStore((store) => store.setSavedScope);

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
            return;
          }
          toast.success(
            <>
              Saved.{' '}
              {/* `success`, not `primary`: the toast's own ink. Brand blue on
                  the green success surface is a third colour in a 14px line. */}
              <Button style="link" variant="success" size="s" underline onClick={() => setSavedScope(true)}>
                View saved roles
              </Button>
            </>,
          );
        },
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
