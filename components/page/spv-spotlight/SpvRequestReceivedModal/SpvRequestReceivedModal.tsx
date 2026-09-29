'use client';

import React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CheckIcon, CloseIcon } from '../icons';
import s from './SpvRequestReceivedModal.module.scss';

type Props = {
  isOpen: boolean;
  email: string;
  isLoggedIn: boolean;
  onClose: () => void;
  /** Opens the investor-profile drawer, or sends a signed-out requester to sign in. */
  onSetUpProfile: () => void;
};

const CircleCheckIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
    <circle cx="13" cy="13" r="13" fill="#1B4DFF" />
    <path d="M8 13.5l3 3 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type Step = { title: string; description: string; done: boolean };

/**
 * Demo Day's AccountCreatedSuccessModal, for a data-room request: submitted →
 * set up investor profile → await approval. Closing it leaves the applied
 * stepper in the hero, which says the same thing.
 */
export const SpvRequestReceivedModal = ({ isOpen, email, isLoggedIn, onClose, onSetUpProfile }: Props) => {
  const steps: Step[] = [
    { title: 'Request submitted', description: 'Sent to the PL team for review.', done: true },
    {
      title: 'Set up investor profile',
      description: 'Complete your investor profile: the PL team reviews it with your request.',
      done: false,
    },
    {
      title: 'Await approval',
      description: `We'll email ${email} once you're approved. The materials then open on this page.`,
      done: false,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassname={s.overlay}
      ariaLabelledBy="spv-request-received-title"
      inertBackground
    >
      <div className={s.modal}>
        <button type="button" className={s.closeButton} onClick={onClose} aria-label="Close">
          <CloseIcon size={16} />
        </button>

        <div className={s.content}>
          <div className={s.icon}>
            <CircleCheckIcon />
          </div>
          <h2 id="spv-request-received-title" className={s.title}>
            Request received
          </h2>

          <ol className={s.steps}>
            {steps.map((step, i) => (
              <li key={step.title} className={s.step}>
                <div className={s.stepIndicator}>
                  {step.done ? (
                    <div className={s.stepIconCompleted}>
                      <CheckIcon />
                    </div>
                  ) : (
                    <div className={s.stepIconPending}>
                      <div className={s.stepDot} />
                    </div>
                  )}
                  {i < steps.length - 1 && <div className={s.line} />}
                </div>
                <div className={s.stepContent}>
                  <p className={s.stepTitle}>{step.title}</p>
                  <p className={s.stepDescription}>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <Button type="button" size="m" style="fill" variant="primary" onClick={onSetUpProfile} className={s.primary}>
          {isLoggedIn ? 'Set up investor profile' : 'Sign in to set up investor profile'}
        </Button>
      </div>
    </Modal>
  );
};
