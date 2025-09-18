import React from 'react';
import s from './InvestorStepper.module.scss';

interface StepperProps {
  currentStep?: number;
  eventDate?: {
    time: string;
    day: string | number;
    month: string;
    year: string | number;
  };
  onFillProfile?: () => void;
}

interface StepData {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
}

export const InvestorStepper: React.FC<StepperProps> = ({
  currentStep = 2,
  eventDate = { time: '19:00', day: '25', month: 'Oct', year: '2025' },
  onFillProfile,
}) => {
  const steps: StepData[] = [
    {
      id: 1,
      title: 'Step 1',
      description: "Invitation accepted — You're on the list.",
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'pending',
    },
    {
      id: 2,
      title: 'Step 2',
      description: 'Complete investor profile — Add information about you.',
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'pending',
    },
    {
      id: 3,
      title: 'Step 3',
      description: `Demo Day access — Opens at ${eventDate.time} UTC, ${eventDate.month} ${eventDate.day}.`,
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'current' : 'pending',
    },
  ];

  return (
    <div className={s.stepperCard}>
      {/* Title Section */}
      <div className={s.titleSection}>
        <h3 className={s.title}>Complete your investor profile to join Demo Day.</h3>
        <p className={s.subtitle}>You need to have all your investor info to access Demo Day.</p>
      </div>

      {/* Vertical Stepper */}
      <div className={s.verticalStepper}>
        {steps.map((step, index) => (
          <div key={step.id} className={`${s.stepContainer} ${s[step.status]}`}>
            {/* Step Indicator and Connector */}
            <div className={s.stepIndicatorContainer}>
              <div className={`${s.stepIndicator} ${s[step.status]}`}>
                <div className={s.stepDot} />
              </div>
              {index < steps.length - 1 && (
                <div className={`${s.stepConnector} ${index < currentStep - 1 ? s.completed : ''}`} />
              )}
            </div>

            {/* Step Content */}
            <div className={s.stepContent}>
              <div className={s.stepTitle}>{step.title}</div>
              <div className={s.stepDescription}>{step.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <button className={s.primaryButton} onClick={onFillProfile}>
        Fill in Your Investor Profile
      </button>
    </div>
  );
};
