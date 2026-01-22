'use client';

import { ChevronDownIcon } from '../icons';
import { EventData } from '../types';
import s from '../IrlGatheringModal.module.scss';

interface SelectedEventInfo {
  uid: string;
  name: string;
}

interface PlanningSectionProps {
  planningQuestion: string;
  selectedDateRange: [Date, Date] | null;
  selectedTopics: string[];
  selectedEvents: SelectedEventInfo[];
  events: EventData[];
  onDateInputClick: () => void;
  onTopicsInputClick: () => void;
  onEventsInputClick: () => void;
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
  selectedEvents,
  events,
  onDateInputClick,
  onTopicsInputClick,
  onEventsInputClick,
}: PlanningSectionProps) {
  const displayValue = formatDateRange(selectedDateRange);

  // Only show events field if there are events available
  const hasEvents = events.length > 0;

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

        {hasEvents && (
          <button type="button" className={s.planningField} onClick={onEventsInputClick}>
            <span className={s.planningFieldLabel}>Select events you plan to attend</span>
            <div className={s.planningFieldInput}>
              {selectedEvents.length > 0 ? (
                <div className={s.planningEventsTags}>
                  {selectedEvents.map((event) => (
                    <span key={event.uid} className={s.planningEventTag}>
                      {event.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className={s.planningFieldTags}>
                  <span className={s.planningFieldTagPlaceholder}>Select events</span>
                </div>
              )}
              <div className={s.planningFieldTrailing}>
                <ChevronDownIcon />
              </div>
            </div>
          </button>
        )}

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

