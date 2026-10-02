import { subDays } from 'date-fns';

import { makeTurn } from '../ai-search/AnswerPanel';
import { newThreadId, type ChatThread } from '../ai-mode/threads';

/** A chat someone else started, opened from a link they sent. */
export interface SharedChat {
  thread: ChatThread;
  owner: { name: string; image: string };
}

export function sharedChat(): SharedChat {
  return {
    owner: { name: 'Maya Chen', image: '/icons/default_profile.svg' },
    thread: {
      id: newThreadId(),
      title: 'Filecoin teams in Berlin',
      createdAt: subDays(new Date(), 2),
      scope: null,
      turns: ['Find teams building on Filecoin in Berlin'].map((q) => {
        const t = makeTurn(q);
        return { ...t, shown: t.answer, status: 'done' as const };
      }),
    },
  };
}

/**
 * Production names a thread with a generated title (`createThreadTitle` in
 * husky.service) rather than its question. Mocked as a lookup; anything not
 * listed keeps its question, which is what production shows until the title
 * comes back. The title bar and the rail read the same title, and the
 * question stays the heading of the first answer — so the two never repeat.
 */
const TITLES: Record<string, string> = {
  'Compare Lumen Storage and Saturn Grid': 'Lumen Storage vs Saturn Grid',
  'Who at Lumen Storage offers office hours?': 'Office hours at Lumen Storage',
  'Upcoming events in Berlin with PL teams attending': 'PL teams at Berlin events',
  'Which events in Lisbon have PL members attending?': 'PL members at Lisbon events',
  'Find teams building on Filecoin in Berlin': 'Filecoin teams in Berlin',
  'Who works on zero-knowledge proofs and offers office hours?': 'ZK experts with office hours',
  'Which teams are hiring protocol engineers?': 'Teams hiring protocol engineers',
  'Show me projects using IPFS for scientific data': 'IPFS for scientific data',
  'Who leads the PL Research Collective?': 'PL Research Collective leads',
  'Investors in the network focused on AI infra': 'AI infra investors',
  'Forum threads about retrieval markets': 'Retrieval markets on the forum',
  'Teams that attended LabWeek 2025': 'LabWeek 2025 teams',
};

export const titleFor = (question: string) => TITLES[question.trim()] ?? question.trim();

export const withTitle = (t: ChatThread): ChatThread => ({ ...t, title: titleFor(t.turns[0]?.question ?? '') });

/** Where a thread's link points once the page is at /ai-search. */
export const threadUrl = (id: number) => `https://directory.plnetwork.io/ai-search/${id}`;

/**
 * What this entry changes on production's /husky page, in the order a person
 * meets it. Shown in the review band's "What changed" panel, so the page can
 * be reviewed against the live one (localhost:4200/husky/chat).
 */
export const CHANGES: { area: string; was: string; now: string }[] = [
  {
    area: 'Name',
    was: '/husky, "AI Chat" tab title, "New Conversation", "Threads"',
    now: '/ai-search, "AI Search" everywhere a person reads it, "New chat", "History"',
  },
  {
    area: 'New chat',
    was: 'Headline and field; the three suggestions only appear in a dropdown once the field is focused',
    now: 'Same headline and banner, one line saying what answers come from, four suggestions visible under the field',
  },
  {
    area: 'Field',
    was: '2px brand ring even at rest, an inline "Shift + Enter to add new line" hint, a square send with the AI Search logo on a grey block',
    now: 'Card border at rest, brand edge on focus, no hint, a round arrow send dimmed until there is text (a stop square while answering); the same field under a chat',
  },
  {
    area: 'History',
    was: 'Grey rows under black 14px group titles; nothing to find an old chat by but scrolling',
    now: 'Same rail, width and ⌘B; quiet date labels, the open chat in primary ink, and a Search chats field',
  },
  {
    area: 'Open chat',
    was: 'No title or actions on desktop (the Threads / New Conversation / delete bar is phone-only)',
    now: 'A title bar on every width: the chat title, Share (copies its link) and ⋯ → Delete',
  },
  {
    area: 'Answer',
    was: '954px column, "N source(s)" pill above the prose, 1–5 rating dialog, input pinned with left: calc(50% + 150px)',
    now: 'The ai-search answer in a 768px reading column: sources after the answer, inline thumbs, input pinned in the column',
  },
  {
    area: 'Shared link',
    was: '"Shared conversation from" avatar, and a black bar with "Continue Conversation" instead of the input',
    now: '"Shared by Maya Chen" in the title bar and the normal input; a follow-up saves your own copy to History',
  },
  {
    area: 'Signed out',
    was: 'No sidebar at all; chats vanish without a word',
    now: 'The rail stays: this session\'s chats, and "Sign in to keep your chats" with Sign up · Sign in',
  },
];
