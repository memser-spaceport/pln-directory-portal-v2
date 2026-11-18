'use client';

/**
 * profile-agent-actions (2026-11-17): the member and team profiles with the header's contact press turned
 * into an agent door.
 *
 *   Header      "Make a request" (glossy, where Schedule Meeting / Request an intro stood) opens a short
 *               list: Book office hours, Request an intro (teams only: intros to members aren't a thing
 *               today), Something else. Picking one opens the Agent drawer with that request already
 *               sent; the agent finds slots or drafts the request, and nothing happens until you press.
 *   Office Hours  Schedule Meeting is back on the card, where production has it.
 *
 * Profile switch: ?profile=team. Hosts member-profile's MemberProfilePage and team-profile's page through
 * new optional props (contactAction / scheduleOnCard / reviewBandExtra, contactPress); the Agent drawer is
 * the `agent` entry's, with its new optional `send`.
 *
 * Reuse map
 *  - Pages: MemberProfilePage (member-profile), TeamProfilePrototype (team-profile).
 *  - Drawer: agent/AgentDrawer + VIEWERS (portfolio founder, Maya Chen of Lattice Compute).
 *  - Press: OfficeHoursView `primaryButton` + intro-shared `.primary`. Menu: NewsShareMenu chrome (base-ui).
 *  - Cards: AgentV0 card chrome; the intro writes intro-shared's store, so the team header and search agree.
 */

import clsx from 'clsx';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import type { AgentReply } from '../home-v2-b/agentScript';
import { AgentDrawer, type SendRequest } from '../agent/AgentDrawer';
import { buildCatalog, PAGES, type AgentItem } from '../agent/items';
import { VIEWERS, type Prompt } from '../agent/script';
import { useIntroRequests } from '../intro-shared/introRequests';
import { MemberProfilePage } from '../member-profile/MemberProfilePrototype';
import band from '../member-profile/MemberProfile.module.scss';
import { SuggestedRail, SUGGESTED_MEMBERS } from '../profile-shared/SuggestedRail';
import TeamProfilePrototype from '../team-profile/TeamProfilePrototype';
import teamBand from '../team-profile/TeamProfile.module.scss';

import { AgentRequestMenu, type RequestOption } from './AgentRequestMenu';
import { MEMBER, TEAM } from './mocks';
import { BOOK_TEAM_LINE, INTRO_LINE, bookLine, profileRequestReply } from './requests';

type Profile = 'member' | 'team';
const PROFILES: { value: Profile; label: string }[] = [
  { value: 'member', label: 'Member' },
  { value: 'team', label: 'Team' },
];

const VIEWER = VIEWERS.founder;

const TEAM_PAGE: AgentItem = {
  id: 'page-team-pl',
  kind: 'page',
  page: 'team',
  label: TEAM.name,
  meta: 'Team profile',
  path: `/teams/${TEAM.uid}`,
};

const MEMBER_PROMPTS: Prompt[] = [{ text: bookLine(MEMBER.name), topic: 'profile' }];
const TEAM_PROMPTS: Prompt[] = [
  { text: INTRO_LINE, topic: 'intro' },
  { text: BOOK_TEAM_LINE, topic: 'team' },
];

export default function ProfileAgentActionsPrototype() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const profile: Profile = searchParams.get('profile') === 'team' ? 'team' : 'member';
  const setProfile = (value: Profile) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'member') params.delete('profile');
    else params.set('profile', value);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const catalog = useMemo(() => (now ? buildCatalog(now) : []), [now]);
  const intros = useIntroRequests();

  /* The menu's pick, handed to the drawer; seq makes the same pick twice count. */
  const [send, setSend] = useState<SendRequest | null>(null);
  const pick = (text: string) => setSend((cur) => ({ seq: (cur?.seq ?? 0) + 1, text }));
  /* "Something else": the drawer on the page, idle. Ctrl/⌘ J is the drawer's own toggle. */
  const openAgent = () =>
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', ctrlKey: true, metaKey: true, bubbles: true }));

  const pageReply = useMemo(
    () =>
      (text: string): AgentReply | null =>
        profileRequestReply(text, VIEWER),
    [],
  );

  if (!now) return <div className={band.pageBackdrop} />;

  const page = profile === 'team' ? TEAM_PAGE : PAGES.maya;

  const drawer = (
    <AgentDrawer
      key={profile}
      page={page}
      viewer={VIEWER}
      recentPages={[PAGES.home, profile === 'team' ? PAGES.maya : TEAM_PAGE, PAGES.jobs]}
      catalog={catalog}
      pagePrompts={profile === 'team' ? TEAM_PROMPTS : MEMBER_PROMPTS}
      pageReply={pageReply}
      send={send}
    />
  );

  if (profile === 'team') {
    const options: RequestOption[] = [
      {
        key: 'intro',
        label: 'Request an intro',
        hint: `The PL team introduces you to the right person`,
        icon: 'intro',
        line: INTRO_LINE,
        done: intros.requested(TEAM.uid) ? 'Intro requested' : undefined,
      },
      {
        key: 'book',
        label: 'Book office hours',
        hint: `With someone at ${TEAM.name} who takes them`,
        icon: 'calendar',
        line: BOOK_TEAM_LINE,
      },
    ];
    return (
      <>
        <TeamProfilePrototype
          initialView="public"
          demoBarExtra={
            <div className={teamBand.demoGroup}>
              <span className={teamBand.demoLabel}>Profile</span>
              <div className={teamBand.demoSwitch}>
                {PROFILES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    className={clsx(teamBand.demoBtn, { [teamBand.demoBtnActive]: p.value === profile })}
                    onClick={() => setProfile(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          }
          contactPress={({ size, className }) => (
            <AgentRequestMenu
              options={options}
              onPick={pick}
              onOpenAgent={openAgent}
              size={size}
              className={className}
            />
          )}
        />
        {drawer}
      </>
    );
  }

  const profileSwitch: ReactNode = (
    <div className={band.demoSwitchGroup}>
      <span className={band.demoSwitchLabel}>Profile</span>
      <div className={band.demoSwitchRow}>
        {PROFILES.map((p) => (
          <button
            key={p.value}
            type="button"
            className={clsx(band.demoSwitchBtn, { [band.active]: p.value === profile })}
            onClick={() => setProfile(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <MemberProfilePage
        askAi="header"
        scheduleOnCard
        reviewBandExtra={profileSwitch}
        suggestions={<SuggestedRail kind="member" items={SUGGESTED_MEMBERS} />}
        /* No office hours: nothing to request. Booking needs the link, and intros to a member aren't
           offered today, so the header has no press and the corner Agent stays the way in. */
        contactAction={({ hasOfficeHours, size, className }) =>
          hasOfficeHours ? (
            <AgentRequestMenu
              options={[
                {
                  key: 'book',
                  label: 'Book office hours',
                  hint: `Pick a ${MEMBER.sessionLength} slot with ${MEMBER.firstName}; the agent books it`,
                  icon: 'calendar',
                  line: bookLine(MEMBER.name),
                },
              ]}
              onPick={pick}
              onOpenAgent={openAgent}
              size={size}
              className={className}
            />
          ) : null
        }
      />
      {drawer}
    </>
  );
}
