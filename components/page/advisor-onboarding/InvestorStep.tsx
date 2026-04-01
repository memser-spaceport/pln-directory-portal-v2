'use client';
import styles from './steps.module.scss';

interface InvestorStepProps { onNext: () => void; onSkip: () => void; onBack: () => void; }

export function InvestorStep({ onNext, onSkip, onBack }: InvestorStepProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Investor Profile</h2>
      <p className={styles.subtitle}>If you are also an investor, you can set up your investor profile. This step is optional and can be completed later in your settings.</p>
      <div className={styles.placeholder}>Investor profile form will use existing investor form components from the settings page.</div>
      <div className={styles.actionsBetween}>
        <button className={styles.backButton} onClick={onBack}>Back</button>
        <div className={styles.rightActions}>
          <button className={styles.skipButton} onClick={onSkip}>Skip</button>
          <button className={styles.nextButton} onClick={onNext}>Complete Setup</button>
        </div>
      </div>
    </div>
  );
}
