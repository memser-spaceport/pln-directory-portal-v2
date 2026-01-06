'use client';

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

export function PlanningSection({ planningQuestion, selectedDateRange, onInputClick }: PlanningSectionProps) {
  const displayValue = formatDateRange(selectedDateRange);

  return (
    <div className={s.section}>
      <h3 className={s.sectionTitle}>{planningQuestion}</h3>
      <p className={s.sectionDescription}>Let others know if you are attending.</p>
      <div className={s.datePickerSection}>
        <span className={s.datePickerLabel}>Select date range</span>
        <div className={s.datePickerInput} onClick={onInputClick}>
          <span className={displayValue ? s.datePickerInputValue : ''}>
            {displayValue || 'Select date range'}
          </span>
        </div>
      </div>
    </div>
  );
}

