'use client';

import { KeyboardEvent, useState } from 'react';
import { toast } from '@/components/core/ToastContainer';
import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import { useDeleteJobAlert } from '@/services/job-alerts/hooks/useDeleteJobAlert';
import { useUpdateJobAlert } from '@/services/job-alerts/hooks/useUpdateJobAlert';
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

  const handleRename = async () => {
    const next = draftName.trim();
    if (!next || next === alert.name) {
      setEditing(false);
      setDraftName(alert.name);
      return;
    }
    try {
      await updateMutation.mutateAsync({ uid: alert.uid, payload: { name: next } });
      analytics.onJobAlertRenamed({ alert_id: alert.uid });
      toast.success('Job alert renamed.');
    } catch (err) {
      toast.error((err as Error).message);
      setDraftName(alert.name);
    } finally {
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
    if (!window.confirm(`Delete job alert "${alert.name}"? This cannot be undone.`)) return;
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
          onClick={() => void handleDelete()}
          disabled={deleteMutation.isPending}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
