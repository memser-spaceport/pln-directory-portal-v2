'use client';

import { useState } from 'react';
import { BioStep } from './BioStep';
import { CalendarConnectStep } from './CalendarConnectStep';
import { AvailabilityStep } from './AvailabilityStep';
import { LinkedInStep } from './LinkedInStep';
import { InvestorStep } from './InvestorStep';
import styles from './AdvisorOnboardingContainer.module.scss';

const STEPS = ['Bio', 'Calendar', 'Availability', 'LinkedIn', 'Investor'];

interface OnboardingData {
  bio: string;
  calendarProvider: 'google' | 'calendly' | null;
  calendarConnected: boolean;
  availabilitySlots: any[];
  linkedinUrl: string;
}

export function AdvisorOnboardingContainer() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    bio: '',
    calendarProvider: null,
    calendarConnected: false,
    availabilitySlots: [],
    linkedinUrl: '',
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      window.location.href = '/members/member-advisor-new';
    }
  };

  const skip = () => next();
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
        {currentStep === 0 && <BioStep value={data.bio} onChange={(bio) => updateData({ bio })} onNext={next} />}
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
          />
        )}
        {currentStep === 3 && (
          <LinkedInStep
            value={data.linkedinUrl}
            onChange={(url) => updateData({ linkedinUrl: url })}
            onNext={next}
            onSkip={skip}
            onBack={back}
          />
        )}
        {currentStep === 4 && <InvestorStep onNext={next} onSkip={skip} onBack={back} />}
      </div>
    </div>
  );
}
