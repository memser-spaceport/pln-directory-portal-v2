'use client';

/**
 * Everything the agent can be pointed at: the page you're on, pages you saw recently, and the network's
 * things (news, teams, members, events, forum threads). One list feeds both doors to it: the "+" in the
 * context row and "@" typed in the composer. All mocked, from the Home entries' own fixtures.
 */

import { Briefcase, CalendarBlank, ChatsCircle, House, Newspaper, User, UsersThree } from '@phosphor-icons/react';

import { EVENT_TYPE_LABEL } from '../newsfeed-v0/eventMeta';
import { FORUM_POSTS } from '../newsfeed-v0/mocks';
import { HOME_EVENTS } from '../home-refactor/mocks';
import { WEEK_ROWS, weekNewsItem } from '../home-refactor-b/mocks';
import { SUGGESTED_TEAMS } from '../home-v2-agent-dock/mocks';
import { MOCK_MEMBER } from '../member-profile/mocks';

export type AgentItemKind = 'page' | 'news' | 'team' | 'member' | 'event' | 'forum';

export type AgentItem = {
  id: string;
  kind: AgentItemKind;
  /** How the chip, the picker and the steps name it. */
  label: string;
  /** The picker's second line. */
  meta: string;
  /** Pages only: which page it is (its glyph). */
  page?: 'home' | 'profile' | 'team' | 'jobs';
  /** What the agent "reads" when asked about it (mocked). */
  body?: string;
  /** News: the team that posted it; forum: the author. */
  by?: string;
  path?: string;
};

export const KIND_LABEL: Record<AgentItemKind, string> = {
  page: 'Pages',
  news: 'News',
  team: 'Teams',
  member: 'Members',
  event: 'Events',
  forum: 'Forum',
};

export function ItemGlyph({ item }: { item: Pick<AgentItem, 'kind' | 'page'> }) {
  const p = { weight: 'regular' as const };
  if (item.kind === 'page') {
    if (item.page === 'profile') return <User {...p} />;
    if (item.page === 'team') return <UsersThree {...p} />;
    if (item.page === 'jobs') return <Briefcase {...p} />;
    return <House {...p} />;
  }
  if (item.kind === 'news') return <Newspaper {...p} />;
  if (item.kind === 'team') return <UsersThree {...p} />;
  if (item.kind === 'member') return <User {...p} />;
  if (item.kind === 'event') return <CalendarBlank {...p} />;
  return <ChatsCircle {...p} />;
}

/* ---------- Pages ---------- */

export const PAGES = {
  home: { id: 'page-home', kind: 'page', page: 'home', label: 'Home', meta: 'Page', path: '/home' },
  maya: {
    id: 'page-maya',
    kind: 'page',
    page: 'profile',
    label: MOCK_MEMBER.name,
    meta: 'Member profile',
    path: `/members/${MOCK_MEMBER.id}`,
    /* Read when the page is @mentioned in AI agent chat (version 2); the agent drawer never reads a page's body. */
    body: `${MOCK_MEMBER.name} co-founded Lattice Compute (verifiable compute markets for AI training) and offers office hours on fundraising and infra go-to-market.`,
  },
  lattice: {
    id: 'page-lattice',
    kind: 'page',
    page: 'team',
    label: 'Lattice Compute',
    meta: 'Team profile',
    path: '/teams/lattice-compute',
    body: 'Lattice Compute builds verifiable compute markets for AI training. It has 2 open roles on the Jobs page: Senior protocol engineer (remote, EU time zones) and Developer relations lead (Lisbon). Maya Okonkwo, the CEO, holds office hours on fundraising.',
  },
  jobs: { id: 'page-jobs', kind: 'page', page: 'jobs', label: 'Jobs', meta: 'Page', path: '/jobs' },
} satisfies Record<string, AgentItem>;

/* ---------- The network's things ---------- */

const MEMBERS: AgentItem[] = [
  {
    id: `member-${MOCK_MEMBER.id}`,
    kind: 'member',
    label: MOCK_MEMBER.name,
    meta: `${MOCK_MEMBER.role} · Lattice Compute`,
    body: 'Building verifiable compute markets for AI training; offers office hours on fundraising and infra go-to-market.',
  },
  ...Array.from(new Map(FORUM_POSTS.map((p) => [p.author, p])).values())
    .slice(0, 5)
    .map(
      (p): AgentItem => ({
        id: `member-${p.memberUid}`,
        kind: 'member',
        label: p.author,
        meta: p.role,
        body: `${p.author} (${p.role}) recently posted “${p.title}” in the forum.`,
      }),
    ),
];

/** The catalog, built after mount (news dates are the viewer's clock). */
export function buildCatalog(now: Date): AgentItem[] {
  const news = WEEK_ROWS.news.map((r): AgentItem => {
    const n = weekNewsItem(r.newsUid!, now);
    return {
      id: `news-${n.uid}`,
      kind: 'news',
      label: n.title,
      meta: `${n.teamName} · ${EVENT_TYPE_LABEL[n.eventType] ?? 'News'}`,
      by: n.teamName,
      body: n.summary ?? n.title,
    };
  });

  const teamsSeen = new Map<string, AgentItem>();
  for (const t of SUGGESTED_TEAMS)
    teamsSeen.set(t.uid, { id: `team-${t.uid}`, kind: 'team', label: t.name, meta: t.shortDescription ?? 'Team' });
  for (const r of WEEK_ROWS.news) {
    const n = weekNewsItem(r.newsUid!, now);
    if (!teamsSeen.has(n.teamUid))
      teamsSeen.set(n.teamUid, { id: `team-${n.teamUid}`, kind: 'team', label: n.teamName, meta: 'Team' });
  }

  const events = HOME_EVENTS.map(
    (e): AgentItem => ({
      id: `event-${e.uid}`,
      kind: 'event',
      label: e.name,
      meta: `${e.range ?? e.startDate} · ${e.location}`,
      body: `${e.name}, hosted by ${e.host} in ${e.location}.`,
    }),
  );

  const forum = FORUM_POSTS.slice(0, 6).map(
    (p): AgentItem => ({
      id: `forum-${p.uid}`,
      kind: 'forum',
      label: p.title,
      meta: `${p.author} · ${p.category}`,
      by: p.author,
      body: p.body,
    }),
  );

  return [...news, ...teamsSeen.values(), ...MEMBERS, ...events, ...forum];
}

/** News as a story card passes it to "Ask AI". */
export function newsItemFor(story: { uid: string; title: string; teamName: string; summary?: string | null; eventType: string }): AgentItem {
  return {
    id: `news-${story.uid}`,
    kind: 'news',
    label: story.title,
    meta: `${story.teamName} · ${EVENT_TYPE_LABEL[story.eventType as keyof typeof EVENT_TYPE_LABEL] ?? 'News'}`,
    by: story.teamName,
    body: story.summary ?? story.title,
  };
}
