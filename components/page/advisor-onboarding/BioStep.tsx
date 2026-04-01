'use client';
import styles from './steps.module.scss';

interface BioStepProps { value: string; onChange: (value: string) => void; onNext: () => void; }

export function BioStep({ value, onChange, onNext }: BioStepProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Tell us about yourself</h2>
      <p className={styles.subtitle}>Share your background and expertise. This will help founders understand how you can help them.</p>
      <textarea className={styles.textarea} placeholder="e.g., Former VP of Engineering at a Series C fintech company..." value={value} onChange={(e) => onChange(e.target.value)} rows={6} />
      <div className={styles.actionsEnd}>
        <button className={styles.nextButton} onClick={onNext} disabled={!value.trim()}>Continue</button>
      </div>
    </div>
  );
}
