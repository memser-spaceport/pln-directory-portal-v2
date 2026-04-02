'use client';

import { useState } from 'react';
import { CalendarConnectStep } from './CalendarConnectStep';
import { AvailabilityStep } from './AvailabilityStep';
import { LinkedInStep } from './LinkedInStep';
import { getUserInfoFromLocal } from '@/utils/common.utils';
import { useRouter } from 'next/navigation';
import styles from './AdvisorOnboardingContainer.module.scss';

const STEPS = ['LinkedIn', 'Calendar', 'Availability'];

interface OnboardingData {
  calendarProvider: 'google' | 'calendly' | null;
  calendarConnected: boolean;
  availabilitySlots: any[];
  linkedinUrl: string;
}

export function AdvisorOnboardingContainer() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    calendarProvider: null,
    calendarConnected: false,
    availabilitySlots: [],
    linkedinUrl: '',
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const userInfo = getUserInfoFromLocal();
  const router = useRouter();

  const goToProfile = () => {
    const uid = userInfo?.uid;
    router.push(uid ? `/members/${uid}` : '/members');
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      goToProfile();
    }
  };

  const back = () => { if (currentStep > 0) setCurrentStep((s) => s - 1); };

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        {STEPS.map((step, i) => (
          <div
            key={step}
            className={`${styles.step} ${i === currentStep ? styles.stepActive : ''} ${i < currentStep ? styles.stepDone : ''}`}
          >
            <div className={styles.stepDot}>{i < currentStep ? '\u2713' : i + 1}</div>
            <span className={styles.stepLabel}>{step}</span>
          </div>
        ))}
      </div>
      <div className={styles.content}>
        {currentStep === 0 && (
          <LinkedInStep
            value={data.linkedinUrl}
            onChange={(url) => updateData({ linkedinUrl: url })}
            onNext={next}
            onSkip={next}
            onBack={() => {}}
          />
        )}
        {currentStep === 1 && (
          <CalendarConnectStep
            provider={data.calendarProvider}
            connected={data.calendarConnected}
            onConnect={(provider) => updateData({ calendarProvider: provider, calendarConnected: true })}
            onNext={next}
            onBack={back}
          />
        )}
        {currentStep === 2 && (
          <AvailabilityStep
            slots={data.availabilitySlots}
            onSlotsChange={(slots) => updateData({ availabilitySlots: slots })}
            onNext={goToProfile}
            onBack={back}
            isLastStep
          />
        )}
      </div>
    </div>
  );
}
