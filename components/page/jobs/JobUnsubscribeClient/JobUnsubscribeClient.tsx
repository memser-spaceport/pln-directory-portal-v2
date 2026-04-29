'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import s from './JobUnsubscribeClient.module.scss';

type Status =
  | { phase: 'pending' }
  | { phase: 'success'; alertUid: string; alertName: string }
  | { phase: 'error'; message: string };

export function JobUnsubscribeClient() {
  const searchParams = useSearchParams();
  const analytics = useJobsAnalytics();
  const [status, setStatus] = useState<Status>({ phase: 'pending' });

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus({ phase: 'error', message: 'Missing token.' });
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${process.env.DIRECTORY_API_URL}/v1/job-alerts/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setStatus({ phase: 'error', message: body?.message || 'Invalid or expired link.' });
          return;
        }
        const data = (await res.json()) as { alertUid: string; alertName: string };
        analytics.onJobAlertDeleted({ alert_id: data.alertUid });
        setStatus({ phase: 'success', alertUid: data.alertUid, alertName: data.alertName });
      } catch (err) {
        setStatus({ phase: 'error', message: (err as Error).message });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status.phase === 'pending') {
    return (
      <div className={s.wrapper}>
        <p className={s.title}>Processing your request…</p>
      </div>
    );
  }

  if (status.phase === 'error') {
    return (
      <div className={s.wrapper}>
        <h1 className={`${s.title} ${s.error}`}>Couldn&apos;t unsubscribe.</h1>
        <p className={s.subtitle}>{status.message}</p>
        <div className={s.actions}>
          <Link href="/settings/job-alerts" className={s.primary}>
            Manage alert
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={s.wrapper}>
      <h1 className={s.title}>Unsubscribed.</h1>
      <p className={s.subtitle}>
        Your job alert &quot;{status.alertName}&quot; has been deleted. You won&apos;t get any more emails from it.
      </p>
      <div className={s.actions}>
        <Link href="/jobs" className={s.primary}>
          Browse jobs
        </Link>
      </div>
    </div>
  );
}
