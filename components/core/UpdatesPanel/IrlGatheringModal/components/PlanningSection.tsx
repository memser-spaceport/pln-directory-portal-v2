'use client';

import { useState } from 'react';
import { SlidersHorizontalIcon, CaretUpIcon, CaretDownIcon, ChevronDownIcon } from '../icons';
import s from '../IrlGatheringModal.module.scss';

interface PlanningSectionProps {
  planningQuestion: string;
  selectedDateRange: [Date, Date] | null;
  selectedTopics: string[];
  onDateInputClick: () => void;
  onTopicsInputClick: () => void;
  defaultExpanded?: boolean;
}

function formatDateRange(range: [Date, Date] | null): string {
  if (!range) return '';
  const [start, end] = range;
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function PlanningSection({
  selectedDateRange,
  selectedTopics,
  onDateInputClick,
  onTopicsInputClick,
  defaultExpanded = true,
}: PlanningSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const displayValue = formatDateRange(selectedDateRange);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className={s.accordionContainer}>
      <button type="button" className={s.accordionHeader} onClick={toggleExpanded}>
        <div className={s.accordionHeaderContent}>
          <span className={s.accordionIcon}>
            <SlidersHorizontalIcon />
          </span>
          <span className={s.accordionTitle}>Your attendance preferences</span>
        </div>
        <span className={s.accordionCaret}>{isExpanded ? <CaretUpIcon /> : <CaretDownIcon />}</span>
      </button>

      {isExpanded && (
        <div className={s.accordionContent}>
          <button type="button" className={s.planningField} onClick={onDateInputClick}>
            <span className={s.planningFieldLabel}>Select date range</span>
            <div className={s.planningFieldInput}>
              <span className={displayValue ? s.planningFieldValue : s.planningFieldPlaceholder}>
                {displayValue || 'Select Date '}
              </span>
            </div>
          </button>

          <button type="button" className={s.planningField} onClick={onTopicsInputClick}>
            <span className={s.planningFieldLabel}>Topics on interest</span>
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
      )}
    </div>
  );
}

