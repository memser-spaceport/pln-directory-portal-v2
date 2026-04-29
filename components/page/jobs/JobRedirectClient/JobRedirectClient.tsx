'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import s from './JobRedirectClient.module.scss';

export function JobRedirectClient() {
  const searchParams = useSearchParams();
  const analytics = useJobsAnalytics();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const alertUid = searchParams.get('alert_uid') ?? '';
    const jobUid = searchParams.get('job_uid') ?? '';
    const utmSource = searchParams.get('utm_source') ?? '';
    const utmCode = searchParams.get('utm_code') ?? undefined;
    const positionRaw = searchParams.get('position');
    const positionInEmail = positionRaw ? Number(positionRaw) : undefined;

    if (!token) {
      setError('Missing token.');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${process.env.DIRECTORY_API_URL}/v1/job-alerts/verify-redirect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body?.message || 'Invalid or expired link.');
          return;
        }
        const data = (await res.json()) as { applyUrl: string; alertUid: string; jobUid: string };

        analytics.onJobAlertEmailLinkClicked({
          alert_id: alertUid || data.alertUid,
          job_id: jobUid || data.jobUid,
          position_in_email: positionInEmail,
          utm_source: utmSource || 'job_alerts',
          utm_code: utmCode,
        });

        window.location.replace(data.applyUrl);
      } catch (err) {
        setError((err as Error).message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className={s.wrapper}>
        <p className={`${s.title} ${s.error}`}>Couldn't open this link.</p>
        <p className={s.subtitle}>{error}</p>
        <Link href="/jobs" className={s.fallbackLink}>
          Back to job board →
        </Link>
      </div>
    );
  }

  return (
    <div className={s.wrapper}>
      <p className={s.title}>Opening the role…</p>
      <p className={s.subtitle}>You'll be redirected in a moment.</p>
    </div>
  );
}
