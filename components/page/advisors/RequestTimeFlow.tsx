'use client';

import { useState } from 'react';
import { IAdvisor } from '@/types/advisors.types';
import { useCreateTimeRequest } from '@/services/advisors/hooks/useCreateTimeRequest';
import { getUserInfoFromLocal } from '@/utils/common.utils';
import styles from './RequestTimeFlow.module.scss';

interface RequestTimeFlowProps {
  advisor: IAdvisor;
  onCancel: () => void;
  onComplete: () => void;
}

export function RequestTimeFlow({ advisor, onCancel, onComplete }: RequestTimeFlowProps) {
  const [message, setMessage] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const createRequest = useCreateTimeRequest();
  const userInfo = getUserInfoFromLocal();

  const handleSubmit = async () => {
    if (!message.trim() || !userInfo) return;
    await createRequest.mutateAsync({
      advisorId: advisor.id,
      founderId: userInfo.uid,
      message: message.trim(),
    });
    setIsConfirmed(true);
  };

  if (isConfirmed) {
    return (
      <div className={styles.confirmation}>
        <div className={styles.checkIcon}>&#10003;</div>
        <h3 className={styles.confirmTitle}>Request Sent</h3>
        <p className={styles.confirmText}>
          Your request has been sent to {advisor.member.name}. They will get back to you with available times.
        </p>
        <button className={styles.doneButton} onClick={onComplete}>Done</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Request a Time</h3>
      <p className={styles.subtitle}>
        No slots available right now. Send a message to {advisor.member.name} to request a time.
      </p>
      <textarea
        className={styles.textarea}
        placeholder="Briefly describe what you'd like to discuss..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
      />
      <div className={styles.actions}>
        <button className={styles.cancelButton} onClick={onCancel}>Cancel</button>
        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={!message.trim() || createRequest.isPending}
        >
          {createRequest.isPending ? 'Sending...' : 'Send Request'}
        </button>
      </div>
    </div>
  );
}
