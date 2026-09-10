'use client';

import clsx from 'clsx';

import { DetailsSection } from '@/components/common/profile/DetailsSection/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { DataIncomplete } from '@/components/page/member-details/DataIncomplete/DataIncomplete';

// The prototypes' settled mark for a field only the PL team can see. Same
// component the profile step puts on this same question — the promise does not
// change because the person asking has no account yet.
import { PlTeamOnlyPill } from '../profile-shared/PlTeamOnlyPill';
/* (The CV importer was imported here — `ExperienceImportPanel`, its review card,
    the `ImportSelection`/`ParsedProfile` types, `OptionalMark`, `formatExperienceDates`,
    ContactDetails' stylesheet and `uniq` for merging skills. The offer is gone from
    this pane, so the imports went with it. The importer itself is untouched: the
    profile step and the onboarding page still mount it.) */

import { AccountFields } from './accountFields';
import { JobSearchStatusInput } from './JobProfilePane';
import type { JobSearchStatus } from './viewerState';
// The sign-up modal's `.signInLink` — the board's other door has carried this
// exact escape since it existed, and the two should not disagree about what a
// sign-in link looks like. Only its *placement* differs here; see `.stepIntro`.
import su from './JobSignUpModal.module.scss';
// This pane's own two classes, both on the sign-in escape. Everything else it
// wears is borrowed from the profile step or the flow's chrome. (It held a third,
// `.orRule`, while the CV card stood above the form.)
import v from './JobAccountPane.module.scss';
// The profile step's stylesheet, for the two classes this pane shares with it:
// the amber incomplete strip and the dimmed body under it. Imported rather than
// restated so the one required question looks identical in both steps.
import d from './JobProfilePane.module.scss';
// The flow's shared chrome, for `.lede` — the sentence every step opens with.
import fd from './JobApplyFlowDrawer.module.scss';

interface JobAccountPaneProps {
  /* (`roleTitle` was a prop: the role the flow is applying for, for the lede and
      then for the amber strip under the status card. Both stopped naming it — the
      lede is gone and the strip now says "Required to continue." — and the pane
      has no other line that mentions the role. The drawer's own footer names it,
      which is where a step's subject belongs when the step is a form.) */
  /** The other half of `isProfileComplete`, and the one answer this pane holds
   *  outside the account form: it belongs to the profile draft the flow already
   *  owns, not to the account record. */
  jobSearchStatus: JobSearchStatus | '';
  onJobSearchStatusChange: (next: JobSearchStatus) => void;
  /** The escape at the top of the pane, for someone who already has an account.
   *  The board signs them in and leaves the flow standing on the same job and
   *  the same step — which then renders `JobProfilePane` instead of this. */
  onSignIn: () => void;
  /* (`draft` and `setDraft` were props here, and `uidSeq`/`mintUid` minted keys for
      the rows a CV added. Only the importer read or wrote the draft from this pane —
      the one profile answer it still collects travels as `jobSearchStatus` — so both
      props and the uid counter went with the offer.) */
}

/**
 * Step 2, for someone with no account: the details that open one.
 *
 * **What this replaced.** `JobSignUpModal`, opened *on top of* the flow drawer
 * by an `onRequireAccount` call from step 1's footer. The flow had just been
 * unified into one container and then re-forked for the one visitor least
 * committed to it — and the fork hid the rail, which is the thing that says how
 * much further there is, at exactly the moment a stranger most wants to know.
 * A modal over a full-screen page on mobile is also just a worse page.
 *
 * So the account is a step now, in the position a member's profile occupies.
 * The rail keeps three places for everyone; only this position's label changes,
 * because a label should name its own pane and a stranger has no profile yet:
 *
 *     signed in   Review job → Your profile → Application
 *     logged out  Review job → Your details → Application
 *
 * **Nothing is created here.** The answers go into the flow drawer's state and
 * the account is opened by the *final* `Apply`, together with the application —
 * one press, one act, the shape Demo Day's investor application already uses
 * (`POST …/investor-application` returns `{ memberUid, isNewMember }`). The
 * consequence worth having is that abandoning at step 3 leaves no orphan
 * account, which the old modal could not promise: it registered you the moment
 * you pressed its own submit, and then the role you came for was dropped.
 *
 * **Why the job search status is here and not left for later.** `isProfileComplete`
 * is the status and nothing else — the current role was the other half of that
 * rule and is not required any more — and step 3 must not send an application
 * from an incomplete profile, which is the whole reason the gate exists. A
 * member passes it on one card; a stranger passes it in this pane. It is also the
 * one answer nothing else in this flow collects, so deferring it would mean
 * asking for it after the application had already gone.
 *
 * **Two stores, deliberately.** The four text fields live in the flow drawer's
 * react-hook-form (lifted, so stepping to the letter and back doesn't cost what
 * was typed); the status lives on the profile draft, because that is what it is
 * — a profile field the account form has no claim on. Each store owns what it
 * owns, and the drawer merges them when the press is made.
 */
export function JobAccountPane({ jobSearchStatus, onJobSearchStatusChange, onSignIn }: JobAccountPaneProps) {
  const hasStatus = jobSearchStatus !== '';

  /* (`parsed`, `imported`, `showCvOffer` and `applyImport` stood here, along with
      the `useFormContext` reach into the drawer's account form. They existed only to
      hold a CV's proposal and write it into the fields — with no offer on this pane
      there is nothing to parse, nothing to merge and nothing to hide once it has been
      used. The pane reads no form state of its own now; the fields are `AccountFields`'
      business and the status is a prop.) */

  return (
    <>
      {/* This pane opens on its title and nothing else. The other two steps open
          on a `.lede`, and this one did too — "These details become your
          profile, and go to <role> with your note." It has been removed, and
          what removed it was the title added directly above it: "Fill in your
          profile" says the first half, and the second half was never this
          sentence's alone to carry. The role is still named on the step without
          it — the footer, beside the button that acts on it — and it says it at
          the moment it bears on a decision, where the lede said it to nobody in
          particular on the way past. (The amber strip under the status card
          named the role too, and no longer does; see the note there.) */}
      <div className={fd.stepIntro}>
        {/* The step's name. Every other stop in this flow opens with one — step
            1 with the role's own masthead — and this one opened on a grey
            sentence, which is why it read as the only pane with no top to it.

            It says "profile", where the rail two inches above says "Your
            details". Not a slip: the rail names the *position* for someone who
            has no account yet and no profile to speak of, and this names what
            the answers under it are about to become. */}
        <h2 className={fd.stepTitle}>Fill in your profile</h2>

        {/* **The escape, and why it is at the top here.**
            This pane only ever renders for a visitor the board believes is
            logged out — so it is also what a *returning member* meets if their
            session has lapsed, and for them every field under it is a second
            copy of an account they already have.

            `JobSignUpModal` carries the same sentence below its actions and
            argues for it: someone who has no account should meet the first
            input, not a fork. That holds there, where the whole form is four
            fields and the escape is in the same glance as Submit. It does not
            hold here. This step is five fields and a radio group deep inside a
            drawer whose footer button says `Continue to apply`, so "under the
            form" is past all of the work the escape exists to save — findable
            only by someone who no longer needs it. (It also named a CV drop
            above the fields; that offer is gone.)

            Still a link and not a button: it is the rarer path, and a second
            control at the top of a step would price itself against the step
            (lesson: an exception must not read as a peer of the main action).

            **Its 12px rank outlived the reason for it, and is kept anyway.** It
            was stepped down from 14 to tell it apart from the lede, which used
            to sit between it and the title — two sentences in one voice eight
            pixels apart read as a single paragraph. The lede is gone, so that
            job is done; but the rank is right on its own terms now, because the
            line it has to be told apart from is a 20px title, and an offer to
            leave should not answer a heading at the same weight. */}
        <p className={v.signInEscape}>
          Already a member?{' '}
          <button type="button" className={clsx(su.signInLink, v.signInEscapeLink)} onClick={onSignIn}>
            Sign in
          </button>
        </p>
      </div>

      {/* (A CV card stood here, above the fields: "You can upload your CV", the note
          under it, `ExperienceImportPanel` to drop the file and `ExperienceImportReview`
          to confirm what it found — then an `or fill it in yourself` rule naming the
          form below as the fallback. The whole offer is gone from the logged-out step;
          a stranger meets the two cards below and types. The importer is unchanged and
          still mounted by the member's profile step and the onboarding page, which is
          where a CV now goes. The `or` rule went with it: with one path there is no
          "or" to name.) */}

      <DetailsSection classes={{ root: fd.cardEdge }}>
        {/* "Your account", not "Your details" — which is what the rail directly
            above already says, and a card header repeating its own step label
            names nothing. The rail names the position; this names what the four
            fields under it actually make, which is also the one thing that
            distinguishes them from the card below (a profile answer, not an
            account one). */}
        <DetailsSectionHeader title="Your account" />
        {/* Email → name → LinkedIn → role @ company, from `accountFields`. The
            same group, the same schema and the same order the sign-up modal
            shows on the board's other door.

            `grid` pairs the two short ones onto one line. Same fields, same
            order, a layout prop rather than a second copy of the group — this
            pane is three cards tall and the modal is a 440px dialog with no
            height to save, which is the whole of the difference. */}
        <AccountFields layout="grid" />
      </DetailsSection>

      {/* The one required answer, wearing the exact treatment the profile
          step gives it: the amber strip when unanswered, the PL-team-only pill,
          the same radio group. A stranger and a member are answering one
          question, so they should be looking at one field.

          **The strip's sentence is the one thing that differs, and on purpose.**
          The member's step says "An answer here is required to apply to
          <role>" — it can, because a member reached that card from a board full
          of roles and naming which one is worth the words. This pane is the
          logged-out step: the person is three cards into a form that makes an
          account, the footer button says `Continue to apply` and names the role
          right beside it, and the strip sits one inch above it. Repeating the
          role there says nothing the button doesn't, in more words, in an amber
          strip whose whole job is to be read in a glance. So it states the only
          thing it knows that the button doesn't — that this field is what's
          standing in the way. */}
      <DetailsSection missingData={!hasStatus} classes={{ root: hasStatus ? fd.cardEdge : undefined }}>
        {!hasStatus && <DataIncomplete className={d.incompleteStrip}>Required to continue.</DataIncomplete>}
        <div className={clsx({ [d.missingBody]: !hasStatus })}>
          <DetailsSectionHeader title="Job search status">
            <PlTeamOnlyPill />
          </DetailsSectionHeader>
          {/* The row group, kept after a tile row was tried beside it. Three
              titled tiles across are shorter and read as a decision, and that is
              not enough: a radio down a column is unambiguously *choose one*,
              where a bordered tile has to earn that reading from its neighbours
              — and this is the answer the step cannot proceed without. The two
              cards above already carry the variant's height savings. */}
          <JobSearchStatusInput value={jobSearchStatus} onChange={onJobSearchStatusChange} />
        </div>
      </DetailsSection>
    </>
  );
}

/* (`JobSearchStatusTiles` lived here — the same three options as a row of titled
    tiles, tried against the radio rows behind a `Details step` switch in the
    review band. The rows won; the tiles, the switch and the `variant` prop that
    selected between them are all gone rather than parked behind a control, which
    is how a settled decision gets re-litigated every time someone opens the
    page. The reason the rows won is recorded where the rows are rendered.) */
