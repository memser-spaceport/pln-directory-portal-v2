'use client';

import { useSavedScopeStore } from '@/services/jobs/saved-scope.store';
import { Button } from '@/components/common/Button';

import s from './SavedJobsEmptyState.module.scss';

interface SavedJobsEmptyStateProps {
  hasNoSavedJobs: boolean;
}

export function SavedJobsEmptyState({ hasNoSavedJobs }: SavedJobsEmptyStateProps) {
  const setSavedScope = useSavedScopeStore((store) => store.setSavedScope);

  return (
    <div className={s.empty}>
      {hasNoSavedJobs ? (
        <>
          You haven&apos;t saved any roles yet. Roles you bookmark collect here, so you can come back to them.{' '}
          <Button style="link" variant="primary" size="s" onClick={() => setSavedScope(false)}>
            Browse all roles
          </Button>
        </>
      ) : (
        <>No roles match your filters. Try clearing some.</>
      )}
    </div>
  );
}
