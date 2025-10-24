import React, { useState } from 'react';
import s from './InvestorStepper.module.scss';
import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import clsx from 'clsx';
import { AddToCalendarModal } from '../AddToCalendarModal';
import Link from 'next/link';

interface StepperProps {
  currentStep: number;
  onFillProfile?: () => void;
  onAddToCalendar?: () => void;
  onGoToDemoDay?: () => void;
}

interface StepData {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  children?: React.ReactNode;
  height?: number;
}

export const InvestorStepper: React.FC<StepperProps> = ({
  currentStep,
  onFillProfile,
  onAddToCalendar,
  onGoToDemoDay,
}) => {
  const { data } = useGetDemoDayState();
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  const handleAddToCalendarClick = () => {
    onAddToCalendar?.();
    setIsCalendarModalOpen(true);
  };

  const handleGoToDemoDayClick = () => {
    onGoToDemoDay?.();
  };

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

  // Check if demoday is active
  const isDemoDayActive = data?.status === 'ACTIVE';

  const eventDateFormatted = data?.date ? formatEventDate(data.date) : '12:00 UTC, Oct 25';

  // Determine Step 2 status and description
  const step2Status = currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'pending';
  const step2Description = isDemoDayActive
    ? `You're all set for Demo Day!`
    : step2Status === 'completed'
      ? `You're all set for Demo Day! Return to this page on ${eventDateFormatted} to join the event.`
      : `Return to this page on ${eventDateFormatted} to join the event.`;

  // Determine button styles based on step completion
  const step1Status = currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'pending';
  const step1ButtonClass = step1Status === 'completed' ? s.secondaryButton : s.primaryButton;
  const step2ButtonClass =
    step1Status === 'completed' && (isDemoDayActive || step2Status !== 'completed')
      ? s.primaryButton
      : s.secondaryButton;

  // Step 2 children based on demoday status
  const step2Children = isDemoDayActive ? (
    <Link href="/demoday/active" className={step2ButtonClass} onClick={handleGoToDemoDayClick}>
      <GoToDemoDayIcon color={step1Status === 'completed' ? 'white' : '#1B4DFF'} /> Go to Demo Day
    </Link>
  ) : (
    <button className={step2ButtonClass} onClick={handleAddToCalendarClick}>
      <CalendarIcon /> Add to your Calendar
    </button>
  );

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
      description: "Complete your investor profile: shared with founders when you're introduced",
      status: step1Status,
      children: (
        <button className={step1ButtonClass} onClick={onFillProfile}>
          <EditIcon /> Go to Investor Profile
        </button>
      ),
      height: 120,
    },
    {
      id: 2,
      title: 'Step 2',
      description: step2Description,
      status: step2Status,
      children: step2Children,
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
                  {step.status === 'completed' ? <CompletedIcon /> : <div className={s.stepDot} />}
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

const CompletedIcon = () => (
  <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10.5 1.875C8.89303 1.875 7.32214 2.35152 5.986 3.24431C4.64985 4.1371 3.60844 5.40605 2.99348 6.8907C2.37852 8.37535 2.21762 10.009 2.53112 11.5851C2.84463 13.1612 3.61846 14.6089 4.75476 15.7452C5.89106 16.8815 7.3388 17.6554 8.9149 17.9689C10.491 18.2824 12.1247 18.1215 13.6093 17.5065C15.094 16.8916 16.3629 15.8502 17.2557 14.514C18.1485 13.1779 18.625 11.607 18.625 10C18.6227 7.84581 17.766 5.78051 16.2427 4.25727C14.7195 2.73403 12.6542 1.87727 10.5 1.875ZM14.0672 8.56719L9.69219 12.9422C9.63415 13.0003 9.56522 13.0464 9.48934 13.0779C9.41347 13.1093 9.33214 13.1255 9.25 13.1255C9.16787 13.1255 9.08654 13.1093 9.01067 13.0779C8.93479 13.0464 8.86586 13.0003 8.80782 12.9422L6.93282 11.0672C6.81554 10.9499 6.74966 10.7909 6.74966 10.625C6.74966 10.4591 6.81554 10.3001 6.93282 10.1828C7.05009 10.0655 7.20915 9.99965 7.375 9.99965C7.54086 9.99965 7.69992 10.0655 7.81719 10.1828L9.25 11.6164L13.1828 7.68281C13.2409 7.62474 13.3098 7.57868 13.3857 7.54725C13.4616 7.51583 13.5429 7.49965 13.625 7.49965C13.7071 7.49965 13.7884 7.51583 13.8643 7.54725C13.9402 7.57868 14.0091 7.62474 14.0672 7.68281C14.1253 7.74088 14.1713 7.80982 14.2027 7.88569C14.2342 7.96156 14.2504 8.04288 14.2504 8.125C14.2504 8.20712 14.2342 8.28844 14.2027 8.36431C14.1713 8.44018 14.1253 8.50912 14.0672 8.56719Z"
      fill="#1B4DFF"
    />
  </svg>
);

const GoToDemoDayIcon = ({ color = '#1B4DFF' }: { color?: string }) => (
  <svg width="22" height="23" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_dd_10958_40759)">
      <path
        d="M17.4563 5.56043L11.2688 2.17348C11.062 2.05968 10.8298 2 10.5938 2C10.3577 2 10.1255 2.05968 9.91875 2.17348L3.73125 5.56043C3.50985 5.68158 3.32513 5.86007 3.19647 6.07718C3.0678 6.2943 2.99994 6.54204 3 6.79442V13.5177C2.99994 13.7701 3.0678 14.0178 3.19647 14.2349C3.32513 14.4521 3.50985 14.6305 3.73125 14.7517L9.91875 18.1386C10.1255 18.2526 10.3577 18.3123 10.5938 18.3123C10.8298 18.3123 11.062 18.2526 11.2688 18.1386L17.4563 14.7517C17.6777 14.6305 17.8624 14.4521 17.991 14.2349C18.1197 14.0178 18.1876 13.7701 18.1875 13.5177V6.79442C18.1876 6.54204 18.1197 6.2943 17.991 6.07718C17.8624 5.86007 17.6777 5.68158 17.4563 5.56043ZM16.5 13.3511L10.5938 16.5854L4.6875 13.3511V6.96106L10.5938 3.72668L16.5 6.96106V13.3511Z"
        fill={color}
      />
    </g>
    <defs>
      <filter
        id="filter0_dd_10958_40759"
        x="-1.40625"
        y="-0.843933"
        width="24"
        height="24"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
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
        <feColorMatrix type="matrix" values="0 0 0 0 0.054902 0 0 0 0 0.0588235 0 0 0 0 0.0666667 0 0 0 0.06 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_10958_40759" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="1" />
        <feGaussianBlur stdDeviation="1.5" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.054902 0 0 0 0 0.0588235 0 0 0 0 0.0666667 0 0 0 0.12 0" />
        <feBlend mode="normal" in2="effect1_dropShadow_10958_40759" result="effect2_dropShadow_10958_40759" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_10958_40759" result="shape" />
      </filter>
    </defs>
  </svg>
);
