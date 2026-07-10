'use client';

import { Fragment, useEffect, useState } from 'react';
import clsx from 'clsx';

import type { IMember } from '@/types/members.types';
import type { IUserInfo } from '@/types/shared.types';

import { BackButton } from '@/components/ui/BackButton';
import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
  NoDataBlock,
} from '@/components/common/profile/DetailsSection';
import { Divider } from '@/components/common/profile/Divider';
import { Badge } from '@/components/common/Badge';
import { CalendarBlankIcon, UsersThreeIcon } from '@/components/icons';
import { TagsList } from '@/components/common/profile/TagsList';
import CustomTooltip from '@/components/ui/Tooltip/Tooltip';

// Import-safe production list components (they render from props — no fetching).
import { TeamsList } from '@/components/page/member-details/TeamsDetails/components/TeamsList';
import { ContributionsList } from '@/components/page/member-details/ContributionsDetails/components/ContributionsList';
import { ExperiencesList } from '@/components/page/member-details/ExperienceDetails/components/ExperienceDetailsView/components/ExperiencesList';
import { ProfileSocialLink } from '@/components/page/member-details/profile-social-link';
import { getProfileFromURL } from '@/utils/common.utils';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';

// Reuse production page + section styling so the prototype tracks production 1:1.
import page from '@/app/members/[id]/page.module.scss';
import h from '@/components/page/member-details/MemberDetailHeader/MemberDetailHeader.module.scss';
import profile from '@/components/page/member-details/ProfileDetails/ProfileDetails.module.scss';
import office from '@/components/page/member-details/OfficeHoursDetails/components/OfficeHoursView/OfficeHoursView.module.scss';
import contact from '@/components/page/member-details/contact-details/ContactDetails.module.scss';
import repo from '@/components/page/member-details/RepositoriesDetails/components/RepositoriesList/RepositoriesList.module.scss';
import book from '@/components/page/member-details/BookWithOther/BookWithOther.module.scss';

import s from './MemberProfile.module.scss';
import {
  MOCK_MEMBER,
  MOCK_EXPERIENCE,
  RELATIONSHIP_SCENARIOS,
  TIER_META,
  totalInteractions,
  type AffinityRelationship,
} from './mocks';

// Cast the mock to the production prop types — the real components read only the
// fields we populate, so this is safe for the prototype.
const member = MOCK_MEMBER as unknown as IMember;
const userInfo = { uid: 'viewer', name: 'Viewer', email: 'viewer@pl.org' } as unknown as IUserInfo;

const SOCIAL_TO_HANDLE_MAP: Record<string, keyof typeof MOCK_MEMBER> = {
  linkedin: 'linkedinHandle',
  github: 'githubHandle',
  twitter: 'twitter',
  email: 'email',
  discord: 'discordHandle',
  telegram: 'telegramHandle',
};
const VISIBLE_HANDLES = ['email', 'linkedin', 'telegram', 'twitter', 'discord', 'github'];

type CardAccent = 'slate' | 'blue';
const CARD_ACCENTS: { key: CardAccent; label: string }[] = [
  { key: 'slate', label: 'Slate' },
  { key: 'blue', label: 'Blue' },
];

export default function MemberProfilePrototype() {
  // Reusing interactive production components — gate on a mounted flag so SSR ===
  // first client render and we avoid hydration drift.
  const [mounted, setMounted] = useState(false);
  const [scenarioKey, setScenarioKey] = useState(RELATIONSHIP_SCENARIOS[0].key);
  const [cardAccent, setCardAccent] = useState<CardAccent>('slate');

  useEffect(() => setMounted(true), []);

  const scenario = RELATIONSHIP_SCENARIOS.find((sc) => sc.key === scenarioKey) ?? RELATIONSHIP_SCENARIOS[0];

  if (!mounted) {
    return <div className={s.pageBackdrop} />;
  }

  return (
    <div className={s.pageBackdrop}>
      <div className={s.demoSwitch}>
        <span className={s.demoSwitchLabel}>Affinity demo — switch the relationship state</span>
        <div className={s.demoSwitchRow}>
          {RELATIONSHIP_SCENARIOS.map((sc) => (
            <button
              key={sc.key}
              type="button"
              className={clsx(s.demoSwitchBtn, { [s.active]: sc.key === scenario.key })}
              onClick={() => setScenarioKey(sc.key)}
            >
              {sc.label}
            </button>
          ))}
        </div>
        <span className={s.demoSwitchLabel}>Card accent</span>
        <div className={s.demoSwitchRow}>
          {CARD_ACCENTS.map((a) => (
            <button
              key={a.key}
              type="button"
              className={clsx(s.demoSwitchBtn, { [s.active]: a.key === cardAccent })}
              onClick={() => setCardAccent(a.key)}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className={page.memberDetail}>
        <div className={page.container}>
          <div className={page.content}>
            <BackButton to="/members" />
            <div className={page.memberDetail__container}>
              <ProfileHeaderCard />
              {/* Inline Affinity copy — only shown below tablet-landscape, where the rail is hidden. */}
              <div className={s.affinityMobile}>
                <AffinityCard relationship={scenario.relationship} empty={scenario.empty} accent={cardAccent} />
              </div>
              <OfficeHoursCard />
              <ContactCard />
              <TeamsCard />
              <ExperienceCard />
              <ContributionsCard />
              <RepositoriesCard />
            </div>
          </div>

          {/* Desktop right rail — mirrors the production BookWithOther rail. */}
          <div className={page.desktopOnly}>
            <div style={{ visibility: 'hidden' }}>
              <BackButton to="/members" />
            </div>
            <div className={s.rail}>
              <AffinityCard relationship={scenario.relationship} empty={scenario.empty} accent={cardAccent} />
              <BookWithOtherCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Profile header (mirrors ProfileDetails + MemberDetailHeader) ---------- */
function ProfileHeaderCard() {
  return (
    <div className={profile.root}>
      <div className={h.header}>
        <div className={h.headerProfile}>
          <img className={h.headerProfileImg} src={MOCK_MEMBER.profile} alt={MOCK_MEMBER.name} />
        </div>

        <div className={h.headerDetails}>
          <div>
            <div className={h.specificsHdr}>
              <CustomTooltip trigger={<h1 className={h.specificsName}>{MOCK_MEMBER.name}</h1>} content={MOCK_MEMBER.name} />
            </div>
            <div className={h.roleAndLocation}>
              <div className={h.teams}>
                <p className={h.teamsName}>{MOCK_MEMBER.teams[0].name}</p>
                {MOCK_MEMBER.teams.length > 1 && (
                  <button onClick={(e) => e.preventDefault()} className={h.moreTeamsButton}>
                    +{MOCK_MEMBER.teams.length - 1}
                  </button>
                )}
              </div>
              <div className={clsx(h.divider, h.desktopOnly)} />
              <p className={h.role}>{MOCK_MEMBER.role}</p>
              <div className={h.divider} />
              <div className={h.location}>
                <LocationIcon />
                <p className={h.locationName}>{MOCK_MEMBER.locationLabel}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={h.tags}>
          <span className={s.founderTag}>Founder</span>
          {MOCK_MEMBER.openToWork && (
            <div className={h.funds}>
              <span className={h.fundsLabel}>Open to Collaborate</span>
            </div>
          )}
          {MOCK_MEMBER.teamLead && (
            <div className={h.funds}>
              <span className={h.fundsLabel}>Team lead</span>
            </div>
          )}
          <TagsList tags={MOCK_MEMBER.skills.map((sk) => ({ title: sk.title }))} tagsToShow={5} />
        </div>
      </div>

      <div className={profile.bioContainer}>
        <div className={s.bioLabel}>Bio</div>
        <div className={s.bio}>{MOCK_MEMBER.bio}</div>
      </div>
    </div>
  );
}

/* ---------- Office Hours (copy-simplified from OfficeHoursView, viewer state) ---------- */
function OfficeHoursCard() {
  return (
    <DetailsSection>
      <div className={office.root}>
        <DetailsSectionHeader title="Office Hours" />
        <div className={office.content}>
          <div className={office.officeHoursSection}>
            <div className={office.col}>
              <div className={office.description}>
                <div>
                  <span>{MOCK_MEMBER.name} is available for a short 1:1 call to connect or help — no introduction needed.</span>
                </div>
                <div className={office.keywordsWrapper}>
                  <span className={office.keywordsLabel}>Topics of Interest:</span>
                  <span className={office.badgesWrapper}>
                    {MOCK_MEMBER.ohInterest.map((item) => (
                      <div key={item} className={office.badge}>
                        {item}
                      </div>
                    ))}
                  </span>
                </div>
                <div className={office.keywordsWrapper}>
                  <span className={office.keywordsLabel}>I Can Help With:</span>
                  <span className={office.badgesWrapper}>
                    {MOCK_MEMBER.ohHelpWith.map((item) => (
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
              <span className={office.subtext}>{MOCK_MEMBER.scheduleMeetingCount} past bookings</span>
            </div>
          </div>
        </div>
      </div>
    </DetailsSection>
  );
}

/* ---------- Contact details (copy-simplified, unlocked viewer state) ---------- */
function ContactCard() {
  return (
    <DetailsSection>
      <div className={contact.contentRoot}>
        <DetailsSectionHeader title="Contact Details" />
        <div className={contact.container}>
          <div className={contact.social}>
            <div className={contact.top}>
              <div className={contact.content}>
                {VISIBLE_HANDLES.map((item, i, arr) => {
                  const handle = (MOCK_MEMBER[SOCIAL_TO_HANDLE_MAP[item]] as string) ?? '';
                  return (
                    <Fragment key={item}>
                      <ProfileSocialLink
                        profile={getProfileFromURL(handle, item)}
                        height={24}
                        width={24}
                        callback={() => {}}
                        type={item}
                        handle={handle}
                        logo={getContactLogoByProvider(item)}
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
    </DetailsSection>
  );
}

/* ---------- Teams ---------- */
function TeamsCard() {
  return (
    <DetailsSection>
      <DetailsSectionHeader title={`Teams (${MOCK_MEMBER.teams.length})`} />
      <TeamsList member={member} userInfo={userInfo} isEditable={false} onEdit={() => {}} />
    </DetailsSection>
  );
}

/* ---------- Experience ---------- */
function ExperienceCard() {
  return (
    <DetailsSection>
      <DetailsSectionHeader title={`Experience (${MOCK_EXPERIENCE.length})`} />
      <ExperiencesList
        data={MOCK_EXPERIENCE}
        member={member}
        userInfo={userInfo}
        isEditable={false}
        isLoading={false}
        onEdit={() => {}}
      />
    </DetailsSection>
  );
}

/* ---------- Project contributions ---------- */
function ContributionsCard() {
  return (
    <DetailsSection>
      <ContributionsList member={member} userInfo={userInfo} isEditable={false} onAdd={() => {}} onEdit={() => {}} />
    </DetailsSection>
  );
}

/* ---------- Repositories (copy-simplified from RepositoriesList) ---------- */
function RepositoriesCard() {
  const repos = MOCK_MEMBER.repositories;
  return (
    <DetailsSection>
      <DetailsSectionHeader title="Repositories">
        <a href={`https://github.com/${MOCK_MEMBER.githubHandle}`} target="_blank" rel="noreferrer" className={repo.profileLink}>
          <img src="/icons/contact/github-contact-logo.svg" alt="GitHub" height={24} width={24} />
          Github Profile
          <RepoLinkIcon />
        </a>
      </DetailsSectionHeader>
      <div className={repo.root}>
        <ul className={repo.list}>
          {repos.map((item) => (
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
  );
}

/* ---------- Schedule rail card (copy-simplified from prod BookWithOther) ---------- */
function BookWithOtherCard() {
  return (
    <div className={book.root}>
      <div className={book.header}>{MOCK_MEMBER.name} doesn&apos;t have their schedule available right now</div>
      <div className={book.body}>You can book office hours with other members who are available.</div>
      <a className={book.button} href="/members?hasOfficeHours=true">
        See 248 members open to connect
      </a>
    </div>
  );
}

/* ---------- Affinity / relationship intelligence card ---------- */
function AffinityCard({
  relationship,
  empty,
  accent,
}: {
  relationship: AffinityRelationship;
  empty?: boolean;
  accent: CardAccent;
}) {
  const { owner, lastContact, tier, windowMonths, months } = relationship;
  const meta = TIER_META[tier];
  const total = totalInteractions(months);
  const isBlue = accent === 'blue';
  // Slate is the neutral "backstage" identity; blue is the brand-accent variant.
  const circleClass = clsx(s.circleIcon, { [s.circleIconSlate]: !isBlue, [s.circleIconMuted]: empty });

  // Field values, shared between the slate (icon-row) and blue (Investor-Details
  // grouped-container) layouts.
  const ownerValue = empty ? (
    <NoDataBlock>Not assigned</NoDataBlock>
  ) : (
    <span className={s.ownerName}>{owner.name}</span>
  );
  const contactValue = empty ? (
    <NoDataBlock>No contact logged yet</NoDataBlock>
  ) : (
    <div className={s.contactBody}>
      <span className={s.contactWhenPrimary}>{lastContact.date}</span>
      <span className={s.contactSummary}>{lastContact.summary}</span>
    </div>
  );
  const freqValue = empty ? (
    <NoDataBlock>No interactions logged yet</NoDataBlock>
  ) : (
    <div className={s.freqHeader}>
      <Badge variant={meta.variant}>{meta.label}</Badge>
      <span className={s.freqCount}>
        <strong>{total}</strong> {total === 1 ? 'touchpoint' : 'touchpoints'} in the last {windowMonths} months
      </span>
    </div>
  );

  // The same icon-row blocks serve both variants; on slate the grey block fill
  // is stripped (scoped in SCSS), on blue it stays — grey blocks on white body,
  // like the production RelationshipDetails card.
  const blocks = (
    <div className={s.blocks}>
      {/* Relationship owner */}
      <DetailsSectionGreyContentContainer className={clsx(s.block, s.blockWithIcon)}>
        <span className={circleClass}>
          <UsersThreeIcon />
        </span>
        <div className={s.blockBody}>
          <span className={s.blockLabel}>Relationship owner</span>
          {ownerValue}
        </div>
      </DetailsSectionGreyContentContainer>

      {/* Last contact */}
      <DetailsSectionGreyContentContainer className={clsx(s.block, s.blockWithIcon)}>
        <span className={circleClass}>
          <CalendarBlankIcon />
        </span>
        <div className={s.blockBody}>
          <span className={s.blockLabel}>Last contact</span>
          {contactValue}
        </div>
      </DetailsSectionGreyContentContainer>

      {/* Interaction frequency */}
      <DetailsSectionGreyContentContainer className={clsx(s.block, s.blockWithIcon)}>
        <span className={circleClass}>
          <ChartIcon />
        </span>
        <div className={clsx(s.blockBody, s.blockBodyLoose)}>
          <span className={s.blockLabel}>Interaction frequency</span>
          {freqValue}
        </div>
      </DetailsSectionGreyContentContainer>
    </div>
  );

  // Blue variant mirrors the Investor Details card: brand-subtle outline,
  // light-blue banner strip attached to the top (carrying "PL Team only"),
  // white body with the grey icon blocks.
  if (isBlue) {
    return (
      <DetailsSection classes={{ root: s.internalCardBlue }}>
        <div className={s.plBanner}>
          <LockIcon />
          <span>PL Team only</span>
        </div>
        <div className={s.blueBody}>
          <DetailsSectionHeader title="Relationship" />
          {blocks}
        </div>
      </DetailsSection>
    );
  }

  return (
    <DetailsSection classes={{ root: s.internalCard }}>
      <DetailsSectionHeader title="Relationship">
        <span className={s.internalPill}>
          <LockIcon />
          PL Team only
        </span>
      </DetailsSectionHeader>
      {blocks}
    </DetailsSection>
  );
}

/* ---------- Inline icons ---------- */
// Local copy of the system ChartIcon using currentColor (the production icon
// hard-codes its fill, so it can't be recolored for the muted empty state).
const ChartIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.9062 11.375C12.9062 11.549 12.8371 11.716 12.714 11.839C12.591 11.9621 12.424 12.0312 12.25 12.0312H1.75C1.57595 12.0312 1.40903 11.9621 1.28596 11.839C1.16289 11.716 1.09375 11.549 1.09375 11.375V2.625C1.09375 2.45095 1.16289 2.28403 1.28596 2.16096C1.40903 2.03789 1.57595 1.96875 1.75 1.96875C1.92405 1.96875 2.09097 2.03789 2.21404 2.16096C2.33711 2.28403 2.40625 2.45095 2.40625 2.625V8.03906L4.7857 5.65906C4.84667 5.59788 4.91912 5.54934 4.99888 5.51622C5.07865 5.4831 5.16418 5.46605 5.25055 5.46605C5.33692 5.46605 5.42244 5.4831 5.50221 5.51622C5.58198 5.54934 5.65442 5.59788 5.71539 5.65906L7 6.94531L9.35156 4.59375H8.75C8.57595 4.59375 8.40903 4.52461 8.28596 4.40154C8.16289 4.27847 8.09375 4.11155 8.09375 3.9375C8.09375 3.76345 8.16289 3.59653 8.28596 3.47346C8.40903 3.35039 8.57595 3.28125 8.75 3.28125H10.9375C11.1115 3.28125 11.2785 3.35039 11.4015 3.47346C11.5246 3.59653 11.5938 3.76345 11.5938 3.9375V6.125C11.5937 6.29905 11.5246 6.46597 11.4015 6.58904C11.2785 6.71211 11.1115 6.78125 10.9375 6.78125C10.7635 6.78125 10.5965 6.71211 10.4735 6.58904C10.3504 6.46597 10.2813 6.29905 10.2812 6.125V5.52344L7.4643 8.34094C7.40333 8.40212 7.33088 8.45066 7.25112 8.48378C7.17135 8.51691 7.08582 8.53396 6.99945 8.53396C6.91308 8.53396 6.82756 8.51691 6.74779 8.48378C6.66802 8.45066 6.59558 8.40212 6.53461 8.34094L5.25 7.05469L2.40625 9.89844V10.7188H12.25C12.424 10.7188 12.591 10.7879 12.714 10.911C12.8371 11.034 12.9062 11.201 12.9062 11.375Z"
      fill="currentColor"
    />
  </svg>
);

// Local lock icon (no lock exists in @/components/icons) — currentColor so the
// pill controls its slate tint. Matches the file's inline-icon pattern.
const LockIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 6.667h-.667V5.333a3.333 3.333 0 0 0-6.666 0v1.334H4c-.736 0-1.333.597-1.333 1.333v5.333c0 .736.597 1.334 1.333 1.334h8c.736 0 1.333-.598 1.333-1.334V8c0-.736-.597-1.333-1.333-1.333Zm-6-1.334a2 2 0 0 1 4 0v1.334H6V5.333Zm2.667 6.334v1a.667.667 0 0 1-1.334 0v-1a1 1 0 1 1 1.334 0Z"
      fill="currentColor"
    />
  </svg>
);

const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 4.6875C9.32013 4.6875 8.65552 4.88911 8.09023 5.26682C7.52493 5.64454 7.08434 6.1814 6.82416 6.80953C6.56399 7.43765 6.49591 8.12881 6.62855 8.79562C6.76119 9.46243 7.08858 10.0749 7.56932 10.5557C8.05006 11.0364 8.66257 11.3638 9.32938 11.4964C9.99619 11.6291 10.6874 11.561 11.3155 11.3008C11.9436 11.0407 12.4805 10.6001 12.8582 10.0348C13.2359 9.46948 13.4375 8.80487 13.4375 8.125C13.4365 7.21363 13.074 6.33989 12.4295 5.69546C11.7851 5.05103 10.9114 4.68853 10 4.6875ZM10 9.6875C9.69097 9.6875 9.38887 9.59586 9.13192 9.42417C8.87497 9.25248 8.6747 9.00845 8.55644 8.72294C8.43818 8.43743 8.40723 8.12327 8.46752 7.82017C8.52781 7.51708 8.67663 7.23866 8.89515 7.02014C9.11367 6.80163 9.39208 6.65281 9.69517 6.59252C9.99827 6.53223 10.3124 6.56318 10.5979 6.68144C10.8835 6.7997 11.1275 6.99997 11.2992 7.25692C11.4709 7.51387 11.5625 7.81597 11.5625 8.125C11.5625 8.5394 11.3979 8.93683 11.1049 9.22985C10.8118 9.52288 10.4144 9.6875 10 9.6875ZM10 0.9375C8.09439 0.939568 6.26742 1.69748 4.91995 3.04495C3.57248 4.39242 2.81457 6.21939 2.8125 8.125C2.8125 14.1687 9.19063 18.7031 9.4625 18.893C9.62005 19.0032 9.8077 19.0624 10 19.0624C10.1923 19.0624 10.3799 19.0032 10.5375 18.893C11.7455 18.0027 12.8508 16.9808 13.8328 15.8461C16.0273 13.3258 17.1875 10.6539 17.1875 8.125C17.1854 6.21939 16.4275 4.39242 15.08 3.04495C13.7326 1.69748 11.9056 0.939568 10 0.9375ZM12.4453 14.5867C11.7004 15.4424 10.8822 16.2313 10 16.9445C9.1178 16.2313 8.29958 15.4424 7.55469 14.5867C6.25 13.0758 4.6875 10.7273 4.6875 8.125C4.6875 6.71604 5.24721 5.36478 6.2435 4.36849C7.23978 3.37221 8.59104 2.8125 10 2.8125C11.409 2.8125 12.7602 3.37221 13.7565 4.36849C14.7528 5.36478 15.3125 6.71604 15.3125 8.125C15.3125 10.7273 13.75 13.0758 12.4453 14.5867Z"
      fill="#455468"
    />
  </svg>
);

const MeetingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.667 2.667h-1.334V2a.667.667 0 0 0-1.333 0v.667H6V2a.667.667 0 1 0-1.333 0v.667H3.333c-.736 0-1.333.597-1.333 1.333v8.667c0 .736.597 1.333 1.333 1.333h9.334c.736 0 1.333-.597 1.333-1.333V4c0-.736-.597-1.333-1.333-1.333Zm0 10H3.333V6.667h9.334v6Zm0-7.334H3.333V4h9.334v1.333Z"
      fill="currentColor"
    />
  </svg>
);

const EmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.333 2.667H2.667c-.736 0-1.333.597-1.333 1.333v8c0 .736.597 1.333 1.333 1.333h10.666c.736 0 1.334-.597 1.334-1.333V4c0-.736-.598-1.333-1.334-1.333Zm0 2.666L8 8.667 2.667 5.333V4L8 7.333 13.333 4v1.333Z"
      fill="currentColor"
    />
  </svg>
);

const InfoIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: 1 }}>
    <path
      d="M8 1.333A6.667 6.667 0 1 0 8 14.667 6.667 6.667 0 0 0 8 1.333Zm0 12A5.333 5.333 0 1 1 8 2.667a5.333 5.333 0 0 1 0 10.666ZM8 7a.667.667 0 0 0-.667.667v2.666a.667.667 0 0 0 1.334 0V7.667A.667.667 0 0 0 8 7Zm0-2.667a.833.833 0 1 0 0 1.667.833.833 0 0 0 0-1.667Z"
      fill="#8897ae"
    />
  </svg>
);

const RepoIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, minWidth: 40 }}>
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
