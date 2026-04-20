'use client';

import { useState } from 'react';
import { CalendarConnectStep } from './CalendarConnectStep';
import { AvailabilityStep } from './AvailabilityStep';
import { WelcomeStep } from './WelcomeStep';
import { CompletionStep } from './CompletionStep';
import { CalendarProvider } from '@/types/advisors.types';
import { getUserInfoFromLocal } from '@/utils/common.utils';
import { useRouter } from 'next/navigation';
import styles from './AdvisorOnboardingContainer.module.scss';

const STEPS = ['Welcome', 'Scheduling', 'Availability', 'Done'] as const;
type Step = typeof STEPS[number];

interface OnboardingData {
  calendarProvider: CalendarProvider | null;
  calendarConnected: boolean;
  availabilitySlots: any[];
}

export function AdvisorOnboardingContainer() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    calendarProvider: null,
    calendarConnected: false,
    availabilitySlots: [],
  });

  const userInfo = getUserInfoFromLocal();
  const router = useRouter();

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const goToProfile = () => {
    const uid = userInfo?.uid;
    router.push(uid ? `/members/${uid}` : '/members');
  };

  const goToEditAvailability = () => {
    router.push('/sign-up/advisor/availability');
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const back = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const isLastContentStep = currentStep === STEPS.length - 1;

  return (
    <div className={styles.container}>
      {/* Stepper — hide on completion screen */}
      {!isLastContentStep && (
        <div className={styles.progress}>
          {STEPS.slice(0, -1).map((step, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep;
            return (
              <div key={step} className={`${styles.stepItem} ${isActive ? styles.stepActive : ''} ${isDone ? styles.stepDone : ''}`}>
                <div className={styles.stepDot}>
                  {isDone ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={styles.stepLabel}>{step}</span>
                {i < STEPS.length - 2 && <div className={styles.stepConnector} />}
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.content}>
        {currentStep === 0 && (
          <WelcomeStep
            advisorName={userInfo?.name}
            onNext={next}
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
            onNext={next}
            onBack={back}
            isLastStep
          />
        )}
        {currentStep === 3 && (
          <CompletionStep
            onViewProfile={goToProfile}
            onEditAvailability={goToEditAvailability}
          />
        )}
      </div>
    </div>
  );
}
