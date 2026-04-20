'use client';
import { useState } from 'react';
import s from './screens.module.scss';

interface Props { onNext: () => void; onBack: () => void; }

type Provider = 'calcom' | 'calendly' | null;

const PROVIDERS = [
  {
    id: 'calcom' as const,
    name: 'Cal.com',
    emoji: '📅',
    bg: '#f0f4ff',
    description: 'Open scheduling. Connect your Cal.com account to share your real-time availability with founders.',
  },
  {
    id: 'calendly' as const,
    name: 'Calendly',
    emoji: '🗓',
    bg: '#f0fdf4',
    description: 'Connect your Calendly account so founders can see your available sessions and request time.',
  },
];

export function ScreenOnboardingConnect({ onNext, onBack }: Props) {
  const [selected, setSelected] = useState<Provider>('calcom');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async (id: Provider) => {
    if (!id) return;
    setSelected(id);
    setConnecting(true);
    await new Promise((r) => setTimeout(r, 800));
    setConnected(true);
    setConnecting(false);
  };

  return (
    <div className={s.screenBg}>
      <div className={s.onboardingWrap}>
        {/* Stepper */}
        <div className={s.stepIndicator}>
          {[{ n: 1, label: 'Welcome' }, { n: 2, label: 'Scheduling' }, { n: 3, label: 'Availability' }].map((step, i) => (
            <div key={step.n} className={s.stepItem}>
              {i > 0 && <div className={s.stepConnector} />}
              <div className={`${s.stepDot} ${step.n === 2 ? s.stepDotActive : step.n < 2 ? s.stepDotDone : ''}`}>
                {step.n < 2 ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> : step.n}
              </div>
              <span className={`${s.stepLabel} ${step.n === 2 ? s.stepLabelActive : ''}`}>{step.label}</span>
            </div>
          ))}
        </div>

        <div className={s.onboardingCard}>
          <div className={s.cardHeading}>
            <h2 className={s.cardTitle}>Connect your scheduling tool</h2>
            <p className={s.cardSubtitle}>
              Connect the tool you use to manage your calendar. Founders will request or book sessions based on your availability.
            </p>
          </div>

          <div className={s.providerCards}>
            {PROVIDERS.map((p) => {
              const isSelected = selected === p.id;
              const isConnected = connected && selected === p.id;
              return (
                <div
                  key={p.id}
                  className={`${s.providerCard} ${isSelected ? s.providerCardSelected : ''}`}
                  onClick={() => !connected && handleConnect(p.id)}
                >
                  <div className={s.providerCardTop}>
                    <div className={s.providerLogoArea} style={{ background: p.bg }}>
                      {p.emoji}
                    </div>
                    <span className={s.providerName}>{p.name}</span>
                    {isConnected && (
                      <span className={s.providerSelectedBadge}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 4-4" stroke="#1b4dff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Connected
                      </span>
                    )}
                    {!connected && isSelected && connecting && (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>Connecting…</span>
                    )}
                    {!connected && !isSelected && (
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>Select</span>
                    )}
                  </div>
                  <p className={s.providerDesc}>{p.description}</p>
                </div>
              );
            })}
          </div>

          <p className={s.helperNote}>
            Your scheduling tool provides the availability data. You&apos;ll select specific windows in the next step.
          </p>

          <div className={s.actionsRow}>
            <button className={s.btnSecondary} onClick={onBack}>Back</button>
            <button className={s.btnPrimary} onClick={onNext} disabled={!connected}>
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
