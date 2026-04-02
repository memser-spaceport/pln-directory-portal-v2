'use client';

import { useState } from 'react';
import { useGetAdvisor } from '@/services/advisors/hooks/useGetAdvisor';
import { IBookableSlot } from '@/types/advisors.types';
import { AdvisorAvailability } from './AdvisorAvailability';
import { BookingFlow } from './BookingFlow';
import { RequestTimeFlow } from './RequestTimeFlow';
import { BackButton } from '@/components/ui/BackButton';
import { MemberDetailHeader } from '@/components/page/member-details/MemberDetailHeader';
import { ContactDetails } from '@/components/page/member-details/ContactDetails';
import { TeamsDetails } from '@/components/page/member-details/TeamsDetails';
import { AdvisorExperience } from './AdvisorExperience';
import { ExpandableDescription } from '@/components/common/ExpandableDescription';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import styles from './AdvisorProfile.module.scss';

interface AdvisorProfileProps {
  advisorId: string;
}

export function AdvisorProfile({ advisorId }: AdvisorProfileProps) {
  const { data, isLoading, isError } = useGetAdvisor(advisorId);
  const [selectedSlot, setSelectedSlot] = useState<IBookableSlot | null>(null);
  const [showRequestTime, setShowRequestTime] = useState(false);

  const realUserInfo = getParsedValue(Cookies.get('userInfo'));
  const isLoggedIn = !!realUserInfo;

  // Use a read-only view userInfo so edit buttons don't show (viewer is a founder, not the advisor)
  const userInfo = realUserInfo ? { ...realUserInfo, uid: '__viewer__', roles: [] } : realUserInfo;

  if (isLoading) return <div className={styles.loading}>Loading advisor...</div>;
  if (isError || !data?.advisor) return <div className={styles.error}>Advisor not found</div>;

  const { advisor, bookableSlots } = data;
  const member = advisor.member;
  const availableSlots = bookableSlots.filter((s) => s.available);
  const hasAvailability = availableSlots.length > 0;

  return (
    <div className={styles.container}>
      <BackButton to="/advisors" />
      <div className={styles.profile}>
        {/* Profile header — reuses member detail header component */}
        <div className={styles.section}>
          <MemberDetailHeader
            member={member}
            isLoggedIn={isLoggedIn}
            userInfo={userInfo}
            onEdit={() => {}}
          />
          {member.bio && (
            <div className={styles.bioContainer}>
              <div className={styles.bioTitle}>Bio</div>
              <ExpandableDescription>
                <div className={styles.bioContent} dangerouslySetInnerHTML={{ __html: member.bio }} />
              </ExpandableDescription>
            </div>
          )}
        </div>

        {/* Office Hours — bookable slots */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Office Hours</h2>
          {selectedSlot ? (
            <BookingFlow
              advisor={advisor}
              selectedSlot={selectedSlot}
              onCancel={() => setSelectedSlot(null)}
              onComplete={() => setSelectedSlot(null)}
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

        {/* Contact */}
        <ContactDetails userInfo={userInfo} member={member} isLoggedIn={isLoggedIn} />

        {/* Teams */}
        <TeamsDetails member={member} isLoggedIn={isLoggedIn} userInfo={userInfo} />

        {/* Experience */}
        <AdvisorExperience advisor={advisor} />
      </div>
    </div>
  );
}
