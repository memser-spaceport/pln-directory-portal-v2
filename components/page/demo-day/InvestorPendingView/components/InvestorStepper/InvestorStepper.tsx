import React from 'react';
import s from './InvestorStepper.module.scss';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';

interface StepperProps {
  currentStep: number;
  onFillProfile?: () => void;
}

interface StepData {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
}

export const InvestorStepper: React.FC<StepperProps> = ({ currentStep, onFillProfile }) => {
  const { data } = useGetDemoDayState();

  // Format the date for Step 3 description
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();

    return `${month} ${day} at ${time} UTC`;
  };

  const eventDateFormatted = data?.date ? formatEventDate(data.date) : '12:00 UTC, Oct 25';
  const steps: StepData[] = [
    // {
    //   id: 1,
    //   title: 'Step 1',
    //   description: 'Confirm your invitation to join Demo Day',
    //   status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'pending',
    // },
    {
      id: 1,
      title: 'Step 1',
      description: 'Complete your investor profile',
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'pending',
    },
    {
      id: 2,
      title: 'Step 2',
      description: `Return to this page on ${eventDateFormatted} to join the event.`,
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'current' : 'pending',
    },
  ];

  return (
    <div className={s.stepperCard}>
      {/* Title Section */}
      <div className={s.titleSection}>
        <h3 className={s.title}>You&apos;re invited to Demo Day.</h3>
        <p className={s.subtitle}>Follow these steps to secure your access:</p>
      </div>

      {/* Vertical Stepper */}
      <div className={s.verticalStepper}>
        {steps.map((step, index) => (
          <div key={step.id} className={`${s.stepContainer}`}>
            {/* Step Indicator and Connector */}
            <div className={s.stepIndicatorContainer}>
              <div className={`${s.stepIndicator}`}>
                <div className={s.stepDot} />
              </div>
              {index < steps.length - 1 && <div className={`${s.stepConnector}`} />}
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
        Go to Investor Profile
      </button>
    </div>
  );
};
