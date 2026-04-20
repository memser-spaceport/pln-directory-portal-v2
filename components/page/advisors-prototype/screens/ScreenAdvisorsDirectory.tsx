'use client';
import { useState } from 'react';
import { PROTO_DIRECTORY_ADVISORS, ProtoAdvisor } from '../proto-mock-data';
import s from './screens.module.scss';

const TOPICS = [
  { label: 'DeFi', count: 3, checked: false },
  { label: 'AI / ML', count: 2, checked: false },
  { label: 'Smart Contracts', count: 2, checked: false },
  { label: 'Infrastructure', count: 3, checked: false },
  { label: 'Tokenomics', count: 1, checked: false },
  { label: 'Protocol Design', count: 2, checked: false },
  { label: 'UX Research', count: 1, checked: false },
  { label: 'Fundraising', count: 1, checked: false },
];

const REGIONS = ['Americas', 'Europe', 'Asia-Pacific', 'MENA', 'Africa'];

function LocationIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path d="M8 1C5.24 1 3 3.24 3 6.5c0 3.06 4.19 8.17 4.37 8.39a.75.75 0 0 0 1.26 0C8.81 14.67 13 9.56 13 6.5 13 3.24 10.76 1 8 1zm0 8a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="#94a3b8"/>
    </svg>
  );
}

function CalIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M9.75 1.5H2.25C1.836 1.5 1.5 1.836 1.5 2.25V9.75c0 .414.336.75.75.75h7.5c.414 0 .75-.336.75-.75V2.25c0-.414-.336-.75-.75-.75zM9.75 9.75H2.25V4.5h7.5v5.25zM4.125 1.5v1.5M7.875 1.5v1.5" stroke={color} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.2"/>
      <path d="M8 4.5V8.5L10.5 10" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function DashIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M4 8h8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function AdvisorCardItem({ advisor, onClick }: { advisor: ProtoAdvisor; onClick: () => void }) {
  const footerClass = advisor.availState === 'available' ? s.footerAvailable
    : advisor.availState === 'request' ? s.footerRequest
    : s.footerNone;

  const footerLabel = advisor.availState === 'available' && advisor.nextAvailable
    ? `First availability: ${advisor.nextAvailable}`
    : advisor.availState === 'request' ? 'Request a time'
    : 'No current availability';

  const footerColor = advisor.availState === 'available' ? '#1b4dff'
    : advisor.availState === 'request' ? '#0891b2'
    : '#94a3b8';

  return (
    <div className={s.advisorCard} onClick={onClick}>
      <div className={s.advisorCardTop}>
        <img src={advisor.avatar} alt={advisor.name} className={s.advisorCardAvatar} />
        <span className={s.advisorCardBadge}>Advisor</span>
      </div>
      <div className={s.advisorCardBody}>
        <p className={s.advisorCardName}>{advisor.name}</p>
        <p className={s.advisorCardCompany}>{advisor.company}</p>
        <p className={s.advisorCardRole}>{advisor.role}</p>
        <div className={s.advisorCardLocation}>
          <LocationIcon />
          <span className={s.advisorCardLocationText}>{advisor.location}</span>
        </div>
        <div className={s.advisorCardTags}>
          {advisor.expertise.slice(0, 3).map((t) => (
            <span key={t} className={s.tag}>{t}</span>
          ))}
        </div>
      </div>
      <div className={`${s.advisorCardFooter} ${footerClass}`}>
        {advisor.availState === 'available' && <CalIcon color={footerColor} />}
        {advisor.availState === 'request' && <ClockIcon color={footerColor} />}
        {advisor.availState === 'none' && <DashIcon color={footerColor} />}
        <span className={s.advisorCardFooterText}>{footerLabel}</span>
      </div>
    </div>
  );
}

interface Props { onSelectAdvisor: (id: string) => void; }

export function ScreenAdvisorsDirectory({ onSelectAdvisor }: Props) {
  const [search, setSearch] = useState('');
  const [topicSearch, setTopicSearch] = useState('');
  const [checkedTopics, setCheckedTopics] = useState<Set<string>>(new Set());

  const toggleTopic = (label: string) => {
    const next = new Set(checkedTopics);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    setCheckedTopics(next);
  };

  const filtered = PROTO_DIRECTORY_ADVISORS.filter((a) => {
    const q = search.toLowerCase();
    if (q && !a.name.toLowerCase().includes(q) && !a.company.toLowerCase().includes(q)) return false;
    if (checkedTopics.size > 0 && !a.expertise.some((e) => checkedTopics.has(e))) return false;
    return true;
  });

  const filteredTopics = TOPICS.filter((t) =>
    t.label.toLowerCase().includes(topicSearch.toLowerCase())
  );

  return (
    <div className={s.screenBg}>
      <div className={s.directoryLayout}>
        {/* Sidebar */}
        <div className={s.directorySidebar}>
          <div className={s.sidebarCard}>
            <span className={s.sidebarLabel}>Search</span>
            <input
              type="text"
              className={s.searchInput}
              placeholder="Name or company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={s.sidebarCard}>
            <span className={s.sidebarLabel}>Topics & expertise</span>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
              Advisors offer focused sessions on specific challenges.
            </p>
            <input
              type="text"
              className={s.searchInput}
              placeholder="E.g. DeFi, Fundraising…"
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
            />
            <div className={s.topicList}>
              {filteredTopics.map((t) => (
                <div key={t.label} className={s.topicItem} onClick={() => toggleTopic(t.label)}>
                  <div className={`${s.topicCheckbox} ${checkedTopics.has(t.label) ? s.topicCheckboxChecked : ''}`}>
                    {checkedTopics.has(t.label) && (
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className={s.topicName}>{t.label}</span>
                  <span className={s.topicCount}>{t.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={s.sidebarCard}>
            <span className={s.sidebarLabel}>Region</span>
            <div className={s.topicList}>
              {REGIONS.map((r) => (
                <div key={r} className={s.topicItem}>
                  <div className={s.topicCheckbox} />
                  <span className={s.topicName}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={s.directoryContent}>
          <div className={s.directoryToolbar}>
            <h1 className={s.directoryTitle}>Advisors</h1>
            <p className={s.directoryCount}>({filtered.length})</p>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              No advisors match your filters.
            </div>
          ) : (
            <div className={s.advisorGrid}>
              {filtered.map((advisor) => (
                <AdvisorCardItem
                  key={advisor.id}
                  advisor={advisor}
                  onClick={() => onSelectAdvisor(advisor.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
