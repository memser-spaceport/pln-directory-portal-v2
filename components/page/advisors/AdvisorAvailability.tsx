'use client';

import { IBookableSlot } from '@/types/advisors.types';
import styles from './AdvisorAvailability.module.scss';

interface AdvisorAvailabilityProps {
  slots: IBookableSlot[];
  selectedSlot: IBookableSlot | null;
  onSelectSlot: (slot: IBookableSlot) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return `${DAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

export function AdvisorAvailability({ slots, selectedSlot, onSelectSlot }: AdvisorAvailabilityProps) {
  const availableSlots = slots.filter((s) => s.available);

  if (availableSlots.length === 0) {
    return null;
  }

  const groupedByDate = availableSlots.reduce<Record<string, IBookableSlot[]>>((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Available Slots</h3>
      <div className={styles.days}>
        {sortedDates.map((date) => (
          <div key={date} className={styles.day}>
            <div className={styles.dayLabel}>{formatDate(date)}</div>
            <div className={styles.slots}>
              {groupedByDate[date].map((slot) => {
                const isSelected =
                  selectedSlot?.date === slot.date && selectedSlot?.startTime === slot.startTime;
                return (
                  <button
                    key={`${slot.date}-${slot.startTime}`}
                    className={`${styles.slot} ${isSelected ? styles.slotSelected : ''}`}
                    onClick={() => onSelectSlot(slot)}
                  >
                    {slot.startTime} - {slot.endTime}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
