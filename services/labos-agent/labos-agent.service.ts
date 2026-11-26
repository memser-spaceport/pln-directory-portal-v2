import { parsePartialJson } from '@ai-sdk/ui-utils';

import type {
  LabosAgentAccess,
  LabosAgentChatContext,
  LabosAgentChatErrorCode,
  LabosAgentChatRequest,
  LabosAgentChatResponse,
  LabosAgentChangeValue,
  LabosAgentClient,
  LabosAgentClosedStatus,
  LabosAgentConfirmRequest,
  LabosAgentConfirmResponse,
  LabosAgentDraft,
  LabosAgentMentionMember,
  LabosAgentMentionNews,
  LabosAgentMentionsQuery,
  LabosAgentMentionsResponse,
  LabosAgentMentionTeam,
  LabosAgentOpenContext,
  LabosAgentProposal,
  LabosAgentProposalChange,
  LabosAgentProposalTool,
  LabosAgentSourceRef,
  LabosAgentStreamOptions,
} from '@/types/labos-agent.types';
import { customFetch } from '@/utils/fetch-wrapper';

import { LABOS_AGENT_ENDPOINTS, LABOS_AGENT_MESSAGE_MAX } from './constants';
import { isLabosAgentMock } from './labos-agent.config';
import { LabosAgentError } from './labos-agent.errors';
import { mockLabosAgentClient } from './labos-agent.mock';
import { visibleWebSources } from './labos-agent.source-dedupe';

export { LabosAgentError } from './labos-agent.errors';

const KNOWN_CODES: LabosAgentChatErrorCode[] = [
  'VALIDATION_ERROR',
  'AGENT_NOT_ENABLED',
  'NEWS_NOT_FOUND',
  'INTRO_TARGET_NOT_FOUND',
  'MEMBER_NOT_FOUND',
  'TEAM_NOT_FOUND',
  'JOB_NOT_FOUND',
  'RATE_LIMITED',
  'ACTION_NOT_ALLOWED',
  'PROPOSAL_NOT_FOUND',
  'PROPOSAL_CLOSED',
  'PROPOSAL_EXPIRED',
  'ACTION_FAILED',
  'THREAD_NOT_FOUND',
  'DRAFT_NOT_FOUND',
  'DRAFT_CLOSED',
];

const CLOSED_STATUSES: LabosAgentClosedStatus[] = ['done', 'cancelled', 'failed'];

const PROPOSAL_TOOLS: LabosAgentProposalTool[] = [
  'update_my_profile',
  'add_experience',
  'update_experience',
  'update_team',
];

const apiUrl = (path: string) => `${process.env.DIRECTORY_API_URL}${path}`;

/**
 * The C1 `context`: only the contract fields. The chip label and the intro entry point stay in the browser. S5
 * (contract 9.2): each page goes with its own id; `profile` has none, and the job board has no `jobUid`. `null`: the
 * member removed the page chip, so the request has no `context`.
 */
export function toChatContext(context: LabosAgentOpenContext | null | undefined): LabosAgentChatContext | undefined {
  if (!context) return undefined;
  if (context.page === 'news-story') return { page: 'news-story', newsUid: context.newsUid };
  if (context.page === 'intro') {
    return { page: 'intro', introTarget: { type: context.introTarget.type, uid: context.introTarget.uid } };
  }
  switch (context.page) {
    case 'member':
      return { page: 'member', memberUid: context.memberUid };
    case 'team':
      return { page: 'team', teamUid: context.teamUid };
    case 'job':
      return context.jobUid ? { page: 'job', jobUid: context.jobUid } : { page: 'job' };
    case 'profile':
      return { page: 'profile' };
    default:
      return { page: 'home' };
  }
}

/** Trims the message and checks the C1 limits before a request leaves the browser. */
export function validateChatMessage(raw: string): string {
  const message = raw.trim();
  if (message.length < 1 || message.length > LABOS_AGENT_MESSAGE_MAX) {
    throw new LabosAgentError(400, 'VALIDATION_ERROR', `Write 1 to ${LABOS_AGENT_MESSAGE_MAX} characters.`);
  }
  return message;
}

export const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length > 0) : [];

export const sourceRefs = (v: unknown): LabosAgentSourceRef[] =>
  Array.isArray(v)
    ? v.filter(
        (r): r is LabosAgentSourceRef =>
          !!r && typeof r === 'object' && typeof r.title === 'string' && typeof r.type === 'string',
      )
    : [];

const isChangeValue = (v: unknown): v is LabosAgentChangeValue =>
  v === null ||
  typeof v === 'string' ||
  typeof v === 'number' ||
  typeof v === 'boolean' ||
  (Array.isArray(v) && v.every((x) => typeof x === 'string'));

const change = (v: unknown): LabosAgentProposalChange | null => {
  if (!v || typeof v !== 'object') return null;
  const c = v as Record<string, unknown>;
  if (typeof c.field !== 'string') return null;
  return {
    field: c.field,
    label: typeof c.label === 'string' && c.label ? c.label : c.field,
    oldValue: isChangeValue(c.oldValue) ? c.oldValue : null,
    newValue: isChangeValue(c.newValue) ? c.newValue : null,
  };
};

/** Keeps only complete proposals with a known tool. A half-streamed proposal drops out until it is whole. */
export function normalizeProposals(v: unknown): LabosAgentProposal[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((raw): LabosAgentProposal[] => {
    if (!raw || typeof raw !== 'object') return [];
    const p = raw as Record<string, unknown>;
    if (typeof p.proposalId !== 'string' || !p.proposalId || typeof p.title !== 'string') return [];
    if (!(PROPOSAL_TOOLS as unknown[]).includes(p.tool)) return [];
    if (!Array.isArray(p.changes)) return [];
    const changes = p.changes.map(change).filter((c): c is LabosAgentProposalChange => c !== null);
    if (changes.length === 0) return [];
    return [
      {
        proposalId: p.proposalId,
        tool: p.tool as LabosAgentProposalTool,
        title: p.title,
        targetType: p.targetType === 'team' ? 'team' : 'member',
        targetUid: typeof p.targetUid === 'string' ? p.targetUid : undefined,
        changes,
        expiresAt: typeof p.expiresAt === 'string' ? p.expiresAt : undefined,
      },
    ];
  });
}

/** The modal limits (contract 8.2). A draft with no limits or bad limits gets these. */
export const INTRO_DRAFT_MIN_LENGTH = 20;
export const INTRO_DRAFT_MAX_LENGTH = 3500;

const positiveInt = (v: unknown): number | null => (typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : null);

/**
 * Keeps only complete intro drafts (contract 8.2). A half-streamed draft drops out until it is whole. The client
 * never trusts the limits more than the modal: `minLength` is at least 20 and `maxLength` at most 3500.
 */
export function normalizeDrafts(v: unknown): LabosAgentDraft[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((raw): LabosAgentDraft[] => {
    if (!raw || typeof raw !== 'object') return [];
    const d = raw as Record<string, unknown>;
    if (typeof d.draftId !== 'string' || !d.draftId || d.kind !== 'intro' || typeof d.text !== 'string') return [];
    const t = d.target && typeof d.target === 'object' ? (d.target as Record<string, unknown>) : null;
    if (!t || (t.type !== 'member' && t.type !== 'team') || typeof t.uid !== 'string' || !t.uid) return [];
    if (typeof t.name !== 'string' || !t.name) return [];
    const min = Math.max(positiveInt(d.minLength) ?? INTRO_DRAFT_MIN_LENGTH, INTRO_DRAFT_MIN_LENGTH);
    const max = Math.min(positiveInt(d.maxLength) ?? INTRO_DRAFT_MAX_LENGTH, INTRO_DRAFT_MAX_LENGTH);
    if (min > max) return [];
    return [
      {
        draftId: d.draftId,
        kind: 'intro',
        target: { type: t.type, uid: t.uid, name: t.name },
        text: d.text.trim().slice(0, max),
        minLength: min,
        maxLength: max,
        source: 'agent',
      },
    ];
  });
}

/** Reads a partial or full stream body into the response shape. Unknown or half-written fields drop out. */
export function normalizeChatBody(value: unknown): LabosAgentChatResponse {
  const body = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const refs = sourceRefs(body.sourceRefs);
  return {
    steps: strings(body.steps),
    content: typeof body.content === 'string' ? body.content : '',
    // LAB-3298 (D2): a page that a ref already lists, or a page on the app's own origin, shows once.
    sources: visibleWebSources(strings(body.sources), refs),
    sourceRefs: refs,
    followUpQuestions: strings(body.followUpQuestions),
    actions: Array.isArray(body.actions) ? body.actions : [],
    proposals: normalizeProposals(body.proposals),
    drafts: normalizeDrafts(body.drafts),
    // LAB-3297 V0-R4: only valid values. A missing or bad value drops out.
    ...(isCount(body.toolCount) ? { toolCount: body.toolCount } : {}),
    ...(typeof body.usedWebSearch === 'boolean' ? { usedWebSearch: body.usedWebSearch } : {}),
    ...(isCount(body.sourceCount) ? { sourceCount: body.sourceCount } : {}),
  };
}

const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

/** Reads a failed response of any agent endpoint into a `LabosAgentError`. */
export async function toError(response: Response): Promise<LabosAgentError> {
  if (response.status === 401) return new LabosAgentError(401, 'UNAUTHORIZED', 'Sign in to use the agent.');
  let body: Record<string, unknown> = {};
  try {
    body = (await response.json()) ?? {};
  } catch {
    // The body is not JSON. Keep the status only.
  }
  const raw = typeof body.code === 'string' ? body.code : typeof body.error === 'string' ? body.error : '';
  const code = (KNOWN_CODES as string[]).includes(raw) ? (raw as LabosAgentChatErrorCode) : 'UNKNOWN';
  const message = typeof body.message === 'string' ? body.message : response.statusText || 'The agent failed.';
  const retryAfter = typeof body.retryAfterSeconds === 'number' ? body.retryAfterSeconds : undefined;
  const closedStatus =
    code === 'PROPOSAL_CLOSED' && (CLOSED_STATUSES as unknown[]).includes(body.status)
      ? (body.status as LabosAgentClosedStatus)
      : undefined;
  // S6 (contract 10.4): a 404 for a mention names its index. A 404 for `context` has none.
  const mentionIndex =
    response.status === 404 && Number.isInteger(body.mentionIndex) && (body.mentionIndex as number) >= 0
      ? (body.mentionIndex as number)
      : undefined;
  // LAB-3457, C5: a 409 `DRAFT_CLOSED` says how the draft closed.
  const draftStatus =
    code === 'DRAFT_CLOSED' && (body.status === 'sent' || body.status === 'cancelled') ? body.status : undefined;
  return new LabosAgentError(response.status, code, message, retryAfter, closedStatus, mentionIndex, draftStatus);
}

/** C1: `POST /v1/labos-agent/chat`. Streams the chunked JSON body and returns the full body at the end. */
async function chat(
  request: LabosAgentChatRequest,
  { signal, onUpdate }: LabosAgentStreamOptions = {},
): Promise<LabosAgentChatResponse> {
  const { mentions, ...rest } = request;
  // S6-F14: no `mentions` key when the member picked none, so the S1 to S5 bodies do not change.
  const body: LabosAgentChatRequest = {
    ...rest,
    message: validateChatMessage(request.message),
    ...(mentions && mentions.length > 0 ? { mentions } : {}),
  };

  let response: Response | undefined;
  try {
    response = await customFetch(
      apiUrl(LABOS_AGENT_ENDPOINTS.chat),
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal },
      true,
    );
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new LabosAgentError(0, 'STREAM_FAILED', 'The agent did not answer.');
  }
  if (!response) throw new LabosAgentError(401, 'UNAUTHORIZED', 'Sign in to use the agent.');
  if (!response.ok) throw await toError(response);
  if (!response.body) throw new LabosAgentError(response.status, 'STREAM_FAILED', 'The agent sent no answer.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      const { value: partial } = parsePartialJson(text);
      if (partial !== undefined) onUpdate?.(normalizeChatBody(partial));
    }
    text += decoder.decode();
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new LabosAgentError(response.status, 'STREAM_FAILED', 'The connection to the agent broke.');
  }

  const { value: full, state } = parsePartialJson(text);
  if (state === 'failed-parse' || state === 'undefined-input') {
    throw new LabosAgentError(response.status, 'STREAM_FAILED', 'The agent sent an answer the page cannot read.');
  }
  return normalizeChatBody(full);
}

/**
 * C2: `POST /v1/labos-agent/actions/confirm`. Sends only the proposal id and the decision. The backend runs the tool
 * once, after it checks the member's permissions again.
 */
async function confirmAction(request: LabosAgentConfirmRequest): Promise<LabosAgentConfirmResponse> {
  let response: Response | undefined;
  try {
    response = await customFetch(
      apiUrl(LABOS_AGENT_ENDPOINTS.confirm),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId: request.proposalId, decision: request.decision }),
      },
      true,
    );
  } catch {
    throw new LabosAgentError(0, 'STREAM_FAILED', 'The agent did not answer.');
  }
  if (!response) throw new LabosAgentError(401, 'UNAUTHORIZED', 'Sign in to use the agent.');
  if (!response.ok) throw await toError(response);
  let body: Record<string, unknown> = {};
  try {
    body = (await response.json()) ?? {};
  } catch {
    // An empty or broken body: fall back to the decision.
  }
  const status = body.status === 'cancelled' || body.status === 'done' ? body.status : undefined;
  return {
    proposalId: typeof body.proposalId === 'string' ? body.proposalId : request.proposalId,
    status: status ?? (request.decision === 'cancel' ? 'cancelled' : 'done'),
    tool: (PROPOSAL_TOOLS as unknown[]).includes(body.tool) ? (body.tool as LabosAgentProposalTool) : undefined,
    summary: typeof body.summary === 'string' ? body.summary : '',
    result: body.result,
  };
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);
const rows = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object') : [];

/** Reads a C4 body into the response shape (contract 10.2). A row with no `uid` or no name drops out. */
export function normalizeMentionsBody(value: unknown, fallbackQuery: string): LabosAgentMentionsResponse {
  const body = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    q: typeof body.q === 'string' ? body.q : fallbackQuery,
    members: rows(body.members).flatMap((m): LabosAgentMentionMember[] => {
      const uid = str(m.uid);
      const name = str(m.name);
      if (!uid || !name) return [];
      return [{ type: 'member', uid, name, imageUrl: str(m.imageUrl), teamName: str(m.teamName), role: str(m.role) }];
    }),
    teams: rows(body.teams).flatMap((t): LabosAgentMentionTeam[] => {
      const uid = str(t.uid);
      const name = str(t.name);
      if (!uid || !name) return [];
      return [{ type: 'team', uid, name, logoUrl: str(t.logoUrl), shortDescription: str(t.shortDescription) }];
    }),
    news: rows(body.news).flatMap((n): LabosAgentMentionNews[] => {
      const uid = str(n.uid);
      const title = str(n.title);
      if (!uid || !title) return [];
      return [
        {
          type: 'news',
          uid,
          title,
          teamUid: str(n.teamUid) ?? '',
          teamName: str(n.teamName) ?? '',
          eventDate: str(n.eventDate) ?? '',
        },
      ];
    }),
  };
}

/**
 * C4 (S6, contract 10.2): `GET /v1/labos-agent/mentions`. The picker search for members, teams and news. `q` goes
 * trimmed. Every failure is a `LabosAgentError`; the picker shows one text for all of them (S6-F16).
 */
async function searchMentions(
  query: LabosAgentMentionsQuery,
  { signal }: { signal?: AbortSignal } = {},
): Promise<LabosAgentMentionsResponse> {
  const q = query.q.trim();
  const params = new URLSearchParams({ q });
  if (query.types && query.types.length > 0) params.set('types', query.types.join(','));
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  let response: Response | undefined;
  try {
    response = await customFetch(
      apiUrl(`${LABOS_AGENT_ENDPOINTS.mentions}?${params.toString()}`),
      { method: 'GET', signal },
      true,
    );
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new LabosAgentError(0, 'STREAM_FAILED', 'Search did not answer.');
  }
  if (!response) throw new LabosAgentError(401, 'UNAUTHORIZED', 'Sign in to use the agent.');
  if (!response.ok) throw await toError(response);
  try {
    return normalizeMentionsBody(await response.json(), q);
  } catch {
    throw new LabosAgentError(response.status, 'UNKNOWN', 'Search sent an answer the page cannot read.');
  }
}

/** `GET /v1/labos-agent/access`: the backend's pilot gate for the signed-in member. */
async function getAccess(): Promise<LabosAgentAccess> {
  const response = await customFetch(apiUrl(LABOS_AGENT_ENDPOINTS.access), { method: 'GET' }, true);
  if (!response?.ok) return { enabled: false };
  try {
    const body = await response.json();
    return { enabled: body?.enabled === true };
  } catch {
    return { enabled: false };
  }
}

export const liveLabosAgentClient: LabosAgentClient = { chat, getAccess, confirmAction, searchMentions };

/** The client the panel uses: live C1, or the mock when it is selected (see `labos-agent.config.ts`). */
export function getLabosAgentClient(): LabosAgentClient {
  return isLabosAgentMock() ? mockLabosAgentClient : liveLabosAgentClient;
}
