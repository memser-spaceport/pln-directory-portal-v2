'use client';

import { DetailsSection } from '@/components/common/profile/DetailsSection/DetailsSection';

import { AccountFields } from '@/components/page/jobs/JobSignUpModal/accountFields';
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
 * **One card, where the prototype has two.** It splits the account fields from
 * the job search status, and gives the status the amber "required to apply"
 * treatment the profile step gives it. That split earns its keep when the status
 * is the one required answer among optional ones. Here it is one of four
 * required fields on a single schema — `accountSchema` refuses to submit without
 * it exactly as it refuses without an email — so singling it out with an amber
 * strip would promise a distinction the form does not make.
 */
export function JobAccountPane({ onSignIn, serverError }: JobAccountPaneProps) {
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

      {/* No card header, and that is the whole reason there is one card.
          The profile step titles its sections because it has several and you
          need to know which is which. Here there is one, the rail two inches
          above already calls this position "Your details", and the heading
          directly above says what filling it in does — so a header could only
          have been a third telling. (It was "Your details" for one commit and
          rendered the same two words twice within 40px.) */}
      <DetailsSection>
        <AccountFields />
      </DetailsSection>

      {/* The role is named by the footer beside the button and by the masthead
          one step back — both at the moment it bears on a decision — which is
          why this pane takes no role prop and opens on no lede of its own. */}
      {serverError && <p className={su.serverError}>{serverError}</p>}
    </>
  );
}
