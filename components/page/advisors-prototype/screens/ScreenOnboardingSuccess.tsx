'use client';
import { PROTO_ADVISOR } from '../proto-mock-data';
import s from './screens.module.scss';

interface Props { onViewProfile: () => void; onEditAvailability: () => void; }

export function ScreenOnboardingSuccess({ onViewProfile, onEditAvailability }: Props) {
  return (
    <div className={s.screenBg}>
      <div className={s.onboardingWrap}>
        <div className={s.onboardingCard}>
          {/* Success icon */}
          <div className={s.successIcon}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M6 14l5.5 5.5 11-11" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <div className={s.cardHeading}>
            <h2 className={s.cardTitle} style={{ textAlign: 'center' }}>You&apos;re all set</h2>
            <p className={s.cardSubtitle} style={{ textAlign: 'center' }}>
              Your advisor profile is live. Founders in the network can now find and request time with you.
            </p>
          </div>

          {/* Setup summary */}
          <div className={s.successDetails}>
            <div className={s.successRow}>
              <span className={s.successRowLabel}>Profile</span>
              <p className={s.successRowValue}>
                {PROTO_ADVISOR.name} · {PROTO_ADVISOR.role} at {PROTO_ADVISOR.company}
              </p>
            </div>
            <div className={s.successRow}>
              <span className={s.successRowLabel}>Scheduling</span>
              <p className={s.successRowValue}>Cal.com connected</p>
            </div>
            <div className={s.successRow}>
              <span className={s.successRowLabel}>Availability</span>
              <p className={s.successRowValue}>
                2 windows set — Mon 9–11am &amp; Wed 2–4pm (America/Los_Angeles)
              </p>
            </div>
            <div className={s.successRow}>
              <span className={s.successRowLabel}>Session length</span>
              <p className={s.successRowValue}>30 minutes per session (system-configured)</p>
            </div>
          </div>

          <p className={s.helperNote}>
            Founders can now browse your profile and request or book sessions. You can update your availability at any time from your advisor settings.
          </p>

          <div className={s.twoButtons}>
            <button className={s.btnPrimary} onClick={onViewProfile}>
              View my advisor profile
            </button>
            <button className={s.btnSecondary} onClick={onEditAvailability}>
              Edit availability
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
