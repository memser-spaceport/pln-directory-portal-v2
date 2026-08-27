'use client';

import clsx from 'clsx';

import s from './ApplyFlowSteps.module.scss';

/**
 * The apply flow's position rail: **Review job → Your profile → Application**.
 *
 * **Transcribed from `pl-design-system/components/Steps`**, which is the design
 * system's own horizontal stepper and — until this — had no consumer anywhere in
 * `app/`, `components/`, `prototypes/` or `stories/`. It is not imported because
 * `tsconfig.json` lists `pl-design-system` in `exclude`, the same wall that keeps
 * `AvatarStack` out of the apply pane's facepile. So the rules are copied
 * verbatim into the stylesheet beside this file — sizes, weights, the 200ms
 * transition, the connector's `top: -12px` nudge — with only the colour layer
 * translated to `var(--token, #fallback)` pairs, because portal-v2 does not load
 * the design-system variable sheet and the source writes bare tokens that would
 * resolve to nothing here (prototypes/CLAUDE.md §3, §6).
 *
 * Same relationship the deleted `PendingApprovalSteps` had to
 * `AppliedInvestorSteps`: the markup is the source's, so the two stay diffable,
 * and the day this app adopts the token layer the fallbacks fall away and the DS
 * component is what renders.
 *
 * **Why the product's existing stepper is the wrong one here.** The repo's most
 * copied pattern is the *vertical* dot-and-rail stepper — `AppliedInvestorSteps`,
 * `InvestorStepper` — and it answers a different
 * question. Those report the status of a process running on someone else's clock
 * ("we are reviewing your account"); you read them and wait. This one is a
 * position in a sequence *you* are walking, where every step is a screen you
 * arrive at and leave. Numbered circles say "three of these, you are on the
 * second"; dots on a rail say "here is what is happening to you".
 *
 * **Three statuses, and no fourth for "blocked".** There is nothing left to
 * block: approval stopped gating applying, so a pending member walks the same
 * three steps as anyone else. The argument against a refused state stands
 * anyway, and is worth keeping for whatever tries to add one next — a step that
 * is merely *not yet* and a step that is *waiting on someone else* look
 * identical from here, and the difference is a sentence, not a colour. The
 * footer says it in words.
 */

export type ApplyStepStatus = 'completed' | 'current' | 'upcoming';

export interface ApplyFlowStep {
  id: string;
  title: string;
  status: ApplyStepStatus;
  /** Whether pressing it goes anywhere. A step you have finished is navigable;
   *  one you have not reached is not, and a rail whose every item looks pressable
   *  would be offering a way past the requirement the flow exists to collect. */
  reachable: boolean;
}

/** How each status is said out loud. Not the status token itself: the source
 *  reads "upcoming" to a screen reader, which is the name of a CSS class rather
 *  than a thing anyone says about a form. */
const STATUS_WORD: Record<ApplyStepStatus, string> = {
  completed: 'done',
  current: 'current step',
  upcoming: 'not started',
};

/** Transcribed from `Steps.tsx`, verbatim. */
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <polyline
        points="2.5,7 5.5,10 11.5,4"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ApplyFlowStepsProps {
  steps: ApplyFlowStep[];
  /** Jump to a finished step. The rail is the flow's only *backwards* control
   *  besides the header's Back — the footer only ever goes forward. */
  onSelect: (id: string) => void;
}

export function ApplyFlowSteps({ steps, onSelect }: ApplyFlowStepsProps) {
  /* How far along the rail the person actually is. The connectors are painted
     from this rather than from the step on their left, which is the source's own
     rule (`index < currentStep`) and matters here in a way it never did there.
     A pre-checked profile step is `completed` on the very first frame, so
     "the step before me is completed" would paint the line into the *unreached*
     Application blue — the rail claiming you had walked a stretch you had not.
     A connector is about the ground between two steps, not about either one. */
  const currentIndex = steps.findIndex((step) => step.status === 'current');

  return (
    /* `role="list"` and `role="listitem"` are the source's. The source spreads
       arbitrary props onto the root; nothing here needs that, so it's dropped
       rather than plumbed through unused. */
    <div className={clsx(s.root, s.horizontal)} role="list">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const connectorCompleted = currentIndex >= 0 && index < currentIndex;

        /* A button only when it goes somewhere. The source renders a plain div
           for every circle because its steps are decorative; here a finished step
           is a real destination — it is how `Edit profile` gets back to the
           profile, and how someone re-reads the posting without losing a letter —
           so the reachable ones are buttons and the rest stay divs. Two elements
           rather than a button with `disabled`, because a disabled control in a
           rail of three reads as something broken rather than as something not
           yet arrived at. */
        /* The whole step said once, for anyone who can't see the rail. The source
           hangs an `aria-label` off the circle `<div>`, which is not announced —
           a bare div takes no accessible name — so the label moves onto the
           button that has one, and the unreachable steps get production's
           `.srOnly` span instead (`NavBar.module.scss`, the same treatment its
           unread dot uses). The visible circle and title are hidden from the
           tree in both cases, or the number and the name would be read twice. */
        const label = `Step ${index + 1} of ${steps.length}: ${step.title}, ${STATUS_WORD[step.status]}`;
        const circle = (
          <span className={clsx(s.circle, s[step.status])} aria-hidden="true">
            {step.status === 'completed' ? <CheckIcon /> : index + 1}
          </span>
        );
        const title = (
          <span className={clsx(s.title, step.status === 'current' && s.current)} aria-hidden="true">
            {step.title}
          </span>
        );

        return (
          <div key={step.id} className={s.step} role="listitem">
            {step.reachable ? (
              <button
                type="button"
                className={clsx(s.stepContent, s.stepButton)}
                onClick={() => onSelect(step.id)}
                aria-label={label}
                aria-current={step.status === 'current' ? 'step' : undefined}
              >
                {circle}
                {title}
              </button>
            ) : (
              <span className={s.stepContent}>
                <span className={s.srOnly}>{label}</span>
                {circle}
                {title}
              </span>
            )}
            {!isLast && <div className={clsx(s.connector, connectorCompleted && s.completed)} aria-hidden="true" />}
          </div>
        );
      })}
    </div>
  );
}
