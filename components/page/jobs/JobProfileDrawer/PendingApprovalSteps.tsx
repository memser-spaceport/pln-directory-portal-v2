'use client';

import clsx from 'clsx';

import s from './PendingApprovalSteps.module.scss';

/**
 * The board's "signed up, waiting on Protocol Labs" state.
 *
 * **What this represents.** A member who has created an account and is sitting
 * between submission and approval. They can browse the board and open any role.
 * What they cannot yet do is apply — an application hands a hiring team a
 * profile the network has vouched for — or fill that profile in, which is what
 * approval unlocks.
 *
 * **Why a stepper and not a banner.** The obvious cheap answer is a one-line
 * strip — "your account is pending review". It states the status and stops
 * there, which leaves the two questions this state actually raises unanswered:
 * *where am I in this*, and *is there anything I can do*. A strip can carry a
 * status or a CTA, but it cannot carry a position, because position is a
 * relation between at least three points — what happened, what's happening,
 * what's next. The stepper draws all three, and drawing them does the reassuring
 * work for free: seeing "await approval confirmation" sitting greyed *below*
 * the current step is what tells someone the wait is a stage and not a wall.
 * Production reaches the same conclusion at the same fork — Demo Day's applied
 * investor gets `AppliedInvestorSteps`, a three-step vertical stepper, in
 * precisely this in-between.
 *
 * **The profile is editable while review is pending, and step 2 says so.** There
 * was an interlude where it wasn't: the profile was locked until approval, so
 * step 2 sat greyed with a sentence naming the dependency. That put the one
 * useful thing a waiting member can do behind the wait itself, and left this
 * stepper describing three stages of nothing happening. Production doesn't do
 * that anywhere — `OneClickVerification` tells a pending member "Complete your
 * profile now to help speed up the review", and Demo Day puts a live
 * "Set Up Investor Profile" button between "submitted" and "await approval" —
 * and it was never the honest reading of this flow either, since a pending
 * account's profile has nothing to be protected from. So step 2 is `current`:
 * it is the person's move, right now, and the only one they have.
 *
 * **It still carries no button.** Not because there's nothing to do, but because
 * this stepper is rendered *inside the profile drawer* — the button would open
 * the thing the person is already looking at. The drawer's own footer Save is
 * the action; the step's job here is to say that finishing this is what the wait
 * is for. (The board behind it does show a real CTA: see `PendingApprovalBanner`,
 * which is where someone who hasn't opened the drawer meets the same ask.)
 *
 * **Transcribed vs imported.** The stepper JSX is transcribed from
 * `components/page/demo-day/AppliedInvestorSteps/AppliedInvestorSteps.tsx`
 * (~L96–161) rather than imported, because that component is inseparable from
 * `useCurrentUserStore`, the `useMember` react-query hook, `useDemoDayAnalytics`
 * and `useRouter` — none of which a mocked prototype has. Its stylesheet is
 * copied into `PendingApprovalSteps.module.scss` with only the colour layer
 * translated to token/fallback pairs; see that file's header. `CheckIcon` is
 * transcribed for the same reason (the job-board's `icons.tsx` has no check, and
 * this component may not touch it). The card chrome around the stepper —
 * `.stepperCard`, its circled checkbox icon, its heading — is dropped: the
 * profile drawer already provides a heading, and a second one would announce the
 * same news twice.
 */

/** Transcribed from `AppliedInvestorSteps`. 16px box, drawn 10px by the sheet. */
const CheckIcon = () => (
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

type StepStatus = 'completed' | 'current' | 'pending';

interface PendingApprovalStepsProps {
  /**
   * rbac PENDING (identity not yet verified) rather than VERIFIED (under
   * review). Both wait on the same approval, but for a PENDING member step 1's
   * "signed up successfully" isn't the whole job — verification is what starts
   * the review, and the description says so.
   */
  needsIdentityVerification?: boolean;
}

export function PendingApprovalSteps({ needsIdentityVerification = false }: PendingApprovalStepsProps) {
  /* Step 2 is 'current' — completing the profile is the person's move and it is
     available now. Step 3 stays 'pending': the approval itself is on the PL
     team's clock, and marking it current would claim the wait is theirs to end. */
  const step2Status: StepStatus = 'current';
  const step3Status: StepStatus = 'pending';

  /* Connector heights are per-step inline pixel values, the same mechanism
     production uses (52 / 116 / 52 there). They are not decorative: the rail is
     the only thing setting the gap between steps, since `.stepContent`'s
     `padding-bottom` never applies (see the stylesheet).

     Measured in the browser against this component's real content, at the
     322px the stylesheet caps the column to — which leaves a 286px text column
     after the 20px indicator and the 16px gap:

       title 20 + gap 4 + description 18 + its 8px margin        = 50px
       …+ gap 4 + the CTA (8 + 20 + 8, plus 1px borders = 38)    = 92px

     Production runs its connector past the content it spans rather than flush
     to it, and that overhang is the entire gap between steps (`.stepContent`'s
     `padding-bottom` never lands — see the stylesheet). Step 1 keeps
     production's 52 against a 50px step, i.e. 26px of overhang once the 20px
     dot and the connector's own 4px top margin are counted; 94 gives step 2's
     92px exactly the same 26. Production's equivalent step runs 30, because its
     description wraps to two lines and its number was chosen for that content —
     matching the overhang rather than the literal number is what keeps this
     rail even.

     Step 2's height has to follow its own CTA: when `profileComplete` the
     button is gone and the step measures like step 1. */
  const step1ConnectorHeight = 52;
  /* No CTA left on step 2, so it measures like step 1 and takes the same 52. */
  const step2ConnectorHeight = 52;

  const steps = [
    {
      id: 0,
      status: 'completed' as StepStatus,
      title: 'Signed up successfully!',
      description: needsIdentityVerification
        ? 'Verify your identity by signing in — verification is what starts the review.'
        : 'Our team will review your account shortly.',
      height: step1ConnectorHeight,
      children: undefined as React.ReactNode,
    },
    {
      id: 1,
      status: step2Status,
      title: 'Complete your profile',
      /* No CTA, because this stepper renders inside the drawer the CTA would
         open — see the note at the top of the file. The description carries the
         reason to do it now instead: the review is running either way, and a
         profile finished before it lands is one that can apply the moment it
         does. */
      description: 'You can do this while you wait — everything you save here is kept.',
      height: step2ConnectorHeight,
      children: undefined as React.ReactNode,
    },
    {
      id: 2,
      status: step3Status,
      title: 'Await approval confirmation',
      description: "You'll receive an email once our team approves your account.",
      /* Never read: the last step draws no connector. Kept so the three entries
         stay the same shape, as production keeps its trailing 52. */
      height: 52,
      children: undefined as React.ReactNode,
    },
  ];

  return (
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
  );
}
