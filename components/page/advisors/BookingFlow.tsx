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

export function BookingFlow({ advisor, selectedSlot, onCancel, onComplete }: BookingFlowProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const createBooking = useCreateBooking();
  const userInfo = getUserInfoFromLocal();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file || !userInfo) return;

    await createBooking.mutateAsync({
      advisorId: advisor.id,
      founderId: userInfo.uid,
      slotId: selectedSlot.slotId,
      date: selectedSlot.date,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      preReadFileUrl: `/uploads/${file.name}`,
    });

    setIsConfirmed(true);
  };

  if (isConfirmed) {
    return (
      <div className={styles.confirmation}>
        <div className={styles.checkIcon}>&#10003;</div>
        <h3 className={styles.confirmTitle}>Booking Confirmed</h3>
        <p className={styles.confirmText}>
          Your session with {advisor.member.name} on {selectedSlot.date} at {selectedSlot.startTime} has been confirmed. You will receive a calendar invite shortly.
        </p>
        <button className={styles.doneButton} onClick={onComplete}>
          Done
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Book Session</h3>
      <div className={styles.slotSummary}>
        <span className={styles.label}>Selected slot</span>
        <span className={styles.value}>
          {selectedSlot.date} &middot; {selectedSlot.startTime} - {selectedSlot.endTime}
        </span>
      </div>
      <div className={styles.uploadSection}>
        <span className={styles.label}>Pre-read document (required)</span>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt,.md"
          className={styles.fileInput}
        />
        {file && <span className={styles.fileName}>{file.name}</span>}
      </div>
      <div className={styles.actions}>
        <button className={styles.cancelButton} onClick={onCancel}>
          Cancel
        </button>
        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={!file || createBooking.isPending}
        >
          {createBooking.isPending ? 'Booking...' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );
}
