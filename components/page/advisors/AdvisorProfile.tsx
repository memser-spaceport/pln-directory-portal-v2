'use client';

import { useState } from 'react';
import { useGetAdvisor } from '@/services/advisors/hooks/useGetAdvisor';
import { useIsAdvisor } from '@/services/advisors/hooks/useIsAdvisor';
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
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import styles from './AdvisorProfile.module.scss';

interface AdvisorProfileProps {
  advisorId: string;
}

function getProviderLabel(provider: string | null): string {
  if (provider === 'calcom') return 'Cal.com';
  if (provider === 'calendly') return 'Calendly';
  return '';
}

export function AdvisorProfile({ advisorId }: AdvisorProfileProps) {
  const { data, isLoading, isError } = useGetAdvisor(advisorId);
  const [selectedSlot, setSelectedSlot] = useState<IBookableSlot | null>(null);
  const [showRequestTime, setShowRequestTime] = useState(false);
  const router = useRouter();

  const realUserInfo = getParsedValue(Cookies.get('userInfo'));
  const isLoggedIn = !!realUserInfo;

  // Viewer userInfo — suppresses edit controls for advisors viewing other profiles
  const userInfo = realUserInfo ? { ...realUserInfo, uid: '__viewer__', roles: [] } : realUserInfo;

  // Check if current user is this advisor
  const { data: isCurrentAdvisor } = useIsAdvisor(realUserInfo?.uid);

  if (isLoading) return <div className={styles.loading}>Loading advisor…</div>;
  if (isError || !data?.advisor) return <div className={styles.error}>Advisor not found</div>;

  const { advisor, bookableSlots } = data;
  const member = advisor.member;
  const availableSlots = bookableSlots.filter((s) => s.available);
  const hasAvailability = availableSlots.length > 0;
  const hasCalendar = advisor.calendarConnected;

  return (
    <div className={styles.container}>
      <BackButton to="/advisors" />
      <div className={styles.profile}>

        {/* Profile header */}
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

        {/* Office Hours */}
        <div className={styles.section}>
          <div className={styles.officeHoursHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Office Hours</h2>
              {hasCalendar && advisor.calendarProvider && (
                <p className={styles.providerNote}>
                  Scheduling via {getProviderLabel(advisor.calendarProvider)}
                </p>
              )}
            </div>
            {isCurrentAdvisor && (
              <button
                className={styles.editAvailBtn}
                onClick={() => router.push('/sign-up/advisor/availability')}
              >
                Edit availability
              </button>
            )}
          </div>

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
              {hasAvailability ? (
                <AdvisorAvailability
                  slots={bookableSlots}
                  selectedSlot={selectedSlot}
                  onSelectSlot={setSelectedSlot}
                />
              ) : hasCalendar ? (
                <div className={styles.stateBlock}>
                  <p className={styles.stateText}>No available sessions in the next 2 weeks.</p>
                  <button className={styles.requestButton} onClick={() => setShowRequestTime(true)}>
                    Request a time
                  </button>
                </div>
              ) : (
                <div className={styles.stateBlock}>
                  <p className={styles.stateText}>
                    {advisor.member.name} hasn&apos;t connected a scheduling tool yet.
                  </p>
                  <button className={styles.requestButton} onClick={() => setShowRequestTime(true)}>
                    Request a time
                  </button>
                  <p className={styles.emailNote}>
                    Your request will be sent to the advisor by email.
                  </p>
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
