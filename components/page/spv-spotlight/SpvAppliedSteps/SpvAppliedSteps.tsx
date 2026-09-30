'use client';

import React from 'react';
import clsx from 'clsx';
import { EditIcon } from '@/components/page/demo-day/DemodayCompletedView/components/Icons';
import { CheckIcon } from '../icons';
import s from './SpvAppliedSteps.module.scss';

type Props = {
  isLoggedIn: boolean;
  profileComplete: boolean;
  /** Opens the investor-profile drawer, or sends a signed-out applicant to sign in. */
  onProfile: () => void;
};

type StepStatus = 'completed' | 'current' | 'pending';

/**
 * Demo Day's applied-investor stepper (AppliedInvestorSteps), for a pending
 * request: submitted → set up investor profile → await approval. Production's
 * steps and statuses; step 3 names the data room instead of Demo Day, and the
 * profile CTA is the completed Demo Day's underlined text link.
 */
export const SpvAppliedSteps = ({ isLoggedIn, profileComplete, onProfile }: Props) => {
  const step1Status: StepStatus = profileComplete ? 'completed' : 'current';
  const step2Status: StepStatus = profileComplete ? 'current' : 'pending';
  const ctaLabel = profileComplete
    ? 'Go to investor profile'
    : isLoggedIn
      ? 'Set up investor profile'
      : 'Sign in to set up investor profile';

  const steps: {
    id: number;
    status: StepStatus;
    title: string;
    description: string;
    connectorHeight: number;
    children?: React.ReactNode;
  }[] = [
    {
      id: 0,
      status: 'completed',
      title: 'Request submitted successfully!',
      description: 'Our team will review your request shortly.',
      connectorHeight: 52,
    },
    {
      id: 1,
      status: step1Status,
      title: 'Set up investor profile',
      description: 'Complete your investor profile: the PL team reviews it with your request.',
      connectorHeight: 88,
      children: (
        <button type="button" className={s.cta} onClick={onProfile}>
          {ctaLabel} {isLoggedIn && <EditIcon />}
        </button>
      ),
    },
    {
      id: 2,
      status: step2Status,
      // Approval is in the title itself, so the description only says how you'll hear.
      title: 'Get access to data room — subject to approval.',
      description:
        "You'll receive an email confirmation if our team approves your request, and the data room then opens on this page.",
      connectorHeight: 52,
    },
  ];

  return (
    <ol className={s.stepper} aria-label="Your access request">
      {steps.map((step, index) => (
        <li key={step.id} className={s.step} aria-current={step.status === 'current' ? 'step' : undefined}>
          <div className={s.indicatorColumn}>
            <div className={s.indicator}>
              {step.status === 'completed' ? (
                <div className={s.iconCompleted}>
                  <CheckIcon />
                </div>
              ) : (
                <div className={clsx(s.dot, { [s.dotCurrent]: step.status === 'current' })} />
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={clsx(s.connector, { [s.connectorCompleted]: step.status === 'completed' })}
                style={{ height: step.connectorHeight }}
              />
            )}
          </div>
          <div className={s.content}>
            <div className={s.title}>{step.title}</div>
            <div className={s.description}>{step.description}</div>
            {step.children}
          </div>
        </li>
      ))}
    </ol>
  );
};
