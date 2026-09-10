'use client';

import { Fragment, PropsWithChildren, Ref, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import type { IMember } from '@/types/members.types';
import type { IUserInfo } from '@/types/shared.types';

import { BackButton } from '@/components/ui/BackButton';
import { DetailsSection, DetailsSectionHeader } from '@/components/common/profile/DetailsSection';
import { Divider } from '@/components/common/profile/Divider';
import { EditButton } from '@/components/common/profile/EditButton';
import { TagsList } from '@/components/common/profile/TagsList';
import { AddButton } from '@/components/page/member-details/components/AddButton/AddButton';
import { ProfileSocialLink } from '@/components/page/member-details/profile-social-link';
import { getProfileFromURL } from '@/utils/common.utils';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';

// Import-safe production list components (they render from props — no fetching).
import { TeamsList } from '@/components/page/member-details/TeamsDetails/components/TeamsList';
import { ContributionsList } from '@/components/page/member-details/ContributionsDetails/components/ContributionsList';

// Production's stylesheets for the page and every card on it, in the order
// `app/members/[id]/page.tsx` renders them.
import page from '@/app/members/[id]/page.module.scss';
import h from '@/components/page/member-details/MemberDetailHeader/MemberDetailHeader.module.scss';
import p from '@/components/page/member-details/ProfileDetails/ProfileDetails.module.scss';
import office from '@/components/page/member-details/OfficeHoursDetails/components/OfficeHoursView/OfficeHoursView.module.scss';
import contact from '@/components/page/member-details/contact-details/ContactDetails.module.scss';
import repo from '@/components/page/member-details/RepositoriesDetails/components/RepositoriesList/RepositoriesList.module.scss';
// `DetailsSection.editView` ships a gradient tint; ContactDetails overrides it to
// the flat `#f2f5ff` + `#aebfff` pair the header card already wears, and that
// override is passed back in through `classes` exactly as ContactDetails does.
import c from '@/components/page/member-details/ContactDetails/ContactDetails.module.scss';

import { ExperienceList } from '../job-board/JobProfilePane';
import type { ExperienceEntry } from '../job-board/viewerState';
import { MOCK_MEMBER } from '../member-profile/mocks';

import { FloatingEditorControls } from './FloatingEditorControls';
import { EditorDirtyContext } from './SectionEditor';
import { ContactForm, ExperienceEditForm, OfficeHoursForm, ProfileDetailsForm } from './forms';
import { SEED_PROFILE, type ContactHandles, type ProfileRecord } from './mocks';
import s from './MemberProfileEdit.module.scss';

/**
 * A member's own profile page, at `/members/<uid>`, with three changes to how a
 * section is edited:
 *
 *  1. **One section at a time, and the rest step back.** Opening a section's
 *     editor mutes every other card — `inert`, so nothing on them can be
 *     pressed or focused, and faded to production's disabled tone. The page
 *     already allowed one open editor; now it *looks* like one thing is
 *     happening, and a stray click on another card's Edit cannot open a second.
 *
 *  2. **Cancel and Save come after the fields.** Production's controls row sits
 *     above the fields, so on a long form the buttons are the first thing you
 *     scroll past and the last thing you can see when you have finished. Here the
 *     title stays at the top and the pair sits under the last field — at the end
 *     of the work, where the hand already is. See `SectionEditor`.
 *
 *  3. **A way back if you scroll off.** With the rest of the page muted the only
 *     other thing to do is scroll, and a person who does — to check a date on
 *     another card, say — has left an open form behind. Once the editing card is
 *     wholly out of view a floating "Keep editing" appears and takes them back
 *     to it, first field focused. And once there are unsaved changes, a
 *     floating "Save changes" stands in for the Save row whenever that row is
 *     off screen — it submits the open form. See `FloatingEditorControls`.
 *
 * Everything else is dev's page: the header card, Office Hours, Contact
 * Details, Teams, Experience, Project Contributions and Repositories, wearing
 * their real stylesheets, filled with `member-profile`'s Maya Okonkwo. Four of
 * them open an editor (the header card, Office Hours, Contact Details and
 * Experience — one short form, one medium, one long, one list with add/edit);
 * Teams, Project Contributions and Repositories are read-only here so that the
 * three rules could be judged on forms of different lengths without building
 * seven editors. They still mute like every other card, which is the part of
 * the rule they have to demonstrate.
 *
 * No demo switch: the page opens at rest and the editing state is one press
 * away on any Edit, which is how a person reaches it.
 */

/**
 * Which card, if any, has swapped itself for its editor. One at a time — a
 * second would put two Saves on one column, and muting the rest of the page is
 * how the rule is made visible. `uid: null` on Experience means a new entry.
 */
type EditTarget =
  | { kind: 'profile' }
  | { kind: 'office-hours' }
  | { kind: 'contact' }
  | { kind: 'experience'; uid: string | null }
  | null;

/** A string the floating control can re-attach on when one editor gives way to another. */
const editKey = (target: EditTarget): string | null => {
  if (!target) return null;
  return target.kind === 'experience' ? `experience:${target.uid ?? 'new'}` : target.kind;
};

// Cast the mock to the production prop types — the real list components read only
// the fields we populate, so this is safe for the prototype.
const member = MOCK_MEMBER as unknown as IMember;
const userInfo = { uid: MOCK_MEMBER.id, name: MOCK_MEMBER.name, email: MOCK_MEMBER.email } as unknown as IUserInfo;

const VISIBLE_HANDLES: Array<keyof ContactHandles> = [
  'email',
  'linkedin',
  'telegram',
  'twitter',
  'bluesky',
  'discord',
  'github',
];

export default function MemberProfileEditPrototype() {
  // Reused fields are base-ui / client-only — gate render to avoid hydration drift.
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState<ProfileRecord>(SEED_PROFILE);
  const [editing, setEditing] = useState<EditTarget>(null);
  /* The wrapper of whichever card is open: what "Keep editing" watches and
     returns to. Moves with `editing`; see `Section`. */
  const editCardRef = useRef<HTMLDivElement>(null);
  /* Whether the open editor has unsaved changes — reported by its controls row
     through `EditorDirtyContext`, read by the floating Save. */
  const [dirty, setDirty] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={s.page} />;
  }

  const close = () => setEditing(null);
  const is = (kind: NonNullable<EditTarget>['kind']) => editing?.kind === kind;
  /** Muted while another card is open; carries the ref while this one is. A
   *  read-only card is a kind the editor can never be, so it reads as "another
   *  card is open" whenever anything is. */
  const sectionProps = (kind: SectionKind) => ({
    muted: editing !== null && editing.kind !== kind,
    ref: editing?.kind === kind ? editCardRef : undefined,
  });
  /* The flat brand tint plus the in-flow override, for a `DetailsSection` that
     is open. `undefined` at rest so `c.root`'s zero padding never reaches a
     resting card. */
  const editClasses = (open: boolean) => (open ? { root: c.root, editView: clsx(c.editView, s.editCard) } : undefined);

  const entryBeingEdited: ExperienceEntry | null =
    editing?.kind === 'experience' && editing.uid
      ? (draft.experiences.find((entry) => entry.uid === editing.uid) ?? null)
      : null;

  const saveExperience = (entry: ExperienceEntry) => {
    setDraft((prev) => ({
      ...prev,
      experiences: prev.experiences.some((item) => item.uid === entry.uid)
        ? prev.experiences.map((item) => (item.uid === entry.uid ? entry : item))
        : [...prev.experiences, entry],
    }));
    close();
  };

  const deleteExperience = (uid: string) => {
    setDraft((prev) => ({ ...prev, experiences: prev.experiences.filter((item) => item.uid !== uid) }));
    close();
  };

  const hasBio = draft.bio.trim() !== '' && draft.bio.trim() !== '<p><br></p>';

  return (
    <div className={s.page}>
      <EditorDirtyContext.Provider value={setDirty}>
        <div className={page.memberDetail}>
          <div className={clsx(page.container, page.singleColumn)}>
            <div className={page.content}>
              <BackButton to="/prototypes" />
              <div className={page.memberDetail__container}>
                {/* 1. The header card. `ProfileDetails` is a plain div carrying
                     its own edit tint, so it is one here too. */}
                <Section {...sectionProps('profile')}>
                  <div className={clsx(p.root, is('profile') && [p.editView, s.editCard])}>
                    {is('profile') ? (
                      <ProfileDetailsForm
                        profile={draft}
                        onClose={close}
                        onSubmit={(patch) => {
                          setDraft((prev) => ({ ...prev, ...patch }));
                          close();
                        }}
                      />
                    ) : (
                      <>
                        <div className={h.header}>
                          <div className={h.headerProfile}>
                            <img className={h.headerProfileImg} src={draft.avatar} alt={draft.name} />
                          </div>
                          <div className={h.headerDetails}>
                            <div>
                              <div className={h.specificsHdr}>
                                <h1 className={h.specificsName}>{draft.name}</h1>
                              </div>
                              <div className={h.roleAndLocation}>
                                <div className={h.teams}>
                                  <p className={h.teamsName}>{draft.team}</p>
                                  {MOCK_MEMBER.teams.length > 1 && (
                                    <button type="button" className={h.moreTeamsButton}>
                                      +{MOCK_MEMBER.teams.length - 1}
                                    </button>
                                  )}
                                </div>
                                <div className={clsx(h.divider, h.desktopOnly)} />
                                <p className={h.role}>{draft.role}</p>
                                <div className={h.divider} />
                                <div className={h.location}>
                                  <LocationIcon />
                                  <p className={h.locationName}>{draft.location}</p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <EditButton onClick={() => setEditing({ kind: 'profile' })} />
                            </div>
                          </div>
                          <div className={h.tags}>
                            {draft.openToWork && (
                              <div className={h.funds}>
                                <span className={h.fundsLabel}>Open to Collaborate</span>
                              </div>
                            )}
                            {MOCK_MEMBER.teamLead && (
                              <div className={h.funds}>
                                <span className={h.fundsLabel}>Team lead</span>
                              </div>
                            )}
                            <TagsList tags={draft.skills.map((title) => ({ title }))} tagsToShow={5} />
                          </div>
                        </div>
                        {hasBio && (
                          <div className={p.bioContainer}>
                            <div className={p.bioTitle}>Bio</div>
                            {/* Prototype-authored markup from a mocked record, so
                              no sanitizer; production sanitizes on read. */}
                            <div className={p.bioContent} dangerouslySetInnerHTML={{ __html: draft.bio }} />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Section>

                {/* 2. Office Hours — the owner's view: the "Available to connect"
                     hint on the title, Edit in the header, no Schedule Meeting
                     (you do not book yourself). The "Learn more" link is left
                     out: it opens a production dialog. */}
                <Section {...sectionProps('office-hours')}>
                  <DetailsSection editView={is('office-hours')} classes={editClasses(is('office-hours'))}>
                    {is('office-hours') ? (
                      <OfficeHoursForm
                        profile={draft}
                        onClose={close}
                        onSubmit={(patch) => {
                          setDraft((prev) => ({ ...prev, ...patch }));
                          close();
                        }}
                      />
                    ) : (
                      <div className={office.root}>
                        <DetailsSectionHeader
                          title={
                            <>
                              Office Hours{' '}
                              {draft.officeHours && (
                                <span className={office.titleHintLabel}>&#8226; Available to connect</span>
                              )}
                            </>
                          }
                        >
                          <EditButton onClick={() => setEditing({ kind: 'office-hours' })} />
                        </DetailsSectionHeader>
                        <div className={office.content}>
                          <div className={office.officeHoursSection}>
                            <div className={office.col}>
                              <div className={office.description}>
                                <div>
                                  <span>
                                    {draft.name} is available for a short 1:1 call to connect or help — no introduction
                                    needed.
                                  </span>
                                </div>
                                <KeywordsRow
                                  label="Topics of Interest:"
                                  items={draft.ohInterest}
                                  onAdd={() => setEditing({ kind: 'office-hours' })}
                                />
                                <KeywordsRow
                                  label="I Can Help With:"
                                  items={draft.ohHelpWith}
                                  onAdd={() => setEditing({ kind: 'office-hours' })}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </DetailsSection>
                </Section>

                {/* 3. Contact Details — the owner's unlocked view, every handle a
                     `ProfileSocialLink`, Edit in the header. */}
                <Section {...sectionProps('contact')}>
                  <DetailsSection editView={is('contact')} classes={editClasses(is('contact'))}>
                    {is('contact') ? (
                      <ContactForm
                        profile={draft}
                        onClose={close}
                        onSubmit={(patch) => {
                          setDraft((prev) => ({ ...prev, ...patch }));
                          close();
                        }}
                      />
                    ) : (
                      <div className={contact.contentRoot}>
                        <DetailsSectionHeader title="Contact Details">
                          <EditButton onClick={() => setEditing({ kind: 'contact' })} />
                        </DetailsSectionHeader>
                        <div className={contact.container}>
                          <div className={contact.social}>
                            <div className={contact.top}>
                              <div className={contact.content}>
                                {VISIBLE_HANDLES.filter((key) => draft.contacts[key]).map((key, i, arr) => {
                                  const handle = draft.contacts[key];
                                  return (
                                    <Fragment key={key}>
                                      <ProfileSocialLink
                                        profile={getProfileFromURL(handle, key)}
                                        height={24}
                                        width={24}
                                        callback={() => {}}
                                        type={key}
                                        handle={handle}
                                        logo={getContactLogoByProvider(key)}
                                      />
                                      {i === arr.length - 1 ? null : <Divider />}
                                    </Fragment>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </DetailsSection>
                </Section>

                {/* 4. Teams. Production's list, read-only here — see the file note. */}
                <Section {...sectionProps('teams')}>
                  <DetailsSection>
                    <DetailsSectionHeader title={`Teams (${MOCK_MEMBER.teams.length})`} />
                    <TeamsList member={member} userInfo={userInfo} isEditable={false} onEdit={() => {}} />
                  </DetailsSection>
                </Section>

                {/* 5. Experience — a list with Add in the header and a pencil per
                     row, each opening the same editor over the card. */}
                <Section {...sectionProps('experience')}>
                  <DetailsSection editView={is('experience')} classes={editClasses(is('experience'))}>
                    {is('experience') ? (
                      <ExperienceEditForm
                        initial={entryBeingEdited}
                        onClose={close}
                        onSubmit={saveExperience}
                        onDelete={deleteExperience}
                      />
                    ) : (
                      <>
                        <DetailsSectionHeader title={`Experience (${draft.experiences.length})`}>
                          <AddButton onClick={() => setEditing({ kind: 'experience', uid: null })} />
                        </DetailsSectionHeader>
                        <ExperienceList
                          entries={draft.experiences}
                          onEdit={(uid) => setEditing({ kind: 'experience', uid })}
                        />
                      </>
                    )}
                  </DetailsSection>
                </Section>

                {/* 6. Project Contributions. Production's list draws its own
                     header; read-only here. */}
                <Section {...sectionProps('contributions')}>
                  <DetailsSection>
                    <ContributionsList
                      member={member}
                      userInfo={userInfo}
                      isEditable={false}
                      onAdd={() => {}}
                      onEdit={() => {}}
                    />
                  </DetailsSection>
                </Section>

                {/* 7. Repositories, copy-simplified from `RepositoriesList` as
                     `member-profile` did. */}
                <Section {...sectionProps('repositories')}>
                  <DetailsSection>
                    <DetailsSectionHeader title="Repositories">
                      <a
                        href={`https://github.com/${draft.contacts.github}`}
                        target="_blank"
                        rel="noreferrer"
                        className={repo.profileLink}
                      >
                        <img src="/icons/contact/github-contact-logo.svg" alt="GitHub" height={24} width={24} />
                        Github Profile
                        <RepoLinkIcon />
                      </a>
                    </DetailsSectionHeader>
                    <div className={repo.root}>
                      <ul className={repo.list}>
                        {MOCK_MEMBER.repositories.map((item) => (
                          <li key={item.url} className={repo.expItem}>
                            <RepoIcon />
                            <div className={repo.details}>
                              <div className={repo.row}>
                                <div className={repo.primaryLabel}>{item.name}</div>
                              </div>
                              <div className={repo.row}>
                                <div className={repo.secondaryLabel}>{item.description}</div>
                              </div>
                            </div>
                            <a href={item.url} target="_blank" rel="noreferrer" className={repo.link}>
                              <RepoLinkIcon />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </DetailsSection>
                </Section>
              </div>
            </div>
          </div>
        </div>

        <FloatingEditorControls target={editCardRef} activeKey={editKey(editing)} dirty={dirty} />
      </EditorDirtyContext.Provider>
    </div>
  );
}

/**
 * One card's wrapper. `inert` is the whole mechanism for "the other sections
 * are disabled": the browser drops every click, focus and tab stop inside it,
 * and assistive tech skips it. The class only paints what `inert` did. The ref
 * lands here rather than on the card because `DetailsSection` forwards none,
 * and the wrapper is the card's outline in every way that matters to the
 * observer.
 */
type SectionKind = NonNullable<EditTarget>['kind'] | 'teams' | 'contributions' | 'repositories';

function Section({ muted, ref, children }: PropsWithChildren<{ muted: boolean; ref?: Ref<HTMLDivElement> }>) {
  return (
    <div ref={ref} className={clsx(s.section, muted && s.muted)} inert={muted} aria-disabled={muted || undefined}>
      {children}
    </div>
  );
}

/** `OfficeHoursView`'s keyword row — badges, or the owner's "Add keywords" when empty. */
function KeywordsRow({ label, items, onAdd }: { label: string; items: string[]; onAdd: () => void }) {
  return (
    <div className={office.keywordsWrapper}>
      <span className={office.keywordsLabel}>{label}</span>
      <span className={office.badgesWrapper}>
        {items.length ? (
          items.map((item) => (
            <div key={item} className={office.badge}>
              {item}
            </div>
          ))
        ) : (
          <button type="button" className={office.addKeywordsBadge} onClick={onAdd}>
            <AddIcon /> Add keywords
          </button>
        )}
      </span>
    </div>
  );
}

/* ---------- Inline icons, as `member-profile` carries them ---------- */

const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 4.6875C9.32013 4.6875 8.65552 4.88911 8.09023 5.26682C7.52493 5.64454 7.08434 6.1814 6.82416 6.80953C6.56399 7.43765 6.49591 8.12881 6.62855 8.79562C6.76119 9.46243 7.08858 10.0749 7.56932 10.5557C8.05006 11.0364 8.66257 11.3638 9.32938 11.4964C9.99619 11.6291 10.6874 11.561 11.3155 11.3008C11.9436 11.0407 12.4805 10.6001 12.8582 10.0348C13.2359 9.46948 13.4375 8.80487 13.4375 8.125C13.4365 7.21363 13.074 6.33989 12.4295 5.69546C11.7851 5.05103 10.9114 4.68853 10 4.6875ZM10 9.6875C9.69097 9.6875 9.38887 9.59586 9.13192 9.42417C8.87497 9.25248 8.6747 9.00845 8.55644 8.72294C8.43818 8.43743 8.40723 8.12327 8.46752 7.82017C8.52781 7.51708 8.67663 7.23866 8.89515 7.02014C9.11367 6.80163 9.39208 6.65281 9.69517 6.59252C9.99827 6.53223 10.3124 6.56318 10.5979 6.68144C10.8835 6.7997 11.1275 6.99997 11.2992 7.25692C11.4709 7.51387 11.5625 7.81597 11.5625 8.125C11.5625 8.5394 11.3979 8.93683 11.1049 9.22985C10.8118 9.52288 10.4144 9.6875 10 9.6875ZM10 0.9375C8.09439 0.939568 6.26742 1.69748 4.91995 3.04495C3.57248 4.39242 2.81457 6.21939 2.8125 8.125C2.8125 14.1687 9.19063 18.7031 9.4625 18.893C9.62005 19.0032 9.8077 19.0624 10 19.0624C10.1923 19.0624 10.3799 19.0032 10.5375 18.893C11.7455 18.0027 12.8508 16.9808 13.8328 15.8461C16.0273 13.3258 17.1875 10.6539 17.1875 8.125C17.1854 6.21939 16.4275 4.39242 15.08 3.04495C13.7326 1.69748 11.9056 0.939568 10 0.9375ZM12.4453 14.5867C11.7004 15.4424 10.8822 16.2313 10 16.9445C9.1178 16.2313 8.29958 15.4424 7.55469 14.5867C6.25 13.0758 4.6875 10.7273 4.6875 8.125C4.6875 6.71604 5.24721 5.36478 6.2435 4.36849C7.23978 3.37221 8.59104 2.8125 10 2.8125C11.409 2.8125 12.7602 3.37221 13.7565 4.36849C14.7528 5.36478 15.3125 6.71604 15.3125 8.125C15.3125 10.7273 13.75 13.0758 12.4453 14.5867Z"
      fill="#455468"
    />
  </svg>
);

/** `OfficeHoursView`'s plus beside "Add keywords". */
const AddIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.5 8C13.5 8.13261 13.4473 8.25979 13.3536 8.35355C13.2598 8.44732 13.1326 8.5 13 8.5H8.5V13C8.5 13.1326 8.44732 13.2598 8.35355 13.3536C8.25979 13.4473 8.13261 13.5 8 13.5C7.86739 13.5 7.74021 13.4473 7.64645 13.3536C7.55268 13.2598 7.5 13.1326 7.5 13V8.5H3C2.86739 8.5 2.74021 8.44732 2.64645 8.35355C2.55268 8.25979 2.5 8.13261 2.5 8C2.5 7.86739 2.55268 7.74021 2.64645 7.64645C2.74021 7.55268 2.86739 7.5 3 7.5H7.5V3C7.5 2.86739 7.55268 2.74021 7.64645 2.64645C7.74021 2.55268 7.86739 2.5 8 2.5C8.13261 2.5 8.25979 2.55268 8.35355 2.64645C8.44732 2.74021 8.5 2.86739 8.5 3V7.5H13C13.1326 7.5 13.2598 7.55268 13.3536 7.64645C13.4473 7.74021 13.5 7.86739 13.5 8Z"
      fill="currentColor"
    />
  </svg>
);

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

const RepoLinkIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0.84375 8.93359C0.953125 9.07031 1.11719 9.125 1.28125 9.125C1.47266 9.125 1.63672 9.07031 1.74609 8.93359L8.0625 2.61719V7.59375C8.0625 7.97656 8.36328 8.25 8.71875 8.25C9.10156 8.25 9.375 7.97656 9.375 7.59375V1.03125C9.375 0.675781 9.10156 0.375 8.71875 0.375H2.15625C1.80078 0.375 1.5 0.675781 1.5 1.03125C1.5 1.41406 1.80078 1.6875 2.15625 1.6875H7.16016L0.84375 8.00391C0.570312 8.27734 0.570312 8.6875 0.84375 8.93359Z"
      fill="#0F172A"
    />
  </svg>
);
