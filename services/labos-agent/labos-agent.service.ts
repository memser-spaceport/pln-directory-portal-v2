import { parsePartialJson } from '@ai-sdk/ui-utils';

import type {
  LabosAgentAccess,
  LabosAgentChatContext,
  LabosAgentChatErrorCode,
  LabosAgentChatRequest,
  LabosAgentChatResponse,
  LabosAgentClient,
  LabosAgentOpenContext,
  LabosAgentSourceRef,
  LabosAgentStreamOptions,
} from '@/types/labos-agent.types';
import { customFetch } from '@/utils/fetch-wrapper';

import { LABOS_AGENT_ENDPOINTS, LABOS_AGENT_MESSAGE_MAX } from './constants';
import { isLabosAgentMock } from './labos-agent.config';
import { LabosAgentError } from './labos-agent.errors';
import { mockLabosAgentClient } from './labos-agent.mock';

export { LabosAgentError } from './labos-agent.errors';

const KNOWN_CODES: LabosAgentChatErrorCode[] = [
  'VALIDATION_ERROR',
  'AGENT_NOT_ENABLED',
  'NEWS_NOT_FOUND',
  'RATE_LIMITED',
];

const apiUrl = (path: string) => `${process.env.DIRECTORY_API_URL}${path}`;

/** The C1 `context`: only the contract fields. The chip label stays in the browser. */
export function toChatContext(context: LabosAgentOpenContext | null | undefined): LabosAgentChatContext | undefined {
  if (!context) return undefined;
  if (context.page === 'news-story') return { page: 'news-story', newsUid: context.newsUid };
  return { page: 'home' };
}

/** Trims the message and checks the C1 limits before a request leaves the browser. */
export function validateChatMessage(raw: string): string {
  const message = raw.trim();
  if (message.length < 1 || message.length > LABOS_AGENT_MESSAGE_MAX) {
    throw new LabosAgentError(400, 'VALIDATION_ERROR', `Write 1 to ${LABOS_AGENT_MESSAGE_MAX} characters.`);
  }
  return message;
}

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length > 0) : [];

const sourceRefs = (v: unknown): LabosAgentSourceRef[] =>
  Array.isArray(v)
    ? v.filter(
        (r): r is LabosAgentSourceRef =>
          !!r && typeof r === 'object' && typeof r.title === 'string' && typeof r.type === 'string',
      )
    : [];

/** Reads a partial or full stream body into the response shape. Unknown or half-written fields drop out. */
export function normalizeChatBody(value: unknown): LabosAgentChatResponse {
  const body = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    steps: strings(body.steps),
    content: typeof body.content === 'string' ? body.content : '',
    sources: strings(body.sources),
    sourceRefs: sourceRefs(body.sourceRefs),
    followUpQuestions: strings(body.followUpQuestions),
    actions: Array.isArray(body.actions) ? body.actions : [],
    proposals: Array.isArray(body.proposals) ? body.proposals : [],
  };
}

async function toError(response: Response): Promise<LabosAgentError> {
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
  return new LabosAgentError(response.status, code, message, retryAfter);
}

/** C1: `POST /v1/labos-agent/chat`. Streams the chunked JSON body and returns the full body at the end. */
async function chat(
  request: LabosAgentChatRequest,
  { signal, onUpdate }: LabosAgentStreamOptions = {},
): Promise<LabosAgentChatResponse> {
  const body: LabosAgentChatRequest = { ...request, message: validateChatMessage(request.message) };

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

export const liveLabosAgentClient: LabosAgentClient = { chat, getAccess };

/** The client the panel uses: live C1, or the mock when it is selected (see `labos-agent.config.ts`). */
export function getLabosAgentClient(): LabosAgentClient {
  return isLabosAgentMock() ? mockLabosAgentClient : liveLabosAgentClient;
}
