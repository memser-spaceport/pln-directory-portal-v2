'use client';
import { useState } from 'react';
import { PROTO_ADVISOR_REQUEST } from '../proto-mock-data';
import s from './screens.module.scss';

interface Props {
  onBack: () => void;
}

export function ScreenAdvisorProfileRequest({ onBack }: Props) {
  const advisor = PROTO_ADVISOR_REQUEST;
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className={s.screenBg}>
        <div className={s.profileLayout}>
          <button className={s.profileBackBtn} onClick={() => setSubmitted(false)}>
            ← Back to profile
          </button>
          <div className={s.profileSection}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                padding: '20px 0',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 12l5.5 5.5 11-11"
                    stroke="#16a34a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0a0c11', margin: 0 }}>Request sent</h3>
              <p style={{ fontSize: 14, color: '#64748b', margin: 0, maxWidth: 380, lineHeight: 1.6 }}>
                {advisor.name} will receive your request via LabOS. They&apos;ll follow up by email to schedule a
                session.
              </p>
              <button className={s.btnPrimary} onClick={() => setSubmitted(false)}>
                Back to profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.screenBg}>
      <div className={s.profileLayout}>
        <button className={s.profileBackBtn} onClick={onBack}>
          ← All advisors
        </button>

        {/* Header */}
        <div className={s.profileSection}>
          <div className={s.profileHeader}>
            <div className={s.profileAvatarWrap}>
              <img src={advisor.avatar} alt={advisor.name} className={s.profileAvatar} />
              <span className={s.profileAdvisorBadge}>Advisor</span>
            </div>
            <div className={s.profileInfo}>
              <h1 className={s.profileName}>{advisor.name}</h1>
              <p className={s.profileMeta}>
                {advisor.role} · {advisor.company}
              </p>
              <div className={s.profileLocation}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 1C5.24 1 3 3.24 3 6.5c0 3.06 4.19 8.17 4.37 8.39a.75.75 0 0 0 1.26 0C8.81 14.67 13 9.56 13 6.5 13 3.24 10.76 1 8 1zm0 8a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
                    fill="#94a3b8"
                  />
                </svg>
                {advisor.location}
              </div>
              <div className={s.profileTags}>
                {advisor.expertise.map((e) => (
                  <span key={e} className={s.tag}>
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className={s.profileSection}>
          <h2 className={s.sectionTitle}>Bio</h2>
          <p className={s.bioText}>{advisor.bio}</p>
        </div>

        {/* Office Hours — request state */}
        <div className={s.profileSection}>
          <div className={s.ohHeader}>
            <div>
              <h2 className={s.sectionTitle} style={{ margin: 0 }}>
                Office Hours
              </h2>
              <p className={s.ohProviderNote} style={{ color: '#0891b2' }}>
                Calendar not connected — request a time directly
              </p>
            </div>
          </div>

          <div className={s.noSlotsBlock} style={{ marginBottom: 12 }}>
            <p className={s.noSlotsText}>
              {advisor.name} hasn&apos;t connected a scheduling tool yet. You can send a direct request and they&apos;ll
              follow up by email.
            </p>
          </div>

          <div className={s.requestForm}>
            <div className={s.requestAdvisorRow}>
              <img
                src={advisor.avatar}
                alt={advisor.name}
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
              />
              <span style={{ fontSize: 13, color: '#64748b' }}>Requesting time with</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0c11' }}>{advisor.name}</span>
            </div>

            <label className={s.requestFormLabel}>
              What would you like to discuss?{' '}
              <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: 12 }}>(optional)</span>
            </label>
            <textarea
              className={s.requestTextarea}
              placeholder="Briefly describe the topic or challenge you'd like guidance on…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />

            <p className={s.helperNote}>
              {advisor.name} will receive your request via LabOS and reach out by email to confirm a time.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className={s.btnPrimary} onClick={() => setSubmitted(true)}>
                Send request
              </button>
            </div>
          </div>
        </div>

        {/* Experience */}
        <div className={s.profileSection}>
          <h2 className={s.sectionTitle}>Experience</h2>
          <div className={s.expList}>
            {[
              { emoji: '🛡', role: 'Lead Auditor', company: 'OpenZeppelin', period: '2021 – present' },
              { emoji: '🔍', role: 'Security Researcher', company: 'Trail of Bits', period: '2019 – 2021' },
              { emoji: '🎓', role: 'MSc Computer Security', company: 'IIT Madras', period: '2017 – 2019' },
            ].map((exp) => (
              <div key={exp.company} className={s.expItem}>
                <div className={s.expLogo}>{exp.emoji}</div>
                <div className={s.expInfo}>
                  <p className={s.expRole}>{exp.role}</p>
                  <p className={s.expCompany}>{exp.company}</p>
                  <p className={s.expPeriod}>{exp.period}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
