'use client';

import Link from 'next/link';

import type { IJobAlert } from '@/types/job-alerts.types';
import { summarizeFilterState } from '@/utils/job-alerts.utils';
import { Button } from '@/components/common/Button';
import { JobAlertShell } from '../JobAlertShell';
import s from './JobAlertIndicator.module.scss';

interface JobAlertIndicatorProps {
  alert: IJobAlert;
  onDismiss?: () => void;
}

export function JobAlertIndicator({ alert, onDismiss }: JobAlertIndicatorProps) {
  const alertName = summarizeFilterState(alert.filterState);

  return (
    <JobAlertShell onDismiss={onDismiss}>
      <div className={s.inner}>
        <p className={s.label}>Showing jobs for your job alert{alertName ? `: ${alertName}` : ''}</p>
        <div className={s.actions}>
          <Link href="/settings/job-alerts">
            <Button style="link" size="xl" underline>
              Manage alert
            </Button>
          </Link>
        </div>
      </div>
    </JobAlertShell>
  );
}
