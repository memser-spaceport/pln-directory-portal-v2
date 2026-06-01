'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { FormSelect } from '@/components/form/FormSelect/FormSelect';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import { useReviewFounder } from '@/services/founders/hooks/useReviewFounder';
import {
  FOUNDER_STATUS_LABEL,
  REVIEW_FEEDBACK_LABEL,
  REVIEW_FEEDBACK_VALUES,
} from '@/services/founders/constants';
import type { Option } from '@/components/form/FormSelect/types';
import type { FounderStatus, ReviewFeedback } from '@/services/founders/types';
import { useFoundersAnalytics } from '@/analytics/founders.analytics';
import s from './ReviewActionsPanel.module.scss';

const REVIEW_STATUS_OPTIONS: FounderStatus[] = ['approved', 'rejected', 'hold', 'wrong-fund'];

const STATUS_OPTIONS = REVIEW_STATUS_OPTIONS.map((v) => ({ value: v, label: FOUNDER_STATUS_LABEL[v] }));
const FEEDBACK_OPTIONS = [
  { value: '', label: 'No feedback' },
  ...REVIEW_FEEDBACK_VALUES.map((v) => ({ value: v, label: REVIEW_FEEDBACK_LABEL[v] })),
];

type FormValues = {
  status: Option | null;
  feedback: Option | null;
  note: string;
};

interface Props {
  founderId: string;
  currentStatus: FounderStatus;
}

export function ReviewActionsPanel({ founderId, currentStatus }: Props) {
  const methods = useForm<FormValues>({
    defaultValues: {
      status: STATUS_OPTIONS.find((o) => o.value === currentStatus) ?? null,
      feedback: FEEDBACK_OPTIONS[0],
      note: '',
    },
  });

  const { mutate, isPending } = useReviewFounder();
  const analytics = useFoundersAnalytics();

  const onSubmit = (values: FormValues) => {
    const status = values.status?.value as FounderStatus | undefined;
    if (!status) return;
    const feedback = values.feedback?.value || undefined;
    const note = values.note?.trim() || undefined;

    mutate(
      { id: founderId, body: { status, feedback: feedback as ReviewFeedback | undefined, note } },
      {
        onSuccess: () => analytics.onReviewSubmitted(founderId, status, !!feedback, !!note),
        onError: () => analytics.onReviewFailed(founderId),
      },
    );
  };

  return (
    <FormProvider {...methods}>
      <form className={s.form} onSubmit={methods.handleSubmit(onSubmit)}>
        <FormSelect
          name="status"
          label="Decision"
          placeholder="Select decision…"
          options={STATUS_OPTIONS}
          isRequired
        />

        <FormSelect
          name="feedback"
          label="Feedback"
          placeholder="No feedback"
          options={FEEDBACK_OPTIONS}
        />

        <FormTextArea
          name="note"
          label="Note"
          placeholder="Add a note for the team…"
          maxLength={500}
          showCharCount
          isOptional
        />

        <button type="submit" className={s.submitBtn} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save review'}
        </button>
      </form>
    </FormProvider>
  );
}
