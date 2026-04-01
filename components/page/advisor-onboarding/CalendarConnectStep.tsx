'use client';
import { useConnectCalendar } from '@/services/advisors/hooks/useConnectCalendar';
import styles from './steps.module.scss';

interface CalendarConnectStepProps {
  provider: 'google' | 'calendly' | null;
  connected: boolean;
  onConnect: (provider: 'google' | 'calendly') => void;
  onNext: () => void;
  onBack: () => void;
}

export function CalendarConnectStep({ provider, connected, onConnect, onNext, onBack }: CalendarConnectStepProps) {
  const connectCalendar = useConnectCalendar();

  const handleConnect = async (p: 'google' | 'calendly') => {
    await connectCalendar.mutateAsync(p);
    onConnect(p);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Connect your calendar</h2>
      <p className={styles.subtitle}>Connect your calendar so founders can book time with you without conflicts.</p>
      <div className={styles.providers}>
        <button
          className={`${styles.providerCard} ${provider === 'google' && connected ? styles.providerConnected : ''}`}
          onClick={() => handleConnect('google')}
          disabled={connectCalendar.isPending}
        >
          <span className={styles.providerName}>Google Calendar</span>
          {provider === 'google' && connected && <span className={styles.connectedLabel}>Connected</span>}
        </button>
        <button
          className={`${styles.providerCard} ${provider === 'calendly' && connected ? styles.providerConnected : ''}`}
          onClick={() => handleConnect('calendly')}
          disabled={connectCalendar.isPending}
        >
          <span className={styles.providerName}>Calendly</span>
          {provider === 'calendly' && connected && <span className={styles.connectedLabel}>Connected</span>}
        </button>
      </div>
      <div className={styles.actionsBetween}>
        <button className={styles.backButton} onClick={onBack}>Back</button>
        <button className={styles.nextButton} onClick={onNext} disabled={!connected}>Continue</button>
      </div>
    </div>
  );
}
