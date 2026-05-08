'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useJobAlerts } from '@/services/job-alerts/hooks/useJobAlerts';
import { triggerLoader } from '@/utils/common.utils';
import { JobAlertRow } from '../JobAlertRow/JobAlertRow';
import s from './JobAlertsManager.module.scss';

export function JobAlertsManager() {
  const router = useRouter();
  const { data, isLoading, isError } = useJobAlerts(true);

  useEffect(() => {
    triggerLoader(false);

    function handleNavigate(e: any) {
      const url = e.detail.url;
      triggerLoader(true);
      router.push(url);
      router.refresh();
    }

    document.addEventListener('settings-navigate', handleNavigate);
    return () => document.removeEventListener('settings-navigate', handleNavigate);
  }, [router]);

  const alert = data?.items?.[0] ?? null;

  return (
    <div className={s.root}>
      <h5 className={s.title}>Job Alert</h5>

      <div className={s.card}>
        <div className={s.content}>
          {isLoading ? (
            <div className={s.placeholder}>Loading your job alert…</div>
          ) : isError ? (
            <div className={s.placeholder}>Could not load your job alert. Please try again.</div>
          ) : !alert ? (
            <div className={s.empty}>
              <p className={s.emptyTitle}>You don&apos;t have a job alert yet.</p>
              <p className={s.emptySub}>Browse jobs, apply some filters, and set a job alert to get a weekly email.</p>
              <Link href="/jobs" className={s.browseLink}>
                Browse jobs
              </Link>
            </div>
          ) : (
            <>
              <JobAlertRow alert={alert} />
              <p className={s.desc}>We&apos;ll email you a weekly digest when new roles match these filters.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
