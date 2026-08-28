'use client';

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { uniq } from 'lodash';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

// (`Drawer` and `Button` are gone: this file used to BE the drawer and used to
//  own the footer that ended it. `JobApplyFlowDrawer` renders both now — one
//  drawer and one footer for all three steps of the flow.)
import { TagsList } from '@/components/common/profile/TagsList';
import { EditButton } from '@/components/common/profile/EditButton';
import { DetailsSection } from '@/components/common/profile/DetailsSection/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { AddButton } from '@/components/page/member-details/components/AddButton/AddButton';
// The app's own chevron — 16px, filled, `currentColor`, so the tone is the
// button's. Not a hand-rolled one: every disclosure arrow in the product is this
// glyph, and a second chevron drawn locally is the "black library icon" mistake
// in a different shape.
import { ChevronDownIcon } from '@/components/icons';
import { DataIncomplete } from '@/components/page/member-details/DataIncomplete/DataIncomplete';
import { EditOfficeHoursFormControls } from '@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursFormControls';
import ConfirmDialog from '@/components/core/ConfirmDialog/ConfirmDialog';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
// Production's rich-text field, RHF-bound and `dynamic(ssr:false)` internally —
// which is what makes it safe here, since prototype routes server-render and
// Quill touches `document` at import. `simplified` forces mentions off (so no
// member-search call fires: mocked-data-only holds) and applies the same
// header / bold-italic-underline / bullet-ordered / link toolbar production's
// own BioInput uses.
import { FormEditor } from '@/components/form/FormEditor/FormEditor';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { FormSwitch } from '@/components/form/FormSwitch';
import { MonthYearSelect } from '@/components/form/MonthYearSelect';

// (Demo Day's `EditInvestorProfileDrawer.module.scss` — the sticky 64px header
//  and the 720px-max centred column — is imported by `JobApplyFlowDrawer` now.
//  A pane that reached for the header and the column it sits inside would be
//  three steps all claiming to own the same box.)
// The white rounded panel the fields sit in, and its `.row` measure. Two
// stylesheets, not one, because production keeps two: the profile card edits
// through `EditProfileForm`'s and an experience entry edits through
// `EditExperienceForm`'s (which also owns the red `.deleteBtn`). Same split
// here, so each form wears the sheet written for it.
import f from '@/components/page/member-details/ProfileDetails/components/EditProfileForm/EditProfileForm.module.scss';
import x from '@/components/page/member-details/ExperienceDetails/components/EditExperienceForm/EditExperienceForm.module.scss';
// The dates row's own layout — column below tablet-landscape, row above.
import di from '@/components/page/member-details/ExperienceDetails/components/ExperienceDatesInput/ExperienceDatesInput.module.scss';
// `DetailsSection.editView` ships a *gradient* tint; ContactDetails overrides it
// to the flat `#f2f5ff` + `#aebfff` pair, and that override is passed back in
// through `DetailsSection`'s `classes` prop exactly as ContactDetails passes it.
import c from '@/components/page/member-details/ContactDetails/ContactDetails.module.scss';
// The profile card's own shell — white, 8px, card shadow — plus its edit-view
// tint and its bio block. `ProfileDetails` is a plain div rather than a
// `DetailsSection`, so the header card here is one too.
import p from '@/components/page/member-details/ProfileDetails/ProfileDetails.module.scss';
// The header card's insides: avatar, name, the amber `+ Your Role` / `+ Your
// Location` pair with its divider, and the grey `+ Add skills` / `+ Add bio`
// pills on the tag row.
import h from '@/components/page/member-details/MemberDetailHeader/MemberDetailHeader.module.scss';
// The canonical empty-state row and filled-entry row for a profile list. One
// import serves Experience and Project Contributions: production keeps a
// stylesheet per section whose `.emptyData`, `.expItem`, `.details`, `.row`,
// `.primaryLabel`, `.secondaryLabel` and `.editBtn` rules are byte-identical, so
// a second copy here would only be a second chance to drift.
// (It covered Teams too, until that section was cut.)
import e from '@/components/page/member-details/ExperienceDetails/components/ExperienceDetailsView/components/ExperiencesList/ExperiencesList.module.scss';
// The two things `ContributionsList` has that the shared row doesn't: the
// project logo frame and the `Current project` pill — which is *not* Teams'
// Primary Team pill (12px on a 4% brand tint against 14px on 16%), so it comes
// from its own sheet rather than being approximated with a neighbour's.
import n from '@/components/page/member-details/ContributionsDetails/components/ContributionsList/ContributionsList.module.scss';
// Repositories keeps its own sheet rather than borrowing the shared row, because
// two of the four classes it needs — `.profileLink` for the Github Profile link
// and `.link` for the row's external-link icon — exist nowhere else.
import r from '@/components/page/member-details/RepositoriesDetails/components/RepositoriesList/RepositoriesList.module.scss';
// The label-over-hint pair production uses for "Are you open to collaborate?".
// Note: its TSX also names `.labelWrapper` and `.primary`, but the stylesheet
// defines only `.root`, `.label` and `.hint` — the other two resolve to
// `undefined` in production too, so only the three real ones are used here.
import pc from '@/components/page/member-details/ProfileDetails/components/ProfileCollaborateInput/ProfileCollaborateInput.module.scss';

import { SkillsTagsInput } from './SkillsTagsInput';
/* `PendingApprovalSteps` — the vertical "signed up → complete your profile →
    await approval" rail — is **back**, and now lives here in the prototype.
    It had been imported from components/page/jobs/JobProfileDrawer/, but develop
    deleted that copy in 2cb0615fa ("approval no longer gates applying"). The
    component is pure presentation — clsx and its own stylesheet, one optional
    prop, nothing to mock — and its own header already describes it as a
    transcription of demo-day's AppliedInvestorSteps, so the prototype is its
    natural home rather than a second copy of a production component.

    It had been deleted on two arguments. The second — that approval no longer
    gated applying, so the rail described a wait holding nothing up — expired
    when the gate came back; a pending member now genuinely cannot apply, which
    is the fact this rail exists to place. The first was that two position
    indicators in one column is worse than one, and it is answered rather than
    overruled: they are in different places answering different questions. The
    flow rail is chrome, horizontal, in the sticky header, and says where you are
    in applying to *this role*. This is content, vertical, in the scrolling
    column, and says where you are in becoming able to apply at all. For this
    viewer that pairing is the point — the flow rail is showing a third step they
    cannot reach, and this is the explanation of why.

    Note what it displaced: the pending lede, which said the review is running
    and an email ends it — steps 1 and 3, in fewer words and with no position
    attached. See the comment at the render site.

    The three-stage account story also exists on the board for anyone who has not
    opened the flow: `PendingApprovalBanner`. Two surfaces, one story — if the
    wording of the wait changes, it changes in both. */
import { PendingApprovalSteps } from './PendingApprovalSteps';
import { VIEWER_EMAIL, VIEWER_NAME } from './profile/viewerIdentity';
import { MOCK_PROJECTS, mockRepositories } from './profile/profileMocks';

// SHARED (prototypes/entries/profile-shared/, no registry entry — like
// nav-shared/ and news-shared/). The prototypes' settled mark for a field only
// the PL team can see; the member-profile entry renders the same component on
// its internal Relationship card.
import { PlTeamOnlyPill } from '../profile-shared/PlTeamOnlyPill';
import { OptionalMark } from '../profile-shared/OptionalMark';
// Bringing a document instead of typing seven fields per position. Shared for
// the same reason `PlTeamOnlyPill` is: the settings prototype's Experience
// section is the second surface that wants it, and one importer that both
// mount cannot drift the way two copies would. See the component's own note for
// why the LinkedIn door was removed rather than kept as a second signpost.
import { ExperienceImportPanel } from '../profile-shared/ExperienceImport/ExperienceImportPanel';
import { ExperienceImportReview } from '../profile-shared/ExperienceImport/ExperienceImportReview';
import { isoToYm, ymToIso } from '../profile-shared/ExperienceImport/dateBridge';
import type { ImportSelection, ParsedProfile } from '../profile-shared/ExperienceImport/types';
import {
  EMPTY_PROFILE,
  JOB_SEARCH_STATUS_OPTIONS,
  formatExperienceDates,
  type ContributionEntry,
  type ExperienceEntry,
  type JobSearchStatus,
  type MemberProfile,
} from './viewerState';
import d from './JobProfilePane.module.scss';
// The flow's shared chrome, for the one class this pane reaches into: `.lede`,
// the sentence each step opens with. Imported rather than restated so the
// profile step and the application step sound like one screen — see the note in
// that stylesheet.
import fd from './JobApplyFlowDrawer.module.scss';

/**
 * "Complete your profile" — the one thing standing between a signed-in visitor
 * and a one-click application.
 *
 * **Why a drawer.** This used to be `JobPreferencesModal`: a centred card that
 * collected what you were looking for. The board's payoff changed — signing in
 * no longer re-sorts the list, it lets you apply — so the collected thing
 * changed with it, from intent to identity. Once it's identity, this stops being
 * a job-board dialog and becomes profile editing, and the product already has a
 * shape for that: Demo Day puts investor and founder profile completion in a
 * right-hand `Drawer` with a sticky Back header and a 720px column
 * (`EditInvestorProfileDrawer`), whose chrome this imports verbatim.
 *
 * **Why it's the profile card stack and not one form.** The earlier version put
 * three invented fields on a single tinted card. It matched the container and
 * not the thing people look at. A member editing their own profile in this
 * product reads a *stack*: a white header card carrying a name, an amber
 * `+ Your Role`, a grey `+ Add skills` pill and a blue Edit, and under it a
 * column of section cards — Experience, Teams, Project Contributions,
 * Repositories — each a grey title with `+ Add` opposite and a light-grey empty
 * row inside. Somebody arriving here from their profile page should not have to
 * work out that this is the same activity, so this *is* that stack, transcribed
 * from `ProfileDetails` + `MemberDetailHeader` + `ExperienceDetails` +
 * `TeamsList` + `ContributionsList` + `RepositoriesList`, and every placeholder
 * opens the same inline editor those pages open.
 *
 * **Why Teams is gone and Project Contributions isn't.** Both were here, fully
 * editable, on the argument that sending someone out of an apply flow to a
 * settings page costs more than writing the forms. That argument was about
 * *where* to edit them and skipped the prior question — whether this drawer
 * should ask for them at all.
 *
 * For Teams the answer is no: the card collects a primary team that an
 * Experience entry's "Team or Organization" field already asks for, so a member
 * filling both in answers the same question twice, and the second answer can
 * disagree with the first.
 *
 * For contributions it's yes, and the near-miss is worth recording: they were
 * cut in the same pass on the reasoning that they're "directory-profile
 * material", then put back. That reasoning conflated *optional* with
 * *unwanted*. Contributions answer a question Experience doesn't — where you
 * worked versus what you built — and in this network that is frequently the
 * more legible half of a candidate: a hiring team that knows libp2p learns more
 * from one contribution row than from a job title. Nothing gates on it
 * (`isProfileComplete` is the status alone), so the cost of keeping it is a card
 * someone can scroll past, and the cost of cutting it was a profile that
 * couldn't say the most useful thing about its owner.
 *
 * **The avatar is a placeholder, on purpose.** It was removed for a while — the
 * picture is account-level, set in Settings and not editable through any of these
 * forms, so it was the one element on the card that could never respond to
 * anything — then asked back. It returns as production's own "nothing uploaded"
 * image rather than a photo or a seeded dicebear shape: this card is a mock of
 * one person's profile, and a generated face would read as *their* picture and
 * invite the reader to judge a likeness instead of the layout. A blank
 * placeholder states the true thing, which is that no image has been set.
 *
 * **Why only the job search status is required, and why it's first.** Experience
 * used to be the gate, on the reasoning that a one-click application hands the
 * hiring team a profile instead of a form, so the profile has to answer "who is
 * this". True — but an experience entry is something most real profiles already
 * carry, and gating on it mostly stops people who have nothing new to add.
 * The job search status is the one answer this flow is uniquely placed to
 * collect: it can't be inferred from anything else in the record, it takes one
 * click, and it decides whether the profile is surfaced to founders who are
 * hiring. So it is the requirement, and requirements go first — its card sits
 * directly under the header, above Experience. Everything below it refines a
 * read rather than making one possible. The rule lives in `isProfileComplete`
 * and is computed here, never restated, so the drawer and the board that reads
 * the same function cannot drift apart.
 *
 * **Where Save lives, and why it isn't per section.** Production's profile page
 * saves per section, and each section here does too — its own Cancel/Save,
 * committing into the flow's draft, the card visibly filling in as the receipt.
 * But the flow needs a second, different action, because leaving this step is
 * not "persist": it is *persist and continue* — it commits the draft and moves
 * to the application. Wiring a section's Save to that would end the step the
 * instant the first section was filled, which is the flow deciding on the
 * person's behalf that they were finished. Two verbs, so two controls with two
 * labels: each card's Save is production's and is local; the flow's own is the
 * drawer's persistent footer, which says what it does next.
 *
 * That footer stays on screen at all times, including while a card is open, and
 * it is live for a pending member too: their profile saves like anyone else's,
 * and only the *apply* half of the flow waits. A flow that greyed out its own
 * Save while telling someone to complete their profile would be asking for work
 * it then refused to keep.
 *
 * **Why the gate is on Apply, not on browsing.** Nothing on this board is hidden
 * behind the form — the flow's own first step is the whole job description, open
 * to anyone. Asking before someone has found a role they want is charging
 * admission for a thing they haven't decided they want; asking at Apply is the
 * first moment the request is obviously in their own interest, and the moment
 * they can be told exactly where the answers are going — which is why
 * `pendingRoleTitle` names the role at the top of the column.
 */

interface JobProfilePaneProps {
  /**
   * The flow's working copy, and the setter that writes it.
   *
   * **Held by the drawer, not by this pane.** Every section's Save commits into
   * it, and the drawer's footer is what finally hands it to the board — so the
   * draft has to outlive this component, which unmounts every time someone steps
   * to the application and back. The setter keeps `useState`'s exact signature,
   * so each of the section handlers below reads the same as it did when this
   * file owned the state.
   */
  draft: MemberProfile;
  setDraft: Dispatch<SetStateAction<MemberProfile>>;
  /**
   * Which card, if any, has swapped itself for its editor — lifted for the same
   * reason as the draft, plus one the draft doesn't have: the drawer's footer
   * and its step rail both refuse to move while a card is open, and they can
   * only refuse if they can see it.
   */
  editing: EditTarget;
  setEditing: Dispatch<SetStateAction<EditTarget>>;
  /** The role the flow is applying for — this step always has one, because the
   *  only way to reach it is through the job. Names the role in the lede, so the
   *  ask says why it is being made and what happens next. */
  pendingRoleTitle?: string | null;
  /** Signed up but not yet approved by the PL team. The stack stays editable —
   *  production never locks a pending member's form — but applying is off, and
   *  the lede and the flow's footer say so. */
  pendingApproval?: boolean;
  /**
   * DELETE WITH: the `design-canvas/` folder.
   *
   * Opens the Experience card straight into the importer, and optionally hands
   * it a parse that has already come back — which is the only way to photograph
   * the review card, since a real one exists for 1.8 seconds after a file is
   * dropped and never at a URL.
   *
   * `panel` is passed through to `ExperienceImportPanel` for the beats that live
   * inside it: whether the drop area is open, and whether it is reading or
   * empty-handed.
   */
  canvasImport?: {
    parsed?: ParsedProfile;
    panel?: { open?: boolean; status?: 'idle' | 'reading' | 'nothing-found'; fileName?: string };
  };
}

/**
 * Which card, if any, has swapped itself for its editor. One at a time — the
 * profile page allows exactly one open section too, and a second would put two
 * Saves and two Cancels on one column.
 *
 * `uid: null` on a list section means "a new entry"; a uid means that row.
 * `github` carries no uid because the section edits one field, not a list.
 */
export type EditTarget =
  | { kind: 'profile' }
  | { kind: 'experience'; uid: string | null }
  | { kind: 'contribution'; uid: string | null }
  | { kind: 'github' }
  /* Bringing a document. Takes over the Experience card the same way an editor
     does, because it is a change to that section and the drawer has exactly one
     grammar for those. Which half is showing depends on `parsed`: nothing read
     yet means the door and the drop area, a result means the review. */
  | { kind: 'import' }
  | null;

export function JobProfilePane(props: JobProfilePaneProps) {
  const { draft, setDraft, editing, setEditing, pendingRoleTitle, pendingApproval = false, canvasImport } = props;

  /**
   * The file the header's "Update from CV" collected, on its way to the panel.
   *
   * **Why the drawer owns an input at all.** Opening the OS file dialog needs a
   * user gesture, and a gesture only survives synchronous JS — so a button that
   * sets state and hopes the freshly-mounted panel can open the picker in an
   * effect is relying on a browser detail that Safari in particular does not
   * promise. The input lives next to the button and the button clicks it
   * directly, which is the version that cannot break.
   *
   * The file is then handed to the panel and validated *there*, by the same
   * dropzone that validates a drop — so the two routes cannot end up disagreeing
   * about what a valid CV is.
   */
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const headerFileInput = useRef<HTMLInputElement>(null);
  /* What a document said, held between the panel reading it and the review
     agreeing to it. Null the rest of the time — a parse is never state the
     profile carries, only a proposal in flight.
     Which door it arrived through used to be held alongside it; nothing reads
     that any more, so it isn't kept. */
  const [parsed, setParsed] = useState<ParsedProfile | null>(null);

  /* Runs once per mount, and this pane mounts exactly when its step becomes
     current — so "on open" and "on mount" are now the same moment. Seeding the
     draft is no longer here: the draft outlives this component (the flow drawer
     holds it, and this pane unmounts every time someone steps to the application
     and back), so re-seeding it on mount would overwrite everything typed the
     moment someone stepped back to check their letter.

     `parsed` is the opposite case and stays local: a document read but not yet
     agreed to is a proposal in flight, and a proposal does not survive leaving
     the step it was made on.

     Always on the stack, never in a form. This step used to open straight into
     the Experience form when the profile was empty, on the argument that
     Experience was the one thing standing between the person and applying, so
     the form *was* the visit. It isn't any more: the requirement is the job
     search status, which is three radios on the first card and needs no form to
     answer. Opening on a form for an optional section would be putting the least
     urgent work in front of the most urgent, and hiding the required question
     behind it. */
  useEffect(() => {
    setParsed(null);

    /* DELETE WITH: the `design-canvas/` folder.
       The canvas photographs the import beats, and all of them live behind the
       Experience card's own controls: opening the importer is a press, and the
       review only exists once a document has been read. Seeded here, after the
       reset above, so a pinned frame is not undone by the effect that clears the
       step on every arrival. */
    if (canvasImport) {
      /* ONLY the review needs the editing card. The panel has two hosts and they
         are not interchangeable: the doors and the drop areas normally sit inline
         in the empty Experience section — white, no Cancel — and the blue
         `editView` card is the *other* route in, from the Add form's "fill from a
         document" line. Opening the card for every pinned beat photographed the
         secondary route and captioned it as the flow's start. A parse is
         different: the review only ever renders in the card. */
      if (canvasImport.parsed) {
        setEditing({ kind: 'import' });
        setParsed(canvasImport.parsed);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* The two halves of that rule, named so each card can mark *itself* rather
     than every incomplete card lighting up whenever anything is missing. Read
     off the draft with the same tests `isProfileComplete` uses — deliberately
     not a second definition of "required", just a finer-grained look at the one
     that exists. */
  /**
   * Nothing filled in yet — so the fastest thing this drawer can offer is "give
   * us the document you already have".
   *
   * Deliberately wider than `experiences.length === 0`: a CV fills the required
   * **role** as well as skills, location and the work history, so the card is
   * only the right *first* thing while none of those has an answer. The moment
   * any of them does, the person is already filling this in by hand and a slab
   * at the top telling them to start over is noise.
   *
   * Bio is left out of the test on purpose — someone who wrote a bio and nothing
   * else has still not started on the facts a CV carries.
   */
  const profileIsBlank =
    draft.role.trim() === '' &&
    draft.location.trim() === '' &&
    draft.skills.length === 0 &&
    draft.experiences.length === 0;

  /**
   * Which of the two hosts owns the importer. Never both — one offer to bring a
   * document, in the place it is most useful:
   *
   *  - blank profile → the card at the top, because a CV answers the required
   *    role as well as the optional history, and that is the whole point of
   *    offering it first;
   *  - anything filled in but no history → the Experience card's own empty row,
   *    next to the section it fills.
   *
   * Two entry points to one mechanism on one screen is a choice with no
   * consequence — the mistake the removed LinkedIn door was.
   */
  const importAtTop = profileIsBlank;

  const hasRole = draft.role.trim() !== '';
  const hasStatus = draft.jobSearchStatus !== '';

  /* Editing is never withheld — not even while approval is pending.
     Waiting is not a reason to take the form away: the review runs on someone
     else's clock, and the profile is the one thing the person can usefully do
     meanwhile, so it saves like any other visit. Only *applying* waits, and the
     footer says so in words rather than by greying out every pencil on the
     page. Kept as a named constant rather than deleted so the sections read the
     same as production's, which pass the same flag. */
  const canEdit = true;
  const editingProfile = editing?.kind === 'profile';
  const editingExperience = editing?.kind === 'experience';
  const editingContribution = editing?.kind === 'contribution';
  const editingGithub = editing?.kind === 'github';
  const editingImport = editing?.kind === 'import';

  /**
   * Whether the three optional sections — Experience, Project Contributions and
   * Repositories — are showing.
   *
   * **What this fork changes, and why.** This step asks two questions: your
   * current role and your job search status. `isProfileComplete` tests those two
   * and nothing else, so everything below them is genuinely optional — and yet
   * the step opened as six cards, four of them optional, each with its own
   * header, its own Add control and its own empty state. Someone mid-apply met a
   * profile-management surface where the flow had promised "the next step is
   * finishing it", and finishing it meant two answers.
   *
   * Folded rather than removed, because each of those sections does something
   * the required pair can't: Experience is what the application read-back quotes
   * on step 3, Contributions is the section a hiring team reads to place someone
   * against a project they know, and all three can be *typed* here — a person
   * who wants to add a role mid-apply must not be sent to another page to do it
   * (that is the detour this whole flow was built to remove).
   *
   * Collapsed at rest in both states, rather than open-when-empty. An empty
   * profile already has the shortest route through all three offered above it —
   * the CV card, which fills them from a document — so opening three empty
   * sections underneath would be showing the long way round and the short way at
   * once, and the amber strips on the two required cards have to stay the
   * loudest thing on the step.
   */
  const [showOptional, setShowOptional] = useState(false);

  /* Forced open around an open editor. Every one of the three saves through a
     card that replaces the section in place, and the drawer's footer is disabled
     while any card is open — so a fold that could close over an editor would
     hide the only Save on screen behind a control the person has no reason to
     press again. Nothing collapses out from under unsaved work. */
  const optionalOpen = showOptional || editingExperience || editingContribution || editingGithub || editingImport;

  /**
   * What is folded away, said as a list.
   *
   * A disclosure whose label is only a noun ("Experience, projects and
   * repositories") tells someone with a full profile nothing they didn't know,
   * and tells someone with an empty one nothing either — so at rest the control
   * has to report its own contents. This is also what keeps the step's lede
   * ("This is what hiring teams see when you apply") honest with the sections
   * closed: the line names what is in there, and one press shows it.
   *
   * Counts for the two that have them, presence for the one that doesn't — a
   * GitHub handle is one thing or nothing, and "1 repository" would be counting
   * the field rather than what is behind it.
   */
  const optionalSummary = (() => {
    const parts: string[] = [];
    if (draft.experiences.length) {
      parts.push(`${draft.experiences.length} ${draft.experiences.length === 1 ? 'role' : 'roles'}`);
    }
    if (draft.contributions.length) {
      parts.push(`${draft.contributions.length} ${draft.contributions.length === 1 ? 'project' : 'projects'}`);
    }
    if (draft.githubHandle.trim()) parts.push('GitHub linked');
    return parts.join(' · ');
  })();

  const experienceBeingEdited = useMemo(
    () => (editingExperience && editing.uid ? (draft.experiences.find((i) => i.uid === editing.uid) ?? null) : null),
    [editing, editingExperience, draft.experiences],
  );

  const contributionBeingEdited = useMemo(
    () =>
      editingContribution && editing.uid ? (draft.contributions.find((i) => i.uid === editing.uid) ?? null) : null,
    [editing, editingContribution, draft.contributions],
  );

  const saveProfileDetails = (patch: Pick<MemberProfile, 'role' | 'location' | 'skills' | 'bio'>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setEditing(null);
  };

  const saveExperience = (entry: ExperienceEntry) => {
    setDraft((prev) => ({
      ...prev,
      experiences: prev.experiences.some((i) => i.uid === entry.uid)
        ? prev.experiences.map((i) => (i.uid === entry.uid ? entry : i))
        : [...prev.experiences, entry],
    }));
    setEditing(null);
  };

  /* A document was read and something came back. The card swaps to the review;
     nothing has touched the draft yet, and won't until Save. */
  const openImportReview = (result: ParsedProfile) => {
    setParsed(result);
    setEditing({ kind: 'import' });
  };

  const closeImport = () => {
    /* So reopening the importer by any route starts empty rather than replaying
       the last file the header collected. */
    setPickedFile(null);
    setParsed(null);
    setEditing(null);
  };

  /**
   * The one place a parse becomes profile.
   *
   * Three rules, all of them "never overwrite an answer the person already
   * gave": the role and location fill only a blank, skills union rather than
   * replace, and positions append rather than replace the list. Someone who
   * imports a second document — an older CV after a newer one — should end up
   * with more history, not with the last file winning.
   *
   * Uids are minted here, not by the review: the review deals in a proposal and
   * this is the moment it becomes a record.
   */
  /* `selection.name` and `selection.email` are read and deliberately dropped.
     The drawer hands the review `VIEWER_NAME` / `VIEWER_EMAIL`, so it never asks
     for either and both come back exactly as they went out — there is nothing to
     merge, and `MemberProfile` has nowhere to put them anyway: the account owns
     those two, which is why they live in `viewerIdentity` and not on the record
     this form edits. Naming them here rather than letting them vanish into the
     rest parameter, so the next reader can see the drop is a decision. */
  const applyImport = (selection: ImportSelection) => {
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
    closeImport();
  };

  const deleteExperience = (uid: string) => {
    setDraft((prev) => ({ ...prev, experiences: prev.experiences.filter((i) => i.uid !== uid) }));
    setEditing(null);
  };

  const saveContribution = (entry: ContributionEntry) => {
    setDraft((prev) => ({
      ...prev,
      contributions: prev.contributions.some((i) => i.uid === entry.uid)
        ? prev.contributions.map((i) => (i.uid === entry.uid ? entry : i))
        : [...prev.contributions, entry],
    }));
    setEditing(null);
  };

  const deleteContribution = (uid: string) => {
    setDraft((prev) => ({ ...prev, contributions: prev.contributions.filter((i) => i.uid !== uid) }));
    setEditing(null);
  };

  const saveGithubHandle = (handle: string) => {
    setDraft((prev) => ({ ...prev, githubHandle: handle }));
    setEditing(null);
  };

  /* (`submit` — the boundary check that used to guard this drawer's own Save —
      has moved with the footer to `JobApplyFlowDrawer`. The rule it enforced is
      unchanged and still `isProfileComplete`, read from the one place that
      defines it.) */

  return (
    <>
      {/* The wrapper is `fd.stepIntro` — the logged-out pane's, and for the same
          reason it exists there: `.drawerContent`'s gap is a uniform 16px, so a
          title and the sentence qualifying it dropped in as two siblings would
          sit as far apart as two unrelated cards. The wrapper has no gap of its
          own, so the one distance inside it is stated at the title.

          The wrapper renders unconditionally even when it holds only the lede.
          `.stepIntro` is a bare full-width flex column with no gap and no
          padding, so a wrapper around one child measures identically to that
          child on its own — and branching the markup to save a div would be two
          shapes for one step. */}
      <div className={fd.stepIntro}>
        {/* **The step's name — only while there is nothing on the profile.**
            The logged-out pane opens on this exact h2, in this exact class, and
            the two steps are one position in the flow, so they say the same
            words when they are asking for the same thing.

            But only then. A member whose profile is already written is not being
            asked to fill anything in — they are being shown what will be sent —
            and a 20px instruction to do work that is done reads as a form that
            hasn't noticed. The step is not left untitled for them either: the
            rail six inches above says `Your profile`, permanently, for all three
            of the flow's steps. That is the step's name; this is the blank
            state's instruction, and only one of the two is always true.

            (If it should be unconditional, that is a one-word change — drop the
            `profileIsBlank &&`. It was implemented blank-only deliberately.) */}
        {profileIsBlank && <h2 className={clsx(fd.stepTitle, d.stepTitleWithLede)}>Fill in your profile</h2>}

        {/* Naming the destination is the whole reason the ask lands here rather
            than at sign-in: the person is mid-decision about one specific role, and
            the sentence tells them what their profile is for and that there is no
            second form behind this one.

            **The stepper replaces this line rather than joining it.** A pending
            member's lede said the review is running and an email ends it — which
            is steps 1 and 3 of the stepper, in fewer words and with no position
            attached. Keeping both would be the same news twice, 16px apart. */}
        {pendingApproval ? (
          <PendingApprovalSteps />
        ) : (
          <p className={fd.lede}>
            {pendingRoleTitle
              ? `We send your profile with your application to ${pendingRoleTitle}.`
              : 'This is what hiring teams see when you apply.'}
          </p>
        )}
      </div>

      {/* 0. Start with a document, when there is nothing to start from.
               **Why this is above the required cards.** The drawer's rule is that
               required things are asked for first, and an earlier pass used that
               rule to keep the importer *out* of this position — a third thing
               above the two gates would bury them. That reasoning was written
               when the importer only filled Experience, which is optional. It
               now fills the required `role` too, so it is not a third thing
               above the requirements: it is the shortest route through one of
               them. A control that answers the question below it belongs above
               it.

               It is a quiet white card, not a tinted slab, for the same reason:
               the amber "your current role is required" strip on the card
               underneath has to stay the loudest thing here. This is an offer,
               and the requirement is a requirement. */}
      {importAtTop && (
        <DetailsSection
          editView={editingImport}
          classes={editingImport ? { root: c.root, editView: `${c.editView} ${d.editCard}` } : { root: fd.cardEdge }}
        >
          {editingImport && parsed ? (
            <ExperienceImportReview
              parsed={parsed}
              /* Both known — this drawer only opens for someone signed in — so
                   the review never puts a Name or Email field on screen. The
                   card's contact group is for the surface that *doesn't* have
                   them yet. */
              currentName={VIEWER_NAME}
              currentEmail={VIEWER_EMAIL}
              currentRole={draft.role}
              currentLocation={draft.location}
              currentSkills={draft.skills}
              currentExperiences={draft.experiences}
              formatDates={formatExperienceDates}
              bodyClassName={d.formBody}
              onClose={closeImport}
              onSubmit={applyImport}
            />
          ) : (
            <>
              {/* Same offer, same mark, same words as the other two surfaces
                  that make it — see `OptionalMark`. */}
              <DetailsSectionHeader
                title={
                  <>
                    You can upload your CV
                    <OptionalMark />
                  </>
                }
              >
                {/* Only while the importer is a *section being edited* — i.e.
                      reached from the Add form. In its resting state this card
                      is not an editor and there is nothing to cancel; the
                      drawer's own footer is live and the stack is right below. */}
                {editingImport && (
                  <button type="button" className={d.headerCancel} onClick={closeImport}>
                    Cancel
                  </button>
                )}
              </DetailsSectionHeader>
              {/* Names the work avoided, not just the work done.
                    Mobbin's clearest example of this is Upwork's profile fork,
                    where the persuasive element is not the upload button but the
                    third option reading "Fill out manually (15 min)" — the cost
                    of *not* uploading, stated. This says the same thing without
                    adding a control: the alternative is typing it all in.

                    "Nothing is saved until you do" came off. The card has a Save
                    in the drawer footer and the review that follows has its own
                    Cancel and Save, so the sentence was promising something two
                    visible buttons already promise — the second time that exact
                    reassurance has been cut from this flow. */}
              <p className={d.cvFirstNote}>
                We&apos;ll fill in your role, skills and experience from it, so you don&apos;t have to type it all in.
              </p>
              <ExperienceImportPanel
                entry="direct"
                privacyNote="We read the file to fill in your experience. It isn't sent with your applications."
                onParsed={openImportReview}
                onAddManually={() => setEditing({ kind: 'experience', uid: null })}
                // DELETE WITH: the `design-canvas/` folder.
                canvasStatus={canvasImport?.panel?.status}
                canvasFileName={canvasImport?.panel?.fileName}
              />
            </>
          )}
        </DetailsSection>
      )}

      {/* **The alternative, written down.**
          The document and the cards under it are a fast path and its fallback,
          and until now the step never said so — a stack of equally-weighted cards
          reads as a list of chores rather than as a shortcut and the long way
          round. A rule with `or` set into it is how that relationship gets
          stated; the same rule stood in this flow's logged-out pane (`.orRule` in
          `JobAccountPane.module.scss`) until the CV card was taken off that step,
          and this is it, transcribed. See the stylesheet for what I searched
          before hand-rolling anything, and for what production's one labelled
          divider does and doesn't lend it.

          **Only while the CV card is at the top**, which is the same test that
          puts it there: `importAtTop`. Once anything on the profile has an
          answer, the offer moves down into the Experience card's own empty row
          and there is no fork at the top of the column to name — a rule there
          would be announcing a choice that isn't on screen.

          And not while a parse is being reviewed. At that moment the card above
          has become the document's own result with its own Cancel and Save, so
          the alternative is no longer "or", it is "or cancel this". */}
      {importAtTop && !parsed && <div className={d.orRule}>or fill it in yourself</div>}

      {/* 1. The header card, and the first of the two required answers: your
               current role. `ProfileDetails` is a plain div that swaps itself for
               `EditProfileForm` in place, so this is a plain div too, and every
               placeholder in it opens that one editor — the amber role and
               location, both grey pills, and the blue Edit.

               While the role is missing the card wears the same treatment the
               status card does: `missingData`'s tint plus a strip naming the
               consequence. The amber `+ Current Role` button inside it is
               already production's "this is missing" affordance, but it says
               *absent*, not *required*, and every other placeholder on the card
               looks exactly the same while being optional. The strip is what
               distinguishes the one that stops you from the four that don't. */}
      <div
        className={clsx(p.root, {
          [p.editView]: editingProfile,
          [d.editCard]: editingProfile,
          [d.missingCard]: !editingProfile && !hasRole,
        })}
      >
        {editingProfile ? (
          <ProfileDetailsForm profile={draft} onClose={() => setEditing(null)} onSubmit={saveProfileDetails} />
        ) : (
          <>
            {!hasRole && (
              <DataIncomplete className={d.incompleteStrip}>
                {pendingRoleTitle
                  ? `Your current role is required to apply to ${pendingRoleTitle}.`
                  : 'Your current role is required to apply.'}
              </DataIncomplete>
            )}
            <div className={clsx({ [d.missingBody]: !hasRole })}>
              <ProfileHeaderCard profile={draft} onEdit={canEdit ? () => setEditing({ kind: 'profile' }) : undefined} />
            </div>
          </>
        )}
      </div>

      {/* 2. Job search status — the required section, so it comes first and,
               while it is unanswered, wears `missingData` and carries the strip
               naming the consequence rather than a generic "incomplete".

               It used to sit third, under Experience, as an optional private
               extra. It moved up when it became the one thing this flow asks
               for: the required question is the first question, or the person
               fills in three optional cards before meeting it.

               The pill goes in the header's own right-hand slot, which is where
               every other section puts its qualifier (Add, Edit, the Github
               Profile link), so the privacy mark reads as part of the section
               rather than as content inside it. */}
      <DetailsSection missingData={!hasStatus} classes={{ root: hasStatus ? fd.cardEdge : undefined }}>
        {!hasStatus && (
          <DataIncomplete className={d.incompleteStrip}>
            {pendingRoleTitle
              ? `An answer here is required to apply to ${pendingRoleTitle}.`
              : 'An answer here is required to apply.'}
          </DataIncomplete>
        )}
        <div className={clsx({ [d.missingBody]: !hasStatus })}>
          <DetailsSectionHeader title="Job search status">
            <PlTeamOnlyPill />
          </DetailsSectionHeader>
          <JobSearchStatusInput
            value={draft.jobSearchStatus}
            onChange={(value) => setDraft((prev) => ({ ...prev, jobSearchStatus: value }))}
          />
        </div>
      </DetailsSection>

      {/* The fold. Everything below it is optional; everything above it is the
          two answers applying actually needs.

          **A line in the column, not a card.** A `DetailsSection` wrapping the
          other three would be a card whose only content is more cards — the
          nested-card shape — and it would add a fourth header to a step whose
          problem was headers. The control wears the surface's own text-button
          rank instead (`.headerCancel`'s 14px/500, secondary → primary on
          hover), so it reads as a control belonging to the stack rather than as
          another thing in it.

          **The mechanism is production's, the chrome is this surface's.**
          `CollapsibleSection` (application-search) is the app's one disclosure —
          a full-width button, title left, chevron right, rotating 180° on open —
          and that shape is transcribed. Its paint is not: it renders a 40px
          `#f8fafc` pill in Tailwind slate with `text-transform: capitalize`,
          which is command-palette chrome and would put a grey slab between two
          amber-strip cards. The expander *copy* comes from the product's settled
          pair instead — Gantry's `Show all … / Show less`, demo-day's
          `Show all (N) / Show less` — because this is the same act on a
          different surface, and the label is what people recognise.

          Not animated. `CollapsibleSection` height-animates through framer, and
          three profile cards are tall enough that a 300ms height transition on
          them is a long slide with a footer moving underneath it — the thing the
          drawer's sticky bar exists to hold still. */}
      <button
        type="button"
        className={d.optionalToggle}
        onClick={() => setShowOptional((v) => !v)}
        aria-expanded={optionalOpen}
        aria-controls="apply-optional-sections"
      >
        <span className={d.optionalToggleLabel}>
          Experience, projects and repositories
          {/* The same `(Optional)` the CV card above wears, for the same reason:
              this is the one place on the step where the distinction between
              "required to continue" and "worth adding" is being drawn, and it is
              drawn with the mark production already uses for it. */}
          <OptionalMark />
        </span>
        {/* At rest the control reports its contents; open, the contents are on
            screen and saying what they are a second time is the summary
            competing with the thing it summarises. */}
        {!optionalOpen && optionalSummary && <span className={d.optionalToggleSummary}>{optionalSummary}</span>}
        <ChevronDownIcon
          className={clsx(d.optionalToggleChevron, optionalOpen && d.optionalToggleChevronOpen)}
          aria-hidden="true"
        />
      </button>

      <div id="apply-optional-sections" className={clsx(d.optionalSections, !optionalOpen && d.optionalSectionsHidden)}>
      {/* 3. Experience — optional now, and no longer the gate. It stays because
               it is what a hiring team actually reads on an application, and the
               apply modal quotes its first entry; it just isn't held over
               anyone's head. */}
      <DetailsSection
        editView={editingExperience || editingImport}
        classes={
          editingExperience || editingImport
            ? { root: c.root, editView: `${c.editView} ${d.editCard}` }
            : { root: fd.cardEdge }
        }
      >
        {editingImport && !importAtTop ? (
          /* The import owns the card the same way an editor does. Which half
               shows depends on whether anything has been read yet — the panel
               is the doors and the drop area, the review is what came back.
               Reached two ways: from the Add form's "fill from a document" line
               (nothing read, so the panel), and from the inline doors below
               (something read, so the review). */
          parsed ? (
            <ExperienceImportReview
              parsed={parsed}
              /* See the note on the card at the top of the drawer: signed in,
                   so neither is asked for. */
              currentName={VIEWER_NAME}
              currentEmail={VIEWER_EMAIL}
              currentRole={draft.role}
              currentLocation={draft.location}
              currentSkills={draft.skills}
              /* So a second import of the same CV doesn't append the same
                   history twice — the rows already here arrive unticked and
                   say why. */
              currentExperiences={draft.experiences}
              /* The list's own formatter, so a found row reads exactly the way
                   the rows it is about to join read. */
              formatDates={formatExperienceDates}
              bodyClassName={d.formBody}
              onClose={closeImport}
              onSubmit={applyImport}
            />
          ) : (
            <>
              {/* Leaving the importer is the *card's* action, so it goes in
                    the header's right-hand slot — where Add, Edit and the Github
                    link go on every other section — rather than under the title
                    as a stray line. Without it this route was a dead end: the
                    panel's own "← Back" only steps back to the doors, and the
                    drawer's footer is disabled while any section is open, so the
                    only way out was closing the whole drawer. */}
              <DetailsSectionHeader title="Add experience from a document">
                <button type="button" className={d.headerCancel} onClick={closeImport}>
                  Cancel
                </button>
              </DetailsSectionHeader>
              {/* `direct`, like the card at the top. This route is reached by
                    pressing a control that already says "Update from CV", so a
                    landing screen offering an "Upload your CV" button was a
                    button revealing a button — the same redundancy the top card
                    was built to avoid, left behind on the other route. */}
              <ExperienceImportPanel
                entry="direct"
                initialFile={pickedFile}
                privacyNote="We read the file to fill in your experience. It isn't sent with your applications."
                onParsed={openImportReview}
                onAddManually={() => setEditing({ kind: 'experience', uid: null })}
                // DELETE WITH: the `design-canvas/` folder.
                canvasOpen={canvasImport?.panel?.open}
                canvasStatus={canvasImport?.panel?.status}
                canvasFileName={canvasImport?.panel?.fileName}
              />
            </>
          )
        ) : editingExperience ? (
          <ExperienceForm
            initial={experienceBeingEdited}
            onClose={() => setEditing(null)}
            onSubmit={saveExperience}
            onDelete={deleteExperience}
          />
        ) : (
          <>
            {/* No `missingBody` here any more. It was left behind from when
                  Experience was the gate, and it tinted this card whenever
                  *anything* on the profile was missing — so an unanswered job
                  search status made the Experience card look like the thing
                  standing in the way. A card marks itself, or it misdirects. */}
            <DetailsSectionHeader
              title={`Experience ${draft.experiences.length ? `(${draft.experiences.length})` : ''}`}
            >
              {/* Two controls in the header slot, which `Repositories` below
                    already does — so the pattern is the section's, not an
                    invention. Its wrapper was called `repoHeaderActions` when
                    Repositories was the only section that needed one; it is
                    `headerActions` now, because a second section wanting the same
                    thing is what turns a local fix into the section grammar.

                    **Why the CV route lives here once there are entries.** The
                    empty row carries the pill; once it is filled the pill goes
                    with it, and until now the only way back to the importer was
                    a line *inside* the Add Experience form — a six-field form
                    someone opens to type, not the thing you look for when you
                    want to drop a newer CV. That line is gone: with a visible
                    route in the header, keeping it would be two entry points to
                    one mechanism on one card, which is the mistake the LinkedIn
                    door was.

                    "Update from CV", not "Upload your CV". The empty state's
                    pill is a first move; this is a refresh of something that
                    already exists, and the verb is the difference. */}
              <div className={d.headerActions}>
                {canEdit && draft.experiences.length > 0 && (
                  <>
                    {/* Straight to the file dialog. Pressing a control that
                          says "Update from CV" and landing on a card asking you
                          to choose a file is the press not being taken at its
                          word — the card behind it still appears, so a cancelled
                          dialog leaves you on the drop area rather than nowhere. */}
                    <button type="button" className={d.headerImport} onClick={() => headerFileInput.current?.click()}>
                      Update from CV
                    </button>
                    <input
                      ref={headerFileInput}
                      type="file"
                      className={d.visuallyHidden}
                      accept=".pdf,.doc,.docx"
                      onChange={(ev) => {
                        const chosen = ev.target.files?.[0] ?? null;
                        /* Cleared so picking the same file twice still fires a
                             change event. */
                        ev.target.value = '';
                        if (!chosen) return;
                        setPickedFile(chosen);
                        setEditing({ kind: 'import' });
                      }}
                    />
                  </>
                )}
                {canEdit && <AddButton onClick={() => setEditing({ kind: 'experience', uid: null })} />}
              </div>
            </DetailsSectionHeader>
            {draft.experiences.length === 0 && canEdit && !importAtTop ? (
              /* The offer, standing in the empty row rather than above it.
                   Production drew a `.connectButton` slot inside `.emptyData`
                   for exactly this and never wired one up; this is that slot.
                   It shows only while the section is empty — an import offer
                   over a history someone has already written is nagging, and
                   the same doors stay reachable from the Add form. */
              <div className={e.root}>
                <ExperienceImportPanel
                  emptyLabel="Share your work history and skills. This shows what you know and what you can do."
                  privacyNote="We read the file to fill in your experience. It isn't sent with your applications."
                  onParsed={openImportReview}
                  onAddManually={() => setEditing({ kind: 'experience', uid: null })}
                  /* DELETE WITH: the `design-canvas/` folder. The canvas pins the
                       panel's beats HERE, in the inline host, because this is the
                       one a person reaches from an empty Experience section. */
                  canvasOpen={canvasImport?.panel?.open}
                  canvasStatus={canvasImport?.panel?.status}
                  canvasFileName={canvasImport?.panel?.fileName}
                />
              </div>
            ) : (
              <ExperienceList
                entries={draft.experiences}
                onEdit={canEdit ? (uid) => setEditing({ kind: 'experience', uid }) : undefined}
              />
            )}
          </>
        )}
      </DetailsSection>

      {/* 4. Project Contributions. Optional — nothing here touches
               `isProfileComplete` — and kept, unlike Teams, because it answers a
               different question from Experience: where you worked versus what
               you built. For this network in particular that's often the more
               legible half of a candidate, and it is the section a hiring team
               reads to place someone against a project they already know.

               Its empty copy is production's, word for word, because it is a
               true instruction in both places — the button that makes it true is
               right above it. */}
      <DetailsSection
        editView={editingContribution}
        classes={
          editingContribution ? { root: c.root, editView: `${c.editView} ${d.editCard}` } : { root: fd.cardEdge }
        }
      >
        {editingContribution ? (
          <ContributionForm
            initial={contributionBeingEdited}
            onClose={() => setEditing(null)}
            onSubmit={saveContribution}
            onDelete={deleteContribution}
          />
        ) : (
          <>
            <DetailsSectionHeader
              title={`Project Contributions ${draft.contributions.length ? `(${draft.contributions.length})` : ''}`}
            >
              {canEdit && <AddButton onClick={() => setEditing({ kind: 'contribution', uid: null })} />}
            </DetailsSectionHeader>
            <ContributionsList
              entries={draft.contributions}
              onEdit={canEdit ? (uid) => setEditing({ kind: 'contribution', uid }) : undefined}
            />
          </>
        )}
      </DetailsSection>

      {/* 5. Repositories. Optional too.

               Teams used to sit above this one and is gone: the card asked for
               the primary team that an Experience entry's "Team or Organization"
               field already collects, so a member filling both in answered the
               same question twice. */}
      <DetailsSection
        editView={editingGithub}
        classes={editingGithub ? { root: c.root, editView: `${c.editView} ${d.editCard}` } : { root: fd.cardEdge }}
      >
        {editingGithub ? (
          <GithubHandleForm handle={draft.githubHandle} onClose={() => setEditing(null)} onSubmit={saveGithubHandle} />
        ) : (
          <RepositoriesSection
            handle={draft.githubHandle}
            onEdit={canEdit ? () => setEditing({ kind: 'github' }) : undefined}
          />
        )}
      </DetailsSection>
      </div>

      {/* (The footer that used to close this file — the persistent
          `Continue to apply` / `Save profile` bar with its "what is still
          missing" hint — is `JobApplyFlowDrawer`'s now, along with `missingHint`
          and `sentenceCase`, the two helpers that wrote that sentence. It says
          the same things for the same reasons; it just says them for all three
          steps instead of only this one, which is what stops the flow ending in
          three differently-worded buttons.) */}
    </>
  );
}

/* ------------------------------------------------------------------ header --- */

/**
 * `MemberDetailHeader`'s markup, transcribed. The component itself isn't
 * importable — it reads analytics hooks, a react-query avatar hook and an
 * `IMember` this prototype has no reason to fake — but its stylesheet is, so the
 * name, the amber add-buttons with their divider and the grey pills are
 * pixel-identical rather than a lookalike. Dropped along the way: the team link
 * and its "+N" tooltip (Teams is its own card here), the investor and team-lead
 * tags, and the `CustomTooltip` around the name, which exists to reveal a name
 * the 200px clamp cut off and is noise at one fixed mock name.
 *
 * **And the avatar, which is why this uses production's `.header` grid.** That
 * grid — `48px auto`, `80px auto` from 1024px — exists to park the picture beside
 * the details, with `.headerDetails` and `.tags` both pinning to `grid-column: 2`
 * so they stack in the second track.
 *
 * There was an interlude where the avatar was removed and the grid went with it,
 * replaced by a local flex column, because an empty 48/80px track would otherwise
 * have held an inset down the left of the card. When the avatar came back the
 * flex row I reached for first put `.tags` *beside* `.headerDetails` instead of
 * under it — the two are siblings, and only the grid was making them stack. The
 * fix was to delete the local class, not to patch it: the workaround existed to
 * cover for a missing avatar, so the moment the avatar returned production's own
 * rule was correct again and the override was the only thing left to be wrong.
 */
function ProfileHeaderCard({ profile, onEdit }: { profile: MemberProfile; onEdit?: () => void }) {
  const skillTags = useMemo(() => profile.skills.map((title) => ({ title })), [profile.skills]);
  /* Production's own emptiness test (`ProfileDetails` L34): an empty rich-text
     field is not an empty string, it is Quill's "<p><br></p>". Without the
     second clause a cleared bio renders a titled block containing a blank line,
     and the `+ Add bio` pill disappears because the card thinks there's one. */
  const hasBio = profile.bio.trim() !== '' && profile.bio.trim() !== '<p><br></p>';

  return (
    <>
      <div className={h.header}>
        {/* Placeholder only — production's own "no image yet" avatar, which is
            what `getDefaultAvatar(undefined)` returns. Deliberately not a photo
            and not a seeded dicebear shape: the drawer is a mock of one person's
            profile, and a generated face would read as *their* picture and
            invite the reader to judge whether it's right. A blank placeholder
            says what's true — nothing has been uploaded — and keeps the row's
            geometry honest for whoever is reviewing the layout. */}
        <div className={h.headerProfile}>
          <img className={h.headerProfileImg} src={getDefaultAvatar(undefined)} alt="" />
        </div>

        <div className={h.headerDetails}>
          <div>
            <div className={h.specificsHdr}>
              <h1 className={h.specificsName}>{VIEWER_NAME}</h1>
            </div>
            <div className={h.roleAndLocation}>
              {profile.role ? (
                <p className={h.role}>{profile.role}</p>
              ) : onEdit ? (
                /* "Current Role", not production's "+ Your Role". On a member's
                   own profile page the possessive is the only disambiguation
                   needed; in a drawer that also holds a dated Experience list —
                   where every entry is *also* a role of theirs — "your role"
                   stops naming anything in particular. The field is the one they
                   hold now, so it says so. */
                <button className={h.addButton} type="button" onClick={onEdit}>
                  + Current Role
                </button>
              ) : null}

              {/* The divider separates two things; with the profile locked and
                  both sides empty there is nothing to separate, and a bare rule
                  under the name reads as a rendering fault. */}
              {(profile.role || profile.location || onEdit) && <div className={h.divider} />}

              {profile.location ? (
                <div className={h.location}>
                  <LocationIcon />
                  <p className={h.locationName}>{profile.location}</p>
                </div>
              ) : onEdit ? (
                <button className={h.addButton} type="button" onClick={onEdit}>
                  + Your Location
                </button>
              ) : null}
            </div>
          </div>

          <div>{onEdit && <EditButton onClick={onEdit} />}</div>
        </div>

        {/* The whole pill row goes when the profile is locked. `hidden` was the
            first attempt and it doesn't work here — `.addPill` sets
            `display: flex`, and a display declaration beats the hidden
            attribute, so the buttons stayed on screen looking pressable. Not
            rendering them is the only honest version. The row itself goes too
            when it would be empty, or its top rule floats under the name with
            nothing beneath it. */}
        {(skillTags.length > 0 || onEdit) && (
          <div className={h.tags}>
            {skillTags.length > 0 ? (
              <TagsList tags={skillTags} />
            ) : (
              <button type="button" className={h.addPill} onClick={onEdit}>
                <PlusIcon />
                <span>Add skills</span>
              </button>
            )}

            {!hasBio && onEdit && (
              <>
                {skillTags.length > 0 && <div className={h.tagDivider} />}
                <button type="button" className={h.addPill} onClick={onEdit}>
                  <PlusIcon />
                  <span>Add bio</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Production renders the bio under the header inside the same card, and
          renders it as HTML (`ProfileDetails` L68) because the field is a rich
          editor.

          This printed it as plain text for a while, with a comment explaining
          that the drawer collected it with a textarea. The field became
          `FormEditor` and the comment outlived the fact: every bio then showed
          its own markup — the seeded profile read literally "<p>Networking and
          consensus…</p>" on screen. Same treatment as production now, including
          its empty guard: Quill leaves "<p><br></p>" behind when someone clears
          the field, and that is an empty bio wearing four tags. */}
      {hasBio && (
        <div className={p.bioContainer}>
          <div className={p.bioTitle}>Bio</div>
          <div className={p.bioContent} dangerouslySetInnerHTML={{ __html: profile.bio }} />
        </div>
      )}
    </>
  );
}

type ProfileFormData = { role: string; location: string; skills: string[]; bio: string };

/**
 * The header card's editor — production's composition, verbatim:
 *
 *   form › EditOfficeHoursFormControls + .body(rows) + EditFormMobileControls
 *
 * `EditOfficeHoursFormControls` rather than `EditFormControls` because of one
 * flag: `alwaysEnabled`. Without it Save sits disabled reading "No Changes"
 * until something is typed — right for an editor, wrong on a card that is empty
 * by definition, where the first thing a person reads would be a button telling
 * them there is nothing to do. Nothing here is required, so nothing is gated.
 */
function ProfileDetailsForm({
  profile,
  onClose,
  onSubmit,
}: {
  profile: MemberProfile;
  onClose: () => void;
  onSubmit: (patch: ProfileFormData) => void;
}) {
  const methods = useForm<ProfileFormData>({
    mode: 'onSubmit',
    defaultValues: {
      role: profile.role || EMPTY_PROFILE.role,
      location: profile.location || EMPTY_PROFILE.location,
      skills: [...profile.skills],
      bio: profile.bio || EMPTY_PROFILE.bio,
    },
  });

  return (
    <FormProvider {...methods}>
      {/* Production's form-level Enter guard, adopted wholesale — which is why
          there is no local one around the skills input. Enter is how you commit
          a tag and also how you submit a form; the tag input's own handler runs
          first on the way up and adds the tag, then this cancels the default, so
          typing a second skill can't save mid-sentence. */}
      <form
        noValidate
        onSubmit={methods.handleSubmit((data) =>
          onSubmit({
            role: data.role.trim(),
            location: data.location.trim(),
            skills: data.skills ?? [],
            bio: data.bio.trim(),
          }),
        )}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter') ev.preventDefault();
        }}
      >
        <EditOfficeHoursFormControls onClose={onClose} title="Edit Profile Details" alwaysEnabled />

        <div className={clsx(f.body, d.formBody)}>
          <div className={f.row}>
            <FormField name="role" label="Role" placeholder="e.g. Senior Protocol Engineer" />
          </div>
          <div className={f.row}>
            <FormField name="location" label="Location" placeholder="e.g. Berlin, Germany" />
          </div>
          <div className={f.row}>
            <SkillsTagsInput name="skills" selectLabel="Skills" placeholder="Add a skill" />
          </div>
          <div className={f.row}>
            <FormEditor
              name="bio"
              label="Bio"
              simplified
              placeholder="What you work on, and what you're looking for next"
            />
          </div>
        </div>

        {/* Below tablet-landscape the controls row collapses to a title and a ✕,
            and Save moves down here: a sticky bar that slides up the moment the
            form is dirty. Same component, same rule, same animation as the
            profile page. */}
      </form>
    </FormProvider>
  );
}

/* -------------------------------------------------------------- experience --- */

/**
 * `ExperiencesList`'s markup, transcribed. The component isn't imported because
 * it pulls `useMemberExperience` — a react-query hook it doesn't even use the
 * result of, taking `data` as a prop instead — and one hook is enough to make it
 * unmountable here. Its stylesheet is imported, so the empty row and the filled
 * rows are production's, down to the 40px briefcase.
 *
 * The vertical rule between title, company and location is a plain span wearing
 * `.Separator` rather than base-ui's `Separator`; the class is the whole visual
 * and a decorative rule needs no role.
 */
export function ExperienceList({ entries, onEdit }: { entries: ExperienceEntry[]; onEdit?: (uid: string) => void }) {
  return (
    <div className={e.root}>
      {entries.length > 0 && (
        <ul className={e.list}>
          {entries.map((item) => (
            <li key={item.uid} className={e.expItem}>
              <ExpIcon />
              <div className={e.details}>
                <div className={e.row}>
                  <div className={e.primaryLabel}>{item.title}</div>
                  {item.company && (
                    <>
                      <span className={e.Separator} />
                      <div className={e.primaryLabel}>{item.company}</div>
                    </>
                  )}
                  {item.location && (
                    <>
                      <span className={e.Separator} />
                      <div className={e.primaryLabel}>{item.location}</div>
                    </>
                  )}
                </div>
                <div className={e.row}>
                  <div className={e.secondaryLabel}>{formatExperienceDates(item)}</div>
                </div>
              </div>
              {/* Only when there is somewhere for it to go. This rendered
                  unconditionally and called `onEdit?.()` — a pencil that did
                  nothing whenever the list was read-only, which the onboarding
                  entry's finished-profile step made visible the moment it
                  mounted the list without a handler. `ContributionsList`, in
                  this same file, has always guarded it this way. */}
              {onEdit && (
                <button
                  type="button"
                  className={e.editBtn}
                  onClick={() => onEdit(item.uid)}
                  aria-label="Edit experience"
                >
                  <PencilIcon />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {entries.length === 0 && (
        <div className={e.emptyData}>
          <span className={e.label}>
            Share your work history and skills. This shows what you know and what you can do.
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * A key for a new entry, in any of the three lists. A counter rather than
 * `Date.now()` or `randomUUID`: both are impure, and `react-hooks/purity` rightly
 * refuses them anywhere a render could reach. One counter for all three lists
 * rather than three, because the only requirement is uniqueness within the
 * session and the prefix already says which list a key belongs to. The value is
 * never persisted or shown — production mints `uid` server-side.
 */
let uidSeq = 0;
const mintUid = (prefix: string): string => `${prefix}-${(uidSeq += 1)}`;

/* `ymToIso` / `isoToYm` used to live here. They moved to
   `profile-shared/ExperienceImport/dateBridge` when the import review became a
   second place that mounts `MonthYearSelect` against this record — two copies of
   a date bridge is two chances for one of them to start rounding differently. */

type ExperienceFormData = {
  title: string;
  company: string;
  description: string;
  /** ISO while in the form — see `ymToIso`. */
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  location: string;
};

/**
 * `EditExperienceForm`, field for field: Role, Team or Organization, a
 * description, the month/year pair with its Present switch, and Location — plus
 * production's red Delete on an existing entry, behind the same `ConfirmDialog`.
 * The real one can't be imported: it posts through a server action and a
 * react-query refresh. The fields, their labels, their order and their
 * stylesheet are its own.
 *
 * Title, company and start date are required; end date is required unless
 * Present. `FormField` takes `rules` and hands them to `register`;
 * `MonthYearSelect` is a controlled pair of react-selects that writes through
 * `setValue`, so its rules are registered by name instead — RHF keeps a rule on
 * a field whether or not an input ref ever attaches to it, and the control
 * renders whatever `error` it is handed.
 */
/* Exported for `profile-settings`, which is the second surface that edits this
   record and must not grow a second editor for it.

   It should live in `profile-shared/` rather than in a drawer — the same debt
   `SkillsTagsInput` carries in the other direction, and recorded here for the
   same reason. Left in place for now because moving ~200 lines and four
   stylesheet imports out of a verified flow is a bigger risk than the debt. */
export function ExperienceForm({
  initial,
  onClose,
  onSubmit,
  onDelete,
}: {
  initial: ExperienceEntry | null;
  onClose: () => void;
  onSubmit: (entry: ExperienceEntry) => void;
  onDelete: (uid: string) => void;
}) {
  const isNew = !initial;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const methods = useForm<ExperienceFormData>({
    mode: 'onSubmit',
    defaultValues: {
      title: initial?.title ?? '',
      company: initial?.company ?? '',
      description: initial?.description ?? '',
      startDate: ymToIso(initial?.startDate ?? null),
      endDate: ymToIso(initial?.endDate ?? null),
      isCurrent: initial?.isCurrent ?? false,
      location: initial?.location ?? '',
    },
  });
  const {
    control,
    register,
    setValue,
    trigger,
    formState: { errors },
  } = methods;

  const startDate = useWatch({ control, name: 'startDate' });
  const endDate = useWatch({ control, name: 'endDate' });
  const isCurrent = useWatch({ control, name: 'isCurrent' });

  useEffect(() => {
    register('startDate', { required: 'Start date is required' });
    register('endDate', {
      validate: (value, values) => (values.isCurrent || !!value ? true : 'End date is required'),
    });
  }, [register]);

  /* Flipping Present on is an answer to the end-date question, so the error it
     resolves should clear with it rather than wait for a second submit.
     Production does the same in `ExperienceDatesInput`. */
  useEffect(() => {
    if (isCurrent && errors.endDate) trigger('endDate');
  }, [isCurrent, errors.endDate, trigger]);

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={methods.handleSubmit((data) =>
          onSubmit({
            uid: initial?.uid ?? mintUid('exp'),
            title: data.title.trim(),
            company: data.company.trim(),
            description: data.description.trim(),
            startDate: isoToYm(data.startDate) ?? '',
            endDate: data.isCurrent ? null : isoToYm(data.endDate),
            isCurrent: data.isCurrent,
            location: data.location.trim(),
          }),
        )}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter') ev.preventDefault();
        }}
      >
        <EditOfficeHoursFormControls
          onClose={onClose}
          title={isNew ? 'Add Experience' : 'Edit Experience'}
          alwaysEnabled
        />

        {/* An "Already written down? Fill this in from your CV" line used to
            open this form. It was the only route back to the importer once the
            section had entries, which made a six-field form the front door to a
            file drop. The route is now a "Update from CV" control in the section
            header, where someone looking for it will look — and this line went
            rather than becoming the second door to it. */}
        <div className={clsx(x.body, d.formBody)}>
          <div className={x.row}>
            <FormField
              name="title"
              label="Role"
              placeholder="Enter role"
              isRequired
              rules={{ required: 'Role is required' }}
            />
          </div>
          <div className={x.row}>
            <FormField
              name="company"
              label="Team or Organization"
              placeholder="Enter team or organization"
              isRequired
              rules={{ required: 'Team or organization is required' }}
            />
          </div>
          <div className={x.row}>
            {/* Production labels this exact field "Impact or Work Description"
                (ExperienceDescriptionInput) — kept verbatim, because the label is
                what tells someone to write about impact rather than duties. */}
            <FormEditor
              name="description"
              label="Impact or Work Description"
              simplified
              placeholder="What you worked on there, and what it changed"
            />
          </div>
          {/* Production's own dates row, wearing its own stylesheet
              (`ExperienceDatesInput`): two month/year selects and the Present
              switch, which disables the end date rather than hiding it — hiding
              a field is a change you can't see you made. `.datesBody` is the one
              local addition; see the note on it in the stylesheet. */}
          <div className={di.root}>
            <div className={clsx(di.body, d.datesBody)}>
              <MonthYearSelect
                label="Start Date"
                isRequired
                error={errors.startDate?.message}
                value={startDate ?? null}
                onChange={(val) => {
                  if (val === null) return;
                  setValue('startDate', val, { shouldValidate: true, shouldDirty: true });
                }}
              />
              <MonthYearSelect
                label="End Date"
                isRequired={!isCurrent}
                disabled={!!isCurrent}
                error={errors.endDate?.message}
                value={endDate ?? null}
                onChange={(val) => {
                  if (val === null) return;
                  setValue('endDate', val, { shouldValidate: true, shouldDirty: true });
                }}
              />
              <FormSwitch name="isCurrent" label="Present" />
            </div>
          </div>
          <div className={x.row}>
            <FormField name="location" label="Location" placeholder="Enter location" />
          </div>

          {!isNew && (
            <>
              <button className={x.deleteBtn} type="button" onClick={() => setConfirmDelete(true)}>
                <DeleteIcon /> Delete Experience
              </button>
              <ConfirmDialog
                title="Delete Experience"
                desc="Are you sure you want to delete selected experience?"
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() => initial && onDelete(initial.uid)}
                confirmTitle="Delete"
              />
            </>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

/* --------------------------------------------------- project contributions --- */

/** The projects the select offers — see `profileMocks.ts`. */
const PROJECT_OPTIONS = MOCK_PROJECTS.map((name) => ({ value: name, label: name }));

/**
 * `ContributionsList`'s markup, on the shared row.
 *
 * Production sorts current projects above past ones, each group newest-first,
 * and so does this — the ordering is a fact about the list, not about the page
 * it's on, so it comes with the transcription rather than being simplified away.
 *
 * Two things come from `ContributionsList`'s own sheet rather than the shared
 * one: `.logo`, the 40px project frame that stands where Experience puts its
 * briefcase, and `.currentProjectBadge`. Everything else — `.expItem`,
 * `.details`, `.row`, the two labels, `.editBtn`, `.emptyData` — is the same row
 * Experience wears.
 *
 * Production's row is a `Link` into `/projects/<uid>`; here the project is a
 * mocked name with no page behind it, so the row is a plain div. A link that
 * goes nowhere is worse than no link.
 */
function ContributionsList({ entries, onEdit }: { entries: ContributionEntry[]; onEdit?: (uid: string) => void }) {
  const ordered = useMemo(() => {
    const current = entries.filter((i) => i.isCurrent).sort((a, b) => b.startDate.localeCompare(a.startDate));
    const past = entries.filter((i) => !i.isCurrent).sort((a, b) => (b.endDate ?? '').localeCompare(a.endDate ?? ''));
    return [...current, ...past];
  }, [entries]);

  return (
    <div className={n.root}>
      {ordered.length > 0 && (
        <ul className={n.list}>
          {ordered.map((item) => (
            <li key={item.uid} className={n.expItem}>
              {/* Production's own default, which is what every project without an
                  uploaded logo shows there. Not a generated shape: a project
                  logo is an identity, and inventing one would put a mark in
                  front of a reviewer that no real project owns. */}
              <img src="/icons/default-project.svg" alt="" width={40} height={40} className={n.logo} />
              <div className={n.details}>
                <div className={n.row}>
                  <div className={n.primaryLabel}>{item.project}</div>
                  {item.isCurrent && <div className={n.currentProjectBadge}>Current project</div>}
                </div>
                <div className={n.row}>
                  {/* Role and dates on one secondary line. Production shows only
                      the role here, because its dates live on the project page a
                      click away — there is no such page in a mock, and a
                      contribution with no period attached reads as undated
                      rather than as elsewhere-dated. */}
                  <div className={n.secondaryLabel}>
                    {item.role}
                    {item.role && ' · '}
                    {formatExperienceDates(item)}
                  </div>
                </div>
              </div>
              {onEdit && (
                <button
                  type="button"
                  className={n.editBtn}
                  onClick={() => onEdit(item.uid)}
                  aria-label="Edit project contribution"
                >
                  <PencilIcon />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {ordered.length === 0 && (
        <div className={n.emptyData}>
          {/* Production's own empty line, verbatim. */}
          <span className={n.label}>Add project experience &amp; contribution details.</span>
        </div>
      )}
    </div>
  );
}

type ContributionOption = { value: string; label: string };
type ContributionFormData = {
  project: ContributionOption | null;
  role: string;
  /** ISO while in the form — see `ymToIso`. */
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string;
};

/**
 * `EditContributionsForm`, field for field and in its order: the project select,
 * Role, the dates pair with its Present switch, and the description.
 *
 * The real one can't be imported — it reads `useMemberFormOptions`, posts
 * through `useUpdateMember` and refreshes the router — so the fields are
 * transcribed and wear `EditExperienceForm`'s stylesheet, the same one the
 * Experience form here uses. Production's two forms are visually identical, and
 * two imports would be two chances for these two cards to stop matching.
 *
 * Project and Role are required, and the dates behave exactly as Experience's
 * do: start always, end unless Present, registered by name because
 * `MonthYearSelect` is controlled. Production requires the same four.
 *
 * Dropped from production's version: the `notFoundContent` link to
 * `/projects/add` (nothing to add a project to in a mock) and the duplicate
 * check that toasts when the same project/role/date combination already exists —
 * that one guards a real record from a double submit, and the honest thing in a
 * mock is not to pretend to.
 */
function ContributionForm({
  initial,
  onClose,
  onSubmit,
  onDelete,
}: {
  initial: ContributionEntry | null;
  onClose: () => void;
  onSubmit: (entry: ContributionEntry) => void;
  onDelete: (uid: string) => void;
}) {
  const isNew = !initial;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const methods = useForm<ContributionFormData>({
    mode: 'onSubmit',
    defaultValues: {
      project: initial ? { value: initial.project, label: initial.project } : null,
      role: initial?.role ?? '',
      startDate: ymToIso(initial?.startDate ?? null),
      endDate: ymToIso(initial?.endDate ?? null),
      isCurrent: initial?.isCurrent ?? false,
      description: initial?.description ?? '',
    },
  });
  const {
    control,
    register,
    setValue,
    trigger,
    formState: { errors },
  } = methods;

  const startDate = useWatch({ control, name: 'startDate' });
  const endDate = useWatch({ control, name: 'endDate' });
  const isCurrent = useWatch({ control, name: 'isCurrent' });

  useEffect(() => {
    register('project', { required: 'Project is required' });
    register('startDate', { required: 'Start date is required' });
    register('endDate', {
      validate: (value, values) => (values.isCurrent || !!value ? true : 'End date is required'),
    });
  }, [register]);

  /* Same rule as the Experience form: flipping Present on answers the end-date
     question, so the error it resolves clears with it. */
  useEffect(() => {
    if (isCurrent && errors.endDate) trigger('endDate');
  }, [isCurrent, errors.endDate, trigger]);

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={methods.handleSubmit((data) =>
          onSubmit({
            uid: initial?.uid ?? mintUid('con'),
            project: data.project?.label ?? '',
            role: data.role.trim(),
            startDate: isoToYm(data.startDate) ?? '',
            endDate: data.isCurrent ? null : isoToYm(data.endDate),
            isCurrent: data.isCurrent,
            description: data.description.trim(),
          }),
        )}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter') ev.preventDefault();
        }}
      >
        <EditOfficeHoursFormControls
          onClose={onClose}
          title={isNew ? 'Add Project Contribution' : 'Edit Project Contribution'}
          alwaysEnabled
        />

        <div className={clsx(x.body, d.formBody)}>
          <div className={x.row}>
            {/* Production's own control and its own labels — "Project Name" over
                a select whose back label reads "Projects" on mobile, where
                `FormSelect` opens as a full-screen list with a Back header. */}
            <FormSelect
              name="project"
              label="Project Name"
              placeholder="Project"
              backLabel="Projects"
              isRequired
              options={PROJECT_OPTIONS}
            />
          </div>
          <div className={x.row}>
            <FormField
              name="role"
              label="Role"
              placeholder="Enter role"
              isRequired
              rules={{ required: 'Role is required' }}
            />
          </div>
          {/* The same dates row the Experience form uses, wearing
              `ExperienceDatesInput`'s sheet. Production's contributions form has
              its own `ContributionsDatesInput` whose markup is the same three
              controls; one sheet here keeps the two cards identical, which is
              what they are in production too. */}
          <div className={di.root}>
            <div className={clsx(di.body, d.datesBody)}>
              <MonthYearSelect
                label="Start Date"
                isRequired
                error={errors.startDate?.message}
                value={startDate ?? null}
                onChange={(val) => {
                  if (val === null) return;
                  setValue('startDate', val, { shouldValidate: true, shouldDirty: true });
                }}
              />
              <MonthYearSelect
                label="End Date"
                isRequired={!isCurrent}
                disabled={!!isCurrent}
                error={errors.endDate?.message}
                value={endDate ?? null}
                onChange={(val) => {
                  if (val === null) return;
                  setValue('endDate', val, { shouldValidate: true, shouldDirty: true });
                }}
              />
              <FormSwitch name="isCurrent" label="Present" />
            </div>
          </div>
          <div className={x.row}>
            {/* Production's `ContributionsDescriptionInput` labels this
                "Description" and asks for the contribution itself. Same editor
                the Experience card uses, `simplified` for the same reason. */}
            <FormEditor
              name="description"
              label="Description"
              simplified
              placeholder="What you contributed to the project"
            />
          </div>

          {!isNew && (
            <>
              <button className={x.deleteBtn} type="button" onClick={() => setConfirmDelete(true)}>
                <DeleteIcon /> Delete Contribution
              </button>
              <ConfirmDialog
                title="Delete Contribution"
                desc="Are you sure you want to delete selected contribution?"
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() => initial && onDelete(initial.uid)}
                confirmTitle="Delete"
              />
            </>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

/* ------------------------------------------------------------ repositories --- */

/**
 * `RepositoriesList`, transcribed — and the one section here that production
 * cannot be copied from wholesale, because production's version is unfinishable
 * from inside this drawer.
 *
 * **Why it has an `+ Add` when production doesn't.** On the profile page the
 * repositories are derived: the member types a GitHub handle in Contact Details,
 * and this card renders whatever that account has. So the card needs no editor,
 * and its empty state points at the section that does have one — "Add your Github
 * handle in the Contact Details section". This drawer has no Contact Details
 * section, which makes that sentence a pointer at nothing. Two ways out: drop the
 * card, or give it the one input it actually depends on. The input is a single
 * handle, the same field production collects one section up, so the card gets an
 * `+ Add`, the handle is collected here, and the derived half stays derived — the
 * rows are still generated from the handle, never typed (see `mockRepositories`).
 *
 * **Why it's still called `Repositories`.** This drawer is a copy of the real
 * profile, and renaming a production section makes the two read as different
 * things, which is exactly what a person arriving from their profile page would
 * have to reconcile. GitHub is named where it is the answer — in the empty state,
 * in the add form and on the profile link — so nothing is hidden by the section
 * title. Reversing this is one word: change the title below to "GitHub".
 *
 * Once a handle is set, the header carries production's own `Github Profile`
 * link, and `EditButton` next to it because a handle is a property of the section
 * rather than a row, so there is no row to hang a pencil on.
 */
function RepositoriesSection({ handle, onEdit }: { handle: string; onEdit?: () => void }) {
  const repositories = useMemo(() => (handle ? mockRepositories(handle) : []), [handle]);

  return (
    <>
      <DetailsSectionHeader title="Repositories">
        {handle ? (
          <div className={d.headerActions}>
            <Link href={`https://github.com/${handle}`} target="_blank" className={r.profileLink}>
              <Image src="/icons/contact/github-contact-logo.svg" alt="GitHub" height={24} width={24} />
              Github Profile
              <LinkIcon />
            </Link>
            {onEdit && <EditButton onClick={onEdit} />}
          </div>
        ) : onEdit ? (
          <AddButton onClick={onEdit} />
        ) : null}
      </DetailsSectionHeader>
      <div className={r.root}>
        {repositories.length > 0 && (
          <ul className={r.list}>
            {repositories.map((item) => (
              <li key={item.url} className={r.expItem}>
                <RepoIcon />
                <div className={r.details}>
                  <div className={r.row}>
                    <div className={r.primaryLabel}>{item.name}</div>
                  </div>
                  <div className={r.row}>
                    <div className={r.secondaryLabel}>{item.description}</div>
                  </div>
                </div>
                <Link href={item.url} target="_blank" className={r.link} aria-label={`Open ${item.name} on GitHub`}>
                  <LinkIcon />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {repositories.length === 0 && (
          <div className={r.emptyData}>
            {/* Production's sentence sends you to a section this drawer doesn't
                have. This one names the thing the button above it collects. */}
            <span className={r.label}>Add your GitHub handle to show your repositories.</span>
          </div>
        )}
      </div>
    </>
  );
}

type GithubFormData = { githubHandle: string };

/**
 * One field, and the same shell every other card here wears — so the section that
 * production edits somewhere else still edits the way this drawer edits.
 *
 * Required: this form exists to set a handle, and an empty save would be a Save
 * that did nothing. Clearing one is a different intention, so it gets the
 * different control — production's red delete, behind the same `ConfirmDialog`.
 */
function GithubHandleForm({
  handle,
  onClose,
  onSubmit,
}: {
  handle: string;
  onClose: () => void;
  onSubmit: (handle: string) => void;
}) {
  const isNew = !handle;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const methods = useForm<GithubFormData>({ mode: 'onSubmit', defaultValues: { githubHandle: handle } });

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={methods.handleSubmit((data) => onSubmit(data.githubHandle.trim()))}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter') ev.preventDefault();
        }}
      >
        <EditOfficeHoursFormControls
          onClose={onClose}
          title={isNew ? 'Add GitHub Handle' : 'Edit GitHub Handle'}
          alwaysEnabled
        />

        <div className={clsx(x.body, d.formBody)}>
          <div className={x.row}>
            <FormField
              name="githubHandle"
              label="GitHub handle"
              placeholder="your-handle"
              isRequired
              rules={{ required: 'GitHub handle is required' }}
            />
          </div>

          {!isNew && (
            <>
              <button className={x.deleteBtn} type="button" onClick={() => setConfirmDelete(true)}>
                <DeleteIcon /> Remove GitHub Handle
              </button>
              <ConfirmDialog
                title="Remove GitHub Handle"
                desc="Are you sure you want to remove your GitHub handle? Your repositories will stop showing."
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() => onSubmit('')}
                confirmTitle="Remove"
              />
            </>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

/* ------------------------------------------------------- job search status --- */

/**
 * Three states, one answer, and a privacy statement that is the point of the
 * section.
 *
 * **Radios, not a dropdown.** The three states mean different things to whoever
 * reads them, and a person answering has to weigh all three against each other.
 * A dropdown shows one at a time and hides the comparison; it would also hide
 * the hints, which are where the difference between "actively looking" and "open
 * to the right role" actually lives.
 *
 * **Why the radio is hand-built.** Checked: there is no PL-styled radio group in
 * this codebase. `components/form/radio-button.tsx` exists but is styled-jsx
 * with a bootstrap `#007bff` and one importer that isn't in this part of the
 * product; `InvestorsFilterRail` and the IRL toolbar use bare unstyled
 * `<input type="radio">`. So this is a native radio with a styled indicator that
 * is the DS `Checkbox` with a round corner — same 1.25rem box, same
 * `var(--Neutral-Slate-300, #cbd5e1)` unchecked border, same `#156ff7` when
 * checked, same focus ring — because the nearest thing the system does have is
 * the control that answers the same kind of question.
 *
 * **The privacy mark is `PlTeamOnlyPill`, and it was already there.** An earlier
 * pass concluded no "this field is private" convention existed and invented one:
 * Demo Day's `Alert` card wearing a sentence of its own. That was wrong twice
 * over. The convention does exist — the member-profile entry marks its internal
 * Relationship card with an uppercase lock pill reading "PL Team only" — and the
 * search had actually found it, then dismissed it for living in a prototype
 * rather than in production. For a prototype, a prototype's settled mark *is* the
 * pattern. The pill now lives in `profile-shared/` and both entries render the
 * same component.
 *
 * It also says more with less: the pill names the audience — "Visible to you and
 * LabOS admins", the member included — where the invented card only named the
 * exclusion. The one sentence that survives under it is the half the pill can't
 * carry: not the privacy again, but what the answer is *for*.
 *
 * **The two entries deliberately word it differently, so don't "fix" it.** Job
 * search status is the member's own field: they set it, they see it, admins can
 * read it — hence the default sentence above. The member profile's Relationship
 * card is PL's CRM notes *about* the member, gated on Affinity access they do
 * not have, so it passes `label="PL team only"`: there is no "you" to include.
 * Same pill, same lock, two different promises.
 *
 * **Not `openToWork`.** That field is public in three places and means "open to
 * collaborate on projects", not job-seeking; overloading it would publish an
 * answer given in confidence. See the note on `JobSearchStatus` in
 * `viewerState.ts`.
 *
 * **The one required answer, and why that doesn't make it unsafe.** This is now
 * what `isProfileComplete` reads. What is required is *an* answer, never a
 * particular one: "Not looking" completes the profile exactly as "Actively
 * looking" does, and applying is open either way. The honesty of the field
 * depends on it costing nothing to say no, and it still costs nothing — what
 * changed is only that the question can't be walked past.
 */
/** Exported for `JobAccountPane`, the apply flow's step 2 for a visitor with no
 *  account. That pane asks the same required question this one does — the status
 *  is half of `isProfileComplete` — and a second radio group with its own hints
 *  would be two versions of one field, drifting the moment either is edited. */
export function JobSearchStatusInput({
  value,
  onChange,
}: {
  value: JobSearchStatus | '';
  onChange: (next: JobSearchStatus) => void;
}) {
  return (
    <div className={d.statusRoot}>
      {/* The pill carries the audience; this line carries the purpose — and now
          the one exclusion that purpose implies but does not state.

          It used to say "Never shown on your profile" — true, but a second
          statement of the same promise the pill above it had just made, which
          left the actual question ("why are you asking?") unanswered. What the
          answer buys is being surfaced to founders who are hiring, so the note
          says that and lets the pill own the privacy.

          **The second clause is the one that decides whether the field gets an
          honest answer.** "Surfaced to founders who are hiring" is, read by
          someone currently employed, a sentence that includes their own
          founder — and the cost of that reading is not a worse answer, it is a
          false one or none at all. A privacy promise the reader has to infer
          from an omission is not a promise; the exclusion has to be said in
          the same breath as the purpose, which is why it is one sentence and
          not a second line under it.

          Still one sentence in the same 12px tertiary voice as the option
          hints, so it reads as a note on the section rather than a second
          announcement competing with the pill. */}
      <p className={d.statusPrivacyNote}>
        Used to decide whether to surface your profile to founders who are hiring — never to your current team.
      </p>

      <div className={d.statusOptions} role="radiogroup" aria-label="Job search status">
        {JOB_SEARCH_STATUS_OPTIONS.map((option) => (
          <label key={option.value} className={clsx(d.statusOption, { [d.statusOptionOn]: value === option.value })}>
            <input
              type="radio"
              name="job-search-status"
              className={d.statusInput}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className={d.statusIndicator} aria-hidden="true" />
            <span className={pc.root}>
              <span className={pc.label}>{option.label}</span>
              <span className={pc.hint}>{option.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- icons --- */

// EditInvestorProfileDrawer's own glyph, copied so the Back control it sits in is
// the same control, not a lookalike.
// Exported since the sign-up page's mobile header needs the same glyph: both
// wear `EditInvestorProfileDrawer`'s Back control, and two copies of one arrow is
// how the two steps of this flow would start pointing slightly differently.
export const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.5 9.99998C17.5 10.1657 17.4342 10.3247 17.3169 10.4419C17.1997 10.5591 17.0408 10.625 16.875 10.625H4.6336L9.19219 15.1828C9.25026 15.2409 9.29632 15.3098 9.32775 15.3857C9.35918 15.4615 9.37535 15.5429 9.37535 15.625C9.37535 15.7071 9.35918 15.7884 9.32775 15.8643C9.29632 15.9402 9.25026 16.0091 9.19219 16.0672C9.13412 16.1252 9.06518 16.1713 8.98931 16.2027C8.91344 16.2342 8.83213 16.2503 8.75 16.2503C8.66788 16.2503 8.58656 16.2342 8.51069 16.2027C8.43482 16.1713 8.36588 16.1252 8.30782 16.0672L2.68282 10.4422C2.62471 10.3841 2.57861 10.3152 2.54715 10.2393C2.5157 10.1634 2.49951 10.0821 2.49951 9.99998C2.49951 9.91785 2.5157 9.83652 2.54715 9.76064C2.57861 9.68477 2.62471 9.61584 2.68282 9.55779L8.30782 3.93279C8.42509 3.81552 8.58415 3.74963 8.75 3.74963C8.91586 3.74963 9.07492 3.81552 9.19219 3.93279C9.30947 4.05007 9.37535 4.20913 9.37535 4.37498C9.37535 4.54083 9.30947 4.69989 9.19219 4.81717L4.6336 9.37498H16.875C17.0408 9.37498 17.1997 9.44083 17.3169 9.55804C17.4342 9.67525 17.5 9.83422 17.5 9.99998Z"
      fill="currentColor"
    />
  </svg>
);

// MemberDetailHeader's location pin and add-pill plus, copied with the markup
// they belong to.
const LocationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 4.6875C9.32013 4.6875 8.65552 4.88911 8.09023 5.26682C7.52493 5.64454 7.08434 6.1814 6.82416 6.80953C6.56399 7.43765 6.49591 8.12881 6.62855 8.79562C6.76119 9.46243 7.08858 10.0749 7.56932 10.5557C8.05006 11.0364 8.66257 11.3638 9.32938 11.4964C9.99619 11.6291 10.6874 11.561 11.3155 11.3008C11.9436 11.0407 12.4805 10.6001 12.8582 10.0348C13.2359 9.46948 13.4375 8.80487 13.4375 8.125C13.4365 7.21363 13.074 6.33989 12.4295 5.69546C11.7851 5.05103 10.9114 4.68853 10 4.6875ZM10 9.6875C9.69097 9.6875 9.38887 9.59586 9.13192 9.42417C8.87497 9.25248 8.6747 9.00845 8.55644 8.72294C8.43818 8.43743 8.40723 8.12327 8.46752 7.82017C8.52781 7.51708 8.67663 7.23866 8.89515 7.02014C9.11367 6.80163 9.39208 6.65281 9.69517 6.59252C9.99827 6.53223 10.3124 6.56318 10.5979 6.68144C10.8835 6.7997 11.1275 6.99997 11.2992 7.25692C11.4709 7.51387 11.5625 7.81597 11.5625 8.125C11.5625 8.5394 11.3979 8.93683 11.1049 9.22985C10.8118 9.52288 10.4144 9.6875 10 9.6875ZM10 0.9375C8.09439 0.939568 6.26742 1.69748 4.91995 3.04495C3.57248 4.39242 2.81457 6.21939 2.8125 8.125C2.8125 14.1687 9.19063 18.7031 9.4625 18.893C9.62005 19.0032 9.8077 19.0624 10 19.0624C10.1923 19.0624 10.3799 19.0032 10.5375 18.893C11.7455 18.0027 12.8508 16.9808 13.8328 15.8461C16.0273 13.3258 17.1875 10.6539 17.1875 8.125C17.1854 6.21939 16.4275 4.39242 15.08 3.04495C13.7326 1.69748 11.9056 0.939568 10 0.9375ZM12.4453 14.5867C11.7004 15.4424 10.8822 16.2313 10 16.9445C9.1178 16.2313 8.29958 15.4424 7.55469 14.5867C6.25 13.0758 4.6875 10.7273 4.6875 8.125C4.6875 6.71604 5.24721 5.36478 6.2435 4.36849C7.23978 3.37221 8.59104 2.8125 10 2.8125C11.409 2.8125 12.7602 3.37221 13.7565 4.36849C14.7528 5.36478 15.3125 6.71604 15.3125 8.125C15.3125 10.7273 13.75 13.0758 12.4453 14.5867Z"
      fill="#455468"
    />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.5 8C13.5 8.13261 13.4473 8.25979 13.3536 8.35355C13.2598 8.44732 13.1326 8.5 13 8.5H8.5V13C8.5 13.1326 8.44732 13.2598 8.35355 13.3536C8.25979 13.4473 8.13261 13.5 8 13.5C7.86739 13.5 7.74021 13.4473 7.64645 13.3536C7.55268 13.2598 7.5 13.1326 7.5 13V8.5H3C2.86739 8.5 2.74021 8.44732 2.64645 8.35355C2.55268 8.25979 2.5 8.13261 2.5 8C2.5 7.86739 2.55268 7.74021 2.64645 7.64645C2.74021 7.55268 2.86739 7.5 3 7.5H7.5V3C7.5 2.86739 7.55268 2.74021 7.64645 2.64645C7.74021 2.55268 7.86739 2.5 8 2.5C8.13261 2.5 8.25979 2.55268 8.35355 2.64645C8.44732 2.74021 8.5 2.86739 8.5 3V7.5H13C13.1326 7.5 13.2598 7.55268 13.3536 7.64645C13.4473 7.74021 13.5 7.86739 13.5 8Z"
      fill="currentColor"
    />
  </svg>
);

// ExperiencesList's own briefcase and pencil, and EditExperienceForm's bin.
const ExpIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={e.expIcon}>
    <path
      d="M33.75 8.75H27.5V7.5C27.5 6.50544 27.1049 5.55161 26.4017 4.84835C25.6984 4.14509 24.7446 3.75 23.75 3.75H16.25C15.2554 3.75 14.3016 4.14509 13.5983 4.84835C12.8951 5.55161 12.5 6.50544 12.5 7.5V8.75H6.25C5.58696 8.75 4.95107 9.01339 4.48223 9.48223C4.01339 9.95107 3.75 10.587 3.75 11.25V31.25C3.75 31.913 4.01339 32.5489 4.48223 33.0178C4.95107 33.4866 5.58696 33.75 6.25 33.75H33.75C34.413 33.75 35.0489 33.4866 35.5178 33.0178C35.9866 32.5489 36.25 31.913 36.25 31.25V11.25C36.25 10.587 35.9866 9.95107 35.5178 9.48223C35.0489 9.01339 34.413 8.75 33.75 8.75ZM15 7.5C15 7.16848 15.1317 6.85054 15.3661 6.61612C15.6005 6.3817 15.9185 6.25 16.25 6.25H23.75C24.0815 6.25 24.3995 6.3817 24.6339 6.61612C24.8683 6.85054 25 7.16848 25 7.5V8.75H15V7.5ZM33.75 11.25V17.752C29.5309 20.0484 24.8036 21.251 20 21.25C15.1966 21.2509 10.4694 20.0486 6.25 17.753V11.25H33.75ZM33.75 31.25H6.25V20.569C10.5312 22.6631 15.2343 23.7515 20.0002 23.7511C24.7662 23.7508 29.4691 22.6617 33.75 20.567V31.25ZM16.25 17.5C16.25 17.1685 16.3817 16.8505 16.6161 16.6161C16.8505 16.3817 17.1685 16.25 17.5 16.25H22.5C22.8315 16.25 23.1495 16.3817 23.3839 16.6161C23.6183 16.8505 23.75 17.1685 23.75 17.5C23.75 17.8315 23.6183 18.1495 23.3839 18.3839C23.1495 18.6183 22.8315 18.75 22.5 18.75H17.5C17.1685 18.75 16.8505 18.6183 16.6161 18.3839C16.3817 18.1495 16.25 17.8315 16.25 17.5Z"
      fill="#CDD4DE"
    />
  </svg>
);

const PencilIcon = () => (
  <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.8789 1.35156L13.3984 1.87109C14 2.47266 14 3.42969 13.3984 4.03125L12.5781 4.85156L9.89844 2.17188L10.7188 1.35156C11.3203 0.75 12.2773 0.75 12.8789 1.35156ZM4.70312 7.36719L9.26953 2.80078L11.9492 5.48047L7.38281 10.0469C7.21875 10.2109 7 10.3477 6.78125 10.4297L4.34766 11.2227C4.12891 11.3047 3.85547 11.25 3.69141 11.0586C3.5 10.8945 3.44531 10.6211 3.52734 10.4023L4.32031 7.96875C4.40234 7.75 4.53906 7.53125 4.70312 7.36719ZM2.625 2.5H5.25C5.71484 2.5 6.125 2.91016 6.125 3.375C6.125 3.86719 5.71484 4.25 5.25 4.25H2.625C2.13281 4.25 1.75 4.66016 1.75 5.125V12.125C1.75 12.6172 2.13281 13 2.625 13H9.625C10.0898 13 10.5 12.6172 10.5 12.125V9.5C10.5 9.03516 10.8828 8.625 11.375 8.625C11.8398 8.625 12.25 9.03516 12.25 9.5V12.125C12.25 13.5742 11.0742 14.75 9.625 14.75H2.625C1.17578 14.75 0 13.5742 0 12.125V5.125C0 3.67578 1.17578 2.5 2.625 2.5Z"
      fill="#64748B"
    />
  </svg>
);

const DeleteIcon = () => (
  <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4.06641 1.24219C4.20312 0.941406 4.50391 0.75 4.83203 0.75H8.14062C8.46875 0.75 8.76953 0.941406 8.90625 1.24219L9.125 1.625H11.75C12.2148 1.625 12.625 2.03516 12.625 2.5C12.625 2.99219 12.2148 3.375 11.75 3.375H1.25C0.757812 3.375 0.375 2.99219 0.375 2.5C0.375 2.03516 0.757812 1.625 1.25 1.625H3.875L4.06641 1.24219ZM11.75 4.25L11.1484 13.5195C11.1211 14.2305 10.5469 14.75 9.83594 14.75H3.13672C2.42578 14.75 1.85156 14.2305 1.82422 13.5195L1.25 4.25H11.75Z"
      fill="#F71515"
    />
  </svg>
);

// RepositoriesList's own two glyphs: the blue graph that stands in for a repo,
// and the arrow that marks a link out to github.com. Copied with the markup they
// belong to, `.link` and all.
const RepoIcon = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0, minWidth: 40 }}
  >
    <path
      d="M10.625 27.3008C10.1578 27.3008 9.69957 27.4214 9.29492 27.6504L9.125 27.7559C8.6812 28.0524 8.33521 28.4737 8.13086 28.9668C7.9265 29.4602 7.87238 30.0036 7.97656 30.5273C8.06776 30.9857 8.27635 31.4114 8.58008 31.7637L8.71582 31.9092C9.09342 32.2868 9.57488 32.5443 10.0986 32.6484C10.5567 32.7395 11.0293 32.71 11.4707 32.5645L11.6582 32.4951C12.0899 32.3163 12.4667 32.0286 12.7529 31.6621L12.8701 31.5C13.1666 31.0561 13.3252 30.5339 13.3252 30C13.3251 29.3736 13.1074 28.7694 12.7139 28.2891L12.5342 28.0908C12.0279 27.5846 11.341 27.3008 10.625 27.3008ZM11.1514 7.35254C10.6933 7.26148 10.2207 7.29092 9.7793 7.43652L9.5918 7.50586C9.0985 7.71019 8.67656 8.05608 8.37988 8.5C8.08328 8.9439 7.92489 9.46613 7.9248 10C7.9248 10.6266 8.14245 11.2315 8.53613 11.7119L8.71582 11.9092C9.22217 12.4155 9.90892 12.7002 10.625 12.7002C11.0922 12.7002 11.5504 12.5796 11.9551 12.3506L12.125 12.2451C12.569 11.9484 12.9148 11.5265 13.1191 11.0332C13.3234 10.5399 13.3776 9.99728 13.2734 9.47363C13.1693 8.94988 12.9118 8.46842 12.5342 8.09082C12.2037 7.76045 11.7939 7.52256 11.3457 7.39844L11.1514 7.35254ZM30.4082 7.50586C29.9767 7.32713 29.5072 7.26366 29.0459 7.32031L28.8486 7.35254C28.3904 7.44368 27.9645 7.65157 27.6123 7.95508L27.4658 8.09082C27.1355 8.42118 26.8976 8.83125 26.7734 9.2793L26.7266 9.47363C26.6354 9.93193 26.6648 10.4051 26.8105 10.8467L26.8809 11.0332C27.0852 11.5265 27.431 11.9484 27.875 12.2451C28.319 12.5418 28.841 12.7002 29.375 12.7002C30.0015 12.7002 30.6055 12.4825 31.0859 12.0889L31.2842 11.9092C31.7904 11.4029 32.0752 10.716 32.0752 10C32.0751 9.46613 31.9167 8.9439 31.6201 8.5C31.3605 8.11156 31.0051 7.79805 30.5898 7.58887L30.4082 7.50586ZM28.3252 14.6895L28.1748 14.6504C27.4142 14.454 26.7152 14.0744 26.1377 13.5469L25.8984 13.3125C25.2796 12.6623 24.8551 11.8508 24.6738 10.9717C24.5153 10.2025 24.5483 9.40786 24.7676 8.65723L24.873 8.33887C25.1454 7.60212 25.5936 6.94495 26.1768 6.42383L26.4346 6.20898C27.1441 5.6591 27.9937 5.31886 28.8867 5.22754C29.668 5.14765 30.4551 5.26162 31.1797 5.55566L31.4863 5.69238C32.1918 6.03796 32.8003 6.55054 33.2598 7.18359L33.4473 7.46191C33.8631 8.12826 34.108 8.88494 34.1631 9.66504L34.1748 10.001C34.1737 10.9986 33.8628 11.9695 33.2871 12.7803L33.1689 12.9395C32.5175 13.7808 31.6051 14.3828 30.5752 14.6504L30.4248 14.6895V17.5C30.4248 18.4415 30.0505 19.345 29.3848 20.0107C28.719 20.6763 27.8164 21.0508 26.875 21.0508H13.125C12.7885 21.0508 12.4641 21.1675 12.2061 21.3789L12.0996 21.4756C11.828 21.7474 11.6749 22.1157 11.6748 22.5V25.3115L11.8252 25.3506C12.9562 25.6427 13.942 26.3369 14.5977 27.3037C15.2533 28.2706 15.5339 29.4436 15.3867 30.6025C15.2487 31.689 14.7438 32.6935 13.959 33.4512L13.7979 33.5996C12.9213 34.3718 11.7932 34.7979 10.625 34.7979C9.52972 34.7978 8.46967 34.4234 7.61914 33.7402L7.45215 33.5996C6.63043 32.8757 6.08214 31.894 5.89551 30.8193L5.86328 30.6025C5.7253 29.5159 5.96348 28.4172 6.53418 27.4873L6.65234 27.3037C7.30799 26.3369 8.29379 25.6427 9.4248 25.3506L9.5752 25.3115V14.6895L9.4248 14.6504C8.36446 14.3766 7.43197 13.749 6.7793 12.875L6.65234 12.6973C6.03757 11.7907 5.75267 10.7027 5.84082 9.61523L5.86328 9.39844C6.00127 8.31202 6.50627 7.30744 7.29102 6.5498L7.45215 6.40137C8.32874 5.62912 9.45676 5.20313 10.625 5.20312C11.7203 5.20312 12.7803 5.57752 13.6309 6.26074L13.7979 6.40137C14.6196 7.12535 15.1679 8.10689 15.3545 9.18164L15.3867 9.39844C15.5247 10.4851 15.2865 11.5838 14.7158 12.5137L14.5977 12.6973C13.942 13.664 12.9562 14.3583 11.8252 14.6504L11.6748 14.6895V19.25L11.9424 19.1543C12.227 19.0529 12.5231 18.9885 12.8232 18.9629L13.125 18.9502H26.875C27.2115 18.9502 27.5359 18.8335 27.7939 18.6221L27.9004 18.5254C28.1722 18.2535 28.3252 17.8845 28.3252 17.5V14.6895Z"
      fill="#93C5FD"
      stroke="white"
      strokeWidth="0.4"
    />
  </svg>
);

const LinkIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className={r.link}>
    <path
      d="M0.84375 8.93359C0.953125 9.07031 1.11719 9.125 1.28125 9.125C1.47266 9.125 1.63672 9.07031 1.74609 8.93359L8.0625 2.61719V7.59375C8.0625 7.97656 8.36328 8.25 8.71875 8.25C9.10156 8.25 9.375 7.97656 9.375 7.59375V1.03125C9.375 0.675781 9.10156 0.375 8.71875 0.375H2.15625C1.80078 0.375 1.5 0.675781 1.5 1.03125C1.5 1.41406 1.80078 1.6875 2.15625 1.6875H7.16016L0.84375 8.00391C0.570312 8.27734 0.570312 8.6875 0.84375 8.93359Z"
      fill="#0F172A"
    />
  </svg>
);
