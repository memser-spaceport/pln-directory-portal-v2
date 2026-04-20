'use client';
import { PROTO_ADVISOR } from '../proto-mock-data';
import s from './screens.module.scss';

interface Props { onNext: () => void; }

export function ScreenOnboardingWelcome({ onNext }: Props) {
  return (
    <div className={s.screenBg}>
      <div className={s.onboardingWrap}>
        <div className={s.onboardingCard}>
          {/* Icon */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className={s.iconCircle} style={{ background: '#eef2ff', width: 56, height: 56 }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 2C7.373 2 2 7.373 2 14s5.373 12 12 12 12-5.373 12-12S20.627 2 14 2zm0 2c5.514 0 10 4.486 10 10S19.514 24 14 24 4 19.514 4 14 8.486 4 14 4zm-1 5v6h6v-2h-4V9h-2z" fill="#1b4dff"/>
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className={s.cardHeading}>
            <h2 className={s.cardTitle}>You&apos;ve been invited to join<br />Protocol Labs advisors</h2>
            <p className={s.cardSubtitle}>
              Protocol Labs has prepared your advisor profile. You just need to finish setting up your scheduling so founders can book Office Hours with you.
            </p>
          </div>

          {/* Pre-filled profile preview */}
          <div className={s.advisorPreviewCard}>
            <img src={PROTO_ADVISOR.avatar} alt={PROTO_ADVISOR.name} className={s.advisorPreviewAvatar} />
            <div className={s.advisorPreviewInfo}>
              <p className={s.advisorPreviewName}>{PROTO_ADVISOR.name}</p>
              <p className={s.advisorPreviewRole}>{PROTO_ADVISOR.role} · {PROTO_ADVISOR.company}</p>
            </div>
            <span className={s.advisorPreviewBadge}>Profile pre-filled</span>
          </div>

          {/* What to expect */}
          <div className={s.checkList}>
            <div className={s.checkItem}>
              <div className={s.checkDot}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 4-4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p className={s.checkText}>Your profile is already prepared — no need to fill in bio or experience.</p>
            </div>
            <div className={s.checkItem}>
              <div className={s.checkDot}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 4-4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p className={s.checkText}>Connect your scheduling tool (Cal.com or Calendly).</p>
            </div>
            <div className={s.checkItem}>
              <div className={s.checkDot}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 4-4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p className={s.checkText}>Select availability windows for founder sessions. Setup takes about 2 minutes.</p>
            </div>
          </div>

          <p className={s.helperNote}>
            This is an invite-only flow. Only advisors invited directly by Protocol Labs can access this link.
          </p>

          <div className={s.actionsEnd}>
            <button className={s.btnPrimary} onClick={onNext}>Get started</button>
          </div>
        </div>
      </div>
    </div>
  );
}
