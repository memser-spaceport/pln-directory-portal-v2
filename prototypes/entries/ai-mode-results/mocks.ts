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
 * The answer components this entry changes, current → proposed, in the order
 * they appear in a turn. Shown in the review band's "What changed in answers"
 * panel; PROPOSAL.md carries the same list with the reasons and the
 * production file each one maps to.
 */
export const ANSWER_CHANGES: { area: string; was: string; now: string }[] = [
  {
    area: 'Turn',
    was: 'Question as an 18px/600 heading over a white bordered card holding the whole answer',
    now: 'Question as a right-aligned grey bubble; the answer runs on the page with no card, its parts spaced 20px apart',
  },
  {
    area: 'Prose',
    was: '14px with 26px leading from the card, 22px from Markdown’s inline styles; links bold #0000ff',
    now: '16/26 (16/24 on phones), 12px between paragraphs, tertiary list markers; one rhythm owned by one stylesheet',
  },
  {
    area: 'Mentions',
    was: 'A directory record in the text is a bold blue link',
    now: 'An inline mention: the record’s 16px picture + name, primary ink, hairline underline that turns brand on hover',
  },
  {
    area: 'Citations',
    was: 'None in AI mode (production prints “[1]” as blue text)',
    now: 'Numbered grey pills at the end of the sentence; hover shows the source as a card; the number matches the Sources list',
  },
  {
    area: 'Sources',
    was: '“N sources” pill at the right end of the actions row; rows unnumbered, initials as marks',
    now: 'Same pill, leading the actions row; rows numbered like the citations, record pictures as marks',
  },
  {
    area: 'Directory results',
    was: 'Brand-blue gear heading; 2×2 grid of separately bordered cards with arrows',
    now: 'One 12px panel of 56px rows with hairlines; “Available to connect” on members with office hours; chevron in, arrow out',
  },
  {
    area: 'Table',
    was: 'DS table with a grey corner, tertiary 12px row labels, “None listed”; scrolls sideways on phones',
    now: 'Entities lead (24px picture + name 14/600), white corner, secondary labels, a dash for nothing; fact blocks on phones',
  },
  {
    area: 'Actions',
    was: 'Regenerate, edit, copy, thumbs (rotated thumbs-up for down) at the bottom of the card, 24px targets',
    now: 'Under the answer: sources pill, copy (✓ when copied), thumbs (DS thumbs-down), then regenerate and edit; 28px targets',
  },
  {
    area: 'Follow-ups',
    was: 'Orange “Follow up questions” with a lightbulb; full-width grey slabs',
    now: '“Follow-up questions” label like every other section; a hairline list of rows with a ↳ glyph, brand on hover; last in the turn',
  },
  {
    area: 'Thinking',
    was: 'AI mark breathing + one shimmering step label',
    now: 'Same label; mark in a brand disc with an orbiting arc; a four-segment step meter; a blinking caret while words stream',
  },
];
