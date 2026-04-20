'use client';
import { useState } from 'react';
import { PROTO_CAL_EVENTS, PROTO_AVAIL_WINDOWS } from '../proto-mock-data';
import s from './screens.module.scss';

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const DAYS = [
  { idx: 1, name: 'Mon', date: 14 },
  { idx: 2, name: 'Tue', date: 15 },
  { idx: 3, name: 'Wed', date: 16 },
  { idx: 4, name: 'Thu', date: 17 },
  { idx: 5, name: 'Fri', date: 18 },
];

const WINDOW_HOURS = 2;
const SLOT_MINS = 30;
const SESSIONS_PER = (WINDOW_HOURS * 60) / SLOT_MINS;

function formatHour(h: number) {
  if (h === 12) return '12pm';
  return h > 12 ? `${h - 12}pm` : `${h}am`;
}

interface Block { dayIdx: number; startH: number; }

function isInWindow(dayIdx: number, hour: number, blocks: Block[]) {
  return blocks.some((b) => b.dayIdx === dayIdx && hour >= b.startH && hour < b.startH + WINDOW_HOURS);
}

function isBlockStart(dayIdx: number, hour: number, blocks: Block[]) {
  return blocks.some((b) => b.dayIdx === dayIdx && b.startH === hour);
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

interface Props { onBack: () => void; }

export function ScreenEditAvailability({ onBack }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(
    PROTO_AVAIL_WINDOWS.map((w) => ({ dayIdx: w.dayIdx, startH: w.startH }))
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savedState, setSavedState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const toggleBlock = (dayIdx: number, startH: number) => {
    if (isConflict(dayIdx, startH) || startH > 17) return;
    const exists = blocks.find((b) => b.dayIdx === dayIdx && b.startH === startH);
    if (exists) {
      setBlocks(blocks.filter((b) => !(b.dayIdx === dayIdx && b.startH === startH)));
    } else {
      setBlocks([...blocks, { dayIdx, startH }]);
    }
    setSavedState('idle');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsRefreshing(false);
  };

  const handleSave = async () => {
    setSavedState('saving');
    await new Promise((r) => setTimeout(r, 600));
    setSavedState('saved');
  };

  const totalSessions = blocks.length * SESSIONS_PER;

  return (
    <div className={s.screenBg}>
      <div className={s.settingsPageWrap}>
        {/* Page header */}
        <div className={s.settingsPageHeader}>
          <div>
            <h1 className={s.settingsPageTitle}>Edit Availability</h1>
            <p className={s.settingsPageSubtitle}>
              Update when founders can book sessions with you.
            </p>
          </div>
          <button className={s.btnSecondary} onClick={onBack}>← Back</button>
        </div>

        {/* Connected provider */}
        <div className={s.providerInfoCard}>
          <div className={s.providerInfoLeft}>
            <span className={s.providerInfoLabel}>Connected scheduling tool</span>
            <span className={s.providerInfoValue}>📅 Cal.com</span>
          </div>
          <button
            className={s.btnSecondary}
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{ fontSize: 13 }}
          >
            {isRefreshing ? 'Refreshing…' : '↻  Refresh from calendar'}
          </button>
        </div>

        {/* Sync note */}
        <p className={s.syncWarning}>
          <strong>Note:</strong> Changes to your external calendar are not synced automatically. Use <strong>Refresh from calendar</strong> to pull in the latest events before saving.
        </p>

        {/* Availability editor */}
        <div className={s.editorCard}>
          <div className={s.editorCardHeader}>
            <div>
              <h2 className={s.editorCardTitle}>Availability windows</h2>
              <p className={s.editorCardDesc}>
                Click a cell to add or remove a {WINDOW_HOURS}-hour window. Each window creates {SESSIONS_PER} bookable {SLOT_MINS}-min sessions for founders.
              </p>
            </div>
            <div className={s.metaChip}>
              <span className={s.metaChipLabel}>Timezone</span>
              <span className={s.metaChipVal}>America/Los_Angeles</span>
            </div>
          </div>

          <div className={s.calLegend}>
            <span className={s.legendItem}><span className={s.legendDotBlue} /> Your window</span>
            <span className={s.legendItem}><span className={s.legendDotRed} /> Existing event</span>
          </div>

          <div className={s.calWeekNav}>
            <button className={s.calWeekBtn}>←</button>
            <span className={s.calWeekLabel}>Mon Apr 14 — Fri Apr 18, 2026</span>
            <button className={s.calWeekBtn}>→</button>
          </div>

          <div className={s.calGrid}>
            <div className={s.calHead}>
              <div className={s.calHeadGutter} />
              {DAYS.map((d) => (
                <div key={d.idx} className={s.calHeadDay}>
                  <div className={s.calHeadDayName}>{d.name}</div>
                  <div className={s.calHeadDayNum}>{d.date}</div>
                </div>
              ))}
            </div>
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
                        {blockStart && !evTitle && <div className={s.calBlock}>{WINDOW_HOURS}h · {SESSIONS_PER}</div>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className={s.editorFooter}>
            {blocks.length > 0 ? (
              <p className={s.calSummary}>
                {blocks.length} window{blocks.length !== 1 ? 's' : ''} — {totalSessions} bookable sessions
              </p>
            ) : (
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No availability windows set.</p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className={s.btnSecondary} onClick={onBack}>Cancel</button>
              <button
                className={s.btnPrimary}
                onClick={handleSave}
                style={savedState === 'saved' ? { background: '#16a34a' } : undefined}
              >
                {savedState === 'saving' ? 'Saving…' : savedState === 'saved' ? '✓ Saved' : 'Save availability'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
