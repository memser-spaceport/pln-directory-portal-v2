'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { uniq } from 'lodash';
import clsx from 'clsx';

import { DetailsSection } from '@/components/common/profile/DetailsSection/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { DataIncomplete } from '@/components/page/member-details/DataIncomplete/DataIncomplete';
// `DetailsSection.editView` ships a gradient tint; ContactDetails overrides it to
// the flat pair, and that override is passed back through `classes` exactly as
// ContactDetails passes it — the same way the profile step mounts this reviewer.
import c from '@/components/page/member-details/ContactDetails/ContactDetails.module.scss';

// The prototypes' settled mark for a field only the PL team can see. Same
// component the profile step puts on this same question — the promise does not
// change because the person asking has no account yet.
import { PlTeamOnlyPill } from '../profile-shared/PlTeamOnlyPill';
// The product's `(Optional)` mark, from `SignupWizard`. Shared for the same
// reason the pill beside it is: three surfaces offer this card.
import { OptionalMark } from '../profile-shared/OptionalMark';
// Bringing a document instead of typing five fields. The same importer the
// profile step mounts — see the note on `showCvOffer` for why this surface wants
// it more than that one does.
import { ExperienceImportPanel } from '../profile-shared/ExperienceImport/ExperienceImportPanel';
import { ExperienceImportReview } from '../profile-shared/ExperienceImport/ExperienceImportReview';
import type { ImportSelection, ParsedProfile } from '../profile-shared/ExperienceImport/types';

import { AccountFields, type AccountFormData } from './accountFields';
import { JobSearchStatusInput } from './JobProfilePane';
import { formatExperienceDates, type JobSearchStatus, type MemberProfile } from './viewerState';
// The profile step's stylesheet, for the two classes this pane shares with it:
// the amber incomplete strip and the dimmed body under it. Imported rather than
// restated so the one required question looks identical in both steps.
import d from './JobProfilePane.module.scss';
// The flow's shared chrome, for `.lede` — the sentence every step opens with.
import fd from './JobApplyFlowDrawer.module.scss';

interface JobAccountPaneProps {
  /** The role the flow is applying for. Always present — the only way to reach
   *  this pane is through a job — so the lede can say what the account is for. */
  roleTitle: string;
  /** The other half of `isProfileComplete`, and the one answer this pane holds
   *  outside the account form: it belongs to the profile draft the flow already
   *  owns, not to the account record. */
  jobSearchStatus: JobSearchStatus | '';
  onJobSearchStatusChange: (next: JobSearchStatus) => void;
  /** The flow's profile draft. The CV fills more than the account form has
   *  fields for — skills, a location and a work history — and those belong here,
   *  travelling with the application like a member's would. */
  draft: MemberProfile;
  setDraft: (next: (prev: MemberProfile) => MemberProfile) => void;
}

/** Prototype-local keys for imported rows, mirroring `JobProfilePane`'s. React
 *  keys only, never persisted — production mints uids server-side. */
let uidSeq = 0;
const mintUid = (prefix: string): string => `${prefix}-acct-${(uidSeq += 1)}`;

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
 * is `role && jobSearchStatus`, and step 3 must not send an application from an
 * incomplete profile — that is the whole reason the gate exists. A member passes
 * it across a stack of cards; a stranger passes it in one pane. It is also the
 * one answer nothing else in this flow collects, so deferring it would mean
 * asking for it after the application had already gone.
 *
 * **Two stores, deliberately.** The four text fields live in the flow drawer's
 * react-hook-form (lifted, so stepping to the letter and back doesn't cost what
 * was typed); the status lives on the profile draft, because that is what it is
 * — a profile field the account form has no claim on. Each store owns what it
 * owns, and the drawer merges them when the press is made.
 */
export function JobAccountPane({
  roleTitle,
  jobSearchStatus,
  onJobSearchStatusChange,
  draft,
  setDraft,
}: JobAccountPaneProps) {
  const hasStatus = jobSearchStatus !== '';

  /* The account form the drawer owns — reached rather than re-created, because a
     CV has to write into the same fields the person could type into. */
  const { getValues, setValue } = useFormContext<AccountFormData>();

  /* The document's proposal, while it is being reviewed. Local: a parse nobody
     has accepted yet is not worth carrying across a step change, and everything
     it *becomes* lands in the two stores above, which are lifted. */
  const [parsed, setParsed] = useState<ParsedProfile | null>(null);
  /* Whether a document has already filled this in. */
  const [imported, setImported] = useState(false);

  /**
   * Whether to offer the CV at all.
   *
   * **Not tied to whether the fields are empty**, which is how the profile step
   * decides (`profileIsBlank`). That rule is right there and wrong here, and the
   * difference is the input model: on the profile step the role is typed inside
   * a card editor and committed with a Save, so the offer disappears on a
   * deliberate act. Here the fields are live inputs — the same rule would snatch
   * the card away on the first keystroke of an email address.
   *
   * So the offer stands until it has been *used*. Someone who starts typing and
   * then remembers they have a CV still has it; someone who has imported doesn't
   * get invited to import again over the top of it.
   */
  const showCvOffer = !imported;

  /**
   * What the document filled in.
   *
   * The rule is the importer's own and the same one the profile step applies:
   * fill a blank, never overwrite an answer given by hand. `setValue` writes
   * into the drawer's react-hook-form so the fields show what arrived and the
   * schema validates it like anything typed.
   *
   * **Name and email are the point of doing this here.** The review card asks
   * for them only when the host says it hasn't got them (`currentName` /
   * `currentEmail`) — on the profile step, which runs signed in, it never does.
   * This is the one surface in the product where those two are genuinely
   * missing, which is exactly the case that contract was written for.
   *
   * `company` is deliberately not filled. The account form's company is a select
   * of *network teams*, and a CV's employer is a free-text string that usually
   * isn't one — writing "Meridian Labs" into a picker that can only hold
   * Protocol Labs teams would be inventing a membership. The experience rows
   * keep the real employer; the select stays the person's own answer.
   */
  const applyImport = (selection: ImportSelection) => {
    const current = getValues();
    if (!current.email?.trim() && selection.email.trim()) setValue('email', selection.email.trim());
    if (!current.name?.trim() && selection.name.trim()) setValue('name', selection.name.trim());
    if (!current.role?.trim() && selection.role.trim()) setValue('role', selection.role.trim());

    setDraft((prev) => ({
      ...prev,
      role: prev.role.trim() === '' ? selection.role.trim() : prev.role,
      location: prev.location.trim() === '' ? selection.location.trim() : prev.location,
      skills: uniq([...prev.skills, ...selection.skills]),
      experiences: [
        ...prev.experiences,
        ...selection.experiences.map((entry) => ({
          uid: mintUid('exp'),
          title: entry.title,
          company: entry.company,
          description: entry.description,
          startDate: entry.startDate,
          endDate: entry.isCurrent ? null : entry.endDate,
          isCurrent: entry.isCurrent,
          location: entry.location,
        })),
      ],
    }));
    setParsed(null);
    setImported(true);
  };

  return (
    <>
      {/* Says what these answers *are*, in the slot and the voice the other two
          steps use.

          It briefly also said when the account opens ("...open your LabOS
          account...") and that was one sentence too many: the footer says
          exactly that, four inches below and at the moment it matters. Two
          statements of one fact in one pane is how a lede stops being read. This
          one takes the half the footer can't carry — that the details are not
          paperwork, they are the profile a hiring team reads. */}
      <p className={fd.lede}>These details become your profile, and go to {roleTitle} with your note.</p>

      {/* **Bring a document instead of typing.** Above the fields it fills, for
          the reason the profile step puts it above its required cards: a control
          that answers the question below it belongs above it.

          This surface has the strongest case for it in the product. On the
          profile step a CV fills the required role and an optional history. Here
          it fills the *name, the email and the role* — three of the four things
          this step cannot proceed without — because the review card asks for
          name and email whenever the host hasn't got them, and a host with no
          account hasn't. It is also the moment a person most reliably has a CV
          to hand: they are applying for a job.

          What it cannot fill is honest and small: the company (a picker of
          network teams, not free text), the LinkedIn URL (the importer
          deliberately doesn't take social links — see `ParsedProfile`), and the
          job search status, which no document can answer because only we ask
          it. */}
      {showCvOffer && (
        <DetailsSection
          editView={!!parsed}
          classes={parsed ? { root: c.root, editView: `${c.editView} ${d.editCard}` } : undefined}
        >
          {parsed ? (
            <ExperienceImportReview
              parsed={parsed}
              /* Empty, and that is the whole point of mounting it here — the card
                 offers to fill both. The profile step passes real values because
                 it only ever runs signed in. */
              currentName=""
              currentEmail=""
              currentRole={getValues('role') ?? ''}
              currentLocation={draft.location}
              currentSkills={draft.skills}
              currentExperiences={draft.experiences}
              formatDates={formatExperienceDates}
              bodyClassName={d.formBody}
              onClose={() => setParsed(null)}
              onSubmit={applyImport}
            />
          ) : (
            <>
              {/* Marked optional, and the heading is an offer rather than an
                  instruction. It read "Start with your CV", which presumed both
                  that you have one and that it is where you begin — on a step
                  whose other two cards are genuinely required, that made a
                  shortcut look like a gate. */}
              <DetailsSectionHeader
                title={
                  <>
                    You can upload your CV
                    <OptionalMark />
                  </>
                }
              />
              {/* Names the work avoided, not the work done — the same line the
                  profile step uses, with the two fields that are only missing
                  here added to the list. */}
              <p className={d.cvFirstNote}>
                We&apos;ll fill in your name, email, role and experience from it, so you don&apos;t have to type it all
                in.
              </p>
              <ExperienceImportPanel
                entry="direct"
                /* The profile step says the file "isn't sent with your
                   applications", which is true there and would be a half-truth
                   here: this step *is* an application. The distinction that
                   matters is the one this says — we read it to fill the form,
                   the document itself does not travel. */
                privacyNote="We read the file to fill in the form. The document itself isn't sent to the team."
                onParsed={setParsed}
                onAddManually={() => setImported(true)}
              />
            </>
          )}
        </DetailsSection>
      )}

      <DetailsSection>
        {/* "Your account", not "Your details" — which is what the rail directly
            above already says, and a card header repeating its own step label
            names nothing. The rail names the position; this names what the four
            fields under it actually make, which is also the one thing that
            distinguishes them from the card below (a profile answer, not an
            account one). */}
        <DetailsSectionHeader title="Your account" />
        {/* Email → name → LinkedIn → role @ company, from `accountFields`. The
            same group, the same schema and the same order the sign-up modal
            shows on the board's other door. */}
        <AccountFields />
      </DetailsSection>

      {/* The second required answer, wearing the exact treatment the profile
          step gives it: the amber strip when unanswered, the PL-team-only pill,
          the same radio group. A stranger and a member are answering one
          question, so they should be looking at one field. */}
      <DetailsSection missingData={!hasStatus}>
        {!hasStatus && (
          <DataIncomplete className={d.incompleteStrip}>
            An answer here is required to apply to {roleTitle}.
          </DataIncomplete>
        )}
        <div className={clsx({ [d.missingBody]: !hasStatus })}>
          <DetailsSectionHeader title="Job search status">
            <PlTeamOnlyPill />
          </DetailsSectionHeader>
          <JobSearchStatusInput value={jobSearchStatus} onChange={onJobSearchStatusChange} />
        </div>
      </DetailsSection>
    </>
  );
}
