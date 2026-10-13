'use client';

/**
 * Tabs 2 and 4 — /members/[id], as the owner and as a visitor.
 *
 * The page shell and every section are the *production* styles, imported
 * read-only, following the pattern the `member-profile` prototype established:
 * app/members/[id]/page.module.scss for the layout, MemberDetailHeader +
 * ProfileDetails for the header, OfficeHoursView for the office-hours card.
 *
 * There is no travel section. The proposal lives entirely inside the profile's
 * existing Location field — see ProfileDetailsCard / LocationField — so this
 * page has exactly the sections dev has today, in dev's order.
 *
 * Empty sections render production's own empty states, not hand-rolled ones.
 * The cold-start tab (Priya) is the whole reason: a day-one profile is mostly
 * empty, so every section's *nothing yet* state is on screen at once, and an
 * invented one reads as a broken page. Each one below cites the production
 * component it is transcribed from.
 */

import { Fragment } from 'react';
import clsx from 'clsx';

import type { IMember } from '@/types/members.types';
import type { IUserInfo } from '@/types/shared.types';
import { BackButton } from '@/components/ui/BackButton';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { Divider } from '@/components/common/profile/Divider';
import { EditButton } from '@/components/common/profile/EditButton';
import { DataIncomplete } from '@/components/page/member-details/DataIncomplete';
import { ProfileSocialLink } from '@/components/page/member-details/profile-social-link';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';
import { getProfileFromURL } from '@/utils/common.utils';

// Import-safe production lists — they render from props, no fetching.
import { TeamsList } from '@/components/page/member-details/TeamsDetails/components/TeamsList';
import { ContributionsList } from '@/components/page/member-details/ContributionsDetails/components/ContributionsList';
import { ExperiencesList } from '@/components/page/member-details/ExperienceDetails/components/ExperienceDetailsView/components/ExperiencesList';
import { EmptyIllustration } from '@/components/page/member-details/ForumActivity/components/ForumActivityCardsList/components/NoForumActivity/components/EmptyIllustration';

import page from '@/app/members/[id]/page.module.scss';
import office from '@/components/page/member-details/OfficeHoursDetails/components/OfficeHoursView/OfficeHoursView.module.scss';
import contact from '@/components/page/member-details/contact-details/ContactDetails.module.scss';
import forum from '@/components/page/member-details/ForumActivity/components/ForumActivityCardsList/components/NoForumActivity/NoForumActivity.module.scss';
import repo from '@/components/page/member-details/RepositoriesDetails/components/RepositoriesList/RepositoriesList.module.scss';

import { PROFILE_EXTRAS, PROFILE_SECTIONS, PROFILE_EXPERIENCE, type PersonCityMember, type Trip } from './mocks';
import { ProfileDetailsCard } from './ProfileDetailsCard';
import s from './Screens.module.scss';

/** contact-details/ContactDetails.tsx:35-46 — same order, same mapping. */
const SOCIAL_TO_HANDLE_MAP: Record<string, string> = {
  linkedin: 'linkedinHandle',
  github: 'githubHandle',
  twitter: 'twitter',
  email: 'email',
  discord: 'discordHandle',
  telegram: 'telegramHandle',
};
const VISIBLE_HANDLES = ['email', 'linkedin', 'telegram', 'twitter', 'discord', 'github'];

interface ProfileTabProps {
  member: PersonCityMember;
  trips: Trip[];
  todayKey: string;
  onTripsChange?: (next: Trip[]) => void;
  isOwner?: boolean;
  /** open Edit Profile Details with the Location add row showing */
  startEditing?: boolean;
  /** everyone's visible stays, when `trips` holds only this member's */
  networkTrips?: Trip[];
  /** set on someone else's profile: the reader's own whereabouts */
  viewer?: { homeCity: string; stays: Trip[] };
}

export function ProfileTab({
  member,
  trips,
  todayKey,
  onTripsChange,
  isOwner = false,
  startEditing = false,
  networkTrips,
  viewer,
}: ProfileTabProps) {
  const extras = PROFILE_EXTRAS[member.id] ?? PROFILE_EXTRAS['maya-okonkwo'];
  const sections = PROFILE_SECTIONS[member.id] ?? PROFILE_SECTIONS['maya-okonkwo'];
  const experience = PROFILE_EXPERIENCE[member.id] ?? [];

  // The production lists read only the fields we populate, so the cast is safe
  // — the same approach the `member-profile` prototype takes.
  const asMember = { ...member, ...sections, skills: member.skills } as unknown as IMember;
  const viewerInfo = { uid: 'viewer', name: 'Viewer', email: 'viewer@pl.org' } as unknown as IUserInfo;

  const hasOfficeHours = Boolean(extras.officeHoursNote);
  // ContactDetails.tsx:55 — LinkedIn is the one required handle, and the strip
  // is the owner's alone.
  const contactsIncomplete = !sections.linkedinHandle && isOwner;

  return (
    <div className={page.memberDetail}>
      {/* page.tsx:310-321 — both modifiers, which the prototype used to drop.
          `.content` is `width: auto` above tablet-landscape, so without them the
          column is as wide as its widest card: the visitor's page measured 824px
          against the owner's 900px, i.e. the same profile changed width when you
          switched tabs. `singleColumn` because there is no sidebar here. */}
      <div className={clsx(page.container, page.singleColumn)}>
        <div className={page.content}>
          <BackButton to="#" />

          <div className={clsx(page.memberDetail__container, { [page.centered]: isOwner || hasOfficeHours })}>
            {/* ---- THE INSERT lives inside here: ProfileDetails' existing
                Location field, extended in time. No new section on the page. ---- */}
            <ProfileDetailsCard
              member={member}
              bio={extras.bio}
              trips={trips}
              todayKey={todayKey}
              onTripsChange={onTripsChange ?? (() => undefined)}
              isOwner={isOwner}
              startEditing={startEditing}
              networkTrips={networkTrips}
              viewer={viewer}
            />

            {/* ---- Office Hours ----
                OfficeHoursDetails.tsx:65-67 returns null for a visitor looking at
                a member with no office hours — so a day-one profile shows this
                card to its owner and to nobody else. For the owner it is
                production's prompt state: the blue DataIncomplete strip, the
                explanation, and one "Add Office Hours" button. The previous
                "Not set up yet." stub was invented, and it was the version a
                visitor got too. */}
            {!hasOfficeHours ? (
              isOwner && (
                <DetailsSection missingData>
                  <DataIncomplete className={office.warningMessageText}>
                    Make it easy for others in the network to connect with you — add your Office Hours link to enable
                    quick 1:1 conversations.
                  </DataIncomplete>
                  <div className={clsx(office.root, office.missingData)}>
                    <DetailsSectionHeader title="Office Hours" />
                    <div className={office.content}>
                      <div className={office.officeHoursSection}>
                        <div className={office.col}>
                          <div className={office.description}>
                            <span>
                              OH are short 15min 1:1 calls to connect about topics of interest or help others with your
                              expertise. Share your calendar. You will also access other members OH.
                            </span>
                          </div>
                        </div>
                        <button type="button" className={office.primaryButton}>
                          Add Office Hours <PlusIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                </DetailsSection>
              )
            ) : (
              <DetailsSection>
                <div className={office.root}>
                  <DetailsSectionHeader title="Office Hours" />
                  <div className={office.content}>
                    <div className={office.officeHoursSection}>
                      <div className={office.col}>
                        <div className={office.description}>
                          <div>
                            <span>
                              {member.name} {extras.officeHoursNote}
                            </span>
                          </div>
                          <div className={office.keywordsWrapper}>
                            <span className={office.keywordsLabel}>Topics of Interest:</span>
                            <span className={office.badgesWrapper}>
                              {extras.ohInterest.map((item) => (
                                <div key={item} className={office.badge}>
                                  {item}
                                </div>
                              ))}
                            </span>
                          </div>
                          <div className={office.keywordsWrapper}>
                            <span className={office.keywordsLabel}>I Can Help With:</span>
                            <span className={office.badgesWrapper}>
                              {extras.ohHelpWith.map((item) => (
                                <div key={item} className={office.badge}>
                                  {item}
                                </div>
                              ))}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={office.primaryButtonWrapper}>
                        <button className={office.primaryButton}>Schedule Meeting</button>
                        <span className={office.subtext}>{member.scheduleMeetingCount} past bookings</span>
                      </div>
                    </div>
                  </div>
                </div>
              </DetailsSection>
            )}

            {/* ---- the rest of the page, in dev's order ----
                app/members/[id]/page.tsx:179-194: Contact → Forum → Teams →
                Experience → Contributions → IRL → Repositories. */}

            {/* ---- Contact Details ----
                contact-details/ContactDetails.tsx:91-140 — a row of logo + handle
                links, each greyed by `.incomplete` where the handle is missing.
                This was a hand-rolled LABEL/value grid, which on a day-one
                profile rendered six empty cells and two orphan "@" characters.

                Two deviations from that file, both so the page reads as one page:
                its `.contentRoot` is dropped, because a second 16px inside
                DetailsSection's own 16px put this card's title 16px right of
                every other card's; and the incomplete state is the tinted
                DetailsSection the Office Hours card above already uses, rather
                than a bordered box nested inside a white card. The strip's text
                goes blue with it — production's is amber on the same blue band,
                and a day-one profile shows both of these nudges at once. */}
            <DetailsSection missingData={contactsIncomplete}>
              {contactsIncomplete && (
                <DataIncomplete className={s.incompleteStrip}>
                  Complete your profile by adding contact details — make it easier for others to connect with you
                </DataIncomplete>
              )}
              <div className={contactsIncomplete ? s.incompleteBody : undefined}>
                <DetailsSectionHeader title="Contact Details">
                  {isOwner && <EditButton onClick={() => undefined} />}
                </DetailsSectionHeader>
                <div className={contact.container}>
                  <div className={contact.social}>
                    <div className={contact.top}>
                      <div className={contact.content}>
                        {VISIBLE_HANDLES.map((item, index, all) => {
                          const handle = sections[SOCIAL_TO_HANDLE_MAP[item]] as string;
                          return (
                            <Fragment key={item}>
                              <ProfileSocialLink
                                profile={getProfileFromURL(handle, item)}
                                height={24}
                                width={24}
                                callback={() => undefined}
                                type={item}
                                handle={handle}
                                logo={getContactLogoByProvider(item)}
                                className={clsx({ [contact.incomplete]: !handle })}
                              />
                              {index === all.length - 1 ? null : <Divider />}
                            </Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DetailsSection>

            {/* ---- Forum Activity ----
                NoForumActivity.tsx + getLabels.ts — the illustration and the two
                lines production shows the owner when they have posted nothing.
                An empty <ul> under a heading was a card with no body in it. */}
            <DetailsSection>
              <DetailsSectionHeader title="Forum Activity" />
              {sections.forumThreads.length > 0 ? (
                <ul className={s.forumList}>
                  {sections.forumThreads.map((thread: { title: string; replies: number; when: string }) => (
                    <li key={thread.title} className={s.forumRow}>
                      <span className={s.forumTitle}>{thread.title}</span>
                      <span className={s.forumMeta}>
                        {thread.replies} replies · {thread.when}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={forum.root}>
                  <EmptyIllustration />
                  <div className={forum.title}>No posts yet</div>
                  <div className={forum.description}>
                    {isOwner
                      ? 'You haven’t started any forum threads yet.'
                      : `${member.name} hasn’t started any forum threads yet.`}
                  </div>
                </div>
              )}
            </DetailsSection>

            {/* Real production lists — they render straight from the cast mock,
                and each one brings its own "Not provided" empty row. */}
            <DetailsSection>
              <DetailsSectionHeader title={`Teams (${sections.teams.length})`}>
                {isOwner && <EditButton onClick={() => undefined} />}
              </DetailsSectionHeader>
              <TeamsList member={asMember} userInfo={viewerInfo} isEditable={false} onEdit={() => undefined} />
            </DetailsSection>

            <DetailsSection>
              <DetailsSectionHeader title={`Experience (${experience.length})`}>
                {isOwner && <EditButton onClick={() => undefined} />}
              </DetailsSectionHeader>
              <ExperiencesList
                data={experience}
                member={asMember}
                userInfo={viewerInfo}
                isEditable={false}
                isLoading={false}
                onEdit={() => undefined}
              />
            </DetailsSection>

            <DetailsSection>
              <ContributionsList
                member={asMember}
                userInfo={viewerInfo}
                isEditable={false}
                onAdd={() => undefined}
                onEdit={() => undefined}
              />
            </DetailsSection>

            {/* Read-only, and deliberately no Edit — the reason the calendar
                could not simply live inside it. page.tsx:283 mounts it only when
                `member.eventGuests.length > 0`, so someone who has been to
                nothing doesn't get a section claiming they have. */}
            {extras.irl && (
              <DetailsSection>
                <DetailsSectionHeader title="IRL Contributions" />
                <div className={s.stubBody}>
                  <p className={s.stubLine}>
                    Attendee at {extras.irl.attended} gatherings · Speaker at {extras.irl.spoke}
                  </p>
                  <p className={s.stubMuted}>Past tense, and the only section here with no Edit button.</p>
                </div>
              </DetailsSection>
            )}

            {/* ---- Repositories ----
                RepositoriesList.tsx:88-99 — with no GitHub handle the section is
                an `.emptyData` row pointing at the field that fills it, not an
                empty list. */}
            <DetailsSection>
              <DetailsSectionHeader title="Repositories" />
              <div className={repo.root}>
                {sections.repositories.length > 0 ? (
                  <ul className={s.repoList}>
                    {sections.repositories.map((repository: { name: string; description: string; url: string }) => (
                      <li key={repository.url} className={s.repoRow}>
                        <span className={s.repoName}>{repository.name}</span>
                        <span className={s.repoDesc}>{repository.description}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={repo.emptyData}>
                    <span className={repo.label}>
                      {sections.githubHandle
                        ? 'No repositories to display, add new ones to your GitHub profile.'
                        : isOwner
                          ? 'Add your Github handle in the Contact Details section to see your repositories.'
                          : 'Not provided'}
                    </span>
                  </div>
                )}
              </div>
            </DetailsSection>
          </div>
        </div>
      </div>
    </div>
  );
}

/** OfficeHoursView.tsx:323 — the button's own plus, white on the brand fill. */
const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M18.0312 10C18.0312 10.2238 17.9424 10.4384 17.7841 10.5966C17.6259 10.7549 17.4113 10.8438 17.1875 10.8438H11.8438V16.1875C11.8438 16.4113 11.7549 16.6259 11.5966 16.7841C11.4384 16.9424 11.2238 17.0312 11 17.0312C10.7762 17.0312 10.5616 16.9424 10.4034 16.7841C10.2451 16.6259 10.1562 16.4113 10.1562 16.1875V10.8438H4.8125C4.58872 10.8438 4.37411 10.7549 4.21588 10.5966C4.05764 10.4384 3.96875 10.2238 3.96875 10C3.96875 9.77622 4.05764 9.56161 4.21588 9.40338C4.37411 9.24514 4.58872 9.15625 4.8125 9.15625H10.1562V3.8125C10.1562 3.58872 10.2451 3.37411 10.4034 3.21588C10.5616 3.05764 10.7762 2.96875 11 2.96875C11.2238 2.96875 11.4384 3.05764 11.5966 3.21588C11.7549 3.37411 11.8438 3.58872 11.8438 3.8125V9.15625H17.1875C17.4113 9.15625 17.6259 9.24514 17.7841 9.40338C17.9424 9.56161 18.0312 9.77622 18.0312 10Z"
      fill="white"
    />
  </svg>
);
