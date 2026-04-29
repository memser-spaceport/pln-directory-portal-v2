'use client';

import { KeyboardEvent, useRef, useState } from 'react';
import { toast } from '@/components/core/ToastContainer';
import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import { useDeleteJobAlert } from '@/services/job-alerts/hooks/useDeleteJobAlert';
import { useUpdateJobAlert } from '@/services/job-alerts/hooks/useUpdateJobAlert';
import { ConfirmDialog } from '@/components/page/demo-day/FounderPendingView/components/ConfirmDialog/ConfirmDialog';
import type { IJobAlert } from '@/types/job-alerts.types';
import { summarizeFilterState } from '@/utils/job-alerts.utils';
import s from './JobAlertRow.module.scss';

interface JobAlertRowProps {
  alert: IJobAlert;
}

export function JobAlertRow({ alert }: JobAlertRowProps) {
  const analytics = useJobsAnalytics();
  const updateMutation = useUpdateJobAlert();
  const deleteMutation = useDeleteJobAlert();

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(alert.name);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const isSubmitting = useRef(false);

  const handleRename = async () => {
    if (isSubmitting.current) return;
    const next = draftName.trim();
    if (!next || next === alert.name) {
      setEditing(false);
      setDraftName(alert.name);
      return;
    }
    isSubmitting.current = true;
    try {
      await updateMutation.mutateAsync({ uid: alert.uid, payload: { name: next } });
      analytics.onJobAlertRenamed({ alert_id: alert.uid });
      toast.success('Job alert renamed.');
    } catch (err) {
      toast.error((err as Error).message);
      setDraftName(alert.name);
    } finally {
      isSubmitting.current = false;
      setEditing(false);
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleRename();
    } else if (e.key === 'Escape') {
      setDraftName(alert.name);
      setEditing(false);
    }
  };

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
  const showCriteria = criteriaSummary !== alert.name;

  return (
    <div className={s.row}>
      <div className={s.body}>
        <div className={s.topLine}>
          <div className={s.nameWrapper}>
            {editing ? (
              <input
                autoFocus
                className={s.nameInput}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={() => void handleRename()}
                onKeyDown={handleKey}
                maxLength={120}
              />
            ) : (
              <h3 className={s.name} onClick={() => setEditing(true)} title="Click to rename">
                {alert.name}
              </h3>
            )}
            {!editing && (
              <button
                type="button"
                className={s.editBtn}
                onClick={() => setEditing(true)}
                aria-label="Edit alert name"
              >
                Edit alert name
              </button>
            )}
          </div>
        </div>

        {showCriteria && <div className={s.criteria}>{criteriaSummary}</div>}
      </div>

      <div className={s.actions}>
        <button
          type="button"
          className={s.deleteBtn}
          onClick={() => setConfirmDeleteOpen(true)}
          disabled={deleteMutation.isPending}
        >
          Delete
        </button>
      </div>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Delete job alert?"
        message={`Delete job alert "${alert.name}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDeleteOpen(false)}
        isLoading={deleteMutation.isPending}
        type="danger"
      />
    </div>
  );
}
