'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

import { ExperienceImportPanel } from '../profile-shared/ExperienceImport/ExperienceImportPanel';
import { OptionalMark } from '../profile-shared/OptionalMark';
import { ExperienceImportReview } from '../profile-shared/ExperienceImport/ExperienceImportReview';
import type { ImportSelection, ParsedProfile } from '../profile-shared/ExperienceImport/types';
import { ExperienceList } from '../job-board/JobProfileDrawer';
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
 * **The one addition, and the point of the entry:** the Experience card's empty
 * state carries the CV importer — the same component the apply drawer and the
 * settings page mount, so three surfaces share one implementation. This is where
 * a document is worth the most: every field a hiring team reads is empty at this
 * exact moment, and one drop fills the role and location on the header card, the
 * skills pill, and the whole list.
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

type EditTarget = { kind: 'import' } | null;

export default function OnboardingPrototype() {
  const [editing, setEditing] = useState<EditTarget>(null);
  const [parsed, setParsed] = useState<ParsedProfile | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const cvInput = useRef<HTMLInputElement>(null);

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
   * That is why the importer moves to the top while it holds: a CV fills the
   * header card's role and location and the skills row as well as the Experience
   * list, so offering it *inside* the Experience section described it as smaller
   * than it is and buried it four cards down the page. A control that answers
   * the questions above it belongs above them.
   */
  const profileIsBlank =
    role.trim() === '' && location.trim() === '' && skills.length === 0 && experiences.length === 0;

  /**
   * Which of the two hosts owns the importer. Never both:
   *
   *  - blank profile → the card at the top of the page;
   *  - anything filled in but no history → the Experience empty state.
   *
   * Two entry points to one mechanism on one screen is a choice with no
   * consequence — the same rule the apply drawer states, and the mistake the
   * removed LinkedIn door was.
   */
  const importAtTop = profileIsBlank;

  const closeImport = () => {
    setEditing(null);
    setParsed(null);
    setPickedFile(null);
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
    setExperiences((prev) => [
      ...prev,
      ...selection.experiences.map((entry, i) => ({
        uid: `new-exp-${prev.length + i + 1}`,
        title: entry.title,
        company: entry.company,
        description: entry.description,
        startDate: entry.startDate,
        endDate: entry.isCurrent ? null : entry.endDate,
        isCurrent: entry.isCurrent,
        location: entry.location,
      })),
    ]);
    closeImport();
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
    setCanvas(state);
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return <div className={o.page} />;

  return (
    <div className={o.page}>
      <div className={o.column}>
        <BackButton to="/prototypes" />

        {/* 0. Start with a document, while there is nothing to start from.

               Not part of dev's page — this is the one addition the entry is
               for, and it sits above the transcription rather than inside it so
               what is copied stays legible as a copy. It is a plain
               `DetailsSection` like every card under it, and it disappears the
               moment the profile has anything in it. */}
        {importAtTop && (
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
            ) : (
              <>
                {/* Same offer, same mark, same words as the two job-board
                    surfaces that make it — see `OptionalMark`. */}
                <DetailsSectionHeader
                  title={
                    <>
                      You can upload your CV
                      <OptionalMark />
                    </>
                  }
                />
                {/* Word for word the apply drawer's line. One sentence for one
                    offer across every surface that makes it — a cross-surface
                    promise that reads differently per page is drift. */}
                <p className={o.cvFirstNote}>
                  We&apos;ll fill in your role, skills and experience from it, so you don&apos;t have to type it all in.
                </p>
                {/* Both, not just `setParsed`: the review renders on
                    `importing && parsed`, so handing over the result without
                    also opening the card left the parse in state with nothing
                    showing it. */}
                <ExperienceImportPanel
                  entry="direct"
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

        {/* 1. The header card. `ProfileDetails` is a plain div in production, so
               this is one too, and every placeholder in it is production's own:
               the amber pair with its divider, the two grey pills, the blue
               Edit. */}
        <div className={p.root}>
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
                <EditButton onClick={() => undefined} />
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
        <DetailsSection>
          <DataIncomplete className={o.promptStrip}>
            Complete your profile by adding contact details — make it easier for others to connect with you.
          </DataIncomplete>
          <div className={o.sectionBody}>
            <DetailsSectionHeader title="Contact Details">
              <EditButton onClick={() => undefined} />
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

        {/* 5. Experience — and the CV. */}
        <DetailsSection editView={importing && !importAtTop}>
          {importing && !importAtTop ? (
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
                  onParsed={setParsed}
                  onAddManually={closeImport}
                />
              </>
            )
          ) : (
            <>
              <DetailsSectionHeader title={`Experience ${experiences.length ? `(${experiences.length})` : ''}`}>
                <div className={o.headerActions}>
                  {experiences.length > 0 && (
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
                          setEditing({ kind: 'import' });
                        }}
                      />
                    </>
                  )}
                  <AddButton onClick={() => undefined} />
                </div>
              </DetailsSectionHeader>
              {experiences.length === 0 && !importAtTop ? (
                <ExperienceImportPanel
                  emptyLabel="Share your work history and skills. This shows what you know and what you can do."
                  onParsed={(result) => {
                    setParsed(result);
                    setEditing({ kind: 'import' });
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
