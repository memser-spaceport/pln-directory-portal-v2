'use client';
import styles from './steps.module.scss';

interface LinkedInStepProps { value: string; onChange: (value: string) => void; onNext: () => void; onSkip: () => void; onBack: () => void; isLastStep?: boolean; }

export function LinkedInStep({ value, onChange, onNext, onSkip, onBack, isLastStep }: LinkedInStepProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>LinkedIn Profile</h2>
      <p className={styles.subtitle}>Add your LinkedIn URL so we can import your experience and projects. This step is optional.</p>
      <input type="url" className={styles.input} placeholder="https://linkedin.com/in/yourprofile" value={value} onChange={(e) => onChange(e.target.value)} />
      <div className={styles.actionsBetween}>
        <button className={styles.backButton} onClick={onBack}>Back</button>
        <div className={styles.rightActions}>
          <button className={styles.skipButton} onClick={onSkip}>{isLastStep ? 'Skip & See Profile' : 'Skip'}</button>
          <button className={styles.nextButton} onClick={onNext} disabled={!value.trim()}>{isLastStep ? 'See Profile' : 'Continue'}</button>
        </div>
      </div>
    </div>
  );
}
