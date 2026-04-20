'use client';

import Link from 'next/link';
import Image from 'next/image';
import { IAdvisor } from '@/types/advisors.types';
import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';
import styles from './AdvisorCard.module.scss';

interface AdvisorCardProps {
  advisor: IAdvisor;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getNextAvailableDate(advisor: IAdvisor): string | null {
  if (!advisor.calendarConnected || advisor.availabilitySlots.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 1; offset <= 30; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dow = d.getDay();

    if (advisor.availabilitySlots.some((s) => s.dayOfWeek === dow)) {
      return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
    }
  }
  return null;
}

function getAvailabilityState(advisor: IAdvisor): {
  label: string;
  type: 'available' | 'request' | 'none' | 'invite';
} {
  if (advisor.status === 'INVITED' || advisor.status === 'ONBOARDING') {
    return { label: 'Invite-only', type: 'invite' };
  }
  if (!advisor.calendarConnected || advisor.availabilitySlots.length === 0) {
    if (advisor.status === 'ACTIVE') {
      return { label: 'Request a time', type: 'request' };
    }
    return { label: 'No current availability', type: 'none' };
  }
  const nextDate = getNextAvailableDate(advisor);
  if (nextDate) {
    return { label: `First availability: ${nextDate}`, type: 'available' };
  }
  return { label: 'Request a time', type: 'request' };
}

export function AdvisorCard({ advisor }: AdvisorCardProps) {
  const defaultAvatar = useDefaultAvatar(advisor.member.name);
  const profileUrl = (advisor.member as any).profile ?? defaultAvatar;

  const location = advisor.member.location
    ? [advisor.member.location.city, advisor.member.location.country].filter(Boolean).join(', ')
    : '';

  const skills = advisor.member.skills?.slice(0, 3) ?? [];
  const availState = getAvailabilityState(advisor);

  const company = advisor.member.mainTeam?.name || advisor.member.teams?.[0]?.name || '';
  const role = advisor.member.mainTeam?.role || (advisor.member as any).role || '';

  return (
    <Link href={`/advisors/${advisor.id}`} className={styles.root}>
      {/* Card top — avatar banner */}
      <div className={styles.top}>
        <div className={styles.avatarWrapper}>
          <div className={styles.outerRing}>
            <Image
              alt={advisor.member.name}
              loading="eager"
              height={72}
              width={72}
              className={styles.avatar}
              src={profileUrl}
            />
          </div>
        </div>
        <div className={styles.advisorBadge}>Advisor</div>
      </div>

      {/* Card body */}
      <div className={styles.body}>
        <div className={styles.nameRow}>
          <h3 className={styles.name}>{advisor.member.name}</h3>
        </div>

        {company && <p className={styles.company}>{company}</p>}
        {role && <p className={styles.role}>{role}</p>}

        {location && (
          <div className={styles.locationRow}>
            <LocationIcon />
            <span className={styles.location}>{location}</span>
          </div>
        )}

        {skills.length > 0 && (
          <div className={styles.tagsRow}>
            {skills.map((s) => (
              <span key={s.uid} className={styles.tag}>{s.title}</span>
            ))}
          </div>
        )}
      </div>

      {/* Card footer — availability status */}
      <div className={`${styles.footer} ${styles[`footer_${availState.type}`]}`}>
        {availState.type === 'available' && <CalendarIcon />}
        {availState.type === 'request' && <ClockIcon />}
        {availState.type === 'none' && <MinusIcon />}
        {availState.type === 'invite' && <LockIcon />}
        <span className={styles.footerText}>{availState.label}</span>
      </div>
    </Link>
  );
}

const LocationIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <path d="M8 4C7.50555 4 7.0222 4.14662 6.61107 4.42133C6.19995 4.69603 5.87952 5.08648 5.6903 5.54329C5.50108 6.00011 5.45157 6.50277 5.54804 6.98773C5.6445 7.47268 5.8826 7.91814 6.23223 8.26777C6.58186 8.6174 7.02732 8.8555 7.51227 8.95196C7.99723 9.04843 8.49989 8.99892 8.95671 8.8097C9.41352 8.62048 9.80397 8.30005 10.0787 7.88893C10.3534 7.4778 10.5 6.99445 10.5 6.5C10.5 5.83696 10.2366 5.20107 9.76777 4.73223C9.29893 4.26339 8.66304 4 8 4ZM8 8C7.70333 8 7.41332 7.91203 7.16664 7.7472C6.91997 7.58238 6.72771 7.34811 6.61418 7.07403C6.50065 6.79994 6.47094 6.49834 6.52882 6.20736C6.5867 5.91639 6.72956 5.64912 6.93934 5.43934C7.14912 5.22956 7.41639 5.0867 7.70736 5.02882C7.99834 4.97094 8.29994 5.00065 8.57403 5.11418C8.84811 5.22771 9.08238 5.41997 9.2472 5.66664C9.41203 5.91332 9.5 6.20333 9.5 6.5C9.5 6.89782 9.34196 7.27936 9.06066 7.56066C8.77936 7.84196 8.39782 8 8 8ZM8 1C6.54182 1.00165 5.14383 1.58165 4.11274 2.61274C3.08165 3.64383 2.50165 5.04182 2.5 6.5C2.5 8.4625 3.40688 10.5425 5.125 12.5156C5.89701 13.4072 6.76591 14.2101 7.71562 14.9094C7.7997 14.9683 7.89985 14.9999 8.0025 14.9999C8.10515 14.9999 8.20531 14.9683 8.28938 14.9094C9.23734 14.2098 10.1046 13.4069 10.875 12.5156C12.5906 10.5425 13.5 8.4625 13.5 6.5C13.4983 5.04182 12.9184 3.64383 11.8873 2.61274C10.8562 1.58165 9.45818 1.00165 8 1ZM8 13.875C6.96688 13.0625 3.5 10.0781 3.5 6.5C3.5 5.30653 3.97411 4.16193 4.81802 3.31802C5.66193 2.47411 6.80653 2 8 2C9.19347 2 10.3381 2.47411 11.182 3.31802C12.0259 4.16193 12.5 5.30653 12.5 6.5C12.5 10.0769 9.03312 13.0625 8 13.875Z" fill="#94a3b8"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
    <path d="M9.75 1.5H8.625V1.125C8.625 1.02554 8.58549 0.930161 8.51517 0.859835C8.44484 0.789509 8.34946 0.75 8.25 0.75C8.15054 0.75 8.05516 0.789509 7.98483 0.859835C7.91451 0.930161 7.875 1.02554 7.875 1.125V1.5H4.125V1.125C4.125 1.02554 4.08549 0.930161 4.01516 0.859835C3.94484 0.789509 3.84946 0.75 3.75 0.75C3.65054 0.75 3.55516 0.789509 3.48484 0.859835C3.41451 0.930161 3.375 1.02554 3.375 1.125V1.5H2.25C2.05109 1.5 1.86032 1.57902 1.71967 1.71967C1.57902 1.86032 1.5 2.05109 1.5 2.25V9.75C1.5 9.94891 1.57902 10.1397 1.71967 10.2803C1.86032 10.421 2.05109 10.5 2.25 10.5H9.75C9.94891 10.5 10.1397 10.421 10.2803 10.2803C10.421 10.1397 10.5 9.94891 10.5 9.75V2.25C10.5 2.05109 10.421 1.86032 10.2803 1.71967C10.1397 1.57902 9.94891 1.5 9.75 1.5ZM9.75 9.75H2.25V4.5H9.75V9.75Z" fill="currentColor"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM8 13.5C4.96 13.5 2.5 11.04 2.5 8C2.5 4.96 4.96 2.5 8 2.5C11.04 2.5 13.5 4.96 13.5 8C13.5 11.04 11.04 13.5 8 13.5ZM8.5 4.5H7.5V8.5L11 10.5L11.5 9.67L8.5 7.92V4.5Z" fill="currentColor"/>
  </svg>
);

const MinusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <path d="M3.5 8H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
    <path d="M12 7H4C3.44772 7 3 7.44772 3 8V13C3 13.5523 3.44772 14 4 14H12C12.5523 14 13 13.5523 13 13V8C13 7.44772 12.5523 7 12 7ZM8 11C7.44772 11 7 10.5523 7 10C7 9.44772 7.44772 9 8 9C8.55228 9 9 9.44772 9 10C9 10.5523 8.55228 11 8 11ZM11 7V5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5V7H11Z" fill="currentColor"/>
  </svg>
);
