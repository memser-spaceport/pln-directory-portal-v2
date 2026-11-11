'use client';

import type { ReactNode } from 'react';

import { useHeaderSearch } from '../home-ai-ask/useHeaderSearch';
import type { AgentPrompt, AgentReply } from '../home-v2-b/agentScript';
import { MemberProfilePage } from '../member-profile/MemberProfilePrototype';
import { MOCK_MEMBER } from '../member-profile/mocks';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';

import { AGENT_PAGES, AgentDock, type AgentPage } from './AgentDock';
import type { AgentViewer } from './AgentV0';

const FIRST = MOCK_MEMBER.name.split(' ')[0];

/* What the agent offers here first: questions about the page it's reading. */
const PROFILE_PROMPTS: AgentPrompt[] = [
  { text: `What is ${FIRST} working on, and why would we talk?`, topic: 'profile' },
  { text: `Draft a message asking ${FIRST} for 15 minutes`, topic: 'intro' },
];

const ABOUT_RE = new RegExp(`\\b(${FIRST}|her|she|this (person|member|profile))\\b`, 'i');

/**
 * Answers about the profile, read from the page's own mocks. With the profile taken out of the context row,
 * the agent says so instead of answering: the chip is what it reads.
 */
function profileReply(text: string, reading: AgentPage[]): AgentReply | null {
  if (!ABOUT_RE.test(text)) return null;
  const readsProfile = reading.some((p) => p.id === AGENT_PAGES.maya.id);
  if (!readsProfile) {
    return {
      steps: [],
      blocks: [
        {
          kind: 'text',
          text: `I'm not reading ${MOCK_MEMBER.name}'s profile right now. Add it back with Add page below and ask again.`,
        },
      ],
    };
  }

  const steps = [`Read ${MOCK_MEMBER.name}`, 'Read her teams and office hours'];
  if (/draft|message|ask .* for|15 minutes/i.test(text)) {
    return {
      steps,
      blocks: [
        { kind: 'text', text: `${FIRST} has office hours, so this goes with a booking link. Here’s a draft:` },
        /* Plain text, not the panel's 'draft' block: that one's button opens the forum. */
        {
          kind: 'text',
          text: `“Hi ${FIRST}, I saw you're building verifiable compute markets and that you're open to talking with technical operators. We're working on something close to it and I'd value 15 minutes on how you price GPU time. I've booked a slot in your office hours; happy to move it if another time suits you better.”`,
        },
      ],
    };
  }
  return {
    steps,
    blocks: [
      {
        kind: 'text',
        /* From the bio and office hours only: the header's role and city are member-profile's long-facts demo. */
        text: `${FIRST} is building verifiable compute markets for AI training. Before that she led GPU scheduling at a large cloud. She's raising a seed extension and offers office hours on ${MOCK_MEMBER.ohHelpWith.join(', ').toLowerCase()}.`,
      },
      {
        kind: 'text',
        text: `Why talk: she asks to hear from infra-focused funds and technical operators, and her office hours cover go-to-market for infra. Want me to draft a message?`,
      },
    ],
  };
}

/**
 * A member profile with the Agent corner, to show the agent on a page other than Home. Production's profile
 * (member-profile's MemberProfilePage), signed in, with this entry's AgentDock. The agent opens reading the
 * profile; the feedback drawer is about the profile too.
 */
export function AgentProfilePage({
  viewer,
  reviewBand,
  openOnArrival,
}: {
  viewer: AgentViewer;
  reviewBand: ReactNode;
  openOnArrival: boolean;
}) {
  const navExtras = useHeaderSearch(true);
  return (
    <>
      <PrototypeNavBar
        hasUnreadNews={false}
        active
        isLoggedIn
        onSignIn={() => {}}
        onSignUp={() => {}}
        {...navExtras}
        eventsInMore
      />
      <PrototypeMobileNav hasUnreadNews={false} active />
      <MemberProfilePage askAi="header" reviewBand={reviewBand} />
      <AgentDock
        key={viewer.key}
        page={AGENT_PAGES.maya}
        viewer={viewer}
        recentPages={[AGENT_PAGES.home, AGENT_PAGES.lattice, AGENT_PAGES.jobs]}
        pagePrompts={PROFILE_PROMPTS}
        pageReply={profileReply}
        openOnArrival={openOnArrival}
      />
    </>
  );
}
