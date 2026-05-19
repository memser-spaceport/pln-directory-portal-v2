'use client';

import { useState } from 'react';
import { NavBar } from '@components/NavBar';
import { Button } from '@components/Button';
import { Badge } from '@components/Badge';
import { mockTeam } from './mock-data';
import s from './TeamProfileMockup.module.scss';

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    <path d="M8 4l2 2" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
);
const WebsiteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M7 1c-1.5 1.5-2 3.5-2 6s.5 4.5 2 6M7 1c1.5 1.5 2 3.5 2 6s-.5 4.5-2 6M1 7h12" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
);
const EmailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M1 5l6 4 6-4" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
);
const LinkedInIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M4.5 6v3.5M4.5 4.5v.5M7 9.5V7.5c0-.8.5-1.5 1.5-1.5S10 6.7 10 7.5V9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const TwitterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 2l4.3 4.6L2 12h1.3l3.3-3.6 2.6 3.6H12l-4.5-6.3L11.8 2h-1.3L6.9 5.3 4.7 2H2z" fill="currentColor"/>
  </svg>
);
const TelegramIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M3.5 7l1.7 1.7 5.3-3.5-4.5 6V8.2L3.5 7z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
  </svg>
);
const CalendlyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M4.5 1.5v2M9.5 1.5v2M1.5 6h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const BlogIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M4 5h6M4 7h6M4 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

export function TeamProfileMockup() {
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const t = mockTeam;

  const shortAbout = t.about.slice(0, 200) + '…';

  return (
    <div className={s.root}>
      <NavBar
        items={[
          { label: 'Members', href: '#' },
          { label: 'Teams', href: '#', active: true },
          { label: 'Projects', href: '#' },
          { label: 'Events', href: '#' },
        ]}
        userName="John Smith"
      />

      <div className={s.pageBody}>
        {/* Profile card */}
        <div className={s.card}>
          <div className={s.profileHeader}>
            <img src={t.logo} alt={t.name} className={s.logo} />
            <div className={s.profileInfo}>
              <div className={s.profileTitleRow}>
                <h1 className={s.name}>{t.name}</h1>
                <Button variant="neutral" styleType="border" size="sm" leftIcon={<EditIcon />}>
                  Edit
                </Button>
              </div>
              <div className={s.badgeRow}>
                <Badge color="green" styleType="light" size="sm">{t.fundingStage}</Badge>
                {t.categories.map(cat => (
                  <Badge key={cat} color="gray" styleType="light" size="sm">{cat}</Badge>
                ))}
                {t.extraCategories > 0 && (
                  <Badge color="gray" styleType="light" size="sm">+{t.extraCategories}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className={s.card}>
          <h2 className={s.sectionTitle}>About</h2>
          <p className={s.aboutText}>{aboutExpanded ? t.about : shortAbout}</p>
          <button className={s.showMore} onClick={() => setAboutExpanded(v => !v)}>
            {aboutExpanded ? 'Show Less' : 'Show More'}
          </button>
        </div>

        {/* Fund Details */}
        <div className={s.card}>
          <div className={s.cardHeader}>
            <h2 className={s.sectionTitle}>Fund Details</h2>
            <Button variant="neutral" styleType="border" size="sm" leftIcon={<EditIcon />}>
              Edit
            </Button>
          </div>
          <dl className={s.detailGrid}>
            <div className={s.detailRow}>
              <dt className={s.detailLabel}>Fund Type(s)</dt>
              <dd className={s.detailValue}>{t.fundDetails.fundType}</dd>
            </div>
            <div className={s.detailRow}>
              <dt className={s.detailLabel}>Typical Check Size</dt>
              <dd className={s.detailValue}>{t.fundDetails.checkSize}</dd>
            </div>
            <div className={s.detailRow}>
              <dt className={s.detailLabel}>Startup Stages</dt>
              <dd className={s.detailValue}>{t.fundDetails.startupStages}</dd>
            </div>
            <div className={s.detailRow}>
              <dt className={s.detailLabel}>Investment Focus</dt>
              <dd className={s.detailValue}>{t.fundDetails.investmentFocus}</dd>
            </div>
          </dl>
        </div>

        {/* Contact Details */}
        <div className={s.card}>
          <div className={s.cardHeader}>
            <h2 className={s.sectionTitle}>Contact Details</h2>
            <Button variant="neutral" styleType="border" size="sm" leftIcon={<EditIcon />}>
              Edit
            </Button>
          </div>
          <ul className={s.contactList}>
            <li className={s.contactItem}>
              <span className={s.contactIcon}><WebsiteIcon /></span>
              <a href={`https://${t.contacts.website}`} className={s.contactLink}>{t.contacts.website}</a>
            </li>
            <li className={s.contactItem}>
              <span className={s.contactIcon}><EmailIcon /></span>
              <a href={`mailto:${t.contacts.email}`} className={s.contactLink}>{t.contacts.email}</a>
            </li>
            <li className={s.contactItem}>
              <span className={s.contactIcon}><LinkedInIcon /></span>
              <a href={`https://linkedin.com/${t.contacts.linkedin}`} className={s.contactLink}>{t.contacts.linkedin}</a>
            </li>
            <li className={s.contactItem}>
              <span className={s.contactIcon}><TwitterIcon /></span>
              <a href={`https://x.com/${t.contacts.twitter}`} className={s.contactLink}>{t.contacts.twitter}</a>
            </li>
            <li className={s.contactItem}>
              <span className={s.contactIcon}><TelegramIcon /></span>
              <span className={s.contactLink}>{t.contacts.telegram}</span>
            </li>
            <li className={s.contactItem}>
              <span className={s.contactIcon}><CalendlyIcon /></span>
              <a href={`https://${t.contacts.calendly}`} className={s.contactLink}>{t.contacts.calendly}</a>
            </li>
            <li className={s.contactItem}>
              <span className={s.contactIcon}><BlogIcon /></span>
              <a href={`https://${t.contacts.blog}`} className={s.contactLink}>{t.contacts.blog}</a>
            </li>
          </ul>
        </div>

        {/* Membership Sources */}
        <div className={s.card}>
          <div className={s.cardHeader}>
            <h2 className={s.sectionTitle}>Membership Sources</h2>
            <Button variant="neutral" styleType="border" size="sm" leftIcon={<EditIcon />}>
              Edit
            </Button>
          </div>
          <div className={s.badgeRow}>
            {t.membershipSources.map(src => (
              <Badge key={src} color="blue" styleType="light" size="sm">{src}</Badge>
            ))}
            {t.extraMembership > 0 && (
              <Badge color="gray" styleType="light" size="sm">+{t.extraMembership}</Badge>
            )}
          </div>
        </div>

        {/* Communities */}
        <div className={s.card}>
          <div className={s.cardHeader}>
            <h2 className={s.sectionTitle}>Communities</h2>
            <Button variant="neutral" styleType="border" size="sm" leftIcon={<EditIcon />}>
              Edit
            </Button>
          </div>
          <div className={s.badgeRow}>
            {t.communities.map(c => (
              <Badge key={c} color="blue" styleType="light" size="sm">{c}</Badge>
            ))}
            {t.extraCommunities > 0 && (
              <Badge color="gray" styleType="light" size="sm">+{t.extraCommunities}</Badge>
            )}
          </div>
        </div>

        {/* Event Contributions */}
        <div className={s.card}>
          <h2 className={s.sectionTitle}>Event Contributions ({t.eventContributions.total})</h2>
          {t.eventContributions.roles.map(roleGroup => (
            <div key={roleGroup.role} className={s.eventRoleGroup}>
              <div className={s.eventRoleHeader}>
                <span className={s.eventRoleName}>{roleGroup.role}</span>
                <Badge color="blue" styleType="light" size="sm">{roleGroup.events.length + roleGroup.extra}</Badge>
              </div>
              <ul className={s.eventList}>
                {roleGroup.events.map((evt, i) => (
                  <li key={i} className={s.eventItem}>{evt}</li>
                ))}
                {roleGroup.extra > 0 && (
                  <li className={s.eventItemExtra}>+{roleGroup.extra} more</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
