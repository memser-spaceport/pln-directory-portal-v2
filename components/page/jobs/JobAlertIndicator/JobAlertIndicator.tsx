'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import s from './JobAlertIndicator.module.scss';

interface JobAlertIndicatorProps {
  alertName: string;
}

export default function JobAlertIndicator({ alertName }: JobAlertIndicatorProps) {
  const router = useRouter();

  return (
    <div className={s.indicator}>
      <span className={s.label}>
        Showing jobs for your job alert
        {alertName ? <> &middot; <span className={s.name}>{alertName}</span></> : null}
      </span>
      <span className={s.actions}>
        <Link href="/settings/job-alerts" className={s.action}>
          Manage alert
        </Link>
        <span className={s.divider} aria-hidden>
          ·
        </span>
        <button type="button" className={s.action} onClick={() => router.replace('/jobs')}>
          Clear
        </button>
      </span>
    </div>
  );
}
