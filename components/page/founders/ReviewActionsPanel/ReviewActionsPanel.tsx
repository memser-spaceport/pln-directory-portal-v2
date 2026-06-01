'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { useReviewFounder } from '@/services/founders/hooks/useReviewFounder';
import {
  FOUNDER_STATUS_LABEL,
  REVIEW_FEEDBACK_VALUES,
  REVIEW_FEEDBACK_LABEL,
} from '@/services/founders/constants';
import type { FounderStatus, ReviewFeedback } from '@/services/founders/types';
import { useFoundersAnalytics } from '@/analytics/founders.analytics';
import s from './ReviewActionsPanel.module.scss';

const REVIEW_STATUS_OPTIONS: FounderStatus[] = ['approved', 'rejected', 'hold', 'wrong-fund'];

interface Props {
  founderId: string;
  currentStatus: FounderStatus;
}

export function ReviewActionsPanel({ founderId, currentStatus }: Props) {
  const [status, setStatus] = useState<FounderStatus>(currentStatus);
  const [feedback, setFeedback] = useState<ReviewFeedback | ''>('');
  const [note, setNote] = useState('');

  const { mutate, isPending } = useReviewFounder();
  const analytics = useFoundersAnalytics();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      {
        id: founderId,
        body: {
          status,
          feedback: feedback || undefined,
          note: note.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          analytics.onReviewSubmitted(founderId, status, !!feedback, !!note.trim());
        },
        onError: () => {
          analytics.onReviewFailed(founderId);
        },
      },
    );
  };

  return (
    <form className={s.form} onSubmit={handleSubmit}>
      <div className={s.field}>
        <label className={s.label}>Decision *</label>
        <div className={s.radioGroup}>
          {REVIEW_STATUS_OPTIONS.map((opt) => (
            <label key={opt} className={clsx(s.radioOption, status === opt && s.radioOptionSelected)}>
              <input
                type="radio"
                name="review-status"
                value={opt}
                checked={status === opt}
                onChange={() => setStatus(opt)}
              />
              <span>{FOUNDER_STATUS_LABEL[opt]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={s.field}>
        <label className={s.label}>Feedback (optional)</label>
        <select
          className={s.select}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value as ReviewFeedback | '')}
        >
          <option value="">No feedback</option>
          {REVIEW_FEEDBACK_VALUES.map((v) => (
            <option key={v} value={v}>
              {REVIEW_FEEDBACK_LABEL[v]}
            </option>
          ))}
        </select>
      </div>

      <div className={s.field}>
        <label className={s.label}>Note (optional)</label>
        <textarea
          className={s.textarea}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note for the team…"
          maxLength={500}
          rows={3}
        />
        <span className={s.charCount}>{note.length}/500</span>
      </div>

      <button type="submit" className={s.submitBtn} disabled={isPending}>
        {isPending ? 'Saving…' : 'Save review'}
      </button>
    </form>
  );
}
