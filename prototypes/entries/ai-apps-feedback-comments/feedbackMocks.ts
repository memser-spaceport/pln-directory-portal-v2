import type { AiAppFeedbackRow } from '@/services/ai-app-feedback/ai-app-feedback.service';

/**
 * Every feedback item in the mocked directory, in the shape production's
 * GET /v1/ai-apps/feedback returns. The Feedback page derives both of its tabs
 * from this one list: "Received" = rows on apps the viewer created,
 * "Given" = rows the viewer wrote. Per-app counts match the `activity`
 * numbers on the viewer's own cards (Warm Intro Matcher 7, Meeting Notes Sync 1,
 * Onboarding Buddy 2).
 *
 * Personas: Polina (m-1, the "Creator") and Nina (m-6, the "Visitor").
 */
const polina = { uid: 'm-1', name: 'Polina Bublii' };
const nina = { uid: 'm-6', name: 'Nina Chen' };
const daniel = { uid: 'm-2', name: 'Daniel Singer' };
const maria = { uid: 'm-3', name: 'Maria Lopez' };
const arjun = { uid: 'm-4', name: 'Arjun Patel' };
const leo = { uid: 'm-7', name: 'Leo Park' };

type Row = AiAppFeedbackRow;

function row(
  uid: string,
  app: { uid: string; name: string },
  member: { uid: string; name: string },
  text: string,
  createdAt: string,
  rest: Partial<Row> = {},
): Row {
  return {
    uid,
    appUid: app.uid,
    appName: app.name,
    text,
    status: 'NEW',
    createdAt,
    kind: 'FEEDBACK',
    reportKind: null,
    priority: null,
    member,
    ...rest,
  };
}

const warmIntro = { uid: 'app-1', name: 'Warm Intro Matcher' };
const meetingNotes = { uid: 'app-7', name: 'Meeting Notes Sync' };
const onboarding = { uid: 'app-10', name: 'Onboarding Buddy' };
const founderDigest = { uid: 'app-2', name: 'Founder Digest' };
const eventScout = { uid: 'app-3', name: 'Event Scout' };
const skillGraph = { uid: 'app-6', name: 'Skill Graph Explorer' };
const portfolioPulse = { uid: 'app-8', name: 'Portfolio Pulse' };
const docsBot = { uid: 'app-9', name: 'Docs Q&A Bot' };

export const mockFeedbackRows: Row[] = [
  // ── On Polina's apps ──────────────────────────────────────────────
  row(
    'fb-1',
    warmIntro,
    nina,
    'The suggested path picks a teammate I have never spoken to. Could it prefer people I share a team with?',
    '2026-10-03T09:12:00.000Z',
    { reportKind: 'request', priority: 'P2', kind: 'COMMENT', status: 'VIEWED' },
  ),
  row(
    'fb-2',
    warmIntro,
    daniel,
    'Search returns nothing for founders added this week — looks like the index lags a few days.',
    '2026-10-02T15:40:00.000Z',
    { reportKind: 'bug', priority: 'P1' },
  ),
  row(
    'fb-3',
    warmIntro,
    maria,
    'Love the "why this path" line. Would be great to copy it straight into the intro email.',
    '2026-09-29T11:05:00.000Z',
    { reportKind: 'request', priority: 'P3', status: 'IMPLEMENTED' },
  ),
  row(
    'fb-4',
    warmIntro,
    arjun,
    'Is there a way to exclude portfolio companies I already have a direct line to?',
    '2026-09-27T08:30:00.000Z',
    { reportKind: 'question' },
  ),
  row(
    'fb-5',
    warmIntro,
    leo,
    'The results table jumps when the scores load in. Hard to click the right row.',
    '2026-09-24T17:22:00.000Z',
    { reportKind: 'bug', priority: 'P2', status: 'VIEWED' },
  ),
  row(
    'fb-6',
    warmIntro,
    nina,
    'Export to CSV would save me retyping every match into our CRM.',
    '2026-09-20T10:48:00.000Z',
    { reportKind: 'request', priority: 'P3' },
  ),
  row(
    'fb-7',
    warmIntro,
    daniel,
    'Login loops back to the start page on Safari.',
    '2026-09-15T13:02:00.000Z',
    { reportKind: 'bug', priority: 'P0', status: 'IMPLEMENTED' },
  ),
  row(
    'fb-8',
    meetingNotes,
    maria,
    'Calendar sync only picks up the primary calendar. Shared team calendars are skipped.',
    '2026-10-01T12:15:00.000Z',
    { reportKind: 'bug', priority: 'P2' },
  ),
  row(
    'fb-9',
    onboarding,
    arjun,
    'The checklist marks "Join Slack" done before I actually joined.',
    '2026-09-30T09:40:00.000Z',
    { reportKind: 'bug', priority: 'P2', status: 'VIEWED' },
  ),
  row(
    'fb-10',
    onboarding,
    leo,
    'Could the welcome message mention who my onboarding buddy is by name?',
    '2026-09-26T16:10:00.000Z',
    { reportKind: 'request', kind: 'COMMENT' },
  ),

  // ── Sent by Polina, on other people's apps ────────────────────────
  row(
    'fb-11',
    founderDigest,
    polina,
    'The Monday digest repeats two stories from the week before.',
    '2026-10-02T08:05:00.000Z',
    { reportKind: 'bug', priority: 'P2', status: 'VIEWED' },
  ),
  row(
    'fb-12',
    portfolioPulse,
    polina,
    'A "since last visit" marker on the chart would make the weekly check much faster.',
    '2026-09-28T14:20:00.000Z',
    { reportKind: 'request', priority: 'P3', status: 'IMPLEMENTED' },
  ),
  row(
    'fb-13',
    eventScout,
    polina,
    'Filters reset when I go back from an event page.',
    '2026-09-25T10:35:00.000Z',
    { reportKind: 'bug', priority: 'P1', kind: 'COMMENT' },
  ),
  row(
    'fb-14',
    docsBot,
    polina,
    'Which docs does it search — only the handbook, or team wikis too?',
    '2026-09-18T09:00:00.000Z',
    { reportKind: 'question' },
  ),
  row(
    'fb-15',
    skillGraph,
    polina,
    'The graph is unreadable past ~40 nodes. Could clusters collapse by default?',
    '2026-09-10T15:45:00.000Z',
    { reportKind: 'request', priority: 'P2', status: 'IMPLEMENTED' },
  ),

  // ── Sent by Nina elsewhere (her own list shows these plus fb-1 and fb-6) ─
  row(
    'fb-16',
    portfolioPulse,
    nina,
    'Numbers on the summary card don’t match the table below it.',
    '2026-09-22T11:30:00.000Z',
    { reportKind: 'bug', priority: 'P1', status: 'VIEWED' },
  ),
];
