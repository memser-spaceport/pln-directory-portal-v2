// Mock data for the AI Apps feedback prototype. No API calls.
// Reuses the app list + iframe previews from the sibling `ai-apps` entry so the
// two prototypes never drift, then extends that base with a longer roster of
// apps (so the new searchable sidebar has enough to warrant search) and layers
// mocked feedback + a current-user role on top.
import type { AiApp } from '@/services/ai-apps/ai-apps.service';

import {
  mockAiApps as baseAiApps,
  mockAppPreviews as baseAppPreviews,
} from '../ai-apps/mocks';

export { mockPageCopy } from '../ai-apps/mocks';

export type DemoRole = 'member' | 'author' | 'admin';

// The signed-in person for the demo. As `author` they own app-1 (Warm Intro
// Matcher); as `admin` they can see feedback across every app.
export const currentUser = {
  uid: 'm-1',
  name: 'Polina Bublii',
};

// A minimal generic iframe preview for the extended roster, so the grid/detail
// flow still shows *something* framable when one of the extra apps is opened.
function genericSrcDoc(title: string, accent: string, tagline: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"/>
  <style>
    :root{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
    *{box-sizing:border-box}
    body{margin:0;background:#f6f8fb;color:#0a0c11}
    .bar{display:flex;align-items:center;gap:10px;padding:14px 20px;background:${accent};color:#fff}
    .dot{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.7)}
    .bar h1{margin:0;font-size:15px;font-weight:600}
    .wrap{padding:28px 24px}
    .card{background:#fff;border:1px solid rgba(27,56,96,.1);border-radius:12px;padding:20px;box-shadow:0 1px 2px rgba(14,15,17,.05)}
    .card h2{margin:0 0 8px;font-size:16px}
    .card p{margin:0;color:#455468;font-size:14px;line-height:1.5}
    .btn{display:inline-block;margin-top:14px;padding:8px 16px;border-radius:8px;background:${accent};color:#fff;font-size:13px;font-weight:600;text-decoration:none}
  </style></head>
  <body>
    <div class="bar"><span class="dot"></span><h1>${title}</h1></div>
    <div class="wrap"><div class="card"><h2>${title}</h2><p>${tagline}</p>
      <a class="btn" href="#">Open ${title} →</a></div></div>
  </body></html>`;
}

function makeApp(
  uid: string,
  appId: string,
  name: string,
  memberUid: string,
  memberName: string,
  description: string,
  createdAt: string,
): AiApp {
  return {
    uid,
    memberUid,
    appId,
    name,
    description,
    status: 'deployed',
    notes: null,
    url: '',
    httpUrl: '',
    host: 'labs.pln',
    port: 443,
    deploymentId: `dep-${uid}`,
    requiredEnvVars: [],
    providedEnvVars: [],
    createdAt,
    updatedAt: createdAt,
    member: { uid: memberUid, name: memberName },
  };
}

// Ten more deployed apps from across the network. None are owned by m-1, so the
// `author` scope stays exactly "Warm Intro Matcher"; the long list only shows
// up under `admin` — which is precisely where the search problem lives.
const extraAiApps: AiApp[] = [
  makeApp('app-4', 'grant-finder', 'Grant Finder', 'm-4', 'David Chen',
    'Surfaces open grants and RFPs matched to a team’s research area and stage.', '2026-06-22T09:00:00.000Z'),
  makeApp('app-5', 'deck-reviewer', 'Deck Reviewer', 'm-5', 'Sarah Kim',
    'Gives structured feedback on a pitch deck against PL investor rubrics.', '2026-06-20T09:00:00.000Z'),
  makeApp('app-6', 'hiring-signal', 'Hiring Signal', 'm-6', 'Andrew Hill',
    'Flags network members open to new roles and matches them to open reqs.', '2026-06-19T09:00:00.000Z'),
  makeApp('app-7', 'cofounder-match', 'Co-founder Match', 'm-7', 'Evan Miyazono',
    'Pairs solo founders on complementary skills, timezone, and thesis.', '2026-06-16T09:00:00.000Z'),
  makeApp('app-8', 'runway-tracker', 'Runway Tracker', 'm-8', 'Dietrich Ayala',
    'Tracks burn and runway from a connected sheet and nudges before cliffs.', '2026-06-14T09:00:00.000Z'),
  makeApp('app-9', 'portfolio-pulse', 'Portfolio Pulse', 'm-9', 'Roneil Rumburg',
    'A weekly health read across a portfolio, ranked by change in momentum.', '2026-06-11T09:00:00.000Z'),
  makeApp('app-10', 'intro-draft', 'Intro Draft', 'm-10', 'Lin Wei',
    'Turns two profiles into a ready-to-send double opt-in intro email.', '2026-06-09T09:00:00.000Z'),
  makeApp('app-11', 'metrics-digest', 'Metrics Digest', 'm-11', 'Omar Farouk',
    'Rolls up product metrics from Postgres into a plain-language weekly note.', '2026-06-07T09:00:00.000Z'),
  makeApp('app-12', 'standup-bot', 'Standup Bot', 'm-12', 'Priya Nair',
    'Collects async standups in Slack and summarizes blockers for the lead.', '2026-06-03T09:00:00.000Z'),
  makeApp('app-13', 'docs-search', 'Docs Search', 'm-13', 'Tomasz Kowalski',
    'Answers questions over a team’s internal docs with cited passages.', '2026-06-01T09:00:00.000Z'),
];

const ACCENTS: Record<string, string> = {
  'app-4': '#c2410c',
  'app-5': '#0369a1',
  'app-6': '#0a9952',
  'app-7': '#7c3aed',
  'app-8': '#b91c1c',
  'app-9': '#0d9488',
  'app-10': '#1b4dff',
  'app-11': '#9333ea',
  'app-12': '#ca8a04',
  'app-13': '#475569',
};

// Base roster (Warm Intro Matcher, Founder Digest, Event Scout) + the extended
// set. Exported as the single `mockAiApps` the entry consumes.
export const mockAiApps: AiApp[] = [...baseAiApps, ...extraAiApps];

// Base previews + a generic preview for every extra app, keyed by uid.
export const mockAppPreviews: Record<string, string> = {
  ...baseAppPreviews,
  ...extraAiApps.reduce<Record<string, string>>((acc, app) => {
    acc[app.uid] = genericSrcDoc(app.name, ACCENTS[app.uid] ?? '#1b4dff', app.description);
    return acc;
  }, {}),
};

// Triage dimension — what kind of note this is. Powers the Type filter and the
// tag shown on each row, turning the log into something an author can act on.
export type FeedbackType = 'feature' | 'bug' | 'praise';

export const FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'feature', label: 'Feature request' },
  { value: 'bug', label: 'Bug' },
  { value: 'praise', label: 'Praise' },
];

export interface FeedbackEntry {
  id: string;
  appUid: string;
  appName: string;
  authorUid: string;
  authorName: string;
  text: string;
  type: FeedbackType;
  createdAt: string; // ISO
}

// Seeded feedback across the roster, from a mix of network members. Counts vary
// on purpose (some apps have several notes, a few have one, Docs Search has
// none) so the sidebar counts read as real signal.
export const mockFeedback: FeedbackEntry[] = [
  {
    id: 'fb-1',
    appUid: 'app-1',
    appName: 'Warm Intro Matcher',
    authorUid: 'm-9',
    authorName: 'Roneil Rumburg',
    text: 'Really useful for finding the shortest path to an investor. The draft intro copy is a bit generic though — would love if it pulled in why the two people should talk.',
    type: 'feature',
    createdAt: '2026-07-04T09:12:00.000Z',
  },
  {
    id: 'fb-2',
    appUid: 'app-1',
    appName: 'Warm Intro Matcher',
    authorUid: 'm-4',
    authorName: 'Juan Benet',
    text: 'Match score is great signal. One ask: let me exclude connectors I have already asked recently so I do not over-tap the same people.',
    type: 'feature',
    createdAt: '2026-07-02T16:40:00.000Z',
  },
  {
    id: 'fb-3',
    appUid: 'app-1',
    appName: 'Warm Intro Matcher',
    authorUid: 'm-7',
    authorName: 'Evan Miyazono',
    text: 'Found a path I did not know existed. Would pay for this.',
    type: 'praise',
    createdAt: '2026-06-28T11:05:00.000Z',
  },
  {
    id: 'fb-4',
    appUid: 'app-2',
    appName: 'Founder Digest',
    authorUid: 'm-5',
    authorName: 'Molly Mackinlay',
    text: 'The weekly ranking is on point, but I only care about two focus areas — a filter to scope the digest would make it a daily-open for me.',
    type: 'feature',
    createdAt: '2026-07-05T08:20:00.000Z',
  },
  {
    id: 'fb-5',
    appUid: 'app-2',
    appName: 'Founder Digest',
    authorUid: 'm-8',
    authorName: 'Dietrich Ayala',
    text: 'Flagged founders section surfaced two I had missed. Small thing: the email version breaks on mobile.',
    type: 'bug',
    createdAt: '2026-07-01T13:55:00.000Z',
  },
  {
    id: 'fb-6',
    appUid: 'app-3',
    appName: 'Event Scout',
    authorUid: 'm-6',
    authorName: 'Andrew Hill',
    text: 'The "who is already going" list is the killer feature. Please add a way to export attendees to a calendar invite.',
    type: 'feature',
    createdAt: '2026-07-03T18:30:00.000Z',
  },
  {
    id: 'fb-7',
    appUid: 'app-4',
    appName: 'Grant Finder',
    authorUid: 'm-2',
    authorName: 'Daniel Singer',
    text: 'Matched us to an RFP that closed our next quarter. The deadline reminders are the part I would keep.',
    type: 'praise',
    createdAt: '2026-07-06T10:10:00.000Z',
  },
  {
    id: 'fb-8',
    appUid: 'app-4',
    appName: 'Grant Finder',
    authorUid: 'm-7',
    authorName: 'Evan Miyazono',
    text: 'Good coverage on public grants, thinner on private RFPs. Would love a source toggle.',
    type: 'feature',
    createdAt: '2026-06-30T15:00:00.000Z',
  },
  {
    id: 'fb-9',
    appUid: 'app-5',
    appName: 'Deck Reviewer',
    authorUid: 'm-9',
    authorName: 'Roneil Rumburg',
    text: 'The rubric feedback caught a weak "why now" slide before I sent it. Scoring felt fair.',
    type: 'praise',
    createdAt: '2026-07-05T12:45:00.000Z',
  },
  {
    id: 'fb-10',
    appUid: 'app-5',
    appName: 'Deck Reviewer',
    authorUid: 'm-6',
    authorName: 'Andrew Hill',
    text: 'Solid, but it dinged us for a missing slide we intentionally cut. An "N/A" option would help.',
    type: 'feature',
    createdAt: '2026-06-29T09:30:00.000Z',
  },
  {
    id: 'fb-11',
    appUid: 'app-6',
    appName: 'Hiring Signal',
    authorUid: 'm-3',
    authorName: 'Maria Lopez',
    text: 'Surfaced two strong candidates already in the network. Please let me save a shortlist.',
    type: 'feature',
    createdAt: '2026-07-04T14:20:00.000Z',
  },
  {
    id: 'fb-12',
    appUid: 'app-7',
    appName: 'Co-founder Match',
    authorUid: 'm-5',
    authorName: 'Molly Mackinlay',
    text: 'The complementary-skills match was uncanny. Timezone weighting could be a bit stronger.',
    type: 'feature',
    createdAt: '2026-07-02T11:15:00.000Z',
  },
  {
    id: 'fb-13',
    appUid: 'app-7',
    appName: 'Co-founder Match',
    authorUid: 'm-8',
    authorName: 'Dietrich Ayala',
    text: 'Would use weekly. A "not a fit" button to train it would make matches sharper over time.',
    type: 'feature',
    createdAt: '2026-06-27T16:05:00.000Z',
  },
  {
    id: 'fb-14',
    appUid: 'app-8',
    appName: 'Runway Tracker',
    authorUid: 'm-2',
    authorName: 'Daniel Singer',
    text: 'The pre-cliff nudge is exactly the anxiety-reducer I needed. Connecting the sheet took a minute though.',
    type: 'praise',
    createdAt: '2026-07-06T08:00:00.000Z',
  },
  {
    id: 'fb-15',
    appUid: 'app-9',
    appName: 'Portfolio Pulse',
    authorUid: 'm-4',
    authorName: 'Juan Benet',
    text: 'Momentum ranking is a great weekly read. I would love drill-down into what moved a company up.',
    type: 'feature',
    createdAt: '2026-07-05T17:40:00.000Z',
  },
  {
    id: 'fb-16',
    appUid: 'app-10',
    appName: 'Intro Draft',
    authorUid: 'm-6',
    authorName: 'Andrew Hill',
    text: 'The double opt-in template is clean and the tone matched mine. Ship it.',
    type: 'praise',
    createdAt: '2026-07-03T13:10:00.000Z',
  },
  {
    id: 'fb-17',
    appUid: 'app-11',
    appName: 'Metrics Digest',
    authorUid: 'm-9',
    authorName: 'Roneil Rumburg',
    text: 'Plain-language weekly note is a great idea. The SQL connection errored once and was hard to debug.',
    type: 'bug',
    createdAt: '2026-06-30T10:25:00.000Z',
  },
  {
    id: 'fb-18',
    appUid: 'app-12',
    appName: 'Standup Bot',
    authorUid: 'm-3',
    authorName: 'Maria Lopez',
    text: 'Blocker summaries save my leads real time. Could it @-mention the person who owns each blocker?',
    type: 'feature',
    createdAt: '2026-07-01T09:50:00.000Z',
  },
];
