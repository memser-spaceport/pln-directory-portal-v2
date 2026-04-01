'use client';
import { useState } from 'react';
import styles from './steps.module.scss';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_BLOCKS = [
  { label: '9-11', start: '09:00', end: '11:00' },
  { label: '11-13', start: '11:00', end: '13:00' },
  { label: '13-15', start: '13:00', end: '15:00' },
  { label: '15-17', start: '15:00', end: '17:00' },
  { label: '17-19', start: '17:00', end: '19:00' },
];

interface SelectedBlock { dayOfWeek: number; startTime: string; endTime: string; }

interface AvailabilityStepProps {
  slots: any[];
  onSlotsChange: (slots: any[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function AvailabilityStep({ slots, onSlotsChange, onNext, onBack }: AvailabilityStepProps) {
  const [selected, setSelected] = useState<SelectedBlock[]>(
    slots.map((s: any) => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })),
  );

  const toggleBlock = (dayOfWeek: number, startTime: string, endTime: string) => {
    const exists = selected.find((s) => s.dayOfWeek === dayOfWeek && s.startTime === startTime);
    let updated: SelectedBlock[];
    if (exists) {
      updated = selected.filter((s) => !(s.dayOfWeek === dayOfWeek && s.startTime === startTime));
    } else {
      updated = [...selected, { dayOfWeek, startTime, endTime }];
    }
    setSelected(updated);
    onSlotsChange(updated.map((s) => ({ ...s, slotDuration: 30, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })));
  };

  const isSelected = (dayOfWeek: number, startTime: string) =>
    selected.some((s) => s.dayOfWeek === dayOfWeek && s.startTime === startTime);

  const totalSlots = selected.length * 4;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Set your availability</h2>
      <p className={styles.subtitle}>Select at least one 2-hour block. Each block will be split into 30-minute slots for founders to book.</p>
      <div className={styles.grid}>
        <div className={styles.gridHeader}>
          <div className={styles.cornerCell} />
          {TIME_BLOCKS.map((b) => <div key={b.start} className={styles.timeHeader}>{b.label}</div>)}
        </div>
        {DAYS.map((day, dayIdx) => (
          <div key={day} className={styles.gridRow}>
            <div className={styles.dayLabel}>{day}</div>
            {TIME_BLOCKS.map((b) => (
              <button
                key={`${dayIdx}-${b.start}`}
                className={`${styles.cell} ${isSelected(dayIdx, b.start) ? styles.cellSelected : ''}`}
                onClick={() => toggleBlock(dayIdx, b.start, b.end)}
              />
            ))}
          </div>
        ))}
      </div>
      {selected.length > 0 && (
        <p className={styles.preview}>{selected.length} block{selected.length > 1 ? 's' : ''} selected = {totalSlots} bookable slots per week</p>
      )}
      <div className={styles.actionsBetween}>
        <button className={styles.backButton} onClick={onBack}>Back</button>
        <button className={styles.nextButton} onClick={onNext} disabled={selected.length === 0}>Continue</button>
      </div>
    </div>
  );
}
