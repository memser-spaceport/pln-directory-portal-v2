import type {
  LabosAgentChatRequest,
  LabosAgentChatResponse,
  LabosAgentClient,
  LabosAgentClosedStatus,
  LabosAgentConfirmRequest,
  LabosAgentConfirmResponse,
  LabosAgentProposal,
  LabosAgentStreamOptions,
} from '@/types/labos-agent.types';

import { LabosAgentError, LABOS_AGENT_STALL_MARKER } from './labos-agent.errors';

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
 * A second C2 call on a closed proposal gets a 409 `PROPOSAL_CLOSED` with the stored `status`, like the backend.
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

export function mockChatBody(request: LabosAgentChatRequest): LabosAgentChatResponse {
  const q = request.message.toLowerCase();
  const onStory = request.context?.page === 'news-story';
  const newsUid = request.context?.page === 'news-story' ? request.context.newsUid : undefined;
  const useWeb = /web|latest|internet/.test(q);

  const steps = [
    'Understanding the question',
    onStory ? 'Reading the news story' : 'Searching LabOS news',
    ...(useWeb ? ['Searching the web'] : []),
    'Writing the answer',
  ];

  const lead = onStory
    ? 'This is a mock answer. The live agent will read this news story and answer your question about it.'
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
    };
  }

  const content = [
    lead,
    '',
    `You asked: "${request.message.trim()}"`,
    '',
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
  };
}

async function chat(
  request: LabosAgentChatRequest,
  { signal, onUpdate }: LabosAgentStreamOptions = {},
): Promise<LabosAgentChatResponse> {
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

export const mockLabosAgentClient: LabosAgentClient = {
  chat,
  getAccess: async () => ({ enabled: true }),
  confirmAction,
};
