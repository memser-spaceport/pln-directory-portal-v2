'use client';

import { ChevronDownIcon } from '../icons';
import s from '../IrlGatheringModal.module.scss';

interface PlanningSectionProps {
  planningQuestion: string;
  selectedDateRange: [Date, Date] | null;
  selectedTopics: string[];
  onDateInputClick: () => void;
  onTopicsInputClick: () => void;
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
  selectedTopics,
  onDateInputClick,
  onTopicsInputClick,
}: PlanningSectionProps) {
  const displayValue = formatDateRange(selectedDateRange);

  return (
    <div className={s.planningContainer}>
      <div className={s.planningHeader}>
        <p className={s.planningTitle}>{planningQuestion}</p>
        <p className={s.planningSubtitle}>Let others know if you are attending.</p>
      </div>

      <div className={s.planningContent}>
        <button type="button" className={s.planningField} onClick={onDateInputClick}>
          <span className={s.planningFieldLabel}>Select date range</span>
          <div className={s.planningFieldInput}>
            <span className={displayValue ? s.planningFieldValue : s.planningFieldPlaceholder}>
              {displayValue || 'Select date range'}
            </span>
          </div>
        </button>

        <button type="button" className={s.planningField} onClick={onTopicsInputClick}>
          <span className={s.planningFieldLabel}>Topics of interest</span>
          <div className={s.planningFieldInput}>
            {selectedTopics.length > 0 ? (
              <div className={s.planningTopicsTags}>
                {selectedTopics.map((topic) => (
                  <span key={topic} className={s.planningTopicTag}>
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <div className={s.planningFieldTags}>
                <span className={s.planningFieldTagPlaceholder}>Select topics</span>
              </div>
            )}
            <div className={s.planningFieldTrailing}>
              <ChevronDownIcon />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

