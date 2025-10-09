import React, { useState } from 'react';
import s from './InvestorStepper.module.scss';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import clsx from 'clsx';
import { AddToCalendarModal } from '../AddToCalendarModal';

interface StepperProps {
  currentStep: number;
  onFillProfile?: () => void;
}

interface StepData {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  children?: React.ReactNode;
  height?: number;
}

export const InvestorStepper: React.FC<StepperProps> = ({ currentStep, onFillProfile }) => {
  const { data } = useGetDemoDayState();
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

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
    {
      id: 0,
      title: 'Step 0',
      description: 'Get approved to join Demo day',
      status: 'completed',
      height: 60,
    },
    {
      id: 1,
      title: 'Step 1',
      description: 'Complete your investor profile',
      status: currentStep > 1 ? 'completed' : currentStep === 2 ? 'current' : 'pending',
      children: (
        <button className={s.primaryButton} onClick={onFillProfile}>
          <EditIcon /> Go to Investor Profile
        </button>
      ),
      height: 120,
    },
    {
      id: 2,
      title: 'Step 2',
      description: `Return to this page on ${eventDateFormatted} to join the event.`,
      status: currentStep > 2 ? 'completed' : currentStep === 3 ? 'current' : 'pending',
      children: (
        <button className={s.secondaryButton} onClick={() => setIsCalendarModalOpen(true)}>
          <CalendarIcon /> Add to Calendar
        </button>
      ),
      height: 120,
    },
  ];

  return (
    <>
      <div className={s.stepperCard}>
        {/* Title Section */}
        <div className={s.titleSection}>
          <h3 className={s.title}>You&apos;re invited to Demo Day.</h3>
          <p className={s.subtitle}>Follow these steps to secure your access:</p>
        </div>

        {/* Vertical Stepper */}
        <div className={s.verticalStepper}>
          {steps.map((step, index) => (
            <div key={step.id} className={clsx(s.stepContainer)}>
              {/* Step Indicator and Connector */}
              <div className={s.stepIndicatorContainer}>
                <div
                  className={clsx(s.stepIndicator, {
                    [s.completed]: step.status === 'completed',
                    [s.current]: step.status === 'current',
                    [s.pending]: step.status === 'pending',
                  })}
                >
                  <div className={s.stepDot} />
                </div>
                {index < steps.length - 1 && <div className={clsx(s.stepConnector)} style={{ height: step.height }} />}
              </div>

              {/* Step Content */}
              <div className={s.stepContent}>
                <div className={s.stepTitle}>{step.title}</div>
                <div className={s.stepDescription}>{step.description}</div>

                {step.children}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add to Calendar Modal */}
      <AddToCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        eventDate={data?.date}
        eventTitle="Protocol Labs Demo Day"
      />
    </>
  );
};

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M14.847 2.90307L12.597 0.653073C12.5186 0.574413 12.4254 0.512 12.3229 0.469414C12.2203 0.426829 12.1103 0.404907 11.9993 0.404907C11.8882 0.404907 11.7783 0.426829 11.6757 0.469414C11.5732 0.512 11.48 0.574413 11.4016 0.653073L4.65164 7.40307C4.49396 7.56167 4.4057 7.77638 4.40625 8.00003V10.25C4.40625 10.4738 4.49514 10.6884 4.65338 10.8466C4.81161 11.0049 5.02622 11.0938 5.25 11.0938H7.5C7.61084 11.0939 7.7206 11.0721 7.82303 11.0298C7.92546 10.9874 8.01854 10.9253 8.09695 10.847L14.847 4.09698C14.9254 4.01862 14.9876 3.92556 15.0301 3.82313C15.0726 3.7207 15.0944 3.61091 15.0944 3.50003C15.0944 3.38914 15.0726 3.27935 15.0301 3.17692C14.9876 3.07449 14.9254 2.98143 14.847 2.90307ZM12 2.44534L13.0547 3.50003L12.2812 4.27346L11.2266 3.21878L12 2.44534ZM7.14844 9.40628H6.09375V8.35159L10.0312 4.41409L11.0859 5.46878L7.14844 9.40628ZM14.5312 8.32135V13.625C14.5312 13.998 14.3831 14.3557 14.1194 14.6194C13.8556 14.8831 13.498 15.0313 13.125 15.0313H1.875C1.50204 15.0313 1.14435 14.8831 0.880631 14.6194C0.616908 14.3557 0.46875 13.998 0.46875 13.625V2.37503C0.46875 2.00206 0.616908 1.64438 0.880631 1.38066C1.14435 1.11693 1.50204 0.968776 1.875 0.968776H7.17867C7.40245 0.968776 7.61706 1.05767 7.77529 1.2159C7.93353 1.37414 8.02242 1.58875 8.02242 1.81253C8.02242 2.0363 7.93353 2.25091 7.77529 2.40915C7.61706 2.56738 7.40245 2.65628 7.17867 2.65628H2.15625V13.3438H12.8438V8.32135C12.8438 8.09758 12.9326 7.88297 13.0909 7.72473C13.2491 7.5665 13.4637 7.4776 13.6875 7.4776C13.9113 7.4776 14.1259 7.5665 14.2841 7.72473C14.4424 7.88297 14.5312 8.09758 14.5312 8.32135Z"
      fill="white"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg width="19" height="21" viewBox="0 0 19 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_9878_30859)">
      <path
        d="M15.125 2.96875H13.7188V2.6875C13.7188 2.46372 13.6299 2.24911 13.4716 2.09088C13.3134 1.93264 13.0988 1.84375 12.875 1.84375C12.6512 1.84375 12.4366 1.93264 12.2784 2.09088C12.1201 2.24911 12.0312 2.46372 12.0312 2.6875V2.96875H6.96875V2.6875C6.96875 2.46372 6.87986 2.24911 6.72162 2.09088C6.56339 1.93264 6.34878 1.84375 6.125 1.84375C5.90122 1.84375 5.68661 1.93264 5.52838 2.09088C5.37014 2.24911 5.28125 2.46372 5.28125 2.6875V2.96875H3.875C3.50204 2.96875 3.14435 3.11691 2.88063 3.38063C2.61691 3.64435 2.46875 4.00204 2.46875 4.375V15.625C2.46875 15.998 2.61691 16.3556 2.88063 16.6194C3.14435 16.8831 3.50204 17.0312 3.875 17.0312H15.125C15.498 17.0312 15.8556 16.8831 16.1194 16.6194C16.3831 16.3556 16.5312 15.998 16.5312 15.625V4.375C16.5312 4.00204 16.3831 3.64435 16.1194 3.38063C15.8556 3.11691 15.498 2.96875 15.125 2.96875ZM5.28125 4.65625C5.28125 4.88003 5.37014 5.09464 5.52838 5.25287C5.68661 5.41111 5.90122 5.5 6.125 5.5C6.34878 5.5 6.56339 5.41111 6.72162 5.25287C6.87986 5.09464 6.96875 4.88003 6.96875 4.65625H12.0312C12.0312 4.88003 12.1201 5.09464 12.2784 5.25287C12.4366 5.41111 12.6512 5.5 12.875 5.5C13.0988 5.5 13.3134 5.41111 13.4716 5.25287C13.6299 5.09464 13.7188 4.88003 13.7188 4.65625H14.8438V6.34375H4.15625V4.65625H5.28125ZM4.15625 15.3438V8.03125H14.8438V15.3438H4.15625ZM12.0312 11.6875C12.0312 11.9113 11.9424 12.1259 11.7841 12.2841C11.6259 12.4424 11.4113 12.5312 11.1875 12.5312H10.3438V13.375C10.3438 13.5988 10.2549 13.8134 10.0966 13.9716C9.93839 14.1299 9.72378 14.2188 9.5 14.2188C9.27622 14.2188 9.06161 14.1299 8.90338 13.9716C8.74514 13.8134 8.65625 13.5988 8.65625 13.375V12.5312H7.8125C7.58872 12.5312 7.37411 12.4424 7.21588 12.2841C7.05764 12.1259 6.96875 11.9113 6.96875 11.6875C6.96875 11.4637 7.05764 11.2491 7.21588 11.0909C7.37411 10.9326 7.58872 10.8438 7.8125 10.8438H8.65625V10C8.65625 9.77622 8.74514 9.56161 8.90338 9.40338C9.06161 9.24514 9.27622 9.15625 9.5 9.15625C9.72378 9.15625 9.93839 9.24514 10.0966 9.40338C10.2549 9.56161 10.3438 9.77622 10.3438 10V10.8438H11.1875C11.4113 10.8438 11.6259 10.9326 11.7841 11.0909C11.9424 11.2491 12.0312 11.4637 12.0312 11.6875Z"
        fill="#1B4DFF"
      />
    </g>
    <defs>
      <filter
        id="filter0_d_9878_30859"
        x="-1.5"
        y="0"
        width="22"
        height="22"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="1" />
        <feGaussianBlur stdDeviation="1" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.054902 0 0 0 0 0.0588235 0 0 0 0 0.0666667 0 0 0 0.06 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_9878_30859" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_9878_30859" result="shape" />
      </filter>
    </defs>
  </svg>
);
