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
 * work for free: seeing "await approval confirmation" sitting greyed *beyond*
 * the current step is what tells someone the wait is a stage and not a wall.
 * Production reaches the same conclusion at the same fork — Demo Day's applied
 * investor gets `AppliedInvestorSteps`, a three-step stepper, in precisely this
 * in-between.
 *
 * **Horizontal, against the source's vertical.** The rotation costs the
 * transcription its line-for-line diffability with `AppliedInvestorSteps`: the
 * atoms are still the source's — the 20px dot, the check disc, the brand ring,
 * both shadows, the type ranks — but the frame around them is this file's own.
 * What it deliberately does *not* become is a second `ApplyFlowSteps`. The
 * drawer already carries the DS's numbered position rail in its sticky header,
 * and two rails in one viewport wearing the same circles would read as one
 * journey drawn twice. The dot-and-check vocabulary is what says "status of a
 * process on someone else's clock", against the rail's "steps you walk" —
 * the axis used to help tell them apart and no longer does, so the vocabulary
 * carries the difference alone.
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
 * **Transcribed vs imported.** The atoms come from
 * `components/page/demo-day/AppliedInvestorSteps/AppliedInvestorSteps.tsx`
 * rather than by import, because that component is inseparable from
 * `useCurrentUserStore`, the `useMember` react-query hook, `useDemoDayAnalytics`
 * and `useRouter` — none of which a mocked prototype has. `CheckIcon` is
 * transcribed for the same reason. The card chrome around the source's stepper
 * is dropped: the profile drawer already provides a heading, and a second one
 * would announce the same news twice.
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

  /* (The vertical version measured per-step connector heights inline — 52/94,
      derived in a long comment from what each step's text happened to measure —
      because its rail had to span content. Horizontal, the connector spans the
      *column*, so it is pure CSS (`flex: 1` in the indicator row) and the whole
      inline-height mechanism goes.) */
  const steps = [
    {
      id: 0,
      status: 'completed' as StepStatus,
      title: 'Signed up successfully!',
      description: needsIdentityVerification
        ? 'Verify your identity by signing in — verification is what starts the review.'
        : 'Our team will review your account shortly.',
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
    },
    {
      id: 2,
      status: step3Status,
      title: 'Await approval confirmation',
      description: "You'll receive an email once our team approves your account.",
    },
  ];

  return (
    <div className={s.stepper}>
      {steps.map((step, index) => (
        <div key={step.id} className={clsx(s.stepContainer, s[step.status])}>
          {/* The dot and, between columns, the wire to the next one. The wire
              belongs to the ground between two steps, so it is drawn by the
              step on its left and painted brand only when that step is done —
              the same rule the flow rail states at its `connectorCompleted`. */}
          <div className={s.indicatorRow}>
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
              <div className={clsx(s.stepConnector, step.status === 'completed' && s.completed)} />
            )}
          </div>
          <div className={s.stepContent}>
            <div className={s.stepTitle}>{step.title}</div>
            <div className={s.stepDescription}>{step.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
