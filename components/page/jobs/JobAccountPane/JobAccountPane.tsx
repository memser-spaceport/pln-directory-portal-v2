'use client';

import clsx from 'clsx';

import { DetailsSection } from '@/components/common/profile/DetailsSection/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { DataIncomplete } from '@/components/page/member-details/DataIncomplete/DataIncomplete';
import { PlTeamOnlyPill } from '@/components/page/jobs/PlTeamOnlyPill/PlTeamOnlyPill';
import { JobSearchStatusInput } from '@/components/page/jobs/JobSearchStatusInput/JobSearchStatusInput';

import { AccountFields, useJobSearchStatus } from '@/components/page/jobs/JobSignUpModal/accountFields';
// `FormField`'s error line, so a refused answer here reads exactly like a
// refused answer in the card above.
import ff from '@/components/form/FormField/FormField.module.scss';
// The profile step's amber strip and the dimmed body under it. Imported rather
// than restated so the one required answer looks identical in both steps — a
// stranger and a member are answering one question.
import d from '@/components/page/jobs/JobProfileDrawer/JobProfileDrawer.module.scss';
// The sign-up modal's own escape link and refusal line. The board's other door
// has carried both since it existed, and the two should not disagree about what
// a sign-in link or a server error looks like. A stylesheet import pulls no JS,
// so this costs the chunk nothing.
import su from '@/components/page/jobs/JobSignUpModal/JobSignUpModal.module.scss';

import s from './JobAccountPane.module.scss';

interface JobAccountPaneProps {
  /** The escape at the top, for someone who already has an account. */
  onSignIn: () => void;
  /** The server's refusal, when there was one. Rendered under the fields rather
   *  than in the footer: it is about what was typed, so it belongs with it. */
  serverError: string | null;
}

/**
 * Step 2, for a visitor with no account: the details that open one.
 *
 * **What this replaces.** `JobSignUpModal`, opened *on top of* this drawer when
 * a logged-out visitor pressed Apply. The flow had just been unified into one
 * container and was then re-forked for the one visitor least committed to it —
 * and the fork hid the rail, which is the thing that says how much further there
 * is, at exactly the moment a stranger most wants to know. A modal over a
 * full-screen page on mobile is also just a worse page.
 *
 * So the account is a step now, in the position a member's profile occupies.
 * The rail keeps three places for everyone; only this position's label changes,
 * because a label should name its own pane and a stranger has no profile yet:
 *
 *     signed in   Review job → Your profile → Application
 *     logged out  Review job → Your details → Application
 *
 * **The account IS created here**, by the footer's press, and then Privy signs
 * them in and the flow resumes on the role they came for. That is deliberately
 * not the prototype's design, which defers creation to the final Apply so one
 * press does both — a better shape that needs an endpoint able to accept an
 * application from someone with no session. This pass moves the form; the
 * combined write is its own.
 *
 * **Two cards, and the split is not cosmetic.** The account questions make an
 * account; the job search status is a *profile* answer that happens to be asked
 * here, and it is the half that decides whether the account this creates can
 * apply without stopping again. Putting it in its own card is what lets it wear
 * the profile step's amber required treatment — the same treatment, for the same
 * question, so a stranger and a member are looking at one field.
 *
 * Both hosts of `AccountFields` share one schema, so the status is required in
 * the modal too; only the framing differs. See `accountFields.tsx`.
 */
export function JobAccountPane({ onSignIn, serverError }: JobAccountPaneProps) {
  /* Bound to the drawer's account form, same as every field in the card above —
     only the framing is this pane's. The amber card treatment replaces the
     required asterisk the modal puts on the label. */
  const status = useJobSearchStatus();

  return (
    <>
      {/* The step's name. Every other stop in this flow opens with one — step 1
          with the role's own masthead — and a pane that opened on a grey
          sentence would read as the only one with no top to it.

          It says "profile" where the rail two inches above says "Your details".
          Not a slip: the rail names the *position* for someone who has no
          account yet, and this names what the answers under it are about to
          become. */}
      <h2 className={s.title}>Fill in your profile</h2>

      {/* **The escape, and why it is at the top here.**
          This pane only ever renders for a visitor the board believes is logged
          out — so it is also what a *returning member* meets when their session
          has lapsed, and for them every field under it is a second copy of an
          account they already have.

          `JobSignUpModal` carries the same sentence below its actions and argues
          for it: someone who has no account should meet the first input, not a
          fork. That holds there, where the whole form is in one glance with
          Submit. It does not hold here. This step is six fields deep inside a
          drawer whose footer sits below all of them, so "under the form" is past
          all of the work the escape exists to save — findable only by someone
          who no longer needs it.

          Still a link and not a button: it is the rarer path, and a second
          control at the top of a step would price itself against the step. */}
      <p className={s.signInEscape}>
        Already a member?{' '}
        <button type="button" className={su.signInLink} onClick={onSignIn}>
          Sign in
        </button>
      </p>

      {/* "Your account", NOT "Your details" — which is what the rail directly
          above already says, and a card header repeating its own step label
          names nothing. (It was "Your details" for one commit and rendered the
          same two words twice within 40px.) What this names is what the fields
          under it actually make, which is also what distinguishes them from the
          card below: those are account answers, that one is a profile answer. */}
      <DetailsSection>
        <DetailsSectionHeader title="Your account" />
        {/* Two cards tall inside a drawer, so the two short fields pair onto one
            line — the height the modal has no need to save. */}
        <AccountFields layout="grid" />
      </DetailsSection>

      {/* The second required answer, wearing the exact treatment the profile
          step gives it: the amber card when unanswered, the PL-team-only pill,
          the same radio group. A stranger and a member are answering one
          question, so they should be looking at one field.

          Its own card rather than a sixth row in the one above, because it is
          the one answer here that is not about the account — it is the profile
          half of what makes this sign-up able to apply. */}
      <DetailsSection missingData={!status.answered}>
        {!status.answered && <DataIncomplete className={d.incompleteStrip}>Required to continue.</DataIncomplete>}
        <div className={clsx({ [d.missingBody]: !status.answered })}>
          <DetailsSectionHeader title="Job search status">
            <PlTeamOnlyPill />
          </DetailsSectionHeader>
          <JobSearchStatusInput
            name="signup-job-search-status"
            value={status.value}
            onChange={status.onChange}
            hiddenValues={['not-looking']}
          />
          {/* Not a second copy of the strip above, though both are about the
              same missing answer. The strip is a standing state — "this card
              isn't done" — and has been there since the step opened; this
              appears only once someone has *pressed* Create account, and says
              why the press did nothing. Without it the button reads as dead:
              the one control that would have moved is a radio the browser
              cannot scroll to, because it is visually hidden by design. */}
          {status.error && <p className={ff.errorMsg}>{status.error}</p>}
        </div>
      </DetailsSection>

      {/* The role is named by the footer beside the button and by the masthead
          one step back — both at the moment it bears on a decision — which is
          why this pane takes no role prop and opens on no lede of its own. */}
      {serverError && <p className={su.serverError}>{serverError}</p>}
    </>
  );
}
