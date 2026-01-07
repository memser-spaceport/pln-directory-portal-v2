'use client';

import { FormTagsInput } from '@/components/form/FormTagsInput/FormTagsInput';
import s from '../IrlGatheringModal.module.scss';

interface PlanningSectionProps {
  planningQuestion: string;
  selectedDateRange: [Date, Date] | null;
  onInputClick: () => void;
}

function formatDateRange(range: [Date, Date] | null): string {
  if (!range) return '';
  const [start, end] = range;
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function PlanningSection({
  planningQuestion,
  selectedDateRange,
  onInputClick,
}: PlanningSectionProps) {
  const displayValue = formatDateRange(selectedDateRange);

  return (
    <div className={s.planningContainer}>
      <div className={s.planningHeader}>
        <p className={s.planningTitle}>{planningQuestion}</p>
        <p className={s.planningSubtitle}>Let others know if you are attending.</p>
      </div>

      <div className={s.planningContent}>
        <button type="button" className={s.planningField} onClick={onInputClick}>
          <span className={s.planningFieldLabel}>Select date range</span>
          <div className={s.planningFieldInput}>
            <span className={displayValue ? s.planningFieldValue : s.planningFieldPlaceholder}>
              {displayValue || 'Select date range'}
            </span>
          </div>
        </button>

        <div className={s.topicsInputWrapper}>
          <FormTagsInput
            name="topics"
            selectLabel="Topics of interest"
            placeholder="Add topic"
            isColorfulBadges={false}
          />
        </div>
      </div>
    </div>
  );
}

