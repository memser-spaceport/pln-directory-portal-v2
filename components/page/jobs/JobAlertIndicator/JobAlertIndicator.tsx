'use client';

import Link from 'next/link';

import type { IJobAlert } from '@/types/job-alerts.types';
import { summarizeFilterState } from '@/utils/job-alerts.utils';
import { Button } from '@/components/common/Button';
import { IconClose } from '../JobAlertShell/components/Icons';
import { JobAlertShell } from '../JobAlertShell';
import s from './JobAlertIndicator.module.scss';

interface JobAlertIndicatorProps {
  alert: IJobAlert;
  onDismiss?: () => void;
}

export function JobAlertIndicator({ alert, onDismiss }: JobAlertIndicatorProps) {
  const alertName = summarizeFilterState(alert.filterState);

  return (
    <JobAlertShell>
      <p className={s.label}>Showing jobs for your job alert{alertName ? `: ${alertName}` : ''}</p>
      <div className={s.actions}>
        <Link href="/settings/job-alerts">
          <Button style="link" size="xl" underline>
            Manage alert
          </Button>
        </Link>
        {onDismiss && (
          <button type="button" className={s.dismissBtn} onClick={onDismiss} aria-label="Dismiss">
            <IconClose />
          </button>
        )}
      </div>
    </JobAlertShell>
  );
}
