'use client';
import { useState, useMemo } from 'react';
import styles from './availability.module.scss';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8am - 7pm
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Mock calendar events to simulate a connected calendar
const MOCK_EVENTS = [
  { title: 'Team Standup', dayOffset: 1, startHour: 9, endHour: 9.5 },
  { title: 'Product Review', dayOffset: 1, startHour: 14, endHour: 15 },
  { title: '1:1 with CEO', dayOffset: 2, startHour: 10, endHour: 10.5 },
  { title: 'Lunch', dayOffset: 3, startHour: 12, endHour: 13 },
  { title: 'Board Prep', dayOffset: 3, startHour: 15, endHour: 17 },
  { title: 'All Hands', dayOffset: 4, startHour: 11, endHour: 12 },
  { title: 'Investor Call', dayOffset: 5, startHour: 9, endHour: 10 },
  { title: 'Team Standup', dayOffset: 8, startHour: 9, endHour: 9.5 },
  { title: 'Sprint Planning', dayOffset: 8, startHour: 14, endHour: 16 },
  { title: '1:1 with CEO', dayOffset: 9, startHour: 10, endHour: 10.5 },
  { title: 'Design Review', dayOffset: 10, startHour: 13, endHour: 14 },
  { title: 'Lunch', dayOffset: 10, startHour: 12, endHour: 13 },
  { title: 'All Hands', dayOffset: 11, startHour: 11, endHour: 12 },
];

interface SelectedBlock {
  date: string;
  startHour: number;
}

interface AvailabilityStepProps {
  slots: any[];
  onSlotsChange: (slots: any[]) => void;
  onNext: () => void;
  onBack: () => void;
  isLastStep?: boolean;
}

function formatDate(date: Date): string {
  return `${DAY_NAMES[date.getDay()]} ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

function dateToKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function AvailabilityStep({ slots, onSlotsChange, onNext, onBack, isLastStep }: AvailabilityStepProps) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [weekOffset, setWeekOffset] = useState(0);

  const [selected, setSelected] = useState<SelectedBlock[]>(
    slots.map((s: any) => ({ date: s.date, startHour: s.startHour })),
  );

  // Generate 7 days starting from the current week
  const days = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  // Map mock events to actual dates
  const events = useMemo(() => {
    const today = new Date();
    return MOCK_EVENTS.map((e) => {
      const d = new Date(today);
      d.setDate(today.getDate() + e.dayOffset);
      return { ...e, date: dateToKey(d) };
    });
  }, []);

  const getEventsForCell = (date: Date, hour: number) => {
    const key = dateToKey(date);
    return events.filter((e) => e.date === key && hour >= e.startHour && hour < e.endHour);
  };

  const isConflict = (date: Date, startHour: number) => {
    const key = dateToKey(date);
    // Check if any hour in the 2h block conflicts with an event
    for (let h = startHour; h < startHour + 2; h += 0.5) {
      if (events.some((e) => e.date === key && h >= e.startHour && h < e.endHour)) {
        return true;
      }
    }
    return false;
  };

  const toggleBlock = (date: Date, startHour: number) => {
    const key = dateToKey(date);
    const exists = selected.find((s) => s.date === key && s.startHour === startHour);
    let updated: SelectedBlock[];
    if (exists) {
      updated = selected.filter((s) => !(s.date === key && s.startHour === startHour));
    } else {
      updated = [...selected, { date: key, startHour }];
    }
    setSelected(updated);
    onSlotsChange(
      updated.map((s) => ({
        date: s.date,
        startHour: s.startHour,
        startTime: `${String(s.startHour).padStart(2, '0')}:00`,
        endTime: `${String(s.startHour + 2).padStart(2, '0')}:00`,
        slotDuration: 30,
        timezone,
      })),
    );
  };

  const isSelected = (date: Date, startHour: number) => {
    const key = dateToKey(date);
    return selected.some((s) => s.date === key && s.startHour === startHour);
  };

  const isInSelectedRange = (date: Date, hour: number) => {
    const key = dateToKey(date);
    return selected.some((s) => s.date === key && hour >= s.startHour && hour < s.startHour + 2);
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const totalSlots = selected.length * 4;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Set your availability</h2>
      <p className={styles.subtitle}>
        Add 2-hour availability windows to your calendar. Each window will be divided into four 30-minute sessions that founders can individually book. Existing calendar events are shown in red to help you avoid conflicts.
      </p>
      <div className={styles.timezoneRow}>
        <span className={styles.timezoneLabel}>Timezone: {timezone}</span>
      </div>

      <div className={styles.weekNav}>
        <button className={styles.weekNavBtn} onClick={() => setWeekOffset((w) => w - 1)}>&larr;</button>
        <span className={styles.weekLabel}>
          {formatDate(days[0])} — {formatDate(days[6])}
        </span>
        <button className={styles.weekNavBtn} onClick={() => setWeekOffset((w) => w + 1)}>&rarr;</button>
      </div>

      <div className={styles.calendar}>
        <div className={styles.calHeader}>
          <div className={styles.timeGutter} />
          {days.map((d) => (
            <div key={dateToKey(d)} className={`${styles.dayCol} ${isPast(d) ? styles.dayPast : ''}`}>
              <div className={styles.dayName}>{DAY_NAMES[d.getDay()]}</div>
              <div className={styles.dayDate}>{d.getDate()}</div>
            </div>
          ))}
        </div>
        <div className={styles.calBody}>
          {HOURS.map((hour) => (
            <div key={hour} className={styles.calRow}>
              <div className={styles.timeGutter}>
                <span className={styles.timeLabel}>{hour > 12 ? `${hour - 12}pm` : hour === 12 ? '12pm' : `${hour}am`}</span>
              </div>
              {days.map((d) => {
                const key = dateToKey(d);
                const cellEvents = getEventsForCell(d, hour);
                const inRange = isInSelectedRange(d, hour);
                const past = isPast(d);
                const blockStart = isSelected(d, hour);

                return (
                  <div
                    key={`${key}-${hour}`}
                    className={`${styles.calCell} ${inRange ? styles.calCellSelected : ''} ${past ? styles.calCellPast : ''}`}
                    onClick={() => {
                      if (!past && !isConflict(d, hour) && hour <= 17) {
                        toggleBlock(d, hour);
                      }
                    }}
                  >
                    {cellEvents.map((ev, i) => (
                      <div key={i} className={styles.event}>{ev.title}</div>
                    ))}
                    {blockStart && <div className={styles.blockMarker}>2h window (4 sessions)</div>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selected.length > 0 && (
        <p className={styles.preview}>
          {selected.length} window{selected.length > 1 ? 's' : ''} selected — {totalSlots} bookable 30-min sessions for founders
        </p>
      )}
      <div className={styles.actionsBetween}>
        <button className={styles.backButton} onClick={onBack}>Back</button>
        <button className={styles.nextButton} onClick={onNext} disabled={selected.length === 0}>{isLastStep ? 'See Profile' : 'Continue'}</button>
      </div>
    </div>
  );
}
