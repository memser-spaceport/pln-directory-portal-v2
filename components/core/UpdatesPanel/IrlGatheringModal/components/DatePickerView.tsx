'use client';

import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import s from '../IrlGatheringModal.module.scss';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface DatePickerViewProps {
  planningQuestion: string;
  initialRange: [Date, Date] | null;
  onCancel: () => void;
  onApply: (range: [Date, Date] | null) => void;
  gatheringDateRange?: {
    start: string | undefined;
    end: string | undefined;
  };
}

function formatDateDisplay(value: Value): string {
  if (!value) return '';
  if (Array.isArray(value)) {
    const [start, end] = value;
    if (start && end) {
      const formatDate = (date: Date) =>
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${formatDate(start)} - ${formatDate(end)}`;
    }
    if (start) {
      return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  } else if (value) {
    return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return '';
}

export function DatePickerView({
  planningQuestion,
  initialRange,
  onCancel,
  onApply,
  gatheringDateRange,
}: DatePickerViewProps) {
  const [tempRange, setTempRange] = useState<Value>(initialRange);

  // Calculate min and max dates based on gathering date range
  const minDate = gatheringDateRange?.start ? new Date(gatheringDateRange.start) : new Date();
  const maxDate = gatheringDateRange?.end ? new Date(gatheringDateRange.end) : undefined;

  const handleCalendarChange = (value: Value) => {
    setTempRange(value);
  };

  const handleApply = () => {
    if (Array.isArray(tempRange) && tempRange[0] && tempRange[1]) {
      onApply([tempRange[0], tempRange[1]]);
    } else {
      onApply(null);
    }
  };

  const handleClear = () => {
    setTempRange(null);
  };

  const displayValue = formatDateDisplay(tempRange);
  const hasSelection = Array.isArray(tempRange) ? tempRange[0] !== null : tempRange !== null;

  return (
    <div className={s.datePickerModal}>
      <div className={s.datePickerContent}>
        <h3 className={s.sectionTitle}>{planningQuestion}</h3>
        <p className={s.sectionDescription}>Let others know if you are attending.</p>

        <div className={s.datePickerSection}>
          <div className={s.datePickerLabelRow}>
            <span className={s.datePickerLabel}>Select date range</span>
            {hasSelection && (
              <button type="button" className={s.datePickerClearButton} onClick={handleClear}>
                Clear
              </button>
            )}
          </div>
          <div className={`${s.datePickerInput} ${s.datePickerInputFocused}`}>
            <span className={displayValue ? s.datePickerInputValue : ''}>{displayValue || 'Select date range'}</span>
          </div>
        </div>

        <div className={s.calendarInline}>
          <Calendar
            onChange={handleCalendarChange}
            value={tempRange}
            selectRange
            minDate={minDate}
            maxDate={maxDate}
            className={s.calendar}
            showFixedNumberOfWeeks
          />
        </div>
      </div>

      <div className={s.calendarFooter}>
        <button type="button" className={s.calendarCancelButton} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={s.calendarApplyButton} onClick={handleApply}>
          Apply
        </button>
      </div>
    </div>
  );
}
