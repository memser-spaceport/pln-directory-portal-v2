'use client';
import { useState } from 'react';
import { PROTO_CAL_EVENTS, PROTO_AVAIL_WINDOWS } from '../proto-mock-data';
import s from './screens.module.scss';

interface Props { onNext: () => void; onBack: () => void; }

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const DAYS = [
  { idx: 1, name: 'Mon', date: 14 },
  { idx: 2, name: 'Tue', date: 15 },
  { idx: 3, name: 'Wed', date: 16 },
  { idx: 4, name: 'Thu', date: 17 },
  { idx: 5, name: 'Fri', date: 18 },
];

const SLOT_DURATION_MINS = 30;
const WINDOW_HOURS = 2;
const SESSIONS_PER_WINDOW = (WINDOW_HOURS * 60) / SLOT_DURATION_MINS;

function formatHour(h: number): string {
  if (h === 12) return '12pm';
  return h > 12 ? `${h - 12}pm` : `${h}am`;
}

interface Block { dayIdx: number; startH: number; }

function blocksFromWindows(windows: typeof PROTO_AVAIL_WINDOWS): Block[] {
  return windows.map((w) => ({ dayIdx: w.dayIdx, startH: w.startH }));
}

function isInWindow(dayIdx: number, hour: number, blocks: Block[]): boolean {
  return blocks.some((b) => b.dayIdx === dayIdx && hour >= b.startH && hour < b.startH + WINDOW_HOURS);
}

function isBlockStart(dayIdx: number, hour: number, blocks: Block[]): boolean {
  return blocks.some((b) => b.dayIdx === dayIdx && b.startH === hour);
}

function hasEvent(dayIdx: number, hour: number): boolean {
  return PROTO_CAL_EVENTS.some((e) => e.dayIdx === dayIdx && hour >= e.startH && hour < e.endH);
}

function getEventTitle(dayIdx: number, hour: number): string {
  const ev = PROTO_CAL_EVENTS.find((e) => e.dayIdx === dayIdx && hour >= e.startH && hour < e.endH);
  return ev?.title ?? '';
}

function isConflict(dayIdx: number, startH: number): boolean {
  for (let h = startH; h < startH + WINDOW_HOURS; h += 0.5) {
    if (PROTO_CAL_EVENTS.some((e) => e.dayIdx === dayIdx && h >= e.startH && h < e.endH)) return true;
  }
  return false;
}

export function ScreenOnboardingAvailability({ onNext, onBack }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(blocksFromWindows(PROTO_AVAIL_WINDOWS));
  const timezone = 'America/Los_Angeles';

  const toggleBlock = (dayIdx: number, startH: number) => {
    if (isConflict(dayIdx, startH)) return;
    if (startH > 17) return;
    const exists = blocks.find((b) => b.dayIdx === dayIdx && b.startH === startH);
    if (exists) {
      setBlocks(blocks.filter((b) => !(b.dayIdx === dayIdx && b.startH === startH)));
    } else {
      setBlocks([...blocks, { dayIdx, startH }]);
    }
  };

  const totalSessions = blocks.length * SESSIONS_PER_WINDOW;

  return (
    <div className={s.screenBg}>
      <div className={s.onboardingWrap} style={{ maxWidth: 680 }}>
        {/* Stepper */}
        <div className={s.stepIndicator}>
          {[{ n: 1, label: 'Welcome' }, { n: 2, label: 'Scheduling' }, { n: 3, label: 'Availability' }].map((step, i) => (
            <div key={step.n} className={s.stepItem}>
              {i > 0 && <div className={s.stepConnector} />}
              <div className={`${s.stepDot} ${step.n === 3 ? s.stepDotActive : step.n < 3 ? s.stepDotDone : ''}`}>
                {step.n < 3 ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> : step.n}
              </div>
              <span className={`${s.stepLabel} ${step.n === 3 ? s.stepLabelActive : ''}`}>{step.label}</span>
            </div>
          ))}
        </div>

        <div className={s.onboardingCard}>
          <div className={s.cardHeading}>
            <h2 className={s.cardTitle}>Choose when founders can book time with you</h2>
            <p className={s.cardSubtitle}>
              Select availability windows. Each window will be divided into {SLOT_DURATION_MINS}-min sessions that founders can individually book.
            </p>
          </div>

          {/* Meta chips */}
          <div className={s.availMeta}>
            <div className={s.metaChip}>
              <span className={s.metaChipLabel}>Timezone</span>
              <span className={s.metaChipVal}>{timezone}</span>
            </div>
            <div className={s.metaChip}>
              <span className={s.metaChipLabel}>Session length</span>
              <span className={s.metaChipVal}>{SLOT_DURATION_MINS} min</span>
            </div>
          </div>

          {/* Legend */}
          <div className={s.calLegend}>
            <span className={s.legendItem}><span className={s.legendDotBlue} /> Your availability window</span>
            <span className={s.legendItem}><span className={s.legendDotRed} /> Existing calendar event</span>
            <span className={s.legendItem}><span className={s.legendDotEmpty} /> Available to select</span>
          </div>

          {/* Week label */}
          <div className={s.calWeekNav}>
            <button className={s.calWeekBtn}>←</button>
            <span className={s.calWeekLabel}>Mon Apr 14 — Fri Apr 18, 2026</span>
            <button className={s.calWeekBtn}>→</button>
          </div>

          {/* Calendar grid */}
          <div className={s.calGrid}>
            {/* Header */}
            <div className={s.calHead}>
              <div className={s.calHeadGutter} />
              {DAYS.map((d) => (
                <div key={d.idx} className={s.calHeadDay}>
                  <div className={s.calHeadDayName}>{d.name}</div>
                  <div className={s.calHeadDayNum}>{d.date}</div>
                </div>
              ))}
            </div>
            {/* Body */}
            <div className={s.calBody}>
              {HOURS.map((hour) => (
                <div key={hour} className={s.calRow}>
                  <div className={s.calGutter}>
                    <span className={s.calTime}>{formatHour(hour)}</span>
                  </div>
                  {DAYS.map((d) => {
                    const inRange = isInWindow(d.idx, hour, blocks);
                    const blockStart = isBlockStart(d.idx, hour, blocks);
                    const evTitle = getEventTitle(d.idx, hour);
                    return (
                      <div
                        key={d.idx}
                        className={`${s.calCell} ${inRange ? s.calCellSelected : ''}`}
                        onClick={() => toggleBlock(d.idx, hour)}
                      >
                        {evTitle && <div className={s.calEvent}>{evTitle}</div>}
                        {blockStart && !evTitle && <div className={s.calBlock}>{WINDOW_HOURS}h · {SESSIONS_PER_WINDOW} sessions</div>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          {blocks.length > 0 ? (
            <p className={s.calSummary}>
              {blocks.length} window{blocks.length > 1 ? 's' : ''} selected — {totalSessions} bookable sessions
            </p>
          ) : (
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
              Click any open cell to add a {WINDOW_HOURS}-hour availability window.
            </p>
          )}

          <p className={s.helperNote}>
            Availability refreshes from your calendar when you edit your schedule. Changes are not synced automatically.
          </p>

          <div className={s.actionsRow}>
            <button className={s.btnSecondary} onClick={onBack}>Back</button>
            <button className={s.btnPrimary} onClick={onNext} disabled={blocks.length === 0}>
              Finish setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
