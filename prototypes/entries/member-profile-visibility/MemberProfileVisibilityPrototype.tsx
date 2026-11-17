'use client';

import { useEffect, useState, type ReactNode } from 'react';
import clsx from 'clsx';

import type { IMember } from '@/types/members.types';
import type { IUserInfo } from '@/types/shared.types';

import { BackButton } from '@/components/ui/BackButton';
import { DetailsSection, DetailsSectionHeader } from '@/components/common/profile/DetailsSection';
import { EditButton } from '@/components/common/profile/EditButton';
import { TagsList } from '@/components/common/profile/TagsList';
import { AddButton } from '@/components/page/member-details/components/AddButton/AddButton';
import { CvAttachmentLine } from '@/components/common/profile/StoredCv/CvAttachmentLine';
import { TeamsList } from '@/components/page/member-details/TeamsDetails/components/TeamsList';
import { ContributionsList } from '@/components/page/member-details/ContributionsDetails/components/ContributionsList';
import { InvestmentDetailsSection } from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView/components/InvestmentDetailsSection';

import page from '@/app/members/[id]/page.module.scss';
import h from '@/components/page/member-details/MemberDetailHeader/MemberDetailHeader.module.scss';
import p from '@/components/page/member-details/ProfileDetails/ProfileDetails.module.scss';
import contact from '@/components/page/member-details/contact-details/ContactDetails.module.scss';
import office from '@/components/page/member-details/OfficeHoursDetails/components/OfficeHoursView/OfficeHoursView.module.scss';
import inv from '@/components/page/member-details/InvestorProfileDetails/components/InvestorProfileView/InvestorProfileView.module.scss';
import repo from '@/components/page/member-details/RepositoriesDetails/components/RepositoriesList/RepositoriesList.module.scss';
import vs from '@/components/core/UpdatesPanel/ViewSwitch/ViewSwitch.module.scss';

import demo from '../member-profile/MemberProfile.module.scss';
import { MOCK_MEMBER } from '../member-profile/mocks';
import { ExperienceList, JobSearchStatusInput } from '../job-board/JobProfilePane';
import type { JobSearchStatus } from '../job-board/viewerState';
import { ContactHandlesList } from '../profile-shared/SectionEditor/views';
import { SEED_PROFILE } from '../member-profile-edit/mocks';

import { DEFAULT_AUDIENCE, VIEWERS, canSee, type AudienceKey, type Viewer } from './audiences';
import { AudienceIcon, CurrentVisibilityBadge, VisibilityMark } from './VisibilityMark';
import s from './MemberProfileVisibility.module.scss';

/**
 * How a member's own profile says who can see each part of it.
 *
 * **Current** transcribes the design under review: a badge on every section —
 * Public green, Members only blue, Private grey.
 *
 * **Proposed** makes four changes:
 *
 *  1. **The default is said once.** Most sections are members-only, so one line
 *     at the top says so, and only the sections that differ carry a badge
 *     (header Public, CV, Investor Details). Seven badges become three, and each
 *     one that remains is news.
 *  2. **One badge style.** Production's grey privacy pill (`PlTeamOnlyPill`,
 *     uppercase 11px) for every audience, beside the section title, told apart
 *     by icon and word — not a colour code with no legend, and not brand blue
 *     beside `+ Add` and `Edit`. Job search status's "Only visible to you"
 *     moves from the header's far right to the title, like the rest.
 *  3. **The badge names its readers.** Press or hover it and one sentence says
 *     who can see the section. The two restricted sections are labelled for who
 *     *does* see them ("Shared when you apply", "Shared on intro"), because the
 *     current "Private" is not true of either — see `audiences.ts`.
 *  4. **View as You / Member / Public.** The owner previews the page as each
 *     audience sees it: sections they can't see are gone, badges and edit
 *     controls are gone. Showing beats labelling.
 *
 * Read-only: Edit buttons are drawn for fidelity and do nothing.
 */

type Version = 'current' | 'proposed';

const member = MOCK_MEMBER as unknown as IMember;
const userInfo = { uid: MOCK_MEMBER.id, name: MOCK_MEMBER.name, email: MOCK_MEMBER.email } as unknown as IUserInfo;
const profile = SEED_PROFILE;
const noop = () => {};

const MOCK_CV = { fileName: 'Maya_Okonkwo_CV.pdf', size: 186_000, uploadedAt: '2026-10-02T10:00:00Z' };

/** Every section on the page, in production's order, with its real audience
 *  and the badge the current design gives it. */
const SECTIONS: Array<{ key: string; title: string; audience: AudienceKey; current: 'public' | 'members' | 'private' }> =
  [
    { key: 'profile', title: 'Profile', audience: 'public', current: 'public' },
    { key: 'investor', title: 'Investor Details', audience: 'investor', current: 'private' },
    { key: 'office-hours', title: 'Office Hours', audience: 'members', current: 'members' },
    { key: 'contact', title: 'Contact Details', audience: 'members', current: 'members' },
    { key: 'teams', title: 'Teams', audience: 'members', current: 'members' },
    { key: 'job-status', title: 'Job search status', audience: 'owner', current: 'private' },
    { key: 'cv', title: 'Your CV', audience: 'cv', current: 'private' },
    { key: 'experience', title: 'Experience', audience: 'members', current: 'members' },
    { key: 'contributions', title: 'Project Contributions', audience: 'members', current: 'members' },
    { key: 'repositories', title: 'Repositories', audience: 'members', current: 'members' },
  ];

export default function MemberProfileVisibilityPrototype() {
  const [mounted, setMounted] = useState(false);
  const [version, setVersion] = useState<Version>('proposed');
  const [viewer, setViewer] = useState<Viewer>('you');
  const [jobStatus, setJobStatus] = useState<JobSearchStatus | ''>('open-to-right-role');

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={s.page} />;

  const proposed = version === 'proposed';
  /* Current has no preview: it is always the owner's view. */
  const as: Viewer = proposed ? viewer : 'you';
  const owner = as === 'you';

  const audienceOf = (key: string) => SECTIONS.find((x) => x.key === key)!;
  const visible = (key: string) => canSee(as, audienceOf(key).audience);

  /** The mark beside a section title, per version. Proposed: only where the
   *  audience differs from the default, and only in the owner's own view. */
  const mark = (key: string): ReactNode => {
    const sec = audienceOf(key);
    if (!proposed) return <CurrentVisibilityBadge kind={sec.current} />;
    if (!owner || sec.audience === DEFAULT_AUDIENCE) return null;
    return <VisibilityMark audience={sec.audience} />;
  };

  const titled = (title: ReactNode, key: string) => (
    <span className={s.titleRow}>
      {title}
      {mark(key)}
    </span>
  );

  const hiddenCount = SECTIONS.filter((x) => !canSee(as, x.audience)).length;

  return (
    <div className={s.page}>
      <div className={demo.demoSwitch}>
        <div className={demo.demoSwitchGroup}>
          <span className={demo.demoSwitchLabel}>Version</span>
          <div className={demo.demoSwitchRow}>
            {(['current', 'proposed'] as Version[]).map((v) => (
              <button
                key={v}
                type="button"
                className={clsx(demo.demoSwitchBtn, { [demo.active]: version === v })}
                onClick={() => {
                  setVersion(v);
                  setViewer('you');
                }}
              >
                {v === 'current' ? 'Current' : 'Proposed'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={page.memberDetail}>
        <div className={clsx(page.container, page.singleColumn)}>
          <div className={page.content}>
            <BackButton to="/prototypes" />
            <div className={page.memberDetail__container}>
              {proposed && (
                <div className={s.audienceBar}>
                  <p className={s.audienceLine}>
                    <AudienceIcon icon={as === 'public' ? 'globe' : 'people'} />
                    <span>
                      {as === 'you' && (
                        <>
                          Your profile is visible to <strong>signed-in network members</strong>. Sections marked
                          otherwise differ.
                        </>
                      )}
                      {as === 'member' && <>This is what signed-in network members see.</>}
                      {as === 'public' && <>This is what anyone sees, including people who aren&apos;t signed in.</>}
                    </span>
                  </p>
                  <div className={s.viewAs}>
                    <span className={s.viewAsLabel}>View as</span>
                    <div className={vs.segmented} role="tablist" aria-label="View your profile as">
                      {VIEWERS.map((v) => (
                        <button
                          key={v.key}
                          type="button"
                          role="tab"
                          aria-selected={viewer === v.key}
                          className={vs.segmentedBtn}
                          onClick={() => setViewer(v.key)}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Header card — public. */}
              <div className={p.root}>
                <div className={h.header}>
                  <div className={h.headerProfile}>
                    <img className={h.headerProfileImg} src={profile.avatar} alt={profile.name} />
                  </div>
                  <div className={h.headerDetails}>
                    <div>
                      <div className={clsx(h.specificsHdr, s.nameRow)}>
                        <h1 className={h.specificsName}>{profile.name}</h1>
                        {mark('profile')}
                      </div>
                      <div className={h.roleAndLocation}>
                        <div className={h.teams}>
                          <p className={h.teamsName}>{profile.team}</p>
                          {MOCK_MEMBER.teams.length > 1 && (
                            <button type="button" className={h.moreTeamsButton}>
                              +{MOCK_MEMBER.teams.length - 1}
                            </button>
                          )}
                        </div>
                        <div className={clsx(h.divider, h.desktopOnly)} />
                        <p className={h.role}>{profile.role}</p>
                        <div className={h.divider} />
                        <div className={h.location}>
                          <p className={h.locationName}>{profile.location}</p>
                        </div>
                      </div>
                    </div>
                    {owner && (
                      <div>
                        <EditButton onClick={noop} />
                      </div>
                    )}
                  </div>
                  <div className={h.tags}>
                    {MOCK_MEMBER.teamLead && (
                      <div className={h.funds}>
                        <span className={h.fundsLabel}>Team lead</span>
                      </div>
                    )}
                    <TagsList tags={profile.skills.map((title) => ({ title }))} tagsToShow={5} />
                  </div>
                </div>
                <div className={p.bioContainer}>
                  <div className={p.bioTitle}>Bio</div>
                  {/* Prototype-authored markup from a mocked record. */}
                  <div className={p.bioContent} dangerouslySetInnerHTML={{ __html: profile.bio }} />
                </div>
              </div>

              {visible('investor') && (
                <DetailsSection>
                  <div className={inv.content}>
                    <DetailsSectionHeader title={titled('Investor Details', 'investor')}>
                      {owner && <EditButton onClick={noop} />}
                    </DetailsSectionHeader>
                    <div className={inv.block}>
                      <div className={inv.blockTitle}>Direct Investments</div>
                      <InvestmentDetailsSection
                        investInStartupStages={['Pre-seed', 'Seed']}
                        typicalCheckSize="50000"
                        investmentFocusAreas={['Infrastructure', 'AI']}
                        secRulesAccepted
                        isEditable={false}
                      />
                    </div>
                  </div>
                </DetailsSection>
              )}

              {visible('office-hours') && (
                <DetailsSection>
                  <div className={office.root}>
                    <DetailsSectionHeader title={titled('Office Hours', 'office-hours')}>
                      {owner && <EditButton onClick={noop} />}
                    </DetailsSectionHeader>
                    <div className={office.content}>
                      <div className={office.officeHoursSection}>
                        <div className={office.col}>
                          <div className={office.description}>
                            <span>
                              {profile.name} is available for a short 1:1 call to connect or help — no introduction
                              needed.
                            </span>
                            <KeywordsRow label="Topics of Interest:" items={profile.ohInterest} />
                            <KeywordsRow label="I Can Help With:" items={profile.ohHelpWith} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DetailsSection>
              )}

              {visible('contact') && (
                <DetailsSection>
                  <div className={contact.contentRoot}>
                    <DetailsSectionHeader title={titled('Contact Details', 'contact')}>
                      {owner && <EditButton onClick={noop} />}
                    </DetailsSectionHeader>
                    <div className={contact.container}>
                      <ContactHandlesList contacts={profile.contacts} />
                    </div>
                  </div>
                </DetailsSection>
              )}

              {visible('teams') && (
                <DetailsSection>
                  <DetailsSectionHeader title={titled(`Teams (${MOCK_MEMBER.teams.length})`, 'teams')} />
                  <TeamsList member={member} userInfo={userInfo} isEditable={false} onEdit={noop} />
                </DetailsSection>
              )}

              {/* Job search status — on dev the "Only visible to you" pill sits
                  at the header's far right; here it joins the title like every
                  other visibility mark. The radios are the job board's own. */}
              {visible('job-status') && (
                <DetailsSection>
                  <DetailsSectionHeader title={titled('Job search status', 'job-status')} />
                  <JobSearchStatusInput value={jobStatus} onChange={setJobStatus} />
                </DetailsSection>
              )}

              {/* CV — copy-simplified: production's resting card (`CvFileCard`)
                  reports analytics and opens a PDF preview, so the file is drawn
                  as the DS's own attachment chip. Replace/Remove left out. */}
              {visible('cv') && (
                <DetailsSection>
                  <DetailsSectionHeader title={titled('Your CV', 'cv')} />
                  <div className={s.cvRow}>
                    <CvAttachmentLine cv={MOCK_CV} variant="chip" />
                  </div>
                </DetailsSection>
              )}

              {visible('experience') && (
                <DetailsSection>
                  <DetailsSectionHeader title={titled(`Experience (${profile.experiences.length})`, 'experience')}>
                    {owner && <AddButton onClick={noop} />}
                  </DetailsSectionHeader>
                  <ExperienceList entries={profile.experiences} onEdit={owner ? noop : undefined} />
                </DetailsSection>
              )}

              {/* Production's list draws its own "Project Contributions" header,
                  so the mark can't sit in it; it gets a header of ours only in
                  Current, where every section carries a badge. */}
              {visible('contributions') && (
                <DetailsSection>
                  {!proposed && (
                    <div className={s.listBadge}>
                      <CurrentVisibilityBadge kind="members" />
                    </div>
                  )}
                  <ContributionsList
                    member={member}
                    userInfo={userInfo}
                    isEditable={false}
                    onAdd={noop}
                    onEdit={noop}
                  />
                </DetailsSection>
              )}

              {visible('repositories') && (
                <DetailsSection>
                  <DetailsSectionHeader title={titled('Repositories', 'repositories')}>
                    <a
                      href={`https://github.com/${profile.contacts.github}`}
                      target="_blank"
                      rel="noreferrer"
                      className={repo.profileLink}
                    >
                      <img src="/icons/contact/github-contact-logo.svg" alt="GitHub" height={24} width={24} />
                      Github Profile
                    </a>
                  </DetailsSectionHeader>
                  <div className={repo.root}>
                    <ul className={repo.list}>
                      {MOCK_MEMBER.repositories.map((item) => (
                        <li key={item.url} className={repo.expItem}>
                          <div className={repo.details}>
                            <div className={repo.row}>
                              <div className={repo.primaryLabel}>{item.name}</div>
                            </div>
                            <div className={repo.row}>
                              <div className={repo.secondaryLabel}>{item.description}</div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </DetailsSection>
              )}

              {/* In a preview, what's missing is said once, at the end — the
                  owner's answer to "what don't they see?". */}
              {!owner && hiddenCount > 0 && (
                <p className={s.hiddenNote}>
                  {hiddenCount} {hiddenCount === 1 ? 'section is' : 'sections are'} hidden from{' '}
                  {as === 'public' ? 'people who aren’t signed in' : 'other members'}.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KeywordsRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div className={office.keywordsWrapper}>
      <span className={office.keywordsLabel}>{label}</span>
      <span className={office.badgesWrapper}>
        {items.map((item) => (
          <div key={item} className={office.badge}>
            {item}
          </div>
        ))}
      </span>
    </div>
  );
}
