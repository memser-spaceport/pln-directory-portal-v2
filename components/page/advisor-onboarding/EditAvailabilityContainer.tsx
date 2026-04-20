'use client';

import { useState, useMemo } from 'react';
import { CalendarProvider } from '@/types/advisors.types';
import { useRouter } from 'next/navigation';
import { getUserInfoFromLocal } from '@/utils/common.utils';
import styles from './EditAvailability.module.scss';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MOCK_EVENTS = [
  { title: 'Team Standup', dayOffset: 1, startHour: 9, endHour: 9.5 },
  { title: 'Product Review', dayOffset: 1, startHour: 14, endHour: 15 },
  { title: '1:1 with CEO', dayOffset: 2, startHour: 10, endHour: 10.5 },
  { title: 'Lunch', dayOffset: 3, startHour: 12, endHour: 13 },
  { title: 'Board Prep', dayOffset: 3, startHour: 15, endHour: 17 },
  { title: 'All Hands', dayOffset: 4, startHour: 11, endHour: 12 },
  { title: 'Investor Call', dayOffset: 5, startHour: 9, endHour: 10 },
];

const SLOT_DURATION_MINS = 30;
const WINDOW_HOURS = 2;
const SESSIONS_PER_WINDOW = (WINDOW_HOURS * 60) / SLOT_DURATION_MINS;

interface SelectedBlock {
  date: string;
  startHour: number;
}

function dateToKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDate(date: Date): string {
  return `${DAY_NAMES[date.getDay()]} ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

function getProviderLabel(provider: CalendarProvider | null): string {
  if (provider === 'calcom') return 'Cal.com';
  if (provider === 'calendly') return 'Calendly';
  return 'None';
}

// Pre-populate mock availability on Tuesdays and Thursdays
function getInitialBlocks(): SelectedBlock[] {
  const today = new Date();
  const blocks: SelectedBlock[] = [];
  for (let offset = 1; offset <= 14; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dow = d.getDay();
    if (dow === 2) blocks.push({ date: dateToKey(d), startHour: 10 });
    if (dow === 4) {
      blocks.push({ date: dateToKey(d), startHour: 10 });
      blocks.push({ date: dateToKey(d), startHour: 14 });
    }
  }
  return blocks;
}

interface EditAvailabilityContainerProps {
  initialProvider?: CalendarProvider;
}

export function EditAvailabilityContainer({ initialProvider = 'calcom' }: EditAvailabilityContainerProps) {
  const router = useRouter();
  const userInfo = getUserInfoFromLocal();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [provider] = useState<CalendarProvider | null>(initialProvider);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<SelectedBlock[]>(getInitialBlocks);
  const [isSaved, setIsSaved] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    for (let h = startHour; h < startHour + WINDOW_HOURS; h += 0.5) {
      if (events.some((e) => e.date === key && h >= e.startHour && h < e.endHour)) return true;
    }
    return false;
  };

  const toggleBlock = (date: Date, startHour: number) => {
    const key = dateToKey(date);
    const exists = selected.find((s) => s.date === key && s.startHour === startHour);
    if (exists) {
      setSelected(selected.filter((s) => !(s.date === key && s.startHour === startHour)));
    } else {
      setSelected([...selected, { date: key, startHour }]);
    }
    setIsSaved(false);
  };

  const isSelectedBlock = (date: Date, startHour: number) => {
    const key = dateToKey(date);
    return selected.some((s) => s.date === key && s.startHour === startHour);
  };

  const isInSelectedRange = (date: Date, hour: number) => {
    const key = dateToKey(date);
    return selected.some((s) => s.date === key && hour >= s.startHour && hour < s.startHour + WINDOW_HOURS);
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsRefreshing(false);
  };

  const handleSave = async () => {
    await new Promise((r) => setTimeout(r, 400));
    setIsSaved(true);
  };

  const totalSessions = selected.length * SESSIONS_PER_WINDOW;

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>Edit Availability</h1>
          <p className={styles.pageSubtitle}>Update when founders can book time with you.</p>
        </div>
        <button className={styles.backBtn} onClick={() => router.back()}>
          ← Back
        </button>
      </div>

      {/* Connected provider card */}
      <div className={styles.providerCard}>
        <div className={styles.providerCardLeft}>
          <div className={styles.providerLabel}>Connected scheduling tool</div>
          <div className={styles.providerName}>{getProviderLabel(provider)}</div>
        </div>
        <div className={styles.providerCardRight}>
          <button
            className={styles.refreshBtn}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh from calendar'}
          </button>
        </div>
      </div>

      <p className={styles.syncNote}>
        Changes to your external calendar are not synced automatically. Use <strong>Refresh from calendar</strong> to pull in the latest events before saving.
      </p>

      {/* Availability editor */}
      <div className={styles.editorCard}>
        <div className={styles.editorHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Availability windows</h2>
            <p className={styles.sectionSubtitle}>
              Click a cell to toggle a {WINDOW_HOURS}-hour availability window. Each window creates {SESSIONS_PER_WINDOW} bookable {SLOT_DURATION_MINS}-minute sessions.
            </p>
          </div>
          <div className={styles.infoChips}>
            <span className={styles.infoChip}>
              <span className={styles.infoChipLabel}>Timezone</span>
              <span className={styles.infoChipValue}>{timezone}</span>
            </span>
          </div>
        </div>

        <div className={styles.legend}>
          <span className={styles.legendItem}><span className={styles.legendDotSelected} /> Your window</span>
          <span className={styles.legendItem}><span className={styles.legendDotEvent} /> Existing event</span>
        </div>

        <div className={styles.weekNav}>
          <button className={styles.weekNavBtn} onClick={() => setWeekOffset((w) => w - 1)}>&#8592;</button>
          <span className={styles.weekLabel}>{formatDate(days[0])} — {formatDate(days[6])}</span>
          <button className={styles.weekNavBtn} onClick={() => setWeekOffset((w) => w + 1)}>&#8594;</button>
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
                  const blockStart = isSelectedBlock(d, hour);

                  return (
                    <div
                      key={`${key}-${hour}`}
                      className={`${styles.calCell} ${inRange ? styles.calCellSelected : ''} ${past ? styles.calCellPast : ''} ${!past && hour <= 17 ? styles.calCellClickable : ''}`}
                      onClick={() => {
                        if (!past && !isConflict(d, hour) && hour <= 17) toggleBlock(d, hour);
                      }}
                    >
                      {cellEvents.map((ev, i) => (
                        <div key={i} className={styles.event}>{ev.title}</div>
                      ))}
                      {blockStart && (
                        <div className={styles.blockMarker}>{WINDOW_HOURS}h · {SESSIONS_PER_WINDOW} sessions</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.editorFooter}>
          {selected.length > 0 ? (
            <p className={styles.preview}>
              {selected.length} window{selected.length !== 1 ? 's' : ''} &mdash; {totalSessions} bookable sessions
            </p>
          ) : (
            <p className={styles.emptyHint}>No availability windows set. Click cells to add windows.</p>
          )}

          <div className={styles.footerActions}>
            <button className={styles.cancelBtn} onClick={() => router.back()}>Cancel</button>
            <button
              className={`${styles.saveBtn} ${isSaved ? styles.saveBtnSaved : ''}`}
              onClick={handleSave}
            >
              {isSaved ? '✓ Saved' : 'Save availability'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
