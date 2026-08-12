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
 */

import type { IMember } from '@/types/members.types';
import type { IUserInfo } from '@/types/shared.types';
import { BackButton } from '@/components/ui/BackButton';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { EditButton } from '@/components/common/profile/EditButton';

// Import-safe production lists — they render from props, no fetching.
import { TeamsList } from '@/components/page/member-details/TeamsDetails/components/TeamsList';
import { ContributionsList } from '@/components/page/member-details/ContributionsDetails/components/ContributionsList';
import { ExperiencesList } from '@/components/page/member-details/ExperienceDetails/components/ExperienceDetailsView/components/ExperiencesList';

import page from '@/app/members/[id]/page.module.scss';
import office from '@/components/page/member-details/OfficeHoursDetails/components/OfficeHoursView/OfficeHoursView.module.scss';

import { PROFILE_EXTRAS, PROFILE_SECTIONS, PROFILE_EXPERIENCE, type PersonCityMember, type Trip } from './mocks';
import { ProfileDetailsCard } from './ProfileDetailsCard';
import s from './Screens.module.scss';

interface ProfileTabProps {
  member: PersonCityMember;
  trips: Trip[];
  todayKey: string;
  onTripsChange?: (next: Trip[]) => void;
  isOwner?: boolean;
  /** open Edit Profile Details with the Location date picker showing */
  startEditing?: boolean;
}

export function ProfileTab({
  member,
  trips,
  todayKey,
  onTripsChange,
  isOwner = false,
  startEditing = false,
}: ProfileTabProps) {
  const extras = PROFILE_EXTRAS[member.id] ?? PROFILE_EXTRAS['maya-okonkwo'];
  const sections = PROFILE_SECTIONS[member.id] ?? PROFILE_SECTIONS['maya-okonkwo'];
  const experience = PROFILE_EXPERIENCE[member.id] ?? [];

  // The production lists read only the fields we populate, so the cast is safe
  // — the same approach the `member-profile` prototype takes.
  const asMember = { ...member, ...sections, skills: member.skills } as unknown as IMember;
  const viewer = { uid: 'viewer', name: 'Viewer', email: 'viewer@pl.org' } as unknown as IUserInfo;

  return (
    <div className={page.memberDetail}>
      <div className={page.container}>
        <div className={page.content}>
          <BackButton to="#" />

          <div className={page.memberDetail__container}>
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
            />

            {/* A day-one profile has no office hours; rendering the section with
                empty badge rows would look broken rather than empty. */}
            {!extras.officeHoursNote ? (
              <DetailsSection missingData={isOwner}>
                <DetailsSectionHeader title="Office Hours">
                  {isOwner && <EditButton onClick={() => undefined} />}
                </DetailsSectionHeader>
                <p className={s.stubMuted}>Not set up yet.</p>
              </DetailsSection>
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
            <DetailsSection>
              <DetailsSectionHeader title="Contact Details">
                {isOwner && <EditButton onClick={() => undefined} />}
              </DetailsSectionHeader>
              <div className={s.contactGrid}>
                {[
                  ['Email', sections.email],
                  ['LinkedIn', sections.linkedinHandle],
                  ['Telegram', `@${sections.telegramHandle}`],
                  ['Twitter', `@${sections.twitter}`],
                  ['Discord', sections.discordHandle],
                  ['GitHub', sections.githubHandle],
                ].map(([label, value]) => (
                  <div key={label} className={s.contactItem}>
                    <span className={s.contactLabel}>{label}</span>
                    <span className={s.contactValue}>{value}</span>
                  </div>
                ))}
              </div>
            </DetailsSection>

            <DetailsSection>
              <DetailsSectionHeader title="Forum Activity" />
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
            </DetailsSection>

            {/* Real production lists — they render straight from the cast mock. */}
            <DetailsSection>
              <DetailsSectionHeader title={`Teams (${sections.teams.length})`}>
                {isOwner && <EditButton onClick={() => undefined} />}
              </DetailsSectionHeader>
              <TeamsList member={asMember} userInfo={viewer} isEditable={false} onEdit={() => undefined} />
            </DetailsSection>

            <DetailsSection>
              <DetailsSectionHeader title={`Experience (${experience.length})`}>
                {isOwner && <EditButton onClick={() => undefined} />}
              </DetailsSectionHeader>
              <ExperiencesList
                data={experience}
                member={asMember}
                userInfo={viewer}
                isEditable={false}
                isLoading={false}
                onEdit={() => undefined}
              />
            </DetailsSection>

            <DetailsSection>
              <ContributionsList
                member={asMember}
                userInfo={viewer}
                isEditable={false}
                onAdd={() => undefined}
                onEdit={() => undefined}
              />
            </DetailsSection>

            {/* Read-only, and deliberately no Edit — the reason the calendar
                could not simply live inside it. */}
            <DetailsSection>
              <DetailsSectionHeader title="IRL Contributions" />
              <div className={s.stubBody}>
                <p className={s.stubLine}>Attendee at 6 gatherings · Speaker at 2</p>
                <p className={s.stubMuted}>Past tense, and the only section here with no Edit button.</p>
              </div>
            </DetailsSection>

            <DetailsSection>
              <DetailsSectionHeader title="Repositories" />
              <ul className={s.repoList}>
                {sections.repositories.map((repository: { name: string; description: string; url: string }) => (
                  <li key={repository.url} className={s.repoRow}>
                    <span className={s.repoName}>{repository.name}</span>
                    <span className={s.repoDesc}>{repository.description}</span>
                  </li>
                ))}
              </ul>
            </DetailsSection>
          </div>
        </div>
      </div>
    </div>
  );
}
