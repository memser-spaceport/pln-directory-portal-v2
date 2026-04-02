'use client';

import { useState, useMemo } from 'react';
import styles from './AdvisorOfficeHours.module.scss';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

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
  { title: 'All Hands', dayOffset: 11, startHour: 11, endHour: 12 },
  { title: 'Team Standup', dayOffset: 15, startHour: 9, endHour: 9.5 },
  { title: 'Quarterly Review', dayOffset: 18, startHour: 14, endHour: 16 },
  { title: 'Board Meeting', dayOffset: 22, startHour: 10, endHour: 12 },
  { title: 'Team Standup', dayOffset: 29, startHour: 9, endHour: 9.5 },
];

interface SelectedBlock {
  date: string;
  startHour: number;
}

function dateToKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function isPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function AdvisorOfficeHours() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  // Pre-populate with mock availability blocks on upcoming Tuesdays and Thursdays
  const [blocks, setBlocks] = useState<SelectedBlock[]>(() => {
    const today = new Date();
    const initial: SelectedBlock[] = [];
    for (let offset = 1; offset <= 30; offset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      const dow = d.getDay();
      if (dow === 2) initial.push({ date: dateToKey(d), startHour: 10 });
      if (dow === 4) {
        initial.push({ date: dateToKey(d), startHour: 10 });
        initial.push({ date: dateToKey(d), startHour: 14 });
      }
    }
    return initial;
  });

  // Generate calendar days for the month grid
  const monthDays = useMemo(() => {
    const firstDay = new Date(viewMonth.year, viewMonth.month, 1);
    const lastDay = new Date(viewMonth.year, viewMonth.month + 1, 0);
    const startPad = firstDay.getDay();
    const days: (Date | null)[] = [];

    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(viewMonth.year, viewMonth.month, d));
    }
    return days;
  }, [viewMonth]);

  // Map mock events to actual dates
  const events = useMemo(() => {
    const today = new Date();
    return MOCK_EVENTS.map((e) => {
      const d = new Date(today);
      d.setDate(today.getDate() + e.dayOffset);
      return { ...e, date: dateToKey(d) };
    });
  }, []);

  const getBlocksForDay = (date: Date) => {
    const key = dateToKey(date);
    return blocks.filter((b) => b.date === key);
  };

  const getEventsForDay = (date: Date) => {
    const key = dateToKey(date);
    return events.filter((e) => e.date === key);
  };

  const getEventsForCell = (date: Date, hour: number) => {
    const key = dateToKey(date);
    return events.filter((e) => e.date === key && hour >= e.startHour && hour < e.endHour);
  };

  const isConflict = (date: Date, startHour: number) => {
    const key = dateToKey(date);
    for (let h = startHour; h < startHour + 2; h += 0.5) {
      if (events.some((e) => e.date === key && h >= e.startHour && h < e.endHour)) return true;
    }
    return false;
  };

  const toggleBlock = (date: Date, startHour: number) => {
    if (!isEditing) return;
    const key = dateToKey(date);
    const exists = blocks.find((s) => s.date === key && s.startHour === startHour);
    if (exists) {
      setBlocks(blocks.filter((s) => !(s.date === key && s.startHour === startHour)));
    } else {
      setBlocks([...blocks, { date: key, startHour }]);
    }
  };

  const isBlockStart = (date: Date, hour: number) => {
    const key = dateToKey(date);
    return blocks.some((s) => s.date === key && s.startHour === hour);
  };

  const isInBlockRange = (date: Date, hour: number) => {
    const key = dateToKey(date);
    return blocks.some((s) => s.date === key && hour >= s.startHour && hour < s.startHour + 2);
  };

  const prevMonth = () => {
    setViewMonth((m) => m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 });
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setViewMonth((m) => m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 });
    setSelectedDay(null);
  };

  const totalSlots = blocks.length * 4;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>Office Hours</h2>
        <button className={styles.editBtn} onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Done' : 'Edit Availability'}
        </button>
      </div>

      <div className={styles.meta}>
        <span className={styles.timezoneLabel}>{timezone}</span>
        {blocks.length > 0 && (
          <span className={styles.slotCount}>{blocks.length} availability window{blocks.length !== 1 ? 's' : ''} &middot; {totalSlots} bookable 30-min sessions</span>
        )}
      </div>

      {/* Month navigation */}
      <div className={styles.monthNav}>
        <button className={styles.monthNavBtn} onClick={prevMonth}>&larr;</button>
        <span className={styles.monthLabel}>{MONTH_NAMES[viewMonth.month]} {viewMonth.year}</span>
        <button className={styles.monthNavBtn} onClick={nextMonth}>&rarr;</button>
      </div>

      {/* Month grid */}
      <div className={styles.monthGrid}>
        {DAY_NAMES.map((d) => (
          <div key={d} className={styles.monthDayHeader}>{d}</div>
        ))}
        {monthDays.map((date, i) => {
          if (!date) return <div key={`pad-${i}`} className={styles.monthCellEmpty} />;

          const dayBlocks = getBlocksForDay(date);
          const past = isPast(date);
          const isSelected = selectedDay && dateToKey(selectedDay) === dateToKey(date);
          return (
            <div
              key={dateToKey(date)}
              className={`${styles.monthCell} ${past ? styles.monthCellPast : ''} ${isSelected ? styles.monthCellActive : ''}`}
              onClick={() => !past && setSelectedDay(date)}
            >
              <span className={styles.monthDate}>{date.getDate()}</span>
              {dayBlocks.length > 0 && (
                <div className={styles.monthDots}>
                  <span className={styles.monthDot} />
                  <span className={styles.monthSlotLabel}>{dayBlocks.length * 4} sessions</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div className={styles.dayPanel}>
          <div className={styles.dayPanelHeader}>
            <h3 className={styles.dayPanelTitle}>
              {DAY_NAMES[selectedDay.getDay()]}, {MONTH_NAMES[selectedDay.getMonth()]} {selectedDay.getDate()}
            </h3>
            {isEditing && <span className={styles.dayPanelHint}>Click a time to add/remove a 2-hour availability window</span>}
          </div>
          <div className={styles.dayGrid}>
            {HOURS.map((hour) => {
              const cellEvents = getEventsForCell(selectedDay, hour);
              const inRange = isInBlockRange(selectedDay, hour);
              const blockStart = isBlockStart(selectedDay, hour);

              return (
                <div
                  key={hour}
                  className={`${styles.dayRow} ${inRange ? styles.dayRowSelected : ''} ${isEditing ? styles.dayRowEditable : ''}`}
                  onClick={() => {
                    if (isEditing && !isConflict(selectedDay, hour) && hour <= 17) {
                      toggleBlock(selectedDay, hour);
                    }
                  }}
                >
                  <div className={styles.dayTime}>
                    {hour > 12 ? `${hour - 12}pm` : hour === 12 ? '12pm' : `${hour}am`}
                  </div>
                  <div className={styles.dayContent}>
                    {cellEvents.map((ev, i) => (
                      <div key={i} className={styles.event}>{ev.title}</div>
                    ))}
                    {blockStart && <div className={styles.blockMarker}>Available &middot; 2h window (4 x 30-min sessions)</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
