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
  isLoggedIn?: boolean;
  onDisabledFieldClick?: () => void;
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
  isLoggedIn = true,
  onDisabledFieldClick,
}: PlanningSectionProps) {
  const displayValue = formatDateRange(selectedDateRange);

  // Only show events field if there are events available
  const hasEvents = events.length > 0;

  return (
    <div className={s.planningContainer}>
      <div className={s.planningHeader}>
        <p className={s.planningTitle}>{planningQuestion}</p>
        <p className={s.planningSubtitle}>
          {isLoggedIn
            ? 'Let others know if you are attending.'
            : "Log in to let others know if you're attending and what you're interested in."}
        </p>
      </div>

      <div className={s.planningContent}>
        <button
          type="button"
          className={`${s.planningField} ${!isLoggedIn ? s.planningFieldDisabled : ''}`}
          onClick={isLoggedIn ? onDateInputClick : onDisabledFieldClick}
        >
          <span className={s.planningFieldLabel}>Select date range</span>
          <div className={`${s.planningFieldInput} ${!isLoggedIn ? s.planningFieldInputDisabled : ''}`}>
            {!isLoggedIn && (
              <span className={s.planningFieldLockIcon}>
                <LockIcon />
              </span>
            )}
            <span className={displayValue ? s.planningFieldValue : s.planningFieldPlaceholder}>
              {displayValue || 'Select date range'}
            </span>
          </div>
          {!isLoggedIn && <span className={s.planningFieldHint}>Log in to select dates and events</span>}
        </button>

        {hasEvents && (
          <button
            type="button"
            className={`${s.planningField} ${!isLoggedIn ? s.planningFieldDisabled : ''}`}
            onClick={isLoggedIn ? onEventsInputClick : onDisabledFieldClick}
          >
            <span className={s.planningFieldLabel}>Select events you plan to attend</span>
            <div className={`${s.planningFieldInput} ${!isLoggedIn ? s.planningFieldInputDisabled : ''}`}>
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

        <button
          type="button"
          className={`${s.planningField} ${!isLoggedIn ? s.planningFieldDisabled : ''}`}
          onClick={isLoggedIn ? onTopicsInputClick : onDisabledFieldClick}
        >
          <span className={s.planningFieldLabel}>Topics of interest</span>
          <div className={`${s.planningFieldInput} ${!isLoggedIn ? s.planningFieldInputDisabled : ''}`}>
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

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10.0007 8.78472C9.53371 8.78488 9.08241 8.95307 8.72925 9.25854C8.37609 9.56402 8.14465 9.98638 8.07723 10.4484C8.00982 10.9105 8.11093 11.3814 8.36208 11.775C8.61324 12.1687 8.99766 12.4588 9.4451 12.5924V13.7847C9.4451 13.9321 9.50363 14.0734 9.60781 14.1776C9.712 14.2817 9.85331 14.3403 10.0007 14.3403C10.148 14.3403 10.2893 14.2817 10.3935 14.1776C10.4977 14.0734 10.5562 13.9321 10.5562 13.7847V12.5924C11.0036 12.4588 11.3881 12.1687 11.6392 11.775C11.8904 11.3814 11.9915 10.9105 11.9241 10.4484C11.8567 9.98638 11.6252 9.56402 11.2721 9.25854C10.9189 8.95307 10.4676 8.78488 10.0007 8.78472ZM10.0007 11.5625C9.83583 11.5625 9.67472 11.5136 9.53768 11.4221C9.40063 11.3305 9.29382 11.2003 9.23075 11.0481C9.16768 10.8958 9.15118 10.7282 9.18333 10.5666C9.21548 10.4049 9.29485 10.2565 9.41139 10.1399C9.52794 10.0234 9.67642 9.944 9.83808 9.91185C9.99973 9.87969 10.1673 9.89619 10.3196 9.95927C10.4718 10.0223 10.602 10.1292 10.6935 10.2662C10.7851 10.4032 10.834 10.5643 10.834 10.7292C10.834 10.9502 10.7462 11.1621 10.5899 11.3184C10.4336 11.4747 10.2217 11.5625 10.0007 11.5625ZM15.5562 6.5625H13.334V4.89583C13.334 4.01178 12.9828 3.16393 12.3577 2.53881C11.7326 1.91369 10.8847 1.5625 10.0007 1.5625C9.1166 1.5625 8.26875 1.91369 7.64363 2.53881C7.01851 3.16393 6.66732 4.01178 6.66732 4.89583V6.5625H4.4451C4.15041 6.5625 3.86779 6.67956 3.65942 6.88794C3.45105 7.09631 3.33398 7.37893 3.33398 7.67361V15.4514C3.33398 15.7461 3.45105 16.0287 3.65942 16.2371C3.86779 16.4454 4.15041 16.5625 4.4451 16.5625H15.5562C15.8509 16.5625 16.1335 16.4454 16.3419 16.2371C16.5503 16.0287 16.6673 15.7461 16.6673 15.4514V7.67361C16.6673 7.37893 16.5503 7.09631 16.3419 6.88794C16.1335 6.67956 15.8509 6.5625 15.5562 6.5625ZM7.77843 4.89583C7.77843 4.30646 8.01255 3.74123 8.4293 3.32448C8.84605 2.90774 9.41128 2.67361 10.0007 2.67361C10.59 2.67361 11.1553 2.90774 11.572 3.32448C11.9887 3.74123 12.2229 4.30646 12.2229 4.89583V6.5625H7.77843V4.89583ZM15.5562 15.4514H4.4451V7.67361H15.5562V15.4514Z"
      fill="#AFBACA"
    />
  </svg>
);
