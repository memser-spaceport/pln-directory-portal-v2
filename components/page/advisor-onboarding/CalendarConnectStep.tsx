'use client';
import { useConnectCalendar } from '@/services/advisors/hooks/useConnectCalendar';
import { CalendarProvider } from '@/types/advisors.types';
import styles from './steps.module.scss';

interface CalendarConnectStepProps {
  provider: CalendarProvider | null;
  connected: boolean;
  onConnect: (provider: CalendarProvider) => void;
  onNext: () => void;
  onBack: () => void;
}

const PROVIDERS: { id: CalendarProvider; name: string; description: string; icon: string }[] = [
  {
    id: 'calcom',
    name: 'Cal.com',
    description: 'Open-source scheduling. Connect your Cal.com account to expose your availability.',
    icon: '📅',
  },
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Connect your Calendly account so founders can request or book time.',
    icon: '🗓',
  },
];

export function CalendarConnectStep({ provider, connected, onConnect, onNext, onBack }: CalendarConnectStepProps) {
  const connectCalendar = useConnectCalendar();

  const handleConnect = async (p: CalendarProvider) => {
    await connectCalendar.mutateAsync(p);
    onConnect(p);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Connect your scheduling tool</h2>
      <p className={styles.subtitle}>
        Connect your scheduling tool so founders can request or book time based on your availability.
      </p>

      <div className={styles.providers}>
        {PROVIDERS.map((p) => {
          const isConnected = provider === p.id && connected;
          return (
            <button
              key={p.id}
              className={`${styles.providerCard} ${isConnected ? styles.providerConnected : ''} ${provider && provider !== p.id && connected ? styles.providerDimmed : ''}`}
              onClick={() => handleConnect(p.id)}
              disabled={connectCalendar.isPending || (connected && provider !== p.id)}
            >
              <div className={styles.providerCardTop}>
                <span className={styles.providerIcon}>{p.icon}</span>
                <span className={styles.providerName}>{p.name}</span>
                {isConnected && (
                  <span className={styles.connectedBadge}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Connected
                  </span>
                )}
              </div>
              <p className={styles.providerDescription}>{p.description}</p>
              {!isConnected && (
                <span className={styles.connectCta}>
                  {connectCalendar.isPending && provider === p.id ? 'Connecting…' : `Connect ${p.name}`}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className={styles.helperNote}>
        Your scheduling tool provides the availability data. You&apos;ll set specific windows in the next step.
      </p>

      <div className={styles.actionsBetween}>
        <button className={styles.backButton} onClick={onBack}>Back</button>
        <button className={styles.nextButton} onClick={onNext} disabled={!connected}>
          Continue
        </button>
      </div>
    </div>
  );
}
