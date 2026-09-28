'use client';

import React from 'react';
import clsx from 'clsx';
// Demo Day's applied-investor stepper — what its landing shows an investor who
// has applied — by its own stylesheet. The component is copy-simplified: it
// reads the auth store and useMember, and sends signed-out people to login.
// Here the applicant is in session and the profile's completeness comes in as
// a prop. Steps, copy, statuses and the CTA's labels are production's; only
// step 3's sentence names the Spotlight instead of Demo Day. Two deviations:
// the tick badge above the steps is gone (step 1's own tick already says it),
// and step 2 carries "Discover PL Network" under the profile CTA.
import s from '@/components/page/demo-day/AppliedInvestorSteps/AppliedInvestorSteps.module.scss';
import st from './SpvSpotlight.module.scss';

type Props = {
  profileComplete: boolean;
  onProfile: () => void;
  /** Where "Discover PL Network" goes — it rides in step 2, under the profile CTA. */
  discoverUrl: string;
};

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M14.847 2.90307L12.597 0.653073C12.5186 0.574413 12.4254 0.512 12.3229 0.469414C12.2203 0.426829 12.1103 0.404907 11.9993 0.404907C11.8882 0.404907 11.7783 0.426829 11.6757 0.469414C11.5732 0.512 11.48 0.574413 11.4016 0.653073L4.65164 7.40307C4.49396 7.56167 4.4057 7.77638 4.40625 8.00003V10.25C4.40625 10.4738 4.49514 10.6884 4.65338 10.8466C4.81161 11.0049 5.02622 11.0938 5.25 11.0938H7.5C7.61084 11.0939 7.7206 11.0721 7.82303 11.0298C7.92546 10.9874 8.01854 10.9253 8.09695 10.847L14.847 4.09698C14.9254 4.01862 14.9876 3.92556 15.0301 3.82313C15.0726 3.7207 15.0944 3.61091 15.0944 3.50003C15.0944 3.38914 15.0726 3.27935 15.0301 3.17692C14.9876 3.07449 14.9254 2.98143 14.847 2.90307ZM12 2.44534L13.0547 3.50003L12.2812 4.27346L11.2266 3.21878L12 2.44534ZM7.14844 9.40628H6.09375V8.35159L10.0312 4.41409L11.0859 5.46878L7.14844 9.40628ZM14.5312 8.32135V13.625C14.5312 13.998 14.3831 14.3557 14.1194 14.6194C13.8556 14.8831 13.498 15.0313 13.125 15.0313H1.875C1.50204 15.0313 1.14435 14.8831 0.880631 14.6194C0.616908 14.3557 0.46875 13.998 0.46875 13.625V2.37503C0.46875 2.00206 0.616908 1.64438 0.880631 1.38066C1.14435 1.11693 1.50204 0.968776 1.875 0.968776H7.17867C7.40245 0.968776 7.61706 1.05767 7.77529 1.2159C7.93353 1.37414 8.02242 1.58875 8.02242 1.81253C8.02242 2.0363 7.93353 2.25091 7.77529 2.40915C7.61706 2.56738 7.40245 2.65628 7.17867 2.65628H2.15625V13.3438H12.8438V8.32135C12.8438 8.09758 12.9326 7.88297 13.0909 7.72473C13.2491 7.5665 13.4637 7.4776 13.6875 7.4776C13.9113 7.4776 14.1259 7.5665 14.2841 7.72473C14.4424 7.88297 14.5312 8.09758 14.5312 8.32135Z"
      fill="currentColor"
    />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M13.3334 4L6.00008 11.3333L2.66675 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SpvAppliedSteps = ({ profileComplete, onProfile, discoverUrl }: Props) => {
  // Production: isNew picks "Set up" vs "Review … (optional)". An SPV
  // applicant is new to the drawer here, so it is the "Set up" pair until the
  // profile is complete, and production's "Go to Investor Profile" after.
  const step1Status = profileComplete ? 'completed' : 'current';
  const step2Status = profileComplete ? 'current' : 'pending';
  const ctaLabel = profileComplete ? 'Go to Investor Profile' : 'Set Up Investor Profile';
  const step1ButtonClass = step1Status === 'completed' ? s.secondaryButton : s.primaryButton;

  const steps = [
    {
      id: 0,
      status: 'completed',
      title: 'Application submitted successfully!',
      description: 'Our team will review your application shortly.',
      height: 52,
    },
    {
      id: 1,
      status: step1Status,
      title: 'Set up investor profile',
      description: 'Complete your investor profile: the PL team reviews it with your application.',
      // Production's 116px connector plus the second button (38px) and the gap.
      height: 162,
      children: (
        <div className={st.stepActions}>
          <button type="button" className={step1ButtonClass} onClick={onProfile}>
            <EditIcon /> {ctaLabel}
          </button>
          {/* The page's other way forward, beside the profile CTA rather than
              above the stepper: the stepper's own lighter button, full width
              like the one above it, so the two read as one pair. */}
          <a href={discoverUrl} target="_blank" rel="noopener noreferrer" className={clsx(s.secondaryButton, st.linkButton)}>
            Discover PL Network
          </a>
        </div>
      ),
    },
    {
      id: 2,
      status: step2Status,
      title: 'Await approval confirmation',
      description:
        "You'll receive an email confirmation if our team approves your application — each team's materials then open on this page.",
      height: 52,
    },
  ];

  return (
    <div className={s.stepperCard}>

      <div className={s.verticalStepper}>
        {steps.map((step, index) => (
          <div key={step.id} className={clsx(s.stepContainer, s[step.status])}>
            <div className={s.stepIndicatorContainer}>
              <div className={clsx(s.stepIndicator, s[step.status])}>
                {step.status === 'completed' ? (
                  <div className={s.stepIconCompleted}>
                    <CheckIcon />
                  </div>
                ) : (
                  <div className={s.stepDot} />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={clsx(s.stepConnector, step.status === 'completed' && s.completed)}
                  style={{ height: step.height }}
                />
              )}
            </div>
            <div className={s.stepContent}>
              <div className={s.stepTitle}>{step.title}</div>
              <div className={s.stepDescription}>{step.description}</div>
              {step.children}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
