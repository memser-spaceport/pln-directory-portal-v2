'use client';

import { useEffect, useState } from 'react';
import { FormProvider, useForm, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import type { IJobRole } from '@/types/jobs.types';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';
import {
  AccountFields,
  accountSchema,
  toAccountDetails,
  EMPTY_ACCOUNT_FORM,
  type AccountDetails,
  type AccountFormData,
} from './accountFields';
// Demo Day's profile-drawer chrome, for the mobile page's `← Back` header — the
// same stylesheet `JobProfileDrawer` wears one step later in this flow, so a
// phone user meets one header rather than two designs of one.
import drawer from '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer.module.scss';

import s from './JobSignUpModal.module.scss';

// `EditInvestorProfileDrawer`'s own glyph, copied rather than imported from
// `JobProfileDrawer` (which exports the same copy for the same reason). That
// module is `dynamic({ ssr: false })` in the controller precisely so a
// logged-out visitor never downloads it, and a static import from here would
// pull it into the sign-up chunk and undo the split.
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.5 9.99998C17.5 10.1657 17.4342 10.3247 17.3169 10.4419C17.1997 10.5591 17.0408 10.625 16.875 10.625H4.6336L9.19219 15.1828C9.25026 15.2409 9.29632 15.3098 9.32775 15.3857C9.35918 15.4615 9.37535 15.5429 9.37535 15.625C9.37535 15.7071 9.35918 15.7884 9.32775 15.8643C9.29632 15.9402 9.25026 16.0091 9.19219 16.0672C9.13412 16.1252 9.06518 16.1713 8.98931 16.2027C8.91344 16.2342 8.83213 16.2503 8.75 16.2503C8.66788 16.2503 8.58656 16.2342 8.51069 16.2027C8.43482 16.1713 8.36588 16.1252 8.30782 16.0672L2.68282 10.4422C2.62471 10.3841 2.57861 10.3152 2.54715 10.2393C2.5157 10.1634 2.49951 10.0821 2.49951 9.99998C2.49951 9.91785 2.5157 9.83652 2.54715 9.76064C2.57861 9.68477 2.62471 9.61584 2.68282 9.55779L8.30782 3.93279C8.42509 3.81552 8.58415 3.74963 8.75 3.74963C8.91586 3.74963 9.07492 3.81552 9.19219 3.93279C9.30947 4.05007 9.37535 4.20913 9.37535 4.37498C9.37535 4.54083 9.30947 4.69989 9.19219 4.81717L4.6336 9.37498H16.875C17.0408 9.37498 17.1997 9.44083 17.3169 9.55804C17.4342 9.67525 17.5 9.83422 17.5 9.99998Z"
      fill="currentColor"
    />
  </svg>
);

/**
 * What this form yields. Defined by `accountFields`, which owns the fields that
 * produce it; the name is kept here because this is where the flow's caller
 * (`JobApplyFlowController`) has always imported it from.
 */
export type JobSignUpDetails = AccountDetails;

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

/* (The form type, `EMPTY_FORM`, the yup schema, `OptionalMark`, the
    personal-domain list and its note all lived here. They moved to
    `./accountFields`, which now owns the fields themselves — see its header for
    why, and note that everything below this line is chrome: the dialog, its
    copy, its mobile page and its two doors.) */

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
  const methods = useForm<AccountFormData>({
    defaultValues: EMPTY_ACCOUNT_FORM,
    resolver: yupResolver(accountSchema) as Resolver<AccountFormData>,
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
      reset(EMPTY_ACCOUNT_FORM);
    }
  }, [open, reset]);

  const handleClose = () => {
    setServerError(null);
    onClose();
  };

  const onSubmit = async (data: AccountFormData) => {
    setServerError(null);
    const result = await onSignUp(toAccountDetails(data));
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
    /* `lockScroll` never showed while this was a card — the overlay covered the
       board and nobody scrolled past it — but a full-height page on a phone is a
       scroll container inside another scroll container, and flicking past the
       end of the form would drift the board underneath. */
    <Modal
      isOpen={open}
      onClose={handleClose}
      overlayClassname={s.overlay}
      closeOnBackdropClick={false}
      closeOnEscape
      lockScroll
      className={s.modal}
    >
      <button type="button" className={s.closeButton} onClick={handleClose} aria-label="Close">
        <CloseIcon />
      </button>

      {/* The page's header, below 960 only. Above it this is display:none and
          the floating ✕ above takes over. */}
      <div className={`${drawer.drawerHeader} ${s.mobileHeader}`}>
        <div className={drawer.breadcrumbs}>
          <button type="button" className={drawer.backButton} onClick={handleClose}>
            <BackIcon />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className={`${s.content} ${s.pageBody}`}>
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
            <AccountFields />

            <div className={s.bottomText}>
              {/* One line, and only the part nothing else on the card says.
                  Nothing is sent to any team by this press, and no application
                  exists yet — approval is what unlocks applying, and the
                  sentence says so.

                  This ran to two sentences and four rendered lines, which pushed
                  "Already have an account? Sign in" off the bottom of any window
                  shorter than ~730px — hiding the escape from precisely the
                  people who need it, since someone who already has an account
                  has no use for the form above it. What it lost was duplication:
                  "Submitting this creates your LabOS account" was the third
                  telling, after the subtitle and the submit button.

                  **Deliberately not the prototype's line.** The prototype says
                  "you can browse and apply while that runs", which is true only
                  after the flow change that lets a new account apply the moment
                  it exists. Here approval still gates applying — that is what
                  the 403 in `job-applications.service.ts` is for — so copy
                  promising otherwise would describe a wall the board has not
                  removed. */}
              <p className={s.body}>
                The PL team reviews new accounts first — you can browse every role while you wait, and applying opens up
                once you&apos;re approved.
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

            {/* The dock: the actions and the sign-in escape, sticky together on
                the mobile page. On the card it is `display: contents`, so both
                go back to being direct children of the form and lay out exactly
                as they did before this wrapper existed. See `.actionsDock`. */}
            <div className={s.actionsDock}>
              <div className={s.footer}>
                {/* Card only — on the page the `← Back` header is the way out.
                    See `.cancelButton`. */}
                <Button
                  type="button"
                  size="m"
                  variant="secondary"
                  style="border"
                  className={s.cancelButton}
                  onClick={handleClose}
                >
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
            </div>
          </form>
        </FormProvider>
      </div>
    </Modal>
  );
}
