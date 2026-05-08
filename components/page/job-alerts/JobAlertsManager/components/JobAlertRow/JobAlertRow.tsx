'use client';

import Link from 'next/link';
import { useState } from 'react';

import { toast } from '@/components/core/ToastContainer';
import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import { useDeleteJobAlert } from '@/services/job-alerts/hooks/useDeleteJobAlert';
import { ConfirmDialog } from '@/components/page/demo-day/FounderPendingView/components/ConfirmDialog';
import type { IJobAlert } from '@/types/job-alerts.types';
import { summarizeFilterState } from '@/utils/job-alerts.utils';
import { Button } from '@/components/common/Button';

import { IconInfo, IconArrowUpRight, DeleteIcon } from './components/Icons';

import s from './JobAlertRow.module.scss';

interface JobAlertRowProps {
  alert: IJobAlert;
}

export function JobAlertRow({ alert }: JobAlertRowProps) {
  const analytics = useJobsAnalytics();
  const deleteMutation = useDeleteJobAlert();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleDelete = async () => {
    setConfirmDeleteOpen(false);
    try {
      await deleteMutation.mutateAsync(alert.uid);
      analytics.onJobAlertDeleted({ alert_id: alert.uid });
      toast.success('Job alert deleted.');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const criteriaSummary = summarizeFilterState(alert.filterState);

  return (
    <div className={s.root}>
      <div className={s.body}>
        <h3 className={s.name}>{criteriaSummary}</h3>

        <p className={s.desc}>We&apos;ll email you a weekly digest when new roles match these filters.</p>
      </div>

      <div className={s.jobLink}>
        <IconInfo />
        <span className={s.jobLinkText}>
          Filters are set from the
          <Link href="/jobs" className={s.jobLinkAnchor}>
            Job Board
            <IconArrowUpRight />
          </Link>
        </span>
      </div>

      <div className={s.delimiter} />

      <Button
        style="link"
        variant="error"
        className={s.deleteBtn}
        disabled={deleteMutation.isPending}
        onClick={() => setConfirmDeleteOpen(true)}
      >
        <DeleteIcon />
        <span>Delete Job Alert</span>
      </Button>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Delete job alert?"
        message={`Delete job alert "${criteriaSummary}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDeleteOpen(false)}
        isLoading={deleteMutation.isPending}
        iconColor="#ff3838"
        classes={{
          dialog: s.confirmDialog,
          iconContainer: s.confirmIconContainer,
          title: s.confirmTitle,
          message: s.confirmMessage,
          actions: s.confirmActions,
          cancelButton: s.confirmCancelButton,
          confirmButton: s.confirmDeleteButton,
        }}
      />
    </div>
  );
}
