'use client';

import React, { useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import clsx from 'clsx';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { FormField } from '@/components/form/FormField';
import { CheckIcon } from '@/components/page/member-details/InvestorProfileDetails/components/EditInvestorProfileForm/icons';
import { PRIVACY_POLICY_URL, TERMS_AND_CONDITIONS_URL } from '@/app/constants/demoday';
import type { SpvAccessRequestPayload } from '@/services/spv-spotlight/types';
import { CloseIcon } from '../icons';
import s from './SpvRequestAccessModal.module.scss';

// ApplyForDemoDayModal's rules for the fields both forms share, trimmed to
// email, name, role @ organization and accreditation. Organization is free
// text: most requesters' funds are not directory teams.
export const requestAccessSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email('Must be a valid email')
    .test('domain-has-dot', 'Email domain must contain a dot (e.g., example.com)', (value) => {
      if (!value) return true;
      const parts = value.split('@');
      return parts.length === 2 && parts[1].includes('.');
    })
    .required('Email is required'),
  name: yup.string().trim().required('Name is required'),
  role: yup.string().trim().required('Role is required'),
  organization: yup.string().trim().required('Organization is required'),
  isAccreditedInvestor: yup
    .boolean()
    .oneOf([true], 'You must confirm that you are an accredited investor')
    .required('You must confirm that you are an accredited investor'),
});

type FormValues = yup.InferType<typeof requestAccessSchema>;

export type SpvRequestAccessOutcome = { type: 'success' } | { type: 'blocked' } | { type: 'error'; message: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Names the data room in the heading; the admin title ("SPV Spotlight: …") reads badly inside a sentence. */
  teamName: string;
  /** Signed-in requesters come in with email and name locked. */
  prefill: { email: string; name: string } | null;
  onSubmit: (payload: SpvAccessRequestPayload) => Promise<SpvRequestAccessOutcome>;
  /** The email already has a request (or can't make one): sign in with it instead. */
  onSignIn: (email: string) => void;
};

/**
 * Demo Day's apply modal, trimmed for a data-room request. Requesting is
 * signing up: a new email gets an account. An email the backend won't take a
 * request from turns the modal into a sign-in prompt; it never says why, so a
 * rejection isn't disclosed to someone who only knows the address.
 */
export const SpvRequestAccessModal = ({ isOpen, onClose, teamName, prefill, onSubmit, onSignIn }: Props) => {
  const isAuthenticated = !!prefill;
  const [step, setStep] = useState<'form' | 'alreadyRequested'>('form');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const methods = useForm<FormValues>({
    defaultValues: {
      email: prefill?.email ?? '',
      name: prefill?.name ?? '',
      role: '',
      organization: '',
      isAccreditedInvestor: false,
    },
    resolver: yupResolver(requestAccessSchema),
    mode: 'onBlur',
  });
  const {
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = methods;
  const isAccreditedInvestor = useWatch({ control, name: 'isAccreditedInvestor' });

  const handleClose = () => {
    reset();
    setStep('form');
    setSubmitError(null);
    onClose();
  };

  const submit = async (values: FormValues) => {
    setSubmitError(null);
    const outcome = await onSubmit({
      email: values.email.trim(),
      name: values.name.trim(),
      role: values.role.trim(),
      organization: values.organization.trim(),
      isAccreditedInvestor: true,
    });
    if (outcome.type === 'blocked') {
      setStep('alreadyRequested');
    } else if (outcome.type === 'error') {
      setSubmitError(outcome.message);
    } else {
      reset();
      setStep('form');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      overlayClassname={s.overlay}
      closeOnBackdropClick={false}
      closeOnEscape
      className={s.modal}
      ariaLabelledBy="spv-request-access-title"
      inertBackground
    >
      <button type="button" className={s.closeButton} onClick={handleClose} aria-label="Close">
        <CloseIcon />
      </button>

      {step === 'alreadyRequested' ? (
        <div className={s.content}>
          <div className={s.header}>
            <h2 id="spv-request-access-title" className={s.title}>
              You&apos;ve already requested access
            </h2>
          </div>
          <p className={s.description}>
            There&apos;s already a request for <strong>{getValues('email')}</strong>. Sign in with that email to see
            where it stands. Each email can request access once.
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
                const email = getValues('email').trim();
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
          <div className={s.header}>
            <h2 id="spv-request-access-title" className={s.title}>
              Request access to the {teamName} data room
            </h2>
          </div>
          <p className={s.description}>
            The PL team reviews every request. Once you&apos;re approved, the data room opens on this page and
            we&apos;ll email you.
          </p>

          <FormProvider {...methods}>
            <form className={s.form} noValidate onSubmit={handleSubmit(submit)}>
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
              <div className={s.column}>
                <div className={clsx(s.inputsLabel, s.required)}>Role & Organization/Fund Name</div>
                <div className={s.inputsWrapper}>
                  <FormField name="role" placeholder="Enter your primary role" aria-label="Role" />
                  <span aria-hidden>@</span>
                  <FormField name="organization" placeholder="e.g. Northfield Ventures" aria-label="Organization" />
                </div>
              </div>

              {/* An SPV is a securities offering: accreditation is the one extra field that isn't optional. */}
              <label className={s.checkboxLabel}>
                <Checkbox.Root
                  className={s.checkbox}
                  checked={isAccreditedInvestor}
                  onCheckedChange={(v: boolean) => {
                    setValue('isAccreditedInvestor', v, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                  }}
                >
                  <Checkbox.Indicator className={s.indicator}>
                    <CheckIcon />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <div className={s.checkboxText}>
                  <div className={clsx(s.checkboxPrimary, s.required)}>Accredited investor confirmation</div>
                  <div className={s.checkboxSecondary}>
                    I am an “accredited investor” under Rule 501(a) of the Securities Act of 1933, or I represent a
                    VC/fund or institutional investor. I agree that I am solely responsible for my own compliance with
                    securities laws and for conducting my own due diligence.
                  </div>
                  {errors.isAccreditedInvestor && (
                    <div className={s.errorMessage}>{errors.isAccreditedInvestor.message}</div>
                  )}
                </div>
              </label>

              <p className={s.legal}>
                {isAuthenticated
                  ? 'By submitting this form, you agree to our '
                  : 'Requesting access creates a free PL Network account for this email. By submitting this form, you agree to our '}
                <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href={TERMS_AND_CONDITIONS_URL} target="_blank" rel="noopener noreferrer">
                  Terms & Conditions
                </a>
                .
              </p>

              {submitError && (
                <p className={s.errorMessage} role="alert">
                  {submitError}
                </p>
              )}

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
