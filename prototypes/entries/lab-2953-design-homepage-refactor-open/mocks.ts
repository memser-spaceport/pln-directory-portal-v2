// LAB-2953 — mock data only. News, forum, jobs and events come from the
// home-refactor entry (itself built on newsfeed / newsfeed-v0), so a story or
// thread opened here is the same one the other Home prototypes show.

import { SUGGESTED_PROMPTS } from '../ai-search/mocks';
import type { AskPrompt } from './AskField';

export {
  FORUM_PICKS,
  HOME_EVENTS,
  HOME_JOBS,
  NEWS_ALSO,
  NEWS_LEAD,
  TOTAL_OPEN_ROLES,
  TOTAL_UPCOMING_EVENTS,
} from '../home-refactor/mocks';
export { FOCUS_AREAS, PL_FACTS } from '../explore-pl-network/mocks';
export { ISLANDS } from '../explore-pl-network/islands';

/* ---------- The signed-in member (sample person, not a real member) ---------- */
export const MEMBER = {
  firstName: 'Sam',
  follows: ['Lumen Storage', 'Saturn Grid'],
  skills: ['Rust', 'Storage'],
};

/* ---------- Prompts under the field ----------
   Signed out: orientation prompts, the same for every visitor.
   Signed in: personalized prompts. Polina (2026-10-28): "personalized, not
   static; not polished until the personalization engine exists". So each one
   names its reason ("you follow…"), and the row carries a rough-draft note.
   The questions are AI Search prompts that have a canned answer. */
export const PROMPTS_SIGNED_OUT: AskPrompt[] = [
  { label: 'What is the PL network?', question: 'What is the Protocol Labs network?' },
  { label: 'Filecoin teams in Berlin', question: SUGGESTED_PROMPTS[0].text },
  { label: 'Who offers office hours?', question: SUGGESTED_PROMPTS[1].text },
];

export const PROMPTS_SIGNED_IN: AskPrompt[] = [
  { label: 'Teams near Lumen Storage in Berlin', question: SUGGESTED_PROMPTS[0].text },
  { label: 'Office hours on zero-knowledge proofs', question: SUGGESTED_PROMPTS[1].text },
  { label: 'Lumen Storage vs Saturn Grid', question: SUGGESTED_PROMPTS[3].text },
];

/* ---------- Deals ----------
   Shape = production `IDeal` (types/deals.types.ts), trimmed to what the card
   shows. Vendor names are invented. */
export interface HomeDeal {
  uid: string;
  vendorName: string;
  shortDescription: string;
  category: string;
  audience: string;
  teamsUsingCount: number;
  isHighValue?: boolean;
}

export const HOME_DEALS: HomeDeal[] = [
  {
    uid: 'd1',
    vendorName: 'Northwind Cloud',
    shortDescription: '$25k in compute credits for 12 months',
    category: 'Infrastructure',
    audience: 'Founders',
    teamsUsingCount: 41,
    isHighValue: true,
  },
  {
    uid: 'd2',
    vendorName: 'Ledgerline',
    shortDescription: '50% off bookkeeping and tax filing for the first year',
    category: 'Finance',
    audience: 'All teams',
    teamsUsingCount: 18,
  },
  {
    uid: 'd3',
    vendorName: 'Quillwork',
    shortDescription: 'Free team plan for docs and wikis, up to 25 seats',
    category: 'Productivity',
    audience: 'All teams',
    teamsUsingCount: 27,
  },
];

export const TOTAL_DEALS = 23;

/* ---------- Agent concept: what each action answers (canned) ---------- */
export const AGENT_REPLIES = {
  search: {
    title: 'Search the network',
    reply: 'I found 3 teams that build on Filecoin in Berlin: Lumen Storage, Saturn Grid and Orbit Relay.',
  },
  office: {
    title: 'Book office hours',
    reply: 'Mara (Lumen Storage) has a free slot on Thursday 30 October, 15:00 UTC. Do you want to book it?',
  },
  draft: {
    title: 'Draft a forum post',
    reply:
      'Draft: "Looking for teams that test storage proofs in Rust. We share a test harness and want feedback. Who wants to try it?"',
  },
} as const;

export type AgentAction = keyof typeof AGENT_REPLIES;
