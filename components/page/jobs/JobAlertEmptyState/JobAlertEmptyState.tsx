'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from '@/components/core/ToastContainer';
import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import { useCreateJobAlert } from '@/services/job-alerts/hooks/useCreateJobAlert';
import { useUpdateJobAlert } from '@/services/job-alerts/hooks/useUpdateJobAlert';
import { useJobAlertMatch } from '@/services/job-alerts/hooks/useJobAlertMatch';
import { PENDING_SAVE_STORAGE_KEY } from '@/services/job-alerts/constants';
import type { IJobAlertFilterState } from '@/types/job-alerts.types';
import { hasActiveFilters } from '@/utils/job-alerts.utils';
import s from './JobAlertEmptyState.module.scss';

interface JobAlertEmptyStateProps {
  filterState: IJobAlertFilterState;
  isLoggedIn: boolean;
}

export default function JobAlertEmptyState({ filterState, isLoggedIn }: JobAlertEmptyStateProps) {
  const router = useRouter();
  const analytics = useJobsAnalytics();
  const createMutation = useCreateJobAlert();
  const updateMutation = useUpdateJobAlert();
  const { userAlert, filtersMatchAlert } = useJobAlertMatch(filterState, isLoggedIn);
  const filtersActive = hasActiveFilters(filterState);

  useEffect(() => {
    if (!filtersActive) return;
    analytics.onJobAlertCtaViewed({
      cta_variant: 'empty',
      filter_state: filterState as unknown as Record<string, unknown>,
      result_count: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersActive, filterState]);

  if (!filtersActive) {
    return (
      <div className={s.empty}>
        <h2 className={s.title}>No roles match yet.</h2>
        <p className={s.subtitle}>Try adjusting your filters or come back soon — new roles are added every week.</p>
      </div>
    );
  }

  if (userAlert && filtersMatchAlert) {
    return (
      <div className={s.empty}>
        <h2 className={s.title}>No roles match yet.</h2>
        <p className={s.subtitle}>
          Your job alert is set for these filters (&quot;{userAlert.name}&quot;). We&apos;ll email you the moment one shows up.
        </p>
        <Link href="/settings/job-alerts" className={s.manageLink}>
          Manage alert →
        </Link>
      </div>
    );
  }

  if (userAlert && !filtersMatchAlert) {
    const handleUpdate = async () => {
      analytics.onJobAlertCtaClicked({
        cta_variant: 'empty',
        filter_state: filterState as unknown as Record<string, unknown>,
      });
      try {
        const updated = await updateMutation.mutateAsync({ uid: userAlert.uid, payload: { filterState } });
        analytics.onJobAlertUpdated({
          alert_id: updated.uid,
          filter_state: filterState as unknown as Record<string, unknown>,
        });
        toast.success('Job alert updated.');
      } catch (err) {
        toast.error((err as Error).message);
      }
    };

    return (
      <div className={s.empty}>
        <h2 className={s.title}>No roles match yet.</h2>
        <p className={s.subtitle}>
          These filters differ from your job alert. Update it to receive emails for the new filter combo.
        </p>
        <button
          type="button"
          className={s.primaryButton}
          onClick={handleUpdate}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Updating…' : 'Update job alert'}
        </button>
      </div>
    );
  }

  const handleSet = async () => {
    analytics.onJobAlertCtaClicked({
      cta_variant: 'empty',
      filter_state: filterState as unknown as Record<string, unknown>,
    });

    if (!isLoggedIn) {
      try {
        window.sessionStorage.setItem(PENDING_SAVE_STORAGE_KEY, JSON.stringify(filterState));
      } catch {
        // sessionStorage unavailable — fall through
      }
      router.push(`${window.location.pathname}${window.location.search}#login`);
      return;
    }

    const result = await createMutation.mutateAsync({ filterState });
    if (result.ok) {
      toast.success("Job alert set. We'll email you when new roles match.");
      analytics.onJobAlertSet({
        alert_id: result.alert.uid,
        filter_state: filterState as unknown as Record<string, unknown>,
        auth_required: false,
      });
    } else if ('conflict' in result && result.conflict) {
      analytics.onJobAlertConflict({ existing_alert_id: result.conflict.existingAlertUid });
      toast.error(result.conflict.message);
    } else if ('error' in result && result.error) {
      toast.error(result.error);
    }
  };

  return (
    <div className={s.empty}>
      <h2 className={s.title}>No roles match yet.</h2>
      <p className={s.subtitle}>Want to know when one does? We&apos;ll email you weekly when new roles match these filters.</p>
      <button
        type="button"
        className={s.primaryButton}
        onClick={handleSet}
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? 'Setting…' : 'Set job alert'}
      </button>
    </div>
  );
}
