'use client';

import React, { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import clsx from 'clsx';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { FormField } from '@/components/form/FormField';
import { CheckIcon } from '@/components/page/member-details/InvestorProfileDetails/components/EditInvestorProfileForm/icons';
// Chrome and form classes are ApplyForDemoDayModal's; the success sheet is
// AccountCreatedSuccessModal's. Both components are copy-simplified here —
// they wire useApplyForDemoDay, useQuery(getMember), useMemberFormOptions,
// router query params and analytics.
import s from '@/components/page/demo-day/ApplyForDemoDayModal/ApplyForDemoDayModal.module.scss';
import ok from '@/components/page/demo-day/ApplyForDemoDayModal/AccountCreatedSuccessModal.module.scss';
import { APPLIED_EMAILS } from './mocks';

// Transcribed from ApplyForDemoDayModal's `applySchema` (same email rules and
// accreditation message). Email, name, and Demo Day's "Role & Organization/Fund
// Name" row (role @ organization). LinkedIn is left out to keep the request
// short. Organization is a plain text field rather than Demo Day's team picker,
// because most requesters are outside investors whose fund is not a directory team.
const applySchema = yup.object({
  email: yup
    .string()
    .email('Must be a valid email')
    .test('domain-has-dot', 'Email domain must contain a dot (e.g., example.com)', (value) => {
      if (!value) return true;
      const parts = value.split('@');
      return parts.length === 2 && parts[1].includes('.');
    })
    .required('Email is required'),
  name: yup.string().required('Name is required'),
  role: yup.string().required('Role is required'),
  org: yup.string().required('Organization is required'),
  isInvestor: yup
    .boolean()
    .oneOf([true], 'You must confirm that you are an accredited investor')
    .required('You must confirm that you are an accredited investor'),
});

type ApplyFormData = yup.InferType<typeof applySchema>;

type Step = 'form' | 'alreadyApplied';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  spotlightTitle: string;
  // Signed-in applicants come in with email + name locked, like production.
  prefill?: { email: string; name: string; role: string; org: string } | null;
  onSubmitted: (email: string) => void;
  onSignIn: (email: string) => void;
};

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SpvApplyModal = ({ isOpen, onClose, spotlightTitle, prefill, onSubmitted, onSignIn }: Props) => {
  const [step, setStep] = useState<Step>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAuthenticated = !!prefill;

  const methods = useForm<ApplyFormData>({
    defaultValues: {
      email: prefill?.email ?? '',
      name: prefill?.name ?? '',
      role: prefill?.role ?? '',
      org: prefill?.org ?? '',
      isInvestor: false,
    },
    resolver: yupResolver(applySchema),
    mode: 'onBlur',
  });
  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = methods;
  const isInvestor = watch('isInvestor');

  const handleClose = () => {
    reset();
    setStep('form');
    setIsSubmitting(false);
    onClose();
  };

  const onSubmit = (data: ApplyFormData) => {
    // The mocked backend: an email that already has an application does not
    // create a second one — the modal turns into a sign-in prompt instead.
    if (!isAuthenticated && APPLIED_EMAILS.includes(data.email.trim().toLowerCase())) {
      setStep('alreadyApplied');
      return;
    }
    // Read the email now: RHF hands `data` by reference, and reset() empties it.
    const email = data.email;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSubmitted(email);
      reset();
      setStep('form');
    }, 700);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassname={s.overlay}
      closeOnBackdropClick={false}
      closeOnEscape
      className={s.modal}
    >
      <button type="button" className={s.closeButton} onClick={handleClose} aria-label="Close">
        <CloseIcon />
      </button>

      {step === 'alreadyApplied' ? (
        <div className={s.content}>
          <div className={s.text}>
            <h2 className={s.title}>You&apos;ve already requested access</h2>
          </div>
          <p className={s.description}>
            There&apos;s already a request for <strong>{getValues('email')}</strong>. Sign in with that email to see
            where it stands — each email can request access once.
          </p>
          <div className={s.footer}>
            <Button type="button" size="m" variant="secondary" style="border" onClick={() => setStep('form')}>
              Use a different email
            </Button>
            <Button
              type="button"
              size="m"
              style="fill"
              variant="primary"
              onClick={() => {
                const email = getValues('email');
                handleClose();
                onSignIn(email);
              }}
            >
              Sign in
            </Button>
          </div>
        </div>
      ) : (
        <div className={s.content}>
          <div className={s.text}>
            <h2 className={s.title}>Request access to the {spotlightTitle} data room</h2>
          </div>
          <p className={s.description}>
            The PL team reviews every request. Once you&apos;re approved, the data room opens on this page and
            we&apos;ll email you.
          </p>

          <FormProvider {...methods}>
            <form className={s.form} noValidate onSubmit={handleSubmit(onSubmit)}>
              <FormField
                name="email"
                label="Email Address"
                placeholder="Enter your email"
                isRequired
                disabled={isAuthenticated}
              />
              <FormField
                name="name"
                label="Full Name"
                placeholder="Enter your full name"
                isRequired
                disabled={isAuthenticated}
              />
              {/* Demo Day's role row, same classes: "Role @ Organization". */}
              <div className={s.column}>
                <div className={clsx(s.inputsLabel, s.required)}>Role & Organization/Fund Name</div>
                <div className={s.inputsWrapper}>
                  <FormField name="role" placeholder="Enter your primary role" />
                  <span>@</span>
                  <FormField name="org" placeholder="e.g. Northfield Ventures" />
                </div>
              </div>

              {/* Kept from the Demo Day form on purpose: an SPV is a securities
                  offering, so accreditation is the one extra field that is not
                  optional. */}
              <label className={s.Label}>
                <Checkbox.Root
                  className={s.Checkbox}
                  checked={isInvestor}
                  onCheckedChange={(v: boolean) => {
                    setValue('isInvestor', v, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                  }}
                >
                  <Checkbox.Indicator className={s.Indicator}>
                    <CheckIcon className={s.Icon} />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <div className={s.col}>
                  <div className={clsx(s.primary, s.required)}>Accredited investor confirmation</div>
                  <div className={s.secondary}>
                    I am an “accredited investor” under Rule 501(a) of the Securities Act of 1933, or I represent a
                    VC/fund or institutional investor. I agree that I am solely responsible for my own compliance with
                    securities laws and for conducting my own due diligence.
                  </div>
                  {errors.isInvestor && <div className={s.errorMessage}>{errors.isInvestor.message}</div>}
                </div>
              </label>

              <div className={s.bottomText}>
                <p className={s.bodySecondary}>
                  {isAuthenticated
                    ? 'By submitting this form, you agree to our '
                    : 'Requesting access creates a free PL Network account for this email. By submitting this form, you agree to our '}
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Privacy Policy
                  </a>{' '}
                  and{' '}
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Terms & Conditions
                  </a>
                  .
                </p>
              </div>

              <div className={s.footer}>
                <Button type="button" size="m" variant="secondary" style="border" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" size="m" style="fill" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Request access'}
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>
      )}
    </Modal>
  );
};

// ---- Success sheet ------------------------------------------------------
// AccountCreatedSuccessModal's layout and stepper, in its order: submitted →
// set up investor profile → await approval. Its one button is Demo Day's too —
// it opens the investor-profile drawer (production's reads "Log In To Set Up
// Investor Profile"; an SPV applicant is already in session here). The ✕
// closes onto the pending page for anyone who'd rather do it later.

const CircleCheckIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="13" cy="13" r="13" fill="#1B4DFF" />
    <path d="M8 13.5l3 3 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StepCheck = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.3334 4L6.00008 11.3333L2.66675 8"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SmallClose = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 4L4 12M4 4L12 12"
      stroke="currentColor"
      strokeWidth="1.33"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SpvAppliedModal = ({
  isOpen,
  onClose,
  onSetUpProfile,
  email,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSetUpProfile: () => void;
  email: string;
}) => (
  <Modal isOpen={isOpen} onClose={onClose} overlayClassname={ok.overlay}>
    <div className={ok.modal}>
      <button type="button" className={ok.closeButton} onClick={onClose} aria-label="Close">
        <SmallClose />
      </button>

      <div className={ok.content}>
        <div className={ok.icon}>
          <CircleCheckIcon />
        </div>
        <div className={ok.text}>
          <h2 className={ok.title}>Request received</h2>

          <div className={ok.steps}>
            <div className={ok.step}>
              <div className={ok.stepIndicator}>
                <div className={ok.lineTop} />
                <div className={ok.stepIconCompleted}>
                  <StepCheck />
                </div>
                <div className={ok.lineBottom} />
              </div>
              <div className={ok.stepContent}>
                <p className={ok.stepTitle}>Request submitted</p>
                <p className={ok.stepDescription}>Sent to the PL team for review.</p>
              </div>
            </div>

            <div className={ok.breakLine} />

            <div className={ok.step}>
              <div className={ok.stepIndicator}>
                <div className={ok.lineTop} />
                <div className={ok.stepIconPending}>
                  <div className={ok.stepDot} />
                </div>
                <div className={ok.lineBottom} />
              </div>
              <div className={ok.stepContent}>
                <p className={ok.stepTitle}>Set up investor profile</p>
                <p className={ok.stepDescription}>
                  Complete your investor profile: the PL team reviews it with your request.
                </p>
              </div>
            </div>

            <div className={ok.breakLine} />

            <div className={ok.step}>
              <div className={ok.stepIndicator}>
                <div className={ok.lineTop} />
                <div className={ok.stepIconPending}>
                  <div className={ok.stepDot} />
                </div>
                <div className={ok.lineBottomHidden} />
              </div>
              <div className={ok.stepContent}>
                <p className={ok.stepTitle}>Get access to data room — subject to approval.</p>
                <p className={ok.stepDescription}>
                  We&apos;ll email {email} if our team approves your request, and the data room then opens on this page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={ok.footer}>
        <Button
          type="button"
          size="m"
          style="fill"
          variant="primary"
          onClick={onSetUpProfile}
          className={ok.primaryButton}
        >
          Set up investor profile
        </Button>
      </div>
    </div>
  </Modal>
);
