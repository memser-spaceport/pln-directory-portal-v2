'use client';

import { useState } from 'react';
import RadioButton from '@/components/form/radio-button';
import SingleSelect from '@/components/form/single-select';
import TextArea from '@/components/form/text-area';
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

const FEEDBACK_OPTIONS = [
  { value: '', label: 'No feedback' },
  ...REVIEW_FEEDBACK_VALUES.map((v) => ({ value: v, label: REVIEW_FEEDBACK_LABEL[v] })),
];

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

  const selectedFeedbackOption = FEEDBACK_OPTIONS.find((o) => o.value === feedback) ?? FEEDBACK_OPTIONS[0];

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
        onSuccess: () => analytics.onReviewSubmitted(founderId, status, !!feedback, !!note.trim()),
        onError: () => analytics.onReviewFailed(founderId),
      },
    );
  };

  return (
    <form className={s.form} onSubmit={handleSubmit}>
      <div className={s.field}>
        <label className={s.label}>Decision *</label>
        <RadioButton
          name="review-status"
          options={REVIEW_STATUS_OPTIONS.map((v) => ({ value: v, label: FOUNDER_STATUS_LABEL[v] }))}
          selectedValue={status}
          onChange={(v) => setStatus(v as FounderStatus)}
        />
      </div>

      <div className={s.field}>
        <label className={s.label}>Feedback (optional)</label>
        <SingleSelect
          id="review-feedback"
          uniqueKey="value"
          displayKey="label"
          arrowImgUrl="/icons/arrow-down.svg"
          options={FEEDBACK_OPTIONS}
          selectedOption={selectedFeedbackOption}
          onItemSelect={(item) => setFeedback((item?.value as ReviewFeedback) || '')}
          placeholder="No feedback"
        />
      </div>

      <div className={s.field}>
        <label className={s.label}>Note (optional)</label>
        <TextArea
          id="review-note"
          name="review-note"
          placeholder="Add a note for the team…"
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
          defaultValue=""
        />
      </div>

      <button type="submit" className={s.submitBtn} disabled={isPending}>
        {isPending ? 'Saving…' : 'Save review'}
      </button>
    </form>
  );
}
