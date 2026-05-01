'use client';

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
import s from './JobAlertBanner.module.scss';

interface JobAlertBannerProps {
  filterState: IJobAlertFilterState;
  resultCount: number;
  isLoggedIn: boolean;
}

export default function JobAlertBanner({ filterState, resultCount, isLoggedIn }: JobAlertBannerProps) {
  const router = useRouter();
  const analytics = useJobsAnalytics();
  const createMutation = useCreateJobAlert();
  const updateMutation = useUpdateJobAlert();
  const { userAlert, filtersMatchAlert } = useJobAlertMatch(filterState, isLoggedIn);
  const isActive = hasActiveFilters(filterState);

  useEffect(() => {
    if (!isActive) return;
    analytics.onJobAlertCtaViewed({
      cta_variant: 'banner',
      filter_state: filterState as unknown as Record<string, unknown>,
      result_count: resultCount,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, filterState]);

  if (!isActive) return null;
  if (userAlert && filtersMatchAlert) return null;

  if (userAlert && !filtersMatchAlert) {
    const handleUpdate = async () => {
      analytics.onJobAlertCtaClicked({
        cta_variant: 'banner',
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
      <div className={s.banner}>
        <div className={s.copy}>
          <p className={s.title}>These filters differ from your job alert.</p>
          <p className={s.subtitle}>Update it to receive emails for the new filter combo.</p>
        </div>
        <div className={s.actions}>
          <button
            type="button"
            className={s.primaryButton}
            onClick={handleUpdate}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Updating…' : 'Update job alert'}
          </button>
        </div>
      </div>
    );
  }

  const handleSet = async () => {
    analytics.onJobAlertCtaClicked({
      cta_variant: 'banner',
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
    <div className={s.banner}>
      <div className={s.copy}>
        <p className={s.title}>Get an email when new roles match these filters.</p>
        <p className={s.subtitle}>We&apos;ll send a weekly digest, only when there are new matches.</p>
      </div>
      <div className={s.actions}>
        <button
          type="button"
          className={s.primaryButton}
          onClick={handleSet}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Setting…' : 'Set job alert'}
        </button>
      </div>
    </div>
  );
}
