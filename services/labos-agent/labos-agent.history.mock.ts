import type {
  LabosAgentChatRequest,
  LabosAgentChatResponse,
  LabosAgentDraftConfirmRequest,
  LabosAgentDraftConfirmResponse,
  LabosAgentHistoryClient,
  LabosAgentThread,
  LabosAgentThreadList,
  LabosAgentThreadsQuery,
} from '@/types/labos-agent.types';

import { LabosAgentError } from './labos-agent.errors';

/**
 * LAB-3457: the mock history (T1, T2, T3, C5). In memory, no network, no member data; a reload starts over. It holds
 * one old AI search thread, and the mock C1 adds each finished turn sent with `persist: true` (`recordMockTurn`).
 *
 * - A thread id that starts with `missing`: T2 and T3 get a 404 `THREAD_NOT_FOUND`.
 * - C5 `send` of a draft whose text has the word "fails": a 503 the first time; the draft stays open, so Retry works.
 * - A second C5 call on a closed draft gets a 409 `DRAFT_CLOSED` with the stored status, like the backend.
 */

const WAIT_MS = 300;
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const MOCK_LEGACY_THREAD_ID = 'mock-ai-search-thread';

const seed = (): Map<string, LabosAgentThread> =>
  new Map([
    [
      MOCK_LEGACY_THREAD_ID,
      {
        threadId: MOCK_LEGACY_THREAD_ID,
        title: 'Teams working on decentralized storage (mock)',
        source: 'ai-search',
        createdAt: '2026-11-20T10:00:00.000Z',
        updatedAt: '2026-11-20T10:00:00.000Z',
        turns: [
          {
            kind: 'ai-search',
            chatId: 'mock-ai-search-chat',
            question: 'Which teams work on decentralized storage?',
            content: 'This is a saved AI search answer (mock). Ask a follow-up to continue the thread on the agent.',
            sources: [],
            sourceRefs: [],
            followUpQuestions: ['Who leads these teams?'],
            actions: [],
            createdAt: '2026-11-20T10:00:00.000Z',
          },
        ],
      },
    ],
  ]);

let threads = seed();
const failedDraftOnce = new Set<string>();

/** Tests only: back to the seeded history. */
export function resetMockHistory() {
  threads = seed();
  failedDraftOnce.clear();
}

/** The mock C1 calls this when a turn sent with `persist: true` finishes. */
export function recordMockTurn(request: LabosAgentChatRequest, body: LabosAgentChatResponse) {
  const now = new Date().toISOString();
  const existing = threads.get(request.threadId);
  const thread: LabosAgentThread = existing ?? {
    threadId: request.threadId,
    title: request.message.slice(0, 80),
    source: 'agent',
    ...(request.context ? { context: request.context } : {}),
    createdAt: now,
    updatedAt: now,
    turns: [],
  };
  thread.turns.push({
    kind: 'agent',
    chatId: request.chatId,
    question: request.message,
    content: body.content,
    sources: body.sources,
    sourceRefs: body.sourceRefs,
    followUpQuestions: body.followUpQuestions,
    actions: body.actions,
    createdAt: now,
    steps: body.steps,
    ...(request.context ? { context: request.context } : {}),
    ...(request.mentions ? { mentions: request.mentions } : {}),
    proposals: body.proposals.map((p) => ({ ...p, status: 'open' as const })),
    drafts: body.drafts.map((d) => ({ ...d, status: 'open' as const })),
  });
  thread.updatedAt = now;
  threads.set(request.threadId, thread);
}

const notFound = () => new LabosAgentError(404, 'THREAD_NOT_FOUND', 'The thread was not found.');

function find(threadId: string): LabosAgentThread {
  const thread = threadId.startsWith('missing') ? undefined : threads.get(threadId);
  if (!thread) throw notFound();
  return thread;
}

async function listThreads({ page = 1, limit = 20 }: LabosAgentThreadsQuery = {}): Promise<LabosAgentThreadList> {
  await wait(WAIT_MS);
  const all = [...threads.values()]
    .filter((t) => t.turns.length > 0)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map(({ turns: _turns, ...item }) => item);
  return { page, limit, total: all.length, items: all.slice((page - 1) * limit, page * limit) };
}

async function getThread(threadId: string): Promise<LabosAgentThread> {
  await wait(WAIT_MS);
  return JSON.parse(JSON.stringify(find(threadId))) as LabosAgentThread;
}

async function deleteThread(threadId: string): Promise<void> {
  await wait(WAIT_MS);
  find(threadId);
  threads.delete(threadId);
}

async function confirmDraft({
  threadId,
  draftId,
  decision,
  text,
}: LabosAgentDraftConfirmRequest): Promise<LabosAgentDraftConfirmResponse> {
  await wait(WAIT_MS);
  const draft = find(threadId)
    .turns.flatMap((t) => (t.kind === 'agent' ? t.drafts : []))
    .find((d) => d.draftId === draftId);
  if (!draft) throw new LabosAgentError(404, 'DRAFT_NOT_FOUND', 'The draft was not found.');
  if (draft.status !== 'open') {
    throw new LabosAgentError(
      409,
      'DRAFT_CLOSED',
      'This draft is closed.',
      undefined,
      undefined,
      undefined,
      draft.status,
    );
  }
  if (decision === 'cancel') {
    draft.status = 'cancelled';
    return { draftId, status: 'cancelled' };
  }
  const sent = (text ?? '').trim();
  if (sent.length < draft.minLength || sent.length > draft.maxLength) {
    throw new LabosAgentError(400, 'VALIDATION_ERROR', 'text must be 20 to 3500 characters after trim');
  }
  if (/fails/i.test(sent) && !failedDraftOnce.has(draftId)) {
    failedDraftOnce.add(draftId);
    throw new LabosAgentError(503, 'UNKNOWN', 'The intro request failed.');
  }
  Object.assign(draft, {
    status: 'sent',
    text: sent,
    introRequestUid: `mock-intro-${draftId}`,
    sentAt: new Date().toISOString(),
  });
  return { draftId, status: 'sent', introRequestUid: `mock-intro-${draftId}` };
}

export const mockLabosAgentHistoryClient: LabosAgentHistoryClient = {
  listThreads,
  getThread,
  deleteThread,
  confirmDraft,
};
