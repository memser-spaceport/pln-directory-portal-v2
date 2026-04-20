'use client';
import styles from './steps.module.scss';

interface CompletionStepProps {
  onViewProfile: () => void;
  onEditAvailability: () => void;
}

export function CompletionStep({ onViewProfile, onEditAvailability }: CompletionStepProps) {
  return (
    <div className={styles.container}>
      <div className={styles.completionIcon}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="24" fill="#F0FDF4" />
          <path d="M16 24L21.5 29.5L32 18" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className={styles.welcomeContent}>
        <h2 className={styles.title}>You're all set</h2>
        <p className={styles.subtitle}>
          Your advisor profile is live and your availability has been saved.
        </p>
      </div>

      <div className={styles.completionDetails}>
        <div className={styles.completionRow}>
          <span className={styles.completionLabel}>What happens next</span>
          <p className={styles.completionText}>
            Founders in the network can browse your profile and request or book time based on your availability windows.
          </p>
        </div>
        <div className={styles.completionRow}>
          <span className={styles.completionLabel}>Editing availability</span>
          <p className={styles.completionText}>
            You can update your availability windows at any time from your profile. Changes take effect when you save.
          </p>
        </div>
      </div>

      <div className={styles.completionActions}>
        <button className={styles.nextButton} onClick={onViewProfile}>
          View my profile
        </button>
        <button className={styles.secondaryButton} onClick={onEditAvailability}>
          Edit availability
        </button>
      </div>
    </div>
  );
}
