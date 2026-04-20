'use client';

import { useState } from 'react';
import { IBookableSlot, IAdvisor } from '@/types/advisors.types';
import { useCreateBooking } from '@/services/advisors/hooks/useCreateBooking';
import { getUserInfoFromLocal } from '@/utils/common.utils';
import styles from './BookingFlow.module.scss';

interface BookingFlowProps {
  advisor: IAdvisor;
  selectedSlot: IBookableSlot;
  onCancel: () => void;
  onComplete: () => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatSlotDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function BookingFlow({ advisor, selectedSlot, onCancel, onComplete }: BookingFlowProps) {
  const [description, setDescription] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const createBooking = useCreateBooking();
  const userInfo = getUserInfoFromLocal();

  const handleSubmit = async () => {
    if (!userInfo) return;

    await createBooking.mutateAsync({
      advisorId: advisor.id,
      founderId: userInfo.uid,
      slotId: selectedSlot.slotId,
      date: selectedSlot.date,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      preReadFileUrl: '',
    });

    setIsConfirmed(true);
  };

  if (isConfirmed) {
    return (
      <div className={styles.confirmation}>
        <div className={styles.checkIcon}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="16" fill="#F0FDF4"/><path d="M10 16l4.5 4.5 8-8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h3 className={styles.confirmTitle}>Booking request sent</h3>
        <p className={styles.confirmText}>
          Your session with {advisor.member.name} on {formatSlotDate(selectedSlot.date)} at {formatTime(selectedSlot.startTime)} has been requested. You'll receive a confirmation shortly.
        </p>
        <button className={styles.doneButton} onClick={onComplete}>Done</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Confirm booking</h3>

      <div className={styles.slotSummary}>
        <div className={styles.slotRow}>
          <span className={styles.slotLabel}>Advisor</span>
          <span className={styles.slotValue}>{advisor.member.name}</span>
        </div>
        <div className={styles.slotRow}>
          <span className={styles.slotLabel}>Date</span>
          <span className={styles.slotValue}>{formatSlotDate(selectedSlot.date)}</span>
        </div>
        <div className={styles.slotRow}>
          <span className={styles.slotLabel}>Time</span>
          <span className={styles.slotValue}>{formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}</span>
        </div>
      </div>

      <div className={styles.descriptionSection}>
        <label className={styles.descLabel}>
          What would you like to discuss? <span className={styles.optional}>(optional)</span>
        </label>
        <textarea
          className={styles.textarea}
          placeholder="Briefly describe the topic or question you'd like to cover in this session…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <p className={styles.emailNote}>
        The advisor will receive your booking request by email from LabOS.
      </p>

      <div className={styles.actions}>
        <button className={styles.cancelButton} onClick={onCancel}>Cancel</button>
        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={createBooking.isPending}
        >
          {createBooking.isPending ? 'Sending…' : 'Confirm booking'}
        </button>
      </div>
    </div>
  );
}
