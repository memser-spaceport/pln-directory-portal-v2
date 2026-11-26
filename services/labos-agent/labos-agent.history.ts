import type {
  LabosAgentChatContext,
  LabosAgentDraftConfirmRequest,
  LabosAgentDraftConfirmResponse,
  LabosAgentHistoryClient,
  LabosAgentMention,
  LabosAgentMentionPage,
  LabosAgentStoredDraft,
  LabosAgentStoredDraftStatus,
  LabosAgentStoredProposal,
  LabosAgentStoredProposalStatus,
  LabosAgentThread,
  LabosAgentThreadList,
  LabosAgentThreadListItem,
  LabosAgentThreadsQuery,
  LabosAgentThreadTurn,
} from '@/types/labos-agent.types';
import { customFetch } from '@/utils/fetch-wrapper';

import { LABOS_AGENT_ENDPOINTS } from './constants';
import { isLabosAgentMock } from './labos-agent.config';
import { LabosAgentError } from './labos-agent.errors';
import { mockLabosAgentHistoryClient } from './labos-agent.history.mock';
import { normalizeDrafts, normalizeProposals, sourceRefs, strings, toError } from './labos-agent.service';
import { visibleWebSources } from './labos-agent.source-dedupe';

/*
 * LAB-3457: the history client. T1 lists the member's threads (old AI search threads and agent threads in one list),
 * T2 reads one thread with its turns, T3 deletes one (soft), C5 sends or cancels a saved intro draft. All four need
 * the member token and the agent gate, as C1 (401, 403 `AGENT_NOT_ENABLED`). Every failure is a `LabosAgentError`.
 */

const apiUrl = (path: string) => `${process.env.DIRECTORY_API_URL}${path}`;

const record = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
const text = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

/** Reads a saved C1 `context`. An unknown page or a page without its id drops out. */
export function normalizeChatContext(v: unknown): LabosAgentChatContext | undefined {
  const c = record(v);
  if (!c) return undefined;
  switch (c.page) {
    case 'home':
      return { page: 'home' };
    case 'profile':
      return { page: 'profile' };
    case 'news-story':
      return text(c.newsUid) ? { page: 'news-story', newsUid: c.newsUid as string } : undefined;
    case 'member':
      return text(c.memberUid) ? { page: 'member', memberUid: c.memberUid as string } : undefined;
    case 'team':
      return text(c.teamUid) ? { page: 'team', teamUid: c.teamUid as string } : undefined;
    case 'job':
      return text(c.jobUid) ? { page: 'job', jobUid: c.jobUid as string } : { page: 'job' };
    case 'intro': {
      const t = record(c.introTarget);
      if (!t || (t.type !== 'member' && t.type !== 'team') || !text(t.uid)) return undefined;
      return { page: 'intro', introTarget: { type: t.type, uid: t.uid as string } };
    }
    default:
      return undefined;
  }
}

function normalizeMentions(v: unknown): LabosAgentMention[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const mentions = v.flatMap((raw): LabosAgentMention[] => {
    const m = record(raw);
    if (!m) return [];
    if ((m.type === 'member' || m.type === 'team' || m.type === 'news') && text(m.uid)) {
      return [{ type: m.type, uid: m.uid as string }];
    }
    if (m.type === 'page' && (MENTION_PAGES as unknown[]).includes(m.page)) {
      return [{ type: 'page', page: m.page as LabosAgentMentionPage }];
    }
    return [];
  });
  return mentions.length > 0 ? mentions : undefined;
}

const MENTION_PAGES: LabosAgentMentionPage[] = ['home', 'job', 'profile'];

const PROPOSAL_STATUSES: LabosAgentStoredProposalStatus[] = ['open', 'done', 'cancelled', 'failed', 'expired'];
const DRAFT_STATUSES: LabosAgentStoredDraftStatus[] = ['open', 'sent', 'cancelled'];

/**
 * Saved action cards. A card with an unknown status reads as `expired`, so it never shows Confirm. An `open` card
 * whose `expiresAt` has passed still closes in the card itself.
 */
function normalizeStoredProposals(v: unknown): LabosAgentStoredProposal[] {
  const raw = Array.isArray(v) ? v : [];
  return normalizeProposals(raw).map((proposal) => {
    const r = record(raw.find((x) => record(x)?.proposalId === proposal.proposalId)) ?? {};
    const status = (PROPOSAL_STATUSES as unknown[]).includes(r.status)
      ? (r.status as LabosAgentStoredProposalStatus)
      : 'expired';
    return { ...proposal, status, ...(text(r.summary) ? { summary: r.summary as string } : {}) };
  });
}

/** Saved intro drafts. A draft with an unknown status reads as `cancelled`, so it never shows Send. */
function normalizeStoredDrafts(v: unknown): LabosAgentStoredDraft[] {
  const raw = Array.isArray(v) ? v : [];
  return normalizeDrafts(raw).map((draft) => {
    const r = record(raw.find((x) => record(x)?.draftId === draft.draftId)) ?? {};
    const status = (DRAFT_STATUSES as unknown[]).includes(r.status)
      ? (r.status as LabosAgentStoredDraftStatus)
      : 'cancelled';
    return {
      ...draft,
      status,
      ...(text(r.introRequestUid) ? { introRequestUid: r.introRequestUid as string } : {}),
      ...(text(r.sentAt) ? { sentAt: r.sentAt as string } : {}),
    };
  });
}

/** One T2 turn. A turn with no `chatId` or no question drops out. A turn with no `kind` is an old AI search turn. */
export function normalizeThreadTurn(v: unknown): LabosAgentThreadTurn | null {
  const t = record(v);
  if (!t || !text(t.chatId) || !text(t.question)) return null;
  const refs = sourceRefs(t.sourceRefs);
  const base = {
    chatId: t.chatId as string,
    question: t.question as string,
    content: typeof t.content === 'string' ? t.content : '',
    sources: visibleWebSources(strings(t.sources), refs),
    sourceRefs: refs,
    followUpQuestions: strings(t.followUpQuestions),
    actions: Array.isArray(t.actions) ? t.actions : [],
    createdAt: text(t.createdAt),
  };
  if (t.kind !== 'agent') return { ...base, kind: 'ai-search' };
  const context = normalizeChatContext(t.context);
  const mentions = normalizeMentions(t.mentions);
  return {
    ...base,
    kind: 'agent',
    steps: strings(t.steps),
    ...(context ? { context } : {}),
    ...(mentions ? { mentions } : {}),
    ...(isCount(t.toolCount) ? { toolCount: t.toolCount } : {}),
    ...(typeof t.usedWebSearch === 'boolean' ? { usedWebSearch: t.usedWebSearch } : {}),
    ...(isCount(t.sourceCount) ? { sourceCount: t.sourceCount } : {}),
    proposals: normalizeStoredProposals(t.proposals),
    drafts: normalizeStoredDrafts(t.drafts),
  };
}

/** One T1 row. A row with no `threadId` drops out; a row with no title gets "Untitled chat". */
export function normalizeThreadListItem(v: unknown): LabosAgentThreadListItem | null {
  const r = record(v);
  if (!r || !text(r.threadId)) return null;
  const context = normalizeChatContext(r.context);
  const createdAt = text(r.createdAt) ?? '';
  return {
    threadId: r.threadId as string,
    title: (typeof r.title === 'string' && r.title.trim()) || 'Untitled chat',
    source: r.source === 'agent' ? 'agent' : 'ai-search',
    ...(context ? { context } : {}),
    createdAt,
    updatedAt: text(r.updatedAt) ?? createdAt,
  };
}

export function normalizeThreadList(v: unknown): LabosAgentThreadList {
  const body = record(v) ?? {};
  const items = (Array.isArray(body.items) ? body.items : [])
    .map(normalizeThreadListItem)
    .filter((x): x is LabosAgentThreadListItem => x !== null);
  return {
    page: isCount(body.page) && body.page > 0 ? body.page : 1,
    limit: isCount(body.limit) && body.limit > 0 ? body.limit : items.length,
    total: isCount(body.total) ? body.total : items.length,
    items,
  };
}

export function normalizeThread(v: unknown, threadId: string): LabosAgentThread {
  const item = normalizeThreadListItem(v) ?? {
    threadId,
    title: 'Untitled chat',
    source: 'ai-search' as const,
    createdAt: '',
    updatedAt: '',
  };
  const raw = record(v)?.turns;
  const turns = (Array.isArray(raw) ? raw : [])
    .map(normalizeThreadTurn)
    .filter((x): x is LabosAgentThreadTurn => x !== null);
  return { ...item, turns };
}

async function request(path: string, init: RequestInit): Promise<Response> {
  let response: Response | undefined;
  try {
    response = await customFetch(apiUrl(path), init, true);
  } catch {
    throw new LabosAgentError(0, 'STREAM_FAILED', 'The agent did not answer.');
  }
  if (!response) throw new LabosAgentError(401, 'UNAUTHORIZED', 'Sign in to use the agent.');
  if (!response.ok) throw await toError(response);
  return response;
}

async function json(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new LabosAgentError(response.status, 'UNKNOWN', 'The agent sent an answer the page cannot read.');
  }
}

const threadPath = (threadId: string) => `${LABOS_AGENT_ENDPOINTS.threads}/${encodeURIComponent(threadId)}`;

/** T1: `GET /v1/labos-agent/threads?page&limit`. */
async function listThreads({ page = 1, limit }: LabosAgentThreadsQuery = {}): Promise<LabosAgentThreadList> {
  const params = new URLSearchParams({ page: String(page) });
  if (limit !== undefined) params.set('limit', String(limit));
  const response = await request(`${LABOS_AGENT_ENDPOINTS.threads}?${params.toString()}`, { method: 'GET' });
  return normalizeThreadList(await json(response));
}

/** T2: `GET /v1/labos-agent/threads/:threadId`. A 404 is `THREAD_NOT_FOUND`. */
async function getThread(threadId: string): Promise<LabosAgentThread> {
  const response = await request(threadPath(threadId), { method: 'GET' });
  return normalizeThread(await json(response), threadId);
}

/** T3: `DELETE /v1/labos-agent/threads/:threadId`. The thread leaves both histories; the data is kept. */
async function deleteThread(threadId: string): Promise<void> {
  await request(threadPath(threadId), { method: 'DELETE' });
}

/**
 * C5: `POST /v1/labos-agent/drafts/confirm`. Sends or cancels a saved intro draft. The backend sends the intro at most
 * once, to the saved target. `text` goes with `send` only.
 */
async function confirmDraft({
  threadId,
  draftId,
  decision,
  text: draftText,
}: LabosAgentDraftConfirmRequest): Promise<LabosAgentDraftConfirmResponse> {
  const body = { threadId, draftId, decision, ...(decision === 'send' ? { text: (draftText ?? '').trim() } : {}) };
  const response = await request(LABOS_AGENT_ENDPOINTS.draftConfirm, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let r: Record<string, unknown> = {};
  try {
    r = record(await response.json()) ?? {};
  } catch {
    // An empty or broken body: fall back to the decision.
  }
  const status = r.status === 'sent' || r.status === 'cancelled' ? r.status : undefined;
  return {
    draftId: text(r.draftId) ?? draftId,
    status: status ?? (decision === 'send' ? 'sent' : 'cancelled'),
    ...(text(r.introRequestUid) ? { introRequestUid: r.introRequestUid as string } : {}),
  };
}

export const liveLabosAgentHistoryClient: LabosAgentHistoryClient = {
  listThreads,
  getThread,
  deleteThread,
  confirmDraft,
};

/** The history client: live, or the mock when the agent mock is selected (see `labos-agent.config.ts`). */
export function getLabosAgentHistoryClient(): LabosAgentHistoryClient {
  return isLabosAgentMock() ? mockLabosAgentHistoryClient : liveLabosAgentHistoryClient;
}
