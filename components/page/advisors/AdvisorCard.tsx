'use client';

import Link from 'next/link';
import { IAdvisor } from '@/types/advisors.types';
import { AdvisorBadge } from './AdvisorBadge';
import styles from './AdvisorCard.module.scss';

interface AdvisorCardProps {
  advisor: IAdvisor;
}

export function AdvisorCard({ advisor }: AdvisorCardProps) {
  const hasAvailability = advisor.availabilitySlots.length > 0 && advisor.calendarConnected;
  const initials = advisor.member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <Link href={`/advisors/${advisor.id}`} className={styles.card}>
      <div className={styles.header}>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.info}>
          <div className={styles.nameRow}>
            <h3 className={styles.name}>{advisor.member.name}</h3>
            <AdvisorBadge />
          </div>
          <div className={styles.availability}>
            <span className={hasAvailability ? styles.dotAvailable : styles.dotUnavailable} />
            {hasAvailability ? 'Available' : 'No slots available'}
          </div>
        </div>
      </div>
      <p className={styles.bio}>{advisor.bio}</p>
      {advisor.member.skills && advisor.member.skills.length > 0 && (
        <div className={styles.skills}>
          {advisor.member.skills.slice(0, 3).map((skill) => (
            <span key={skill.uid} className={styles.skillTag}>
              {skill.title}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
