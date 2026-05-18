'use client';

import { useState } from 'react';
import { NavBar } from '@components/NavBar';
import { Button } from '@components/Button';
import { Badge } from '@components/Badge';
import { mockMember } from './mock-data';
import s from './MemberProfileMockup.module.scss';

const EmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M1 5l7 5 7-5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 7v4M5 5v.5M8 11V8.5c0-1 .6-1.5 1.5-1.5S11 7.5 11 8.5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const TelegramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 8l2 2 6-4-5 7V9.5L4 8z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);
const TwitterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 2.5l5 5.3L2 13.5h1.5l3.8-4.2 3 4.2H14l-5.2-7.3L13.5 2H12L8.5 5.8 5.8 2H2z" fill="currentColor"/>
  </svg>
);
const DiscordIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M11.5 3.5A9.5 9.5 0 0 0 9 3a6.5 6.5 0 0 0-.3.6A8.8 8.8 0 0 0 4.5 3c-.1.2-.2.4-.3.6A9.5 9.5 0 0 0 1.5 6C.7 8.4 1 10.6 1.2 11.5c.9.6 1.8 1 2.8 1.3l.6-1a6.3 6.3 0 0 1-1-.5l.3-.2c1.8.9 3.9.9 5.7 0l.3.2a6.3 6.3 0 0 1-1 .5l.6 1c1-.3 1.9-.7 2.8-1.3.2-.9.5-3.1-.3-5.5-.7-.5-1.5-.9-2.5-1zM6 9.5c-.6 0-1-.5-1-1.1 0-.6.4-1.1 1-1.1.6 0 1 .5 1 1.1 0 .6-.4 1.1-1 1.1zm4 0c-.6 0-1-.5-1-1.1 0-.6.4-1.1 1-1.1.6 0 1 .5 1 1.1 0 .6-.4 1.1-1 1.1z" fill="currentColor"/>
  </svg>
);
const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M8 1a7 7 0 0 0-2.21 13.64c.35.06.48-.15.48-.34v-1.2C4.04 13.5 3.63 12 3.63 12c-.32-.8-.77-1.01-.77-1.01-.63-.43.05-.42.05-.42.7.05 1.06.7 1.06.7.62 1.05 1.62.75 2.02.57.06-.44.24-.75.44-.92-1.54-.17-3.16-.77-3.16-3.42 0-.76.27-1.38.72-1.86-.07-.18-.31-.88.07-1.84 0 0 .58-.19 1.91.71A6.63 6.63 0 0 1 8 4.17c.59 0 1.18.08 1.73.23 1.32-.9 1.9-.71 1.9-.71.38.96.14 1.66.07 1.84.45.48.72 1.1.72 1.86 0 2.66-1.62 3.25-3.17 3.42.25.22.47.64.47 1.3v1.92c0 .19.13.41.48.34A7 7 0 0 0 8 1z" fill="currentColor"/>
  </svg>
);
const ExternalIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M5 2H2v8h8V7M7 2h3v3M10 2 5.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const LocationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1a4 4 0 0 1 4 4c0 2.5-4 8-4 8S3 7.5 3 5a4 4 0 0 1 4-4z" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="7" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const BriefcaseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="5" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

export function MemberProfileMockup() {
  const [bioExpanded, setBioExpanded] = useState(false);
  const m = mockMember;

  const shortBio = m.bio.slice(0, 180) + '…';

  return (
    <div className={s.root}>
      <NavBar
        items={[
          { label: 'Members', href: '#', active: true },
          { label: 'Teams', href: '#' },
          { label: 'Projects', href: '#' },
          { label: 'Events', href: '#' },
        ]}
        userName="John Smith"
        avatar={m.avatar}
      />

      <div className={s.pageBody}>
        <a href="#" className={s.breadcrumb}>← Back</a>

        <div className={s.layout}>
          {/* Main column */}
          <main className={s.main}>
            {/* Profile card */}
            <div className={s.card}>
              <div className={s.profileHeader}>
                <img src={m.avatar} alt={m.name} className={s.avatar} />
                <div className={s.profileInfo}>
                  <h1 className={s.name}>{m.name}</h1>
                  <div className={s.metaRow}>
                    <a href={m.orgHref} className={s.orgLink}>
                      {m.orgName} <ExternalIcon />
                    </a>
                    <span className={s.metaDot} aria-hidden="true">·</span>
                    <span className={s.roleMeta}>{m.role}</span>
                  </div>
                  <div className={s.locationRow}>
                    <LocationIcon />
                    <span>{m.location}</span>
                  </div>
                  <div className={s.tagsRow}>
                    {m.tags.map(tag => (
                      <Badge key={tag} color="blue" styleType="light" size="sm">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className={s.card}>
              <h2 className={s.sectionTitle}>About</h2>
              <p className={s.bioText}>{bioExpanded ? m.bio : shortBio}</p>
              <button className={s.showMore} onClick={() => setBioExpanded(v => !v)}>
                {bioExpanded ? 'Show Less' : 'Show More'}
              </button>
            </div>

            {/* Contact Details */}
            <div className={s.card}>
              <h2 className={s.sectionTitle}>Contact Details</h2>
              <ul className={s.contactList}>
                <li className={s.contactItem}>
                  <span className={s.contactIcon}><EmailIcon /></span>
                  <a href={`mailto:${m.contacts.email}`} className={s.contactLink}>{m.contacts.email}</a>
                </li>
                <li className={s.contactItem}>
                  <span className={s.contactIcon}><LinkedInIcon /></span>
                  <a href={`https://linkedin.com/in/${m.contacts.linkedin}`} className={s.contactLink}>{m.contacts.linkedin}</a>
                </li>
                <li className={s.contactItem}>
                  <span className={s.contactIcon}><TelegramIcon /></span>
                  <a href={`https://t.me/${m.contacts.telegram}`} className={s.contactLink}>{m.contacts.telegram}</a>
                </li>
                <li className={s.contactItem}>
                  <span className={s.contactIcon}><TwitterIcon /></span>
                  <a href={`https://x.com/${m.contacts.twitter}`} className={s.contactLink}>{m.contacts.twitter}</a>
                </li>
                <li className={s.contactItem}>
                  <span className={s.contactIcon}><DiscordIcon /></span>
                  <span className={s.contactLink}>{m.contacts.discord}</span>
                </li>
                <li className={s.contactItem}>
                  <span className={s.contactIcon}><GithubIcon /></span>
                  <a href={`https://github.com/${m.contacts.github}`} className={s.contactLink}>{m.contacts.github}</a>
                </li>
              </ul>
            </div>

            {/* Teams */}
            <div className={s.card}>
              <h2 className={s.sectionTitle}>Teams ({m.teams.length})</h2>
              {m.teams.map(team => (
                <div key={team.id} className={s.teamRow}>
                  <img src={team.logo} alt={team.name} className={s.teamLogo} />
                  <div className={s.teamInfo}>
                    <div className={s.teamNameRow}>
                      <span className={s.teamName}>{team.name}</span>
                      <span className={s.teamRole}>{team.role}</span>
                    </div>
                    <div className={s.tagsRow}>
                      {team.tags.map(tag => (
                        <Badge key={tag} color="gray" styleType="light" size="sm">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Experience */}
            <div className={s.card}>
              <h2 className={s.sectionTitle}>Experience ({m.experience.length})</h2>
              <ul className={s.expList}>
                {m.experience.map(exp => (
                  <li key={exp.id} className={s.expItem}>
                    <span className={s.expIcon}><BriefcaseIcon /></span>
                    <div className={s.expInfo}>
                      <span className={s.expRole}>{exp.role}</span>
                      <span className={s.expCompany}>{exp.company}</span>
                      {'location' in exp && <span className={s.expLocation}>{exp.location}</span>}
                      <span className={s.expDates}>{exp.dates}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Projects */}
            <div className={s.card}>
              <h2 className={s.sectionTitle}>Projects</h2>
              {m.projects.map(project => (
                <div key={project.id} className={s.projectRow}>
                  <img src={project.logo} alt={project.name} className={s.projectLogo} />
                  <div className={s.projectInfo}>
                    <span className={s.projectName}>{project.name}</span>
                    <Badge color="gray" styleType="light" size="sm">{project.role}</Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Event Contributions */}
            <div className={s.card}>
              <h2 className={s.sectionTitle}>Event Contributions ({m.eventContributions})</h2>
              <p className={s.emptyNote}>This member has contributed to {m.eventContributions} events.</p>
            </div>
          </main>

          {/* Sidebar */}
          <aside className={s.sidebar}>
            <div className={s.card}>
              <h2 className={s.sectionTitle}>Office Hours</h2>
              <p className={s.officeHoursText}>
                {m.name} doesn&apos;t have their schedule available right now. You can book office hours with other members who are available.
              </p>
              <Button variant="primary" styleType="border" size="sm" fullWidth>
                See 245 members open to connect
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
