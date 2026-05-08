'use client';

import Link from 'next/link';

import type { IJobAlert } from '@/types/job-alerts.types';
import { summarizeFilterState } from '@/utils/job-alerts.utils';
import { Button } from '@/components/common/Button';

import { IconInfo, IconClose } from './components/Icons';

import s from './JobAlertIndicator.module.scss';

interface JobAlertIndicatorProps {
  alert: IJobAlert;
  onDismiss?: () => void;
}

export function JobAlertIndicator({ alert, onDismiss }: JobAlertIndicatorProps) {
  const alertName = summarizeFilterState(alert.filterState);

  return (
    <div className={s.indicator}>
      <IconInfo />
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
      {onDismiss && (
        <button type="button" className={s.dismissBtn} onClick={onDismiss} aria-label="Dismiss">
          <IconClose />
        </button>
      )}
    </div>
  );
}
