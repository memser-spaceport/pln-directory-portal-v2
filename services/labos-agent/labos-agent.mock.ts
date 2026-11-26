import type {
  LabosAgentChatRequest,
  LabosAgentChatResponse,
  LabosAgentClient,
  LabosAgentClosedStatus,
  LabosAgentConfirmRequest,
  LabosAgentConfirmResponse,
  LabosAgentDraft,
  LabosAgentMentionsQuery,
  LabosAgentMentionsResponse,
  LabosAgentPage,
  LabosAgentProposal,
  LabosAgentStreamOptions,
} from '@/types/labos-agent.types';

import { LabosAgentError, LABOS_AGENT_STALL_MARKER } from './labos-agent.errors';
import { recordMockTurn } from './labos-agent.history.mock';

/**
 * The mock C1 client. Scripted answers, no network, no member data. It streams like the real endpoint: steps first,
 * then the content a few words at a time, then sources and follow-ups.
 *
 * Test words in the message:
 * - "error": the connection breaks after the first step (hard error).
 * - "stall": the answer ends with the backend's stalled notice.
 * - "web": the answer uses web search and shows web sources.
 * - "edit profile": the answer proposes a profile edit (one action card).
 * - "edit team": the answer proposes a team edit (one action card).
 * - "forbidden": the answer proposes a team edit, and Confirm gets a 403 `ACTION_NOT_ALLOWED`.
 * - "save fails": the first Confirm gets no answer (Retry shows); the next Confirm saves.
 *
 * Intro context (S3, `context.page` `intro`):
 * - Any message gives one intro draft for the context target (contract 8.2).
 * - "not eligible": the agent refuses, with `drafts: []` (contract 8.3).
 * - A target uid that starts with `missing`: C1 gets a 404 `INTRO_TARGET_NOT_FOUND` before the stream.
 * - The draft card's Send calls the real C3 (`POST /v1/intro-requests`). The mock replaces C1 only.
 *
 * Page context (S5, contract 9.2 and 9.3):
 * - `member`, `team`, `job` and `profile` pages get an answer that names the page.
 * - A `memberUid`, `teamUid` or `jobUid` that starts with `missing`: C1 gets a 404 `MEMBER_NOT_FOUND`,
 *   `TEAM_NOT_FOUND` or `JOB_NOT_FOUND` before the stream.
 *
 * @mentions (S6, contract 10.2 to 10.4):
 * - C4 searches a fixed list of mock members, teams and news (`MOCK_MENTIONS`). No real member data.
 * - The query "unavailable" gives a 503, so the picker shows its error text.
 * - A mention uid that starts with `missing` gives a C1 404 with `mentionIndex` before the stream.
 * - The answer names each mention, in order.
 *
 * A second C2 call on a closed proposal gets a 409 `PROPOSAL_CLOSED` with the stored `status`, like the backend.
 *
 * LAB-3457: a finished turn sent with `persist: true` is saved in the mock history (`labos-agent.history.mock.ts`).
 */

const STEP_MS = 400;
const SAVE_MS = 600;
const MOCK_ID = 'ap_mock_';
const TICK_MS = 30;
const WORDS_PER_TICK = 3;

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });

/** The mock proposals for a message. The id carries the confirm path: `forbidden` or `fails`. */
export function mockProposals(message: string, chatId: string): LabosAgentProposal[] {
  const q = message.toLowerCase();
  const forbidden = /forbidden/.test(q);
  const path = forbidden ? 'forbidden_' : /save fails/.test(q) ? 'fails_' : '';
  const proposals: LabosAgentProposal[] = [];
  if (/edit profile/.test(q)) {
    proposals.push({
      proposalId: `${MOCK_ID}${path}profile_${chatId}`,
      tool: 'update_my_profile',
      title: 'Update your profile',
      targetType: 'member',
      targetUid: 'mock-member',
      changes: [
        // `bio` is HTML, like the real profile field. The card shows it as plain text.
        {
          field: 'bio',
          label: 'Bio',
          oldValue: '<p>Mock old bio.</p>',
          newValue: '<p>Mock new bio, <strong>written</strong> by the agent.</p>',
        },
        { field: 'skills', label: 'Skills', oldValue: ['Product'], newValue: ['Product', 'AI'] },
      ],
    });
  }
  if (/edit team/.test(q) || forbidden) {
    proposals.push({
      proposalId: `${MOCK_ID}${path}team_${chatId}`,
      tool: 'update_team',
      title: 'Update the team description',
      targetType: 'team',
      targetUid: 'mock-team',
      changes: [
        {
          field: 'shortDescription',
          label: 'Short description',
          oldValue: 'Mock old description.',
          newValue: 'Mock new description.',
        },
      ],
    });
  }
  return proposals;
}

/** The mock name of an intro target. The real name comes from the database (contract 8.2). */
export const MOCK_INTRO_TARGET_NAME = 'Mock Member';

/** The refusal text for a member who cannot request intros (contract 8.3). */
export const MOCK_INTRO_REFUSAL =
  'You cannot request intros. Only members of portfolio teams and PL Infra can. This is a mock answer.';

/** The mock intro drafts for a request. None outside the intro context, or for "not eligible". */
export function mockDrafts(request: LabosAgentChatRequest): LabosAgentDraft[] {
  if (request.context?.page !== 'intro') return [];
  if (/not eligible/.test(request.message.toLowerCase())) return [];
  const { type, uid } = request.context.introTarget;
  return [
    {
      draftId: `dr_mock_${request.chatId}`,
      kind: 'intro',
      target: { type, uid, name: MOCK_INTRO_TARGET_NAME },
      text:
        'I lead product at a portfolio team. We plan a new data feature and want advice from someone who ' +
        'built one at scale. This is a mock draft from the agent.',
      minLength: 20,
      maxLength: 3500,
      source: 'agent',
    },
  ];
}

const introBody = (request: LabosAgentChatRequest): LabosAgentChatResponse => {
  const drafts = mockDrafts(request);
  return {
    steps: ['Understanding the question', 'Checking who you can ask', 'Writing the draft'],
    content:
      drafts.length > 0
        ? 'This is a mock answer. Here is a draft. Check it and press Send. Nothing is sent before you press Send.'
        : MOCK_INTRO_REFUSAL,
    sources: [],
    sourceRefs: [],
    followUpQuestions: [],
    actions: [],
    proposals: [],
    drafts,
  };
};

/** S5: the step and the words for each page that the agent reads (contract 9.4). */
const PAGE_READS: Partial<Record<LabosAgentPage, { step: string; what: string }>> = {
  member: { step: 'Reading this member page', what: 'this member page' },
  team: { step: 'Reading this team page', what: 'this team page' },
  job: { step: 'Reading the job post', what: 'this job post or the job board' },
  profile: { step: 'Reading your profile', what: 'your profile' },
};

/** S5: the 404 that C1 gives for a page uid that starts with `missing` (contract 9.3). */
function missingPageError(request: LabosAgentChatRequest): LabosAgentError | null {
  const c = request.context;
  if (c?.page === 'member' && c.memberUid.startsWith('missing')) {
    return new LabosAgentError(404, 'MEMBER_NOT_FOUND', 'The member was not found.');
  }
  if (c?.page === 'team' && c.teamUid.startsWith('missing')) {
    return new LabosAgentError(404, 'TEAM_NOT_FOUND', 'The team was not found.');
  }
  if (c?.page === 'job' && c.jobUid?.startsWith('missing')) {
    return new LabosAgentError(404, 'JOB_NOT_FOUND', 'The job opening was not found.');
  }
  return null;
}

/** S6: mock C4 rows. Mock names only, no real member data (S6-F22). */
export const MOCK_MENTIONS: Omit<LabosAgentMentionsResponse, 'q'> = {
  members: [
    {
      type: 'member',
      uid: 'mock-member-ada',
      name: 'Ada Mock',
      imageUrl: null,
      teamName: 'Mock Labs',
      role: 'Founder',
    },
    { type: 'member', uid: 'mock-member-ben', name: 'Ben Sample', imageUrl: null, teamName: 'Sample Co', role: 'CTO' },
    { type: 'member', uid: 'missing-member', name: 'Missing Mock Member', imageUrl: null, teamName: null, role: null },
  ],
  teams: [
    { type: 'team', uid: 'mock-team-labs', name: 'Mock Labs', logoUrl: null, shortDescription: 'A mock team.' },
    { type: 'team', uid: 'mock-team-sample', name: 'Sample Co', logoUrl: null, shortDescription: 'Another mock team.' },
  ],
  news: [
    {
      type: 'news',
      uid: 'mock-news-seed',
      title: 'Mock Labs raises a mock seed round',
      teamUid: 'mock-team-labs',
      teamName: 'Mock Labs',
      eventDate: '2026-11-12T00:00:00.000Z',
    },
    {
      type: 'news',
      uid: 'mock-news-launch',
      title: 'Sample Co ships a mock launch',
      teamUid: 'mock-team-sample',
      teamName: 'Sample Co',
      eventDate: '2026-11-10T00:00:00.000Z',
    },
  ],
};

/** S6: mock C4 (contract 10.2). The empty query gives no members, the teams and the newest news (10.2.3). */
export function mockMentions({ q: raw, types, limit = 5 }: LabosAgentMentionsQuery): LabosAgentMentionsResponse {
  const q = raw.trim();
  const want = (type: 'member' | 'team' | 'news') => !types || types.includes(type);
  const has = (...values: (string | null)[]) => values.some((v) => !!v && v.toLowerCase().includes(q.toLowerCase()));
  return {
    q,
    members: want('member') && q ? MOCK_MENTIONS.members.filter((m) => has(m.name, m.teamName)).slice(0, limit) : [],
    teams: want('team') ? MOCK_MENTIONS.teams.filter((t) => !q || has(t.name)).slice(0, limit) : [],
    news: want('news') ? MOCK_MENTIONS.news.filter((n) => !q || has(n.title, n.teamName)).slice(0, limit) : [],
  };
}

const MENTION_NOT_FOUND = { member: 'MEMBER_NOT_FOUND', team: 'TEAM_NOT_FOUND', news: 'NEWS_NOT_FOUND' } as const;

/** S6: the 404 that C1 gives for the first mention uid that starts with `missing` (contract 10.4). */
function missingMentionError(request: LabosAgentChatRequest): LabosAgentError | null {
  const index = (request.mentions ?? []).findIndex((m) => m.type !== 'page' && m.uid.startsWith('missing'));
  if (index < 0) return null;
  const mention = request.mentions![index];
  if (mention.type === 'page') return null;
  return new LabosAgentError(
    404,
    MENTION_NOT_FOUND[mention.type],
    `Not found: ${mention.uid}`,
    undefined,
    undefined,
    index,
  );
}

/** S6: the words for the mentions of a message, in order. */
const mentionWords = (request: LabosAgentChatRequest): string =>
  (request.mentions ?? [])
    .map((m, i) => `${i + 1}. ${m.type === 'page' ? `the ${m.page} page` : `${m.type} ${m.uid}`}`)
    .join('\n');

export function mockChatBody(request: LabosAgentChatRequest): LabosAgentChatResponse {
  if (request.context?.page === 'intro') return introBody(request);
  const q = request.message.toLowerCase();
  const onStory = request.context?.page === 'news-story';
  const pageRead = request.context ? PAGE_READS[request.context.page] : undefined;
  const newsUid = request.context?.page === 'news-story' ? request.context.newsUid : undefined;
  const useWeb = /web|latest|internet/.test(q);

  const mentioned = mentionWords(request);
  const steps = [
    'Understanding the question',
    ...(mentioned ? ['Reading the items you added'] : []),
    onStory ? 'Reading the news story' : (pageRead?.step ?? 'Searching LabOS news'),
    ...(useWeb ? ['Searching the web'] : []),
    'Writing the answer',
  ];

  const lead = onStory
    ? 'This is a mock answer. The live agent will read this news story and answer your question about it.'
    : pageRead
      ? `This is a mock answer. The live agent will read ${pageRead.what} and answer your question about it.`
      : 'This is a mock answer. The live agent will search LabOS news and answer your question.';

  const proposals = mockProposals(request.message, request.chatId);
  if (proposals.length > 0) {
    return {
      steps: ['Understanding the question', 'Reading your profile', 'Preparing the change'],
      content: 'This is a mock answer. I prepared the change below. Nothing is saved until you press Confirm.',
      sources: [],
      sourceRefs: [],
      followUpQuestions: [],
      actions: [],
      proposals,
      drafts: [],
    };
  }

  const content = [
    lead,
    '',
    `You asked: "${request.message.trim()}"`,
    '',
    ...(mentioned ? ['The live agent will also read the items you added:', mentioned, ''] : []),
    useWeb
      ? 'LabOS has no data on this, so the live agent will search the web and list the pages it used below.'
      : '- The answer will cite the LabOS stories it used.\n- When LabOS has no data, the agent will search the web.',
  ].join('\n');

  return {
    steps,
    content: /stall/.test(q) ? `${content}\n\n_${LABOS_AGENT_STALL_MARKER}. Please try again._` : content,
    sources: useWeb ? ['https://example.com/mock-web-source'] : [],
    sourceRefs: onStory && newsUid ? [{ type: 'news', uid: newsUid, title: 'This news story (mock)' }] : [],
    followUpQuestions: onStory
      ? ['Which other teams work on this?', 'What happened before this?']
      : ['What else happened this week?'],
    actions: [],
    proposals: [],
    drafts: [],
  };
}

async function chat(
  request: LabosAgentChatRequest,
  { signal, onUpdate }: LabosAgentStreamOptions = {},
): Promise<LabosAgentChatResponse> {
  if (request.context?.page === 'intro' && request.context.introTarget.uid.startsWith('missing')) {
    await wait(STEP_MS, signal);
    throw new LabosAgentError(404, 'INTRO_TARGET_NOT_FOUND', 'The intro target was not found.');
  }
  const pageError = missingPageError(request) ?? missingMentionError(request);
  if (pageError) {
    await wait(STEP_MS, signal);
    throw pageError;
  }
  const full = mockChatBody(request);
  const fail = /error/.test(request.message.toLowerCase());

  for (let i = 1; i <= full.steps.length; i++) {
    await wait(STEP_MS, signal);
    onUpdate?.({ steps: full.steps.slice(0, i) });
    if (fail) throw new LabosAgentError(200, 'STREAM_FAILED', 'The connection to the agent broke.');
  }

  const words = full.content.split(' ');
  for (let n = WORDS_PER_TICK; n < words.length + WORDS_PER_TICK; n += WORDS_PER_TICK) {
    await wait(TICK_MS, signal);
    onUpdate?.({ steps: full.steps, content: words.slice(0, n).join(' ') });
  }

  onUpdate?.(full);
  // LAB-3457: a finished turn sent with `persist: true` goes into the mock history.
  if (request.persist) recordMockTurn(request, full);
  return full;
}

/** The mock `fails_` proposals that already failed once. */
const failedOnce = new Set<string>();

/** The mock proposals that C2 closed, with the stored status. A second C2 call on one gets a 409. */
const closed = new Map<string, LabosAgentClosedStatus>();

async function confirmAction({ proposalId, decision }: LabosAgentConfirmRequest): Promise<LabosAgentConfirmResponse> {
  await wait(SAVE_MS);
  const stored = closed.get(proposalId);
  if (stored) {
    throw new LabosAgentError(409, 'PROPOSAL_CLOSED', 'This proposal is closed.', undefined, stored);
  }
  if (decision === 'cancel') {
    closed.set(proposalId, 'cancelled');
    return { proposalId, status: 'cancelled', summary: 'Nothing changed.' };
  }
  if (proposalId.startsWith(`${MOCK_ID}forbidden_`)) {
    throw new LabosAgentError(403, 'ACTION_NOT_ALLOWED', 'You cannot change this team.');
  }
  if (proposalId.startsWith(`${MOCK_ID}fails_`) && !failedOnce.has(proposalId)) {
    failedOnce.add(proposalId);
    throw new LabosAgentError(0, 'STREAM_FAILED', 'The agent did not answer.');
  }
  const team = proposalId.includes('_team_');
  closed.set(proposalId, 'done');
  return {
    proposalId,
    status: 'done',
    tool: team ? 'update_team' : 'update_my_profile',
    summary: team
      ? 'The team description is updated (mock, nothing saved).'
      : 'Your profile is updated (mock, nothing saved).',
    result: {},
  };
}

async function searchMentions(
  query: LabosAgentMentionsQuery,
  { signal }: { signal?: AbortSignal } = {},
): Promise<LabosAgentMentionsResponse> {
  await wait(TICK_MS * 5, signal);
  if (/unavailable/i.test(query.q)) throw new LabosAgentError(503, 'UNKNOWN', 'Search is not available.');
  return mockMentions(query);
}

export const mockLabosAgentClient: LabosAgentClient = {
  chat,
  getAccess: async () => ({ enabled: true }),
  confirmAction,
  searchMentions,
};
