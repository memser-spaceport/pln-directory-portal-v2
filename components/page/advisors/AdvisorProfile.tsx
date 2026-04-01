'use client';

import { useState } from 'react';
import { useGetAdvisor } from '@/services/advisors/hooks/useGetAdvisor';
import { IBookableSlot } from '@/types/advisors.types';
import { AdvisorBadge } from './AdvisorBadge';
import { AdvisorAvailability } from './AdvisorAvailability';
import { BookingFlow } from './BookingFlow';
import { RequestTimeFlow } from './RequestTimeFlow';
import { BackButton } from '@/components/ui/BackButton';
import styles from './AdvisorProfile.module.scss';

interface AdvisorProfileProps {
  advisorId: string;
}

export function AdvisorProfile({ advisorId }: AdvisorProfileProps) {
  const { data, isLoading, isError } = useGetAdvisor(advisorId);
  const [selectedSlot, setSelectedSlot] = useState<IBookableSlot | null>(null);
  const [showRequestTime, setShowRequestTime] = useState(false);

  if (isLoading) return <div className={styles.loading}>Loading advisor...</div>;
  if (isError || !data?.advisor) return <div className={styles.error}>Advisor not found</div>;

  const { advisor, bookableSlots } = data;
  const availableSlots = bookableSlots.filter((s) => s.available);
  const hasAvailability = availableSlots.length > 0;

  const initials = advisor.member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const handleBookingComplete = () => {
    setSelectedSlot(null);
  };

  return (
    <div className={styles.container}>
      <BackButton to="/advisors" />
      <div className={styles.profile}>
        <div className={styles.header}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.headerInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.name}>{advisor.member.name}</h1>
              <AdvisorBadge />
            </div>
            {advisor.member.location && (
              <span className={styles.location}>
                {advisor.member.location.city}, {advisor.member.location.country}
              </span>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>About</h2>
          <p className={styles.bio}>{advisor.bio}</p>
        </div>

        {advisor.member.skills && advisor.member.skills.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Expertise</h2>
            <div className={styles.skills}>
              {advisor.member.skills.map((skill) => (
                <span key={skill.uid} className={styles.skillTag}>{skill.title}</span>
              ))}
            </div>
          </div>
        )}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Office Hours</h2>
          {selectedSlot ? (
            <BookingFlow
              advisor={advisor}
              selectedSlot={selectedSlot}
              onCancel={() => setSelectedSlot(null)}
              onComplete={handleBookingComplete}
            />
          ) : showRequestTime ? (
            <RequestTimeFlow
              advisor={advisor}
              onCancel={() => setShowRequestTime(false)}
              onComplete={() => setShowRequestTime(false)}
            />
          ) : (
            <>
              <AdvisorAvailability
                slots={bookableSlots}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
              />
              {!hasAvailability && (
                <div className={styles.noSlots}>
                  <p className={styles.noSlotsText}>No slots available right now</p>
                  <button className={styles.requestButton} onClick={() => setShowRequestTime(true)}>
                    Request a Time
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
