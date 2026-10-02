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
// and step 2's profile CTA is the completed Demo Day's underlined text link
// rather than a button.
import s from '@/components/page/demo-day/AppliedInvestorSteps/AppliedInvestorSteps.module.scss';
import d from '@/components/page/demo-day/DemodayCompletedView/DemodayCompletedView.module.scss';
import { EditIcon } from '@/components/page/demo-day/DemodayCompletedView/components/Icons';

type Props = {
  profileComplete: boolean;
  onProfile: () => void;
};

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M13.3334 4L6.00008 11.3333L2.66675 8"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SpvAppliedSteps = ({ profileComplete, onProfile }: Props) => {
  // Production: isNew picks "Set up" vs "Review … (optional)". An SPV
  // applicant is new to the drawer here, so it is the "Set up" pair until the
  // profile is complete, and production's "Go to Investor Profile" after.
  const step1Status = profileComplete ? 'completed' : 'current';
  const step2Status = profileComplete ? 'current' : 'pending';
  const ctaLabel = profileComplete ? 'Go to investor profile' : 'Set up investor profile';

  const steps = [
    {
      id: 0,
      status: 'completed',
      title: 'Request submitted successfully!',
      description: 'Our team will review your request shortly.',
      height: 52,
    },
    {
      id: 1,
      status: step1Status,
      title: 'Set up investor profile',
      description: 'Complete your investor profile: the PL team reviews it with your request.',
      // Shorter than production's 116px: a text link, not a 40px button.
      height: 88,
      children: (
        // The same text link as the approved hero's (the completed Demo Day's
        // "Give Feedback" style), inline so its underline hugs the words.
        <div className={d.links}>
          <button type="button" className={d.linkButton} onClick={onProfile}>
            {ctaLabel} <EditIcon />
          </button>
        </div>
      ),
    },
    {
      id: 2,
      status: step2Status,
      // Anuj's wording (2026-09-29 review), approval in the title itself, so the
      // description only says how you'll hear.
      title: 'Get access to data room — subject to approval.',
      description:
        "You'll receive an email confirmation if our team approves your request, and the data room then opens on this page.",
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
