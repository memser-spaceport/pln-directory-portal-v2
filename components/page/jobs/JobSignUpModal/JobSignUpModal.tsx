'use client';

import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { IJobRole } from '@/types/jobs.types';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
import { CloseIcon } from '@/components/icons';
import { useMemberFormOptions } from '@/services/members/hooks/useMemberFormOptions';

import s from './JobSignUpModal.module.scss';

export interface JobSignUpDetails {
  name: string;
  email: string;
  linkedin: string;
  role: string;
  /** The network team they picked as their current company, if any. */
  teamUid: string | null;
}

export type JobSignUpResult = { success: true } | { success: false; emailTaken?: boolean };

interface JobSignUpModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * The role they pressed Apply on, when that's how they got here — the modal
   * names it, because the form is the continuation of that click. Null when
   * opened by a plain Sign up press (header/banner); the header goes generic.
   */
  role: IJobRole | null;
  /** The hiring team, when `role` is set. Empty otherwise. */
  teamName: string;
  /**
   * Filling this in IS the sign-up (the Demo Day shape: a plain form that
   * enrols you, authentication deferred to Privy afterwards). The parent files
   * the participants-request; a failed result is reported back for inline
   * display, a success closes the modal and hands off to Privy.
   */
  onSignUp: (details: JobSignUpDetails) => Promise<JobSignUpResult>;
  /** The escape for people who already have an account. */
  onSignIn: () => void;
}

/** `company` is a react-select Option — `FormSelect` writes the whole option
 *  object into form state — flattened to its value (team uid) on the way out. */
type SignUpFormData = {
  email: string;
  name: string;
  linkedin: string;
  role: string;
  company?: { label: string; value: string } | null;
};

const EMPTY_FORM: SignUpFormData = {
  email: '',
  name: '',
  linkedin: '',
  role: '',
  company: null,
};

// Transcribed from ApplyForDemoDayModal's `applySchema` — same email domain-dot
// test, same LinkedIn handle-or-URL pair of patterns. `role` is plainly
// required here, because there is no branch in which it isn't.
const signUpSchema = yup.object({
  email: yup
    .string()
    .email('Must be a valid email')
    .test('domain-has-dot', 'Email domain must contain a dot (e.g., example.com)', (value) => {
      if (!value) return true; // Let required() handle empty values
      const emailParts = value.split('@');
      if (emailParts.length !== 2) return false;
      return emailParts[1].includes('.');
    })
    .required('Email is required'),
  name: yup.string().required('Name is required'),
  linkedin: yup
    .string()
    .defined()
    .test('linkedin-url', 'Please enter a valid LinkedIn handle or URL', (value) => {
      if (!value || value.trim() === '') return true; // Allow empty values

      const trimmedValue = value.trim();
      const linkedinUrlPattern = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub|profile)\/[\w-]+\/?$/i;
      const linkedinHandlePattern = /^[\w-]{3,100}$/;

      return linkedinUrlPattern.test(trimmedValue) || linkedinHandlePattern.test(trimmedValue);
    }),
  role: yup.string().required('Role is required'),
  company: yup.mixed<{ label: string; value: string }>().nullable(),
});

/**
 * Sign up by applying: the form that creates the account is the application
 * form. Promoted from the job-board prototype; see its header for the full
 * design rationale (why filling in details IS the sign-up, why the modal names
 * the role, why the sign-in escape is a link below the footer).
 *
 * One deliberate copy change from the prototype: nothing here claims details
 * are sent to the hiring team or that an application happens — the request
 * goes to PL admins for review and no application exists yet. The button
 * always reads "Create account", and the body names the wait. Claiming
 * otherwise would violate the flow's own pending-never-claims-applied rule at
 * the exact moment trust is being asked for.
 */
export function JobSignUpModal({ open, onClose, role, teamName, onSignUp, onSignIn }: JobSignUpModalProps) {
  const methods = useForm<SignUpFormData>({
    defaultValues: EMPTY_FORM,
    resolver: yupResolver(signUpSchema) as Resolver<SignUpFormData>,
    mode: 'onBlur',
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  const [serverError, setServerError] = useState<string | null>(null);

  // Reset on every open: the modal is mounted for the life of the board and can
  // be opened against a different role each time. The server error clears on
  // close (below) rather than here — setState in an effect body cascades.
  useEffect(() => {
    if (open) {
      reset(EMPTY_FORM);
    }
  }, [open, reset]);

  const handleClose = () => {
    setServerError(null);
    onClose();
  };

  // The same teams source production's sign-up wizard uses, minus projects —
  // the field asks for a current company, not a contribution.
  const { data: formOptions } = useMemberFormOptions();
  const companyOptions = useMemo(
    () =>
      (formOptions?.teams ?? [])
        .map((item: { teamUid: string; teamTitle: string }) => ({ value: item.teamUid, label: item.teamTitle }))
        .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label)),
    [formOptions],
  );

  const onSubmit = async (data: SignUpFormData) => {
    setServerError(null);
    const result = await onSignUp({
      name: data.name.trim(),
      email: data.email.trim(),
      linkedin: (data.linkedin ?? '').trim(),
      role: data.role.trim(),
      teamUid: data.company?.value ?? null,
    });
    if (!result.success) {
      /* Named rather than vague. The earlier version deliberately blurred
         "email exists" into a generic message to avoid an account-enumeration
         oracle — but the endpoint answers 409 either way, so anyone probing
         reads it off the status code and the vagueness only confuses the
         person who genuinely forgot they had an account. (The oracle is worth
         raising about the endpoint itself, not papering over here.) */
      setServerError(
        result.emailTaken
          ? 'This email already has an account. Sign in instead — your application picks up from there.'
          : 'We couldn’t create your account just now. Please try again.',
      );
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      overlayClassname={s.overlay}
      closeOnBackdropClick={false}
      closeOnEscape
      className={s.modal}
    >
      <button type="button" className={s.closeButton} onClick={handleClose} aria-label="Close">
        <CloseIcon />
      </button>

      <div className={s.content}>
        <div className={s.text}>
          <h2 className={s.title}>{role ? `Apply for ${role.roleTitle}` : 'Sign up to apply'}</h2>
          <div className={s.subtitle}>
            {role
              ? `${teamName} · Creating your LabOS account is the first step.`
              : 'One profile applies to every open role across the Protocol Labs network.'}
          </div>
        </div>

        <FormProvider {...methods}>
          <form className={s.form} noValidate onSubmit={handleSubmit(onSubmit)}>
            {/* Email leads: it is the field the account is created on. */}
            <FormField name="email" label="Email address" placeholder="Enter your email" isRequired />

            <FormField name="name" label="Full name" placeholder="Enter your full name" isRequired />

            <FormField
              name="linkedin"
              label="LinkedIn profile"
              placeholder="eg., johndoe or https://linkedin.com/in/johndoe"
            />

            <div className={s.column}>
              <div className={s.inputsLabel}>Current role &amp; company</div>
              <div className={s.inputsWrapper}>
                <FormField name="role" placeholder="Enter your current role" />
                <span className={s.separator}>@</span>
                <FormSelect name="company" placeholder="Select a company" isClearable options={companyOptions} />
              </div>
            </div>

            <div className={s.bottomText}>
              {/* Says what actually happens next, including the part nobody
                  wants to read. Nothing is sent to any team by this press, and
                  no application exists yet — approval is what unlocks applying,
                  and the sentence says so. */}
              <p className={s.body}>
                Submitting this creates your LabOS account. The PL team reviews new accounts first — you can keep
                browsing every role while you wait, and applying opens up once you&apos;re approved.
              </p>
              <p className={s.bodySecondary}>
                By submitting this form, you agree to our{' '}
                <a
                  className={s.inlineLink}
                  href="https://drive.google.com/file/d/1RIAyMlyuLYnipa6W_YBzcJ6hDzfH7yW3/view"
                  target="_blank"
                  rel="noreferrer"
                >
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a
                  className={s.inlineLink}
                  href="https://drive.google.com/file/d/1MjOF66asddB_hsg7Jc-7Oxk6L1EvYHxk/view"
                  target="_blank"
                  rel="noreferrer"
                >
                  Terms &amp; Conditions
                </a>
                .
              </p>
              {serverError && <p className={s.serverError}>{serverError}</p>}
            </div>

            <div className={s.footer}>
              <Button type="button" size="m" variant="secondary" style="border" onClick={handleClose}>
                Cancel
              </Button>
              {/* Disabled only while submitting, never on `!isValid` — with
                  `mode: "onBlur"` a validity gate leaves a dead button in front
                  of a completed form. Always "Create account": no application is
                  filed by this press, and a button claiming "& apply" would
                  promise one. */}
              <Button type="submit" size="m" style="fill" variant="primary" disabled={isSubmitting}>
                Create account
              </Button>
            </div>

            <p className={s.signInRow}>
              Already have an account?{' '}
              <button type="button" className={s.signInLink} onClick={onSignIn}>
                Sign in
              </button>
            </p>
          </form>
        </FormProvider>
      </div>
    </Modal>
  );
}
