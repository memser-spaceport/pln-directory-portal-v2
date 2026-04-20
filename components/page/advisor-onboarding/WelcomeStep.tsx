'use client';
import styles from './steps.module.scss';

interface WelcomeStepProps {
  advisorName?: string;
  onNext: () => void;
}

export function WelcomeStep({ advisorName, onNext }: WelcomeStepProps) {
  return (
    <div className={styles.container}>
      <div className={styles.welcomeIcon}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="20" fill="#EEF2FF" />
          <path d="M20 11C15.037 11 11 15.037 11 20C11 24.963 15.037 29 20 29C24.963 29 29 24.963 29 20C29 15.037 24.963 11 20 11ZM20 27.2C16.023 27.2 12.8 23.977 12.8 20C12.8 16.023 16.023 12.8 20 12.8C23.977 12.8 27.2 16.023 27.2 20C27.2 23.977 23.977 27.2 20 27.2ZM20.9 16.1H19.1V21.5L23.75 24.245L24.65 22.775L20.9 20.585V16.1Z" fill="#6366f1"/>
          <circle cx="20" cy="20" r="7" fill="none" stroke="#6366f1" strokeWidth="1.5"/>
          <path d="M18 20l2 2 4-4" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className={styles.welcomeContent}>
        <h2 className={styles.title}>
          {advisorName ? `Welcome, ${advisorName}` : 'Welcome to PL Network'}
        </h2>
        <p className={styles.subtitle}>
          You've been invited to join the Protocol Labs advisor network.
        </p>
      </div>

      <div className={styles.welcomeList}>
        <div className={styles.welcomeItem}>
          <div className={styles.welcomeItemDot} />
          <p className={styles.welcomeItemText}>
            Your advisor profile has already been prepared — no need to fill in the basics.
          </p>
        </div>
        <div className={styles.welcomeItem}>
          <div className={styles.welcomeItemDot} />
          <p className={styles.welcomeItemText}>
            You'll connect your scheduling tool and set your availability windows.
          </p>
        </div>
        <div className={styles.welcomeItem}>
          <div className={styles.welcomeItemDot} />
          <p className={styles.welcomeItemText}>
            Founders in the network will be able to request or book time for Office Hours.
          </p>
        </div>
      </div>

      <p className={styles.helperNote}>
        Setup takes about 2 minutes. You can update your availability at any time.
      </p>

      <div className={styles.actionsEnd}>
        <button className={styles.nextButton} onClick={onNext}>
          Get started
        </button>
      </div>
    </div>
  );
}
