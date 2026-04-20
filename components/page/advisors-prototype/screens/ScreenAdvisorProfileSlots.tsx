'use client';
import { useState } from 'react';
import { PROTO_ADVISOR, PROTO_SLOTS, ProtoSlot } from '../proto-mock-data';
import s from './screens.module.scss';

interface Props { onBack: () => void; }

// Group slots by date
function groupByDate(slots: ProtoSlot[]): Record<string, ProtoSlot[]> {
  return slots.reduce<Record<string, ProtoSlot[]>>((acc, slot) => {
    if (!acc[slot.dateLabel]) acc[slot.dateLabel] = [];
    acc[slot.dateLabel].push(slot);
    return acc;
  }, {});
}

export function ScreenAdvisorProfileSlots({ onBack }: Props) {
  const advisor = PROTO_ADVISOR;
  const [selectedSlot, setSelectedSlot] = useState<ProtoSlot | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [description, setDescription] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  const availableSlots = PROTO_SLOTS.filter((s) => s.available);
  const grouped = groupByDate(availableSlots);
  const sortedDates = Object.keys(grouped);

  if (isConfirmed && selectedSlot) {
    return (
      <div className={s.screenBg}>
        <div className={s.profileLayout}>
          <button className={s.profileBackBtn} onClick={() => { setIsConfirmed(false); setShowBooking(false); setSelectedSlot(null); setDescription(''); }}>← Back to profile</button>
          <div className={s.profileSection}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 12l5.5 5.5 11-11" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0a0c11', margin: 0 }}>Booking confirmed</h3>
              <p style={{ fontSize: 14, color: '#64748b', margin: 0, maxWidth: 380, lineHeight: 1.6 }}>
                Your session with {advisor.name} on {selectedSlot.dateLabel} at {selectedSlot.time} has been requested. You&apos;ll receive a confirmation by email.
              </p>
              <button className={s.btnPrimary} onClick={() => { setIsConfirmed(false); setShowBooking(false); setSelectedSlot(null); }}>Done</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showBooking && selectedSlot) {
    return (
      <div className={s.screenBg}>
        <div className={s.profileLayout}>
          <button className={s.profileBackBtn} onClick={() => setShowBooking(false)}>← Back to profile</button>
          <div className={s.profileSection}>
            <h2 className={s.sectionTitle}>Confirm booking</h2>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
              {[
                { label: 'Advisor', value: advisor.name },
                { label: 'Date', value: selectedSlot.dateLabel },
                { label: 'Time', value: `${selectedSlot.time} – ${selectedSlot.endTime}` },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8', width: 60, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#0a0c11' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#0a0c11' }}>
                What would you like to discuss? <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                className={s.requestTextarea}
                placeholder="Briefly describe the topic or challenge you'd like guidance on…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <p className={s.helperNote} style={{ marginBottom: 16 }}>
              The advisor will receive your booking request by email from LabOS.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className={s.btnSecondary} onClick={() => setShowBooking(false)}>Cancel</button>
              <button className={s.btnPrimary} onClick={() => setIsConfirmed(true)}>Confirm booking</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.screenBg}>
      <div className={s.profileLayout}>
        <button className={s.profileBackBtn} onClick={onBack}>← All advisors</button>

        {/* Header */}
        <div className={s.profileSection}>
          <div className={s.profileHeader}>
            <div className={s.profileAvatarWrap}>
              <img src={advisor.avatar} alt={advisor.name} className={s.profileAvatar} />
              <span className={s.profileAdvisorBadge}>Advisor</span>
            </div>
            <div className={s.profileInfo}>
              <h1 className={s.profileName}>{advisor.name}</h1>
              <p className={s.profileMeta}>{advisor.role} · {advisor.company}</p>
              <div className={s.profileLocation}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1C5.24 1 3 3.24 3 6.5c0 3.06 4.19 8.17 4.37 8.39a.75.75 0 0 0 1.26 0C8.81 14.67 13 9.56 13 6.5 13 3.24 10.76 1 8 1zm0 8a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="#94a3b8"/></svg>
                {advisor.location}
              </div>
              <div className={s.profileTags}>
                {advisor.expertise.map((e) => (
                  <span key={e} className={s.tag}>{e}</span>
                ))}
              </div>
            </div>
            <div className={s.profileCtaArea}>
              <button className={s.btnPrimary} disabled={!selectedSlot} onClick={() => selectedSlot && setShowBooking(true)}>
                Book session
              </button>
              {!selectedSlot && <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, textAlign: 'right' }}>Select a time slot below</p>}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className={s.profileSection}>
          <h2 className={s.sectionTitle}>Bio</h2>
          <p className={s.bioText}>{advisor.bio}</p>
        </div>

        {/* Office Hours */}
        <div className={s.profileSection}>
          <div className={s.ohHeader}>
            <div>
              <h2 className={s.sectionTitle} style={{ margin: 0 }}>Office Hours</h2>
              <p className={s.ohProviderNote}>Via Cal.com · 30-min sessions</p>
            </div>
            <button className={s.btnSecondary} style={{ fontSize: 12, padding: '6px 12px' }}>Edit availability</button>
          </div>

          <div className={s.slotGroups}>
            {sortedDates.map((date) => (
              <div key={date}>
                <p className={s.slotGroupDate}>{date}</p>
                <div className={s.slotRow}>
                  {PROTO_SLOTS.filter((sl) => sl.dateLabel === date).map((slot) => (
                    <button
                      key={`${slot.date}-${slot.time}`}
                      className={`${s.slotChip} ${!slot.available ? s.slotChipBooked : ''} ${selectedSlot?.time === slot.time && selectedSlot?.dateLabel === slot.dateLabel ? s.slotChipSelected : ''}`}
                      onClick={() => slot.available && setSelectedSlot(selectedSlot?.time === slot.time && selectedSlot?.dateLabel === slot.dateLabel ? null : slot)}
                      title={slot.available ? undefined : 'Already booked'}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className={s.bookingNote} style={{ marginTop: 12 }}>
            You may request more than one session. Please be thoughtful about the time you book.
          </p>
        </div>

        {/* Experience */}
        <div className={s.profileSection}>
          <h2 className={s.sectionTitle}>Experience</h2>
          <div className={s.expList}>
            {[
              { emoji: '🦄', role: 'Head of Research', company: 'Uniswap Labs', period: '2022 – present' },
              { emoji: '⬡', role: 'Protocol Researcher', company: 'Ethereum Foundation', period: '2019 – 2022' },
              { emoji: '📐', role: 'Mechanism Designer', company: 'Independent', period: '2017 – 2019' },
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
