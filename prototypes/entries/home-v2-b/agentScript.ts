import type { ReactNode } from 'react';

import type { ISuggestedTeam, ITeamNewsItem } from '@/types/team-news.types';

import type { HomeJob } from '../home-refactor/mocks';
import { EVENT_TYPE_LABEL } from '../newsfeed-v0/eventMeta';

/* The agent's replies are scripted from the page's own data (mocked, no model). A reply is the steps it
   shows while working, then blocks it streams in order. */

export type AgentBlock =
  | { kind: 'text'; text: string }
  | { kind: 'stories'; items: ITeamNewsItem[] }
  | { kind: 'teams'; items: ISuggestedTeam[] }
  | { kind: 'roles'; items: HomeJob[]; total: number }
  | { kind: 'draft'; title: string; body: string }
  /** A change the agent wants to make: nothing happens until the member presses it. */
  | { kind: 'proposal'; title: string; confirmLabel: string; teamUids: string[] }
  | { kind: 'suggest'; prompts: string[] }
  /** A block another entry scripts (home-v2's request, change and draft cards); it owns its own state. */
  | { kind: 'custom'; render: (ctx: AgentBlockContext) => ReactNode };

/** What a custom block can do in the thread: answer for the member (a question's options) while nothing is running. */
export type AgentBlockContext = { send: (text: string) => void; busy: boolean };

export type AgentReply = { steps: string[]; blocks: AgentBlock[] };

export const AGENT_PROMPTS = [
  "Summarize this week's network updates",
  'Which teams should I follow?',
  'Find open roles that fit my profile',
  'Draft a forum post introducing my team',
];

export type AgentData = {
  news: ITeamNewsItem[];
  forumCount: number;
  likeCount: (uid: string) => number;
  teams: ISuggestedTeam[];
  followed: Set<string>;
  roles: HomeJob[];
  totalRoles: number;
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function agentReply(prompt: string, d: AgentData): AgentReply {
  const q = prompt.toLowerCase();

  if (/summar|this week|happen|update|news/.test(q)) {
    const teams = new Set(d.news.map((n) => n.teamUid)).size;
    const top = [...d.news].sort((a, b) => d.likeCount(b.uid) - d.likeCount(a.uid)).slice(0, 3);
    const byType = Object.entries(
      d.news.reduce<Record<string, number>>((acc, n) => ({ ...acc, [n.eventType]: (acc[n.eventType] ?? 0) + 1 }), {}),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t, n]) => plural(n, (EVENT_TYPE_LABEL[t as keyof typeof EVENT_TYPE_LABEL] ?? t).toLowerCase()))
      .join(', ');
    return {
      steps: [`Read ${plural(d.news.length, 'news update')}`, `Read ${plural(d.forumCount, 'forum thread')}`],
      blocks: [
        {
          kind: 'text',
          text: `This week ${plural(teams, 'team')} posted ${plural(d.news.length, 'update')} (${byType}), and the forum had ${plural(d.forumCount, 'new thread')}. The three people reacted to most:`,
        },
        { kind: 'stories', items: top },
        { kind: 'suggest', prompts: ['Which teams should I follow?'] },
      ],
    };
  }

  if (/follow|team/.test(q) && !/draft|post|write/.test(q)) {
    const picks = d.teams.filter((t) => !d.followed.has(t.uid));
    if (!picks.length)
      return {
        steps: ['Checked the teams you follow'],
        blocks: [{ kind: 'text', text: 'You already follow every team I would suggest right now.' }],
      };
    return {
      steps: ['Read your focus areas and skills', 'Checked the teams you follow', 'Ranked teams that post often'],
      blocks: [
        {
          kind: 'text',
          text: `These ${plural(picks.length, 'team')} match your focus areas and post most weeks, so following them changes what For You shows:`,
        },
        { kind: 'teams', items: picks },
        {
          kind: 'proposal',
          title: `Follow ${plural(picks.length, 'team')}?`,
          confirmLabel: `Follow ${plural(picks.length, 'team')}`,
          teamUids: picks.map((t) => t.uid),
        },
      ],
    };
  }

  if (/role|job|hiring|hire|work/.test(q)) {
    return {
      steps: ['Read your profile and skills', `Searched ${d.totalRoles} open roles`],
      blocks: [
        {
          kind: 'text',
          text: `${plural(d.roles.length, 'role')} out of ${d.totalRoles} fit your experience in distributed systems:`,
        },
        { kind: 'roles', items: d.roles, total: d.totalRoles },
      ],
    };
  }

  if (/draft|post|forum|write|intro/.test(q)) {
    return {
      steps: ['Read your team profile', 'Read recent introductions in the forum'],
      blocks: [
        { kind: 'text', text: "Here's a draft. Nothing is posted until you post it from the forum." },
        {
          kind: 'draft',
          title: 'Hello from the Protocol Labs design team',
          body: "Hi all, I'm Polina, a product designer on the Protocol Labs Directory. We're reworking Home and the job board this quarter and would love to hear what you open the Directory for, and what's missing.\n\nIf you have 20 minutes for a call, reply here or send me a message.",
        },
      ],
    };
  }

  return {
    steps: ['Searched the Directory'],
    blocks: [
      {
        kind: 'text',
        text: "I can't answer that in this prototype yet. Here's what I can do:",
      },
      { kind: 'suggest', prompts: AGENT_PROMPTS },
    ],
  };
}

/** Streaming: a text block costs one unit per word, every other block one unit. */
export const blockUnits = (b: AgentBlock) => (b.kind === 'text' ? b.text.split(' ').length : 1);
export const replyUnits = (r: AgentReply) => r.blocks.reduce((n, b) => n + blockUnits(b), 0);
