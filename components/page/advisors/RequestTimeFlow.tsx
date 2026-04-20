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
    if (!userInfo) return;
    await createRequest.mutateAsync({
      advisorId: advisor.id,
      founderId: userInfo.uid,
      message: message.trim() || '(No message provided)',
    });
    setIsConfirmed(true);
  };

  if (isConfirmed) {
    return (
      <div className={styles.confirmation}>
        <div className={styles.checkIcon}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="16" fill="#F0FDF4"/><path d="M10 16l4.5 4.5 8-8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h3 className={styles.confirmTitle}>Request sent</h3>
        <p className={styles.confirmText}>
          {advisor.member.name} will receive your request by email and get back to you with available times.
        </p>
        <button className={styles.doneButton} onClick={onComplete}>Done</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.advisorRow}>
        <span className={styles.advisorLabel}>Requesting time with</span>
        <span className={styles.advisorName}>{advisor.member.name}</span>
      </div>

      <div className={styles.messageSection}>
        <label className={styles.messageLabel}>
          What would you like to discuss? <span className={styles.optional}>(optional)</span>
        </label>
        <textarea
          className={styles.textarea}
          placeholder="Briefly describe the topic or challenge you&apos;d like guidance on…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />
      </div>

      <p className={styles.emailNote}>
        Your request will be sent to the advisor by email from LabOS. They&apos;ll respond with available times.
      </p>

      <div className={styles.actions}>
        <button className={styles.cancelButton} onClick={onCancel}>Cancel</button>
        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={createRequest.isPending}
        >
          {createRequest.isPending ? 'Sending…' : 'Send request'}
        </button>
      </div>
    </div>
  );
}
