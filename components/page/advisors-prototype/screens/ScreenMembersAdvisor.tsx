'use client';
import { PROTO_MEMBERS } from '../proto-mock-data';
import s from './screens.module.scss';

export function ScreenMembersAdvisor() {
  return (
    <div className={s.screenBg}>
      <div className={s.membersPageWrap}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div className={s.membersToolbar}>
            <h1 className={s.membersTitle}>Members</h1>
            <p className={s.membersCount}>({PROTO_MEMBERS.length})</p>
          </div>
          {/* Tab strip — showing that "All" is active */}
          <div style={{ display: 'flex', gap: 4 }}>
            {['All members', 'Advisors', 'Your team'].map((tab, i) => (
              <button
                key={tab}
                style={{
                  padding: '6px 14px',
                  border: '1px solid',
                  borderColor: i === 0 ? '#1b4dff' : '#e2e8f0',
                  borderRadius: 8,
                  background: i === 0 ? '#eef2ff' : '#fff',
                  color: i === 0 ? '#1b4dff' : '#64748b',
                  fontSize: 13,
                  fontWeight: i === 0 ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Context note */}
        <p style={{
          fontSize: 12,
          color: '#64748b',
          padding: '8px 14px',
          background: '#f8f9ff',
          border: '1px solid #c7d2fe',
          borderRadius: 8,
          margin: 0,
          lineHeight: 1.6,
        }}>
          Advisors are visible to all members. Office Hours bookings are available to founders in the network.
          <span style={{ marginLeft: 8, fontStyle: 'italic', color: '#94a3b8' }}>Advisor badge shown where relevant.</span>
        </p>

        {/* Members grid */}
        <div className={s.membersGrid}>
          {PROTO_MEMBERS.map((member) => (
            <div key={member.id} className={s.memberCard}>
              <div className={s.memberCardTop}>
                {member.isAdvisor && <span className={s.memberCardAdvisorBadge}>Advisor</span>}
                <img
                  src={member.avatar}
                  alt={member.name}
                  className={s.memberCardAvatar}
                />
              </div>
              <div className={s.memberCardBody}>
                <p className={s.memberCardName}>{member.name}</p>
                <p className={s.memberCardTeam}>{member.company}</p>
                <p className={s.memberCardRole}>{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
