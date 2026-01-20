'use client';

import Image from 'next/image';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { ArrowRightIcon } from '../icons';
import s from '../IrlGatheringModal.module.scss';

interface Attendee {
  uid: string;
  picture?: string;
}

interface AttendeesSectionProps {
  attendees: Attendee[];
  attendeesCount: number;
  gatheringLink?: string;
}

export function AttendeesSection({ attendees, attendeesCount, gatheringLink }: AttendeesSectionProps) {
  return (
    <div className={s.section}>
      <h3 className={s.sectionTitle}>Attendees</h3>
      <div className={s.attendeesRow}>
        <div className={s.avatarGroup}>
          {attendees.slice(0, 3).map((attendee, index) => (
            <div key={attendee.uid || index} className={s.avatar}>
              <Image src={attendee.picture || getDefaultAvatar(attendee.uid || '')} alt="" width={24} height={24} />
            </div>
          ))}
        </div>
        <a href={gatheringLink || '#'} className={s.linkButton} target="_blank" rel="noopener noreferrer">
          {attendeesCount} People going <ArrowRightIcon />
        </a>
      </div>
    </div>
  );
}
