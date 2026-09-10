'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { uniq } from 'lodash';

import { BackButton } from '@/components/ui/BackButton';
import { DetailsSection } from '@/components/common/profile/DetailsSection/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { EditButton } from '@/components/common/profile/EditButton';
import { TagsList } from '@/components/common/profile/TagsList';
import { AddButton } from '@/components/page/member-details/components/AddButton/AddButton';
import { DataIncomplete } from '@/components/page/member-details/DataIncomplete/DataIncomplete';
import { InfoCircleIcon } from '@/components/icons';
import { ProfileSocialLink } from '@/components/page/member-details/profile-social-link';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

// Production's own stylesheets for every card on this page, imported rather than
// re-typed. The page is `app/members/[id]/page.tsx`; these are the sheets its
// sections wear, in the order that page renders them.
import p from '@/components/page/member-details/ProfileDetails/ProfileDetails.module.scss';
import h from '@/components/page/member-details/MemberDetailHeader/MemberDetailHeader.module.scss';
import ib from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView/components/InvestorPromptBanner/InvestorPromptBanner.module.scss';
import iv from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView/InvestorProfileView.module.scss';
import id from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView/components/InvestmentDetailsSection/InvestmentDetailsSection.module.scss';
import e from '@/components/page/member-details/ExperienceDetails/components/ExperienceDetailsView/components/ExperiencesList/ExperiencesList.module.scss';
import n from '@/components/page/member-details/ContributionsDetails/components/ContributionsList/ContributionsList.module.scss';
import rl from '@/components/page/member-details/RepositoriesDetails/components/RepositoriesList/RepositoriesList.module.scss';
import cd from '@/components/page/member-details/contact-details/ContactDetails.module.scss';

import { ExperienceImportPanel, type ImportStatus } from '../profile-shared/ExperienceImport/ExperienceImportPanel';
// The CV-read lock: while a file is uploading or being read, the cards it will
// write to are muted and say when they come back. See `ImportLock`.
import {
  ImportLockNote,
  importLockClass,
  importLockWrapClass,
  isImportWaiting,
} from '../profile-shared/ExperienceImport/ImportLock';
import { OptionalMark } from '../profile-shared/OptionalMark';
// The kept CV at rest — shared with the apply flow's profile step, so the two
// surfaces cannot drift on what "your CV" looks like. See the folder's notes.
import {
  CvFileCard,
  CvHeaderActions,
  RemoveCvDialog,
  storedCvFromFile,
  withSampleUrl,
  MOCK_STORED_CV,
  type StoredCv,
} from '../profile-shared/StoredCv';
import { ExperienceImportReview } from '../profile-shared/ExperienceImport/ExperienceImportReview';
import { parseResultFor } from '../profile-shared/ExperienceImport/parseMocks';
import type { ImportSelection, ParsedProfile } from '../profile-shared/ExperienceImport/types';
// The prototype-only state switch, from the row the job board wears it in.
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import { ExperienceList } from '../job-board/JobProfilePane';
import { formatExperienceDates, type ExperienceEntry } from '../job-board/viewerState';

import { MOCK_USER } from './mocks';
// DELETE WITH: the `design-canvas/` folder.
import { readCanvasState, type OnboardingCanvasState } from './canvasStates';
import o from './Onboarding.module.scss';

/**
 * A brand-new member profile, as dev renders it — and the CV drop that fills it.
 *
 * **This is a copy, not a design.** The first version of this entry was an
 * invented four-step wizard, and it was wrong: the product does not create
 * profiles in a wizard. Production's onboarding modal collects five contact
 * fields and then `router.replace`s you to `/members/<uid>`, and *that page* is
 * where a profile actually gets written — through the amber placeholders and
 * prompt banners a new member lands on. So this is transcribed from
 * `app/members/[id]/page.tsx` in the order it renders, wearing its real
 * stylesheets. Nothing here is arranged to taste.
 *
 * **In dev's order:** the header card with its `+ Your Role` / `+ Your Location`
 * pair and the `+ Add skills` / `+ Add bio` pills; the investor prompt banner
 * with Add Details / Not an Investor, over the Investment Details block; Office
 * Hours with its prompt; Contact Details with its prompt; then Experience,
 * Project Contributions and Repositories.
 *
 * **The one addition, and the point of the entry:** a `Your CV` section under
 * the header card, carrying the same importer the apply drawer and the settings
 * page mount, so three surfaces share one implementation. This is where a
 * document is worth the most: every field a hiring team reads is empty at this
 * exact moment, and one drop fills the role and location on the header card, the
 * skills pill, and the whole list. It is a permanent section rather than a
 * first-run offer, because the file is kept and goes out with every application
 * — see `showCvSection` for why that changes what the card is.
 *
 * **Omitted, and why:** `ForumActivity`, `TeamsDetails` and the `TeamNews` rail
 * all render lists of things a member who signed up ten seconds ago does not
 * have, and the `member-profile` entry already covers them for a filled profile.
 * `OneClickVerification` is a modal trigger, not a section.
 *
 * The avatar is production's seeded dicebear shape (`getDefaultAvatar(name)`) —
 * dev's own output for a member with no photo, including the fact that this name
 * renders as a disc with a triangle in it. It reads like a play button and was
 * briefly swapped for the blank placeholder; it is what dev shows, so it stays.
 */

/* `host` remembers which card an import is happening in — see the job board's
   `EditTarget` for why: the file becomes the CV the moment it is read, and the
   CV section must not appear over a review the Experience card is showing. */
type EditTarget = { kind: 'import'; host?: 'experience' } | null;

/**
 * **Prototype-only: the three states of this page, as a switch.**
 *
 * The page opens blank and every later state is component state a person
 * reaches by dropping a document — so the two states the CV section was
 * *changed* for could not be looked at without either uploading a file or
 * editing a URL, and one of them (a filled profile that never had a CV) could
 * not be reached by using the page at all. That is what the switch is for; it
 * is the job board's own `Preview as` row, same component and same classes.
 *
 * Three, and only three: the CV section's states are the page's states.
 *
 *  - a new profile, where the section is the offer and everything under it is
 *    empty;
 *  - a profile with answers and no file — written by hand, or one whose CV was
 *    removed — where the section stays, on the same offer;
 *  - the same profile with the document on it, at rest.
 *
 * The reading and review beats are not here: they are a press away inside each
 * of these, and a switch position for a state the page can reach on its own is
 * scaffolding competing with the thing it demonstrates. (`?canvas=` still pins
 * those for the design canvas — a separate mechanism with a separate consumer,
 * and it wins on mount. See `canvasStates.ts`.)
 */
const PREVIEW_PARAM = 'state';

/** The document the seeded states were filled from — `canvasStates`' `FIRST_CV`. */
const PREVIEW_SEED = parseResultFor('three-roles');

const PREVIEW_STATES: Array<{ value: string; label: string; seed?: ParsedProfile; cv?: boolean }> = [
  { value: 'new', label: 'New profile' },
  { value: 'no-cv', label: 'Filled in, no CV', seed: PREVIEW_SEED },
  { value: 'with-cv', label: 'Filled in, with CV', seed: PREVIEW_SEED, cv: true },
];

type PreviewState = (typeof PREVIEW_STATES)[number]['value'];

/** A parse's positions as profile rows. One mapping, two callers. */
const toExperienceEntries = (entries: ImportSelection['experiences'], offset: number): ExperienceEntry[] =>
  entries.map((entry, i) => ({
    uid: `new-exp-${offset + i + 1}`,
    title: entry.title,
    company: entry.company,
    description: entry.description,
    startDate: entry.startDate,
    endDate: entry.isCurrent ? null : entry.endDate,
    isCurrent: entry.isCurrent,
    location: entry.location,
  }));

export default function OnboardingPrototype() {
  const [editing, setEditing] = useState<EditTarget>(null);
  const [parsed, setParsed] = useState<ParsedProfile | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const cvInput = useRef<HTMLInputElement>(null);
  /* The profile's kept CV — the file, as distinct from the fields read out of
     it. Null on a new profile; set the moment a document has been read. */
  const [cv, setCv] = useState<StoredCv | null>(null);
  const [confirmRemoveCv, setConfirmRemoveCv] = useState(false);
  /* What the import panel is doing, reported by whichever mount is live. While
     it is uploading or reading, the cards the document fills — the header card
     (role, location, skills), Contact Details (email) and Experience — are
     locked; see `ImportLock`. The card hosting the panel is never locked. */
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const cvWaiting = isImportWaiting(importStatus);

  /* Seeded from the account, which is where production gets it: sign-up runs
     before this page exists. `MOCK_USER.email` is empty and the name isn't —
     that asymmetry is the fixture's whole point, and it is what makes the import
     review offer an Email field here and no Name field. */
  const [email, setEmail] = useState(MOCK_USER.email);
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([]);
  const [investorHidden, setInvestorHidden] = useState(false);
  /* Prototype-only: which of `PREVIEW_STATES` the switch is on. */
  const [preview, setPreview] = useState<PreviewState>(PREVIEW_STATES[0].value);

  /* DELETE WITH: the `design-canvas/` folder. The review-only state pinned by
     `?canvas=`, and the gate that lets it land before anything renders — the
     importer panel seeds its own `useState` from the props it mounts with, so a
     state applied one paint later would never reach it. See `canvasStates.ts`. */
  const [canvas, setCanvas] = useState<OnboardingCanvasState | null>(null);
  const [mounted, setMounted] = useState(false);

  const skillTags = useMemo(() => skills.map((title) => ({ title })), [skills]);
  const importing = editing?.kind === 'import';

  /**
   * Nothing on the profile yet — which is every field this page is made of, not
   * just the work history.
   *
   * That is why the CV sits at the top: a document fills the header card's role
   * and location and the skills row as well as the Experience list, so offering
   * it *inside* the Experience section described it as smaller than it is and
   * buried it four cards down the page. A control that answers the questions
   * above it belongs above them.
   *
   * It is no longer what decides whether the section is drawn — see below — and
   * now says only one thing: whether the lede promising a fill-in is true.
   */
  const profileIsBlank =
    role.trim() === '' && location.trim() === '' && skills.length === 0 && experiences.length === 0;

  /**
   * **The CV section is permanent.** It used to appear only while the profile
   * was blank and disappear the moment anything was filled in, because it was an
   * *importer offer* — a control with a job that finishes. It isn't one any
   * more: the CV is kept and goes out with every application (see `StoredCv`),
   * so it is a thing the profile *holds*, and a profile page shows what it holds.
   * Every other card on this page renders empty and says what would fill it —
   * Repositories, Project Contributions, Office Hours — and a section that
   * vanished when it had nothing was the odd one out. It also left a filled
   * profile with no way to add a CV at all, and the only door left, "Update from
   * CV" in the Experience header, named the import rather than the document.
   *
   * The rule it always had still holds and now holds always: while the section
   * is drawn it is the importer's only host, so the Experience header's "Update
   * from CV" stands down and Replace on the section takes its job. The one
   * exception is a review the Experience card is already showing — the file
   * becomes the CV the moment it is read, and the section must not appear over
   * that card's own review.
   */
  const importHost: 'cv' | 'experience' | null = importing ? (editing?.host ?? 'cv') : null;
  const showCvSection = importHost !== 'experience';

  /* The Experience card's lock: through the read, and then through the review
     the CV section shows once the read lands — the positions it found are on
     no profile until that card's Save. Never while this card is the importer's
     own host. See `importReviewLockCopy`. */
  const reviewingFromCv = importing && !!parsed && importHost !== 'experience';
  const experienceLocked = (cvWaiting && importHost !== 'experience') || reviewingFromCv;

  const closeImport = () => {
    setEditing(null);
    setParsed(null);
    setPickedFile(null);
  };

  /* "The upload is the store" — see `ExperienceImportPanel.onFileRead`. */
  const keepFile = (file: File) => {
    setCv(storedCvFromFile(file));
  };

  /* The file goes; every field it filled in stays. See `RemoveCvDialog`. The
     section stays too, back on its offer — it is permanent now, so removal no
     longer needs a flag holding the card open. */
  const removeCv = () => {
    setCv(null);
    setConfirmRemoveCv(false);
  };

  /* The same three merge rules every surface mounting this importer applies:
     fill only a blank, union the skills, append the positions.

     Email joins the first rule rather than getting one of its own — it is a
     scalar the document offered and the profile was missing, which is exactly
     what `role` and `location` are. The name is not here: `MOCK_USER.name` comes
     from sign-up and is never blank, so the review never asks for it and there
     is nothing to fill. */
  const applyImport = (selection: ImportSelection) => {
    if (email.trim() === '') setEmail(selection.email.trim());
    if (role.trim() === '') setRole(selection.role.trim());
    if (location.trim() === '') setLocation(selection.location.trim());
    setSkills((prev) => uniq([...prev, ...selection.skills]));
    setExperiences((prev) => [...prev, ...toExperienceEntries(selection.experiences, prev.length)]);
    closeImport();
  };

  /* Prototype-only. Jumps the page to one of `PREVIEW_STATES` — see there for
     what the three are and why.

     Absolute sets rather than a replay of `applyImport`: the merge rules only
     describe what a document adds to what is already on the profile, and a
     switch is not adding anything, it is answering "what does this page look
     like in that state". Against a blank profile the two agree anyway — fill
     every blank, take every skill, append every position — so the frames the
     switch shows are still frames the real pipeline can produce. (Resetting and
     then calling `applyImport` in the same handler would not work in any case:
     it reads `role`/`email` from the render it was made in, so it would see the
     values being cleared and decline to fill them.) */
  const applyPreview = (value: PreviewState) => {
    const next = PREVIEW_STATES.find((state) => state.value === value);
    if (!next) return;
    setPreview(value);
    closeImport();
    setConfirmRemoveCv(false);
    const { seed } = next;
    setEmail(seed?.email?.trim() || MOCK_USER.email);
    setRole(seed?.role.trim() ?? '');
    setLocation(seed?.location.trim() ?? '');
    setSkills(seed ? [...seed.skills] : []);
    setExperiences(seed ? toExperienceEntries(seed.experiences, 0) : []);
    setCv(next.cv ? withSampleUrl(MOCK_STORED_CV) : null);
    /* So a shared link opens on the state the sender was looking at. `replace`
       rather than `push`: these are the same page in a different state, and a
       back button walking through preview states would be scaffolding taking
       over a real control. */
    const url = new URL(window.location.href);
    if (value === PREVIEW_STATES[0].value) url.searchParams.delete(PREVIEW_PARAM);
    else url.searchParams.set(PREVIEW_PARAM, value);
    window.history.replaceState(null, '', url.toString());
  };

  /* DELETE WITH: the `design-canvas/` folder.

     A seeded profile is applied through `applyImport` rather than through
     `setRole`/`setExperiences` directly, so a frame of a filled profile is
     merged by the same three rules a real import is. `AFTER_BOTH` is one
     `ParsedProfile` for the same reason: two calls in one effect would read each
     other's stale state and the second would overwrite the role. */
  useEffect(() => {
    const state = readCanvasState(window.location.search);
    if (state?.seed) {
      applyImport({
        experiences: state.seed.experiences,
        skills: state.seed.skills,
        name: state.seed.name ?? '',
        email: state.seed.email ?? '',
        role: state.seed.role,
        location: state.seed.location,
      });
    }
    if (state?.review) {
      setParsed(state.review);
      setEditing({ kind: 'import' });
    }
    if (state?.cv) setCv(withSampleUrl(MOCK_STORED_CV));
    if (state?.removeCv) setConfirmRemoveCv(true);
    /* A pinned reading beat over a kept file is Replace in progress. */
    if (state?.cv && state?.panel?.status) setEditing({ kind: 'import' });
    setCanvas(state);
    /* The switch's own query, read only when the canvas has not pinned
       something — a capture asked for one exact frame and a preview state
       landing on top of it would be a second answer to the same question. */
    const wanted = new URLSearchParams(window.location.search).get(PREVIEW_PARAM);
    if (!state && wanted) applyPreview(wanted);
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return <div className={o.page} />;

  return (
    <div className={o.page}>
      <div className={o.column}>
        {/* Prototype-only. It joins the Back row rather than taking a band of
            its own, so the scaffolding costs the page no vertical space and
            nothing below it moves — the same reason the AI Apps preview pill
            was moved into that page's masthead. No note under the labels: the
            page *is* the note, and a sentence restating "Filled in, no CV" is
            the kind of caption this file keeps deleting. */}
        <div className={o.topRow}>
          <BackButton to="/prototypes" />
          <div className={v0.switchBar}>
            <span className={v0.switchLabel}>Preview</span>
            <div className={v0.switch} role="tablist" aria-label="Profile state">
              {PREVIEW_STATES.map((state) => (
                <button
                  key={state.value}
                  type="button"
                  role="tab"
                  aria-selected={preview === state.value}
                  className={`${v0.switchBtn} ${preview === state.value ? v0.switchBtnActive : ''}`}
                  onClick={() => applyPreview(state.value)}
                >
                  {state.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 1. The header card. `ProfileDetails` is a plain div in production, so
               this is one too, and every placeholder in it is production's own:
               the amber pair with its divider, the two grey pills, the blue
               Edit. */}
        <div className={clsx(p.root, cvWaiting && importLockClass)} inert={cvWaiting}>
          <div className={h.header}>
            <div className={h.headerProfile}>
              <img className={h.headerProfileImg} src={getDefaultAvatar(MOCK_USER.name)} alt="" />
            </div>
            <div className={h.headerDetails}>
              <div>
                <div className={h.specificsHdr}>
                  <h1 className={h.specificsName}>{MOCK_USER.name}</h1>
                </div>
                <div className={h.roleAndLocation}>
                  {role ? (
                    <p className={h.role}>{role}</p>
                  ) : (
                    <button className={h.addButton} type="button">
                      + Your Role
                    </button>
                  )}
                  <div className={h.divider} />
                  {location ? (
                    <div className={h.location}>
                      <p className={h.locationName}>{location}</p>
                    </div>
                  ) : (
                    <button className={h.addButton} type="button">
                      + Your Location
                    </button>
                  )}
                </div>
              </div>
              <div>
                {cvWaiting ? <ImportLockNote status={importStatus} /> : <EditButton onClick={() => undefined} />}
              </div>
            </div>
            <div className={h.tags}>
              {skillTags.length > 0 ? (
                <TagsList tags={skillTags} />
              ) : (
                <button type="button" className={h.addPill}>
                  <PlusIcon />
                  <span>Add skills</span>
                </button>
              )}
              {skillTags.length > 0 && <div className={h.tagDivider} />}
              <button type="button" className={h.addPill}>
                <PlusIcon />
                <span>Add bio</span>
              </button>
            </div>
          </div>
        </div>

        {/* Below the header card, like the apply step (production's order for
            the drawer, `JobProfileDrawer`): the page says whose profile this is
            first, and the CV — offer or kept file — follows, above the sections
            it fills. */}
        {/* 0. Your CV — the document the profile holds, and the offer to add one.

               Not part of dev's page — this is the one addition the entry is
               for, and it sits above the transcription rather than inside it so
               what is copied stays legible as a copy. It is a plain
               `DetailsSection` like every card under it, and like every card
               under it it is always drawn: empty on a profile with no CV, and
               holding the file once there is one. See `showCvSection`. */}
        {showCvSection && (
          <DetailsSection editView={importing}>
            {importing && parsed ? (
              <ExperienceImportReview
                parsed={parsed}
                /* The account has a name from sign-up and no email yet, so this
                   is the one surface where the review shows a contact field — an
                   Email, and only an Email. Nothing is special-cased inside the
                   card: it asks for the blank one and skips the filled one, the
                   same rule it has always applied to role and location. */
                currentName={MOCK_USER.name}
                currentEmail={email}
                currentRole={role}
                currentLocation={location}
                currentSkills={skills}
                currentExperiences={experiences}
                formatDates={formatExperienceDates}
                onClose={closeImport}
                onSubmit={applyImport}
              />
            ) : cv && !importing ? (
              /* **The resting state: a kept file.** The same card the apply
                 flow's profile step shows — title, header pair, file row — from
                 the same shared components. See the job board's copy of this
                 branch for the reasoning; nothing here is decided differently. */
              <>
                <DetailsSectionHeader title="Your CV">
                  <CvHeaderActions
                    onReplace={(file) => {
                      setPickedFile(file);
                      setEditing({ kind: 'import' });
                    }}
                    onRemove={() => setConfirmRemoveCv(true)}
                  />
                </DetailsSectionHeader>
                <CvFileCard cv={cv} />
                <RemoveCvDialog
                  isOpen={confirmRemoveCv}
                  onClose={() => setConfirmRemoveCv(false)}
                  onConfirm={removeCv}
                />
              </>
            ) : (
              <>
                {/* Same offer, same mark, same words as the two job-board
                    surfaces that make it — see `OptionalMark`. Over a kept file
                    being replaced, the resting title and a Cancel back to it. */}
                <DetailsSectionHeader
                  title={
                    cv ? (
                      'Your CV'
                    ) : (
                      <>
                        You can upload your CV
                        <OptionalMark />
                      </>
                    )
                  }
                >
                  {importing && (
                    <button type="button" className={o.headerAction} onClick={closeImport}>
                      Cancel
                    </button>
                  )}
                </DetailsSectionHeader>
                {/* Word for word the apply drawer's line. One sentence for one
                    offer across every surface that makes it — a cross-surface
                    promise that reads differently per page is drift. Only under
                    the offer; a replace in progress says what it is doing in
                    the reading row.

                    And only on a blank profile, which is the state its first
                    clause describes: on a filled one there is no role, location
                    or skill left to fill in, and the second clause is already
                    said under the drop area by `privacyNote`. Rather than a
                    second, shorter version of the same promise — two strings
                    for one fact is exactly the drift the note above warns
                    about — the card lets the privacy line carry it alone. */}
                {!cv && profileIsBlank && (
                  <p className={o.cvFirstNote}>
                    We&apos;ll fill in your role, skills and experience from it — and it goes with your applications, so
                    teams read the document you wrote as well as the profile.
                  </p>
                )}
                {/* Both, not just `setParsed`: the review renders on
                    `importing && parsed`, so handing over the result without
                    also opening the card left the parse in state with nothing
                    showing it. */}
                <ExperienceImportPanel
                  entry="direct"
                  privacyNote="Kept on your profile and sent with your applications. You can replace or remove it any time."
                  initialFile={pickedFile}
                  onFileRead={keepFile}
                  onStatusChange={setImportStatus}
                  onCancelRead={cv ? closeImport : undefined}
                  onParsed={(result) => {
                    setParsed(result);
                    setEditing({ kind: 'import' });
                  }}
                  onAddManually={() => undefined}
                  // DELETE WITH: the `design-canvas/` folder.
                  canvasStatus={canvas?.panel?.status}
                  canvasFileName={canvas?.panel?.fileName}
                />
              </>
            )}
          </DetailsSection>
        )}

        {/* 2. Investor Details, behind its prompt. This is the interactive
               variant `InvestorPromptBanner` renders while `isInvestor === null`
               — the state a new member is in. "Not an Investor" hides the
               section, which is what production does with it. */}
        {!investorHidden && (
          <DetailsSection>
            <div className={ib.incompleteWarning}>
              <div className={ib.warningContent}>
                <div className={ib.warningIcon}>
                  <InfoCircleIcon />
                </div>
                <div className={ib.warningText}>
                  Do you invest in startups? Add your investor details to receive demo day invites and deal flow intros.
                </div>
                <div className={ib.warningButtons}>
                  <button type="button" className={ib.linkButton}>
                    <PlusIcon />
                    Add Details
                  </button>
                  <button type="button" className={ib.linkButton} onClick={() => setInvestorHidden(true)}>
                    <CloseSmIcon />
                    Not an Investor
                  </button>
                </div>
              </div>
            </div>

            <div className={o.sectionBody}>
              <DetailsSectionHeader title="Investor Details">
                <EditButton onClick={() => undefined} />
              </DetailsSectionHeader>
              <div className={iv.content}>
                <div className={id.section}>
                  {INVESTOR_FIELDS.map((field) => (
                    <div className={id.keywordsWrapper} key={field.label}>
                      <span className={id.keywordsLabel}>{field.label}</span>
                      <span className={id.badgesWrapper}>
                        <button type="button" className={id.addPill}>
                          <PlusIcon />
                          <span>{field.add}</span>
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DetailsSection>
        )}

        {/* 3. Office Hours, with its own prompt. */}
        <DetailsSection>
          <DataIncomplete className={o.promptStrip}>
            Make it easy for others in the network to connect with you — add your Office Hours link to enable quick 1:1
            conversations.
          </DataIncomplete>
          <div className={o.sectionBody}>
            <DetailsSectionHeader title="Office Hours" />
            <div className={o.officeHoursRow}>
              <span className={o.officeHoursText}>
                OH are short 15min 1:1 calls to connect about topics of interest or help others with your expertise.
                Share your calendar. You will also access other members OH.
              </span>
              <button type="button" className={o.primaryAction}>
                Add Office Hours <PlusIcon />
              </button>
            </div>
          </div>
        </DetailsSection>

        {/* 4. Contact details, with its own prompt — the strip the screenshot
               cuts off at the bottom of the fold.

               **Where the imported email lands.** The review offers to fill an
               email because this account hasn't got one; this is the card that
               owns email on dev's page, so this is where the answer has to show
               up. Without that the field would ask for something and do nothing
               with it, which is the worst kind of field.

               The filled state is production's own — `contact-details`' grey
               `.social` block holding a `ProfileSocialLink` — rather than a line
               of text, so the row a CV fills in looks like the row a person
               types in. `isPreview` because a mocked address has no inbox behind
               it; a link that goes nowhere is worse than no link.

               The prompt strip stays either way. It asks for "contact details"
               plural — Telegram and the social links are still missing — and one
               filled row does not answer it. */}
        <div className={clsx(importLockWrapClass, cvWaiting && importLockClass)} inert={cvWaiting}>
          <DetailsSection>
            <DataIncomplete className={o.promptStrip}>
              Complete your profile by adding contact details — make it easier for others to connect with you.
            </DataIncomplete>
            <div className={o.sectionBody}>
              <DetailsSectionHeader title="Contact Details">
                {cvWaiting ? <ImportLockNote status={importStatus} /> : <EditButton onClick={() => undefined} />}
              </DetailsSectionHeader>
              {email ? (
                <div className={cd.social}>
                  <div className={cd.top}>
                    <div className={cd.content}>
                      <ProfileSocialLink
                        type="email"
                        profile={email}
                        handle={email}
                        logo={getContactLogoByProvider('email')}
                        height={24}
                        width={24}
                        isPreview
                        callback={() => undefined}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className={e.root}>
                  <div className={e.emptyData}>
                    <span className={e.label}>Add your email, Telegram and social links so members can reach you.</span>
                  </div>
                </div>
              )}
            </div>
          </DetailsSection>
        </div>

        {/* 5. Experience.

               The card can still host an import — the review, the drop area,
               and "Update from CV" in its header are all still here — but with
               the CV section permanent nothing can open them any more: every
               one is gated on `!showCvSection`, and the document's doors now
               live on the section that owns it (its drop area when there is no
               file, Replace when there is). Kept rather than deleted because
               the gates were already there and already correct; if the CV ever
               stops being a kept profile object, this is the path that comes
               back. */}
        {/* Locked with the rest while the CV section above is reading; never
            while this card is the importer's own host. */}
        <div className={clsx(importLockWrapClass, experienceLocked && importLockClass)} inert={experienceLocked}>
          <DetailsSection editView={importing && importHost === 'experience'}>
            {importing && importHost === 'experience' ? (
              parsed ? (
                <ExperienceImportReview
                  parsed={parsed}
                  /* The account has a name from sign-up and no email yet, so this
                   is the one surface where the review shows a contact field — an
                   Email, and only an Email. Nothing is special-cased inside the
                   card: it asks for the blank one and skips the filled one, the
                   same rule it has always applied to role and location. */
                  currentName={MOCK_USER.name}
                  currentEmail={email}
                  currentRole={role}
                  currentLocation={location}
                  currentSkills={skills}
                  currentExperiences={experiences}
                  formatDates={formatExperienceDates}
                  onClose={closeImport}
                  onSubmit={applyImport}
                />
              ) : (
                <>
                  <DetailsSectionHeader title="Add experience from a document">
                    <button type="button" className={o.headerAction} onClick={closeImport}>
                      Cancel
                    </button>
                  </DetailsSectionHeader>
                  <ExperienceImportPanel
                    entry="direct"
                    initialFile={pickedFile}
                    onFileRead={keepFile}
                    onStatusChange={setImportStatus}
                    onParsed={setParsed}
                    onAddManually={closeImport}
                  />
                </>
              )
            ) : (
              <>
                <DetailsSectionHeader title={`Experience ${experiences.length ? `(${experiences.length})` : ''}`}>
                  {experienceLocked ? (
                    <ImportLockNote status={importStatus} reviewing={reviewingFromCv} />
                  ) : (
                    <div className={o.headerActions}>
                      {/* Off while the CV section is drawn — Replace there is this
                      control's job, and one mechanism gets one door. */}
                      {experiences.length > 0 && !showCvSection && (
                        <>
                          <button type="button" className={o.headerAction} onClick={() => cvInput.current?.click()}>
                            Update from CV
                          </button>
                          <input
                            ref={cvInput}
                            type="file"
                            className={o.visuallyHidden}
                            accept=".pdf,.doc,.docx"
                            onChange={(ev) => {
                              const chosen = ev.target.files?.[0] ?? null;
                              ev.target.value = '';
                              if (!chosen) return;
                              setPickedFile(chosen);
                              setEditing({ kind: 'import', host: 'experience' });
                            }}
                          />
                        </>
                      )}
                      <AddButton onClick={() => undefined} />
                    </div>
                  )}
                </DetailsSectionHeader>
                {experiences.length === 0 && !showCvSection ? (
                  <ExperienceImportPanel
                    emptyLabel="Share your work history and skills. This shows what you know and what you can do."
                    privacyNote="Kept on your profile and sent with your applications. You can replace or remove it any time."
                    onFileRead={keepFile}
                    onStatusChange={setImportStatus}
                    onParsed={(result) => {
                      setParsed(result);
                      setEditing({ kind: 'import', host: 'experience' });
                    }}
                    onAddManually={() => undefined}
                  />
                ) : experiences.length === 0 ? (
                  /* Production's own empty row, unadorned. Reached only while the
                   card at the top is making the offer — this section should not
                   make it a second time. */
                  <div className={e.root}>
                    <div className={e.emptyData}>
                      <span className={e.label}>
                        Share your work history and skills. This shows what you know and what you can do.
                      </span>
                    </div>
                  </div>
                ) : (
                  <ExperienceList entries={experiences} />
                )}
              </>
            )}
          </DetailsSection>
        </div>

        {/* 6 and 7. Production's own empty copy, word for word. */}
        <DetailsSection>
          <DetailsSectionHeader title="Project Contributions">
            <AddButton onClick={() => undefined} />
          </DetailsSectionHeader>
          <div className={n.root}>
            <div className={n.emptyData}>
              <span className={n.label}>Add project experience &amp; contribution details.</span>
            </div>
          </div>
        </DetailsSection>

        <DetailsSection>
          <DetailsSectionHeader title="Repositories" />
          <div className={rl.root}>
            <div className={rl.emptyData}>
              <span className={rl.label}>Add your GitHub handle to show your repositories.</span>
            </div>
          </div>
        </DetailsSection>
      </div>
    </div>
  );
}

/** `InvestmentDetailsSection`'s three fields, in its order. */
const INVESTOR_FIELDS = [
  { label: 'Startup Stages', add: 'Add startup stages' },
  { label: 'Typical Check Size', add: 'Typical check size' },
  { label: 'Investment Focus', add: 'Investment focus' },
];

/** `MemberDetailHeader`'s plus, and `InvestmentDetailsSection`'s — same glyph. */
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.5 8C13.5 8.13261 13.4473 8.25979 13.3536 8.35355C13.2598 8.44732 13.1326 8.5 13 8.5H8.5V13C8.5 13.1326 8.44732 13.2598 8.35355 13.3536C8.25979 13.4473 8.13261 13.5 8 13.5C7.86739 13.5 7.74021 13.4473 7.64645 13.3536C7.55268 13.2598 7.5 13.1326 7.5 13V8.5H3C2.86739 8.5 2.74021 8.44732 2.64645 8.35355C2.55268 8.25979 2.5 8.13261 2.5 8C2.5 7.86739 2.55268 7.74021 2.64645 7.64645C2.74021 7.55268 2.86739 7.5 3 7.5H7.5V3C7.5 2.86739 7.55268 2.74021 7.64645 2.64645C7.74021 2.55268 7.86739 2.5 8 2.5C8.13261 2.5 8.25979 2.55268 8.35355 2.64645C8.44732 2.74021 8.5 2.86739 8.5 3V7.5H13C13.1326 7.5 13.2598 7.55268 13.3536 7.64645C13.4473 7.74021 13.5 7.86739 13.5 8Z"
      fill="currentColor"
    />
  </svg>
);

/** The ✕ beside "Not an Investor", as `InvestorPromptBanner` draws it. */
const CloseSmIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
