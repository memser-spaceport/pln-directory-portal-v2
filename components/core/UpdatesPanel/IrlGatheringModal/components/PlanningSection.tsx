'use client';

import s from '../IrlGatheringModal.module.scss';
import { ChevronDownIcon } from '../icons';

interface PlanningSectionProps {
  planningQuestion: string;
  selectedDateRange: [Date, Date] | null;
  selectedTopics?: string[];
  onInputClick: () => void;
  onTopicsClick?: () => void;
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
  selectedTopics = [],
  onInputClick,
  onTopicsClick,
}: PlanningSectionProps) {
  const displayValue = formatDateRange(selectedDateRange);
  const hasTopics = selectedTopics.length > 0;

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

        <div className={s.planningField}>
          <span className={s.planningFieldLabel}>Topics on interest</span>
          <div className={s.planningFieldInput} onClick={onTopicsClick}>
            <div className={s.planningFieldTags}>
              {hasTopics ? (
                selectedTopics.map((topic) => (
                  <span key={topic} className={s.planningTag}>
                    {topic}
                  </span>
                ))
              ) : (
                <span className={s.planningFieldTagPlaceholder}>Select topics</span>
              )}
            </div>
            <div className={s.planningFieldTrailing}>
              <ChevronDownIcon />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

