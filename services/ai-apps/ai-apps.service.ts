import { customFetch } from '@/utils/fetch-wrapper';
import { logTimestampSortValue } from '@/services/ai-apps/ai-apps-logs.utils';

const AI_APPS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/ai-apps`;

/** Keep in sync with the status set the web-api emits (LAB-2101). */
export type AiAppStatus = 'DRAFT' | 'DEPLOYING' | 'READY' | 'ERROR';

export interface AiApp {
  uid: string;
  memberUid: string;
  appId: string;
  name: string;
  description: string;
  status: AiAppStatus;
  notes: string | null;
  url: string | null;
  httpUrl: string | null;
  host: string | null;
  port: number | null;
  deploymentId: string;
  /** Env var NAMES the app needs at runtime (draft/secrets flow). */
  requiredEnvVars: string[];
  /** NAMES the member already stored values for (values never leave the backend). */
  providedEnvVars: string[];
  /** Server-computed on the detail endpoint: requester is the creator or a directory admin. */
  canManage?: boolean;
  /** URL to the stored one-pager file (Markdown or HTML) in S3 (LAB-2101). Null/absent = no one-pager. */
  prd?: string | null;
  createdAt: string;
  updatedAt: string;
  member: {
    uid: string;
    name: string;
    /** Profile photo URL; null when the member has no photo (UI falls back to a generated avatar). */
    image: string | null;
  };
}

export interface DeployAiAppResult {
  app: AiApp | null;
  error: string | null;
}

/**
 * Member-triggered deploy of a draft app (or redeploy after updating secrets).
 * `secrets` maps env var names to the values entered on the page; the backend
 * forwards them straight to the sandbox runner's secret store (they are never
 * persisted in the directory DB). A 400 (e.g. missing required vars) surfaces
 * its message so the page can show it.
 */
export async function deployAiApp(uid: string, secrets: Record<string, string>): Promise<DeployAiAppResult> {
  const response = await customFetch(
    `${AI_APPS_API_URL}/${encodeURIComponent(uid)}/deploy`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.keys(secrets).length ? { secrets } : {}),
    },
    true,
  );

  if (!response) {
    return { app: null, error: 'Deploy failed. Please try again.' };
  }
  if (!response.ok) {
    let message = 'Deploy failed. Please try again.';
    try {
      const body = await response.json();
      if (typeof body?.message === 'string' && body.message) {
        message = body.message;
      }
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    return { app: null, error: message };
  }

  return { app: await response.json(), error: null };
}

/**
 * Server-side reachability probe of the app's public URL (one attempt per call).
 * The detail page polls this before mounting/remounting the iframe so the user
 * sees our own loading/error state instead of a raw gateway error page. Any
 * failure (network, 404, …) is treated as "not live yet".
 */
export async function checkAiAppLive(uid: string): Promise<boolean> {
  try {
    const response = await customFetch(`${AI_APPS_API_URL}/${encodeURIComponent(uid)}/live`, { method: 'GET' }, true);
    if (!response || !response.ok) {
      return false;
    }
    const body = await response.json();
    return body?.live === true;
  } catch {
    return false;
  }
}

export async function fetchAiApps(): Promise<AiApp[]> {
  const response = await customFetch(AI_APPS_API_URL, { method: 'GET' }, true);

  if (!response || !response.ok) {
    return [];
  }

  return response.json();
}

/**
 * Why discriminate: the manage menu must treat "you have no access" (fresh,
 * authoritative — hide the menu) differently from "the check didn't go through"
 * (transient — keep the menu, just disabled). A bare null can't express that.
 */
export type AiAppFetchErrorKind = 'forbidden' | 'not-found' | 'network';

export interface FetchAiAppResult {
  app: AiApp | null;
  errorKind: AiAppFetchErrorKind | null;
}

export async function fetchAiApp(uid: string): Promise<FetchAiAppResult> {
  const response = await customFetch(`${AI_APPS_API_URL}/${encodeURIComponent(uid)}`, { method: 'GET' }, true);

  if (!response) {
    return { app: null, errorKind: 'network' };
  }
  if (!response.ok) {
    const errorKind: AiAppFetchErrorKind =
      response.status === 403 ? 'forbidden' : response.status === 404 ? 'not-found' : 'network';
    return { app: null, errorKind };
  }

  return { app: await response.json(), errorKind: null };
}

/** The two log sources the platform produces: the image build (Kaniko) vs the running app pod. */
export type AiAppLogStream = 'build' | 'runtime';

/** One CloudWatch log line, proxied verbatim from the sandbox runner. */
export interface AiAppLogEvent {
  /** Epoch milliseconds per the contract; treated as unparseable-safe by the UI formatter. */
  timestamp: number;
  message: string;
}

/**
 * One scroll-step of a stream's log. `nextToken` present = more log remains
 * (feeds useInfiniteQuery's getNextPageParam); absent = end of stream.
 */
export interface AiAppLogsPage {
  events: AiAppLogEvent[];
  nextToken?: string;
}

/**
 * Typed failure for a logs page fetch, thrown (not returned) so React Query
 * owns the error state per page — an initial-load failure surfaces on the
 * query, a failed fetchNextPage keeps the already-loaded pages rendered.
 */
export class AiAppLogsError extends Error {
  constructor(public readonly errorKind: AiAppFetchErrorKind) {
    super(`ai-app-logs: ${errorKind}`);
    this.name = 'AiAppLogsError';
  }
}

/** Lines requested per scroll-step. Typical logs land in 1–3 pages. */
const AI_APP_LOGS_PAGE_SIZE = 500;
/**
 * CloudWatch can return empty pages WITH a nextToken over sparse windows, so
 * each scroll-step skips a few of those before giving up its turn. These
 * bounds end the step, not the log — a returned token lets the next step
 * (user keeps scrolling) resume where this one stopped.
 */
const AI_APP_LOGS_MAX_SKIPS = 5;
const AI_APP_LOGS_TIME_BUDGET_MS = 8_000;

/**
 * Server ordering is not documented, so display order is enforced per page:
 * DESCENDING by timestamp (stable, so equal/unparseable stamps keep arrival
 * order). The log table reads newest-first — the latest lines are why the
 * modal was opened — and scrolling down loads earlier history.
 * logTimestampSortValue does the comparing: the runner has been seen sending
 * string timestamps, and a numbers-only comparator silently no-ops on those.
 */
function sortLogEvents(events: AiAppLogEvent[]): AiAppLogEvent[] {
  return [...events].sort((a, b) => logTimestampSortValue(b.timestamp) - logTimestampSortValue(a.timestamp));
}

/**
 * Fetch ONE page of a stream's logs, resuming from `nextToken` when given.
 * A bounded follow-up loop exists only to skip CloudWatch's
 * empty-page-with-token responses inside a single step.
 *
 * Termination rules (unit-tested):
 * - first NON-EMPTY page → done; `nextToken` returned iff it advanced (more
 *   log remains).
 * - empty page with no token, or a token equal to the one we sent →
 *   end-of-stream, no nextToken (CloudWatch never nulls the token; a repeated
 *   token is the real end signal).
 * - skip/time budget exhausted while skipping empties → empty page WITH the
 *   last token, so the next scroll-step resumes instead of losing the cursor.
 * - AbortError is RETHROWN as-is — a cancelled fetch must not cache anything.
 *   Any other failure throws AiAppLogsError so the modal can discriminate
 *   forbidden/not-found from transient trouble.
 */
export async function fetchAiAppLogsPage(
  uid: string,
  stream: AiAppLogStream,
  opts: { signal?: AbortSignal; sinceMinutes?: number; nextToken?: string } = {},
): Promise<AiAppLogsPage> {
  const { signal, sinceMinutes } = opts;
  const startedAt = Date.now();
  let sentToken = opts.nextToken;

  for (let skip = 0; skip < AI_APP_LOGS_MAX_SKIPS; skip++) {
    // order=desc: the web-api assembles the newest-first view (the runner only
    // pages forward) — page 1 is the log's true tail and nextToken walks
    // EARLIER into history. Desc responses are allowlisted {events, nextToken}
    // with numeric timestamps.
    const params = new URLSearchParams({ order: 'desc', limit: String(AI_APP_LOGS_PAGE_SIZE) });
    if (sinceMinutes !== undefined) params.set('sinceMinutes', String(sinceMinutes));
    if (sentToken !== undefined) params.set('nextToken', sentToken);

    let response: Response | undefined;
    try {
      // Member-JWT routes (creator-or-directory-admin, enforced server-side).
      // The agent's deploy-token routes live at /logs/{stream} — not these.
      response = await customFetch(
        `${AI_APPS_API_URL}/${encodeURIComponent(uid)}/${stream}-logs?${params.toString()}`,
        { method: 'GET', signal },
        true,
      );
    } catch (error) {
      // Name check, not instanceof: fetch aborts reject with a DOMException,
      // which is not `instanceof Error` in browsers.
      if ((error as { name?: string } | null)?.name === 'AbortError') {
        throw error;
      }
      throw new AiAppLogsError('network');
    }

    // customFetch resolves undefined only on its logout/refresh-failure paths.
    if (!response) {
      throw new AiAppLogsError('network');
    }
    if (!response.ok) {
      throw new AiAppLogsError(
        response.status === 403 ? 'forbidden' : response.status === 404 ? 'not-found' : 'network',
      );
    }

    const body = await response.json().catch(() => null);
    const pageEvents: AiAppLogEvent[] = Array.isArray(body?.events)
      ? body.events.filter((e: unknown): e is AiAppLogEvent => typeof (e as AiAppLogEvent)?.message === 'string')
      : [];
    const nextToken: string | undefined = typeof body?.nextToken === 'string' ? body.nextToken : undefined;
    const tokenAdvanced = !!nextToken && nextToken !== sentToken;

    if (pageEvents.length > 0) {
      return { events: sortLogEvents(pageEvents), nextToken: tokenAdvanced ? nextToken : undefined };
    }

    if (!tokenAdvanced) {
      return { events: [] };
    }
    sentToken = nextToken;
    if (Date.now() - startedAt > AI_APP_LOGS_TIME_BUDGET_MS) {
      return { events: [], nextToken: sentToken };
    }
  }

  return { events: [], nextToken: sentToken };
}

export interface UpdateAiAppPatch {
  name?: string;
  description?: string;
  /** MD/HTML text; explicit null clears the stored one-pager. */
  prd?: string | null;
}

export interface UpdateAiAppResult {
  app: AiApp | null;
  error: string | null;
}

async function parseUpdateResponse(response: Response | undefined): Promise<UpdateAiAppResult> {
  if (!response) {
    return { app: null, error: 'Saving failed. Please try again.' };
  }
  if (!response.ok) {
    let message = 'Saving failed. Please try again.';
    if (response.status === 404) {
      message = 'This app no longer exists.';
    } else {
      try {
        const body = await response.json();
        if (typeof body?.message === 'string' && body.message) {
          message = body.message;
        }
      } catch {
        // Non-JSON error body — keep the generic message.
      }
    }
    return { app: null, error: message };
  }

  return { app: await response.json(), error: null };
}

/** Metadata-only edit (including clearing the one-pager with `prd: null`) — never triggers a redeploy. */
export async function updateAiApp(uid: string, patch: UpdateAiAppPatch): Promise<UpdateAiAppResult> {
  const response = await customFetch(
    `${AI_APPS_API_URL}/${encodeURIComponent(uid)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    },
    true,
  );

  return parseUpdateResponse(response);
}

export interface UpdateAiAppFileInput {
  name?: string;
  description?: string;
  /** The one-pager file itself — the backend derives `prd` from its contents. */
  file: File;
}

/**
 * Setting or replacing the one-pager goes through multipart, not JSON: the
 * backend wants the file itself (`-F file=@one-pager.md`), not its text
 * inlined as `prd`. Never set a Content-Type header here — the browser must
 * generate the multipart boundary itself (customFetch only adds Authorization).
 */
export async function updateAiAppFile(uid: string, input: UpdateAiAppFileInput): Promise<UpdateAiAppResult> {
  const formData = new FormData();
  if (input.name !== undefined) formData.append('name', input.name);
  if (input.description !== undefined) formData.append('description', input.description);
  formData.append('file', input.file);

  const response = await customFetch(
    `${AI_APPS_API_URL}/${encodeURIComponent(uid)}`,
    { method: 'PATCH', body: formData },
    true,
  );

  return parseUpdateResponse(response);
}

export interface DeleteAiAppResult {
  ok: boolean;
  error: string | null;
}

/** Removes the app for everyone, including its one-pager and stored secrets. 404 counts as success (already gone). */
export async function deleteAiApp(uid: string): Promise<DeleteAiAppResult> {
  const response = await customFetch(`${AI_APPS_API_URL}/${encodeURIComponent(uid)}`, { method: 'DELETE' }, true);

  if (!response) {
    return { ok: false, error: 'Deleting failed. Please try again.' };
  }
  if (!response.ok && response.status !== 404) {
    let message = 'Deleting failed. Please try again.';
    try {
      const body = await response.json();
      if (typeof body?.message === 'string' && body.message) {
        message = body.message;
      }
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    return { ok: false, error: message };
  }

  return { ok: true, error: null };
}

/** Single source of truth for "this app has a one-pager" — gates the badge, the viewer, and edit seeding. */
export function hasPrd(app: Pick<AiApp, 'prd'>): boolean {
  return typeof app.prd === 'string' && app.prd.trim().length > 0;
}

export interface FetchPrdContentResult {
  content: string | null;
  error: string | null;
}

/**
 * The `prd` field is a direct S3 URL; the bucket has no CORS policy, so it
 * can't be fetched from the browser. Routed through our own API so the fetch
 * happens server-side, with the URL validated there against the expected S3
 * host/prefix.
 */
export async function fetchAiAppPrdContent(prdUrl: string): Promise<FetchPrdContentResult> {
  try {
    const response = await fetch(`/api/ai-apps/prd?url=${encodeURIComponent(prdUrl)}`);
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      return { content: null, error: body?.error ?? 'One-pager could not be loaded' };
    }

    return { content: body?.content ?? '', error: null };
  } catch {
    return { content: null, error: 'One-pager could not be loaded' };
  }
}

export interface FetchPrdSizeResult {
  size: number | null;
  error: string | null;
}

/** HEAD-only variant of fetchAiAppPrdContent — used by the edit modal's existing-file preview card. */
export async function fetchAiAppPrdSize(prdUrl: string): Promise<FetchPrdSizeResult> {
  try {
    const response = await fetch(`/api/ai-apps/prd?url=${encodeURIComponent(prdUrl)}`, { method: 'HEAD' });
    if (!response.ok) {
      return { size: null, error: 'Could not determine file size' };
    }

    const contentLength = response.headers.get('content-length');
    return { size: contentLength ? Number(contentLength) : null, error: null };
  } catch {
    return { size: null, error: 'Could not determine file size' };
  }
}

export type ConnectStatus = 'pending' | 'approved' | 'denied' | 'expired';

export interface ConnectSession {
  sessionId: string;
  userCode: string;
  clientName: string | null;
  status: ConnectStatus;
  expiresAt: string;
}

/**
 * Connect-session display info for the LabOS approval page. Public (no token
 * required) and returns no secrets, so we use a plain fetch to avoid the
 * auth-wrapper's logout-on-missing-token side effect for not-yet-signed-in users.
 */
export async function fetchConnectSession(sessionId: string): Promise<ConnectSession | null> {
  const response = await fetch(`${AI_APPS_API_URL}/connect/${encodeURIComponent(sessionId)}`, { method: 'GET' });

  if (!response || !response.ok) {
    return null;
  }

  return response.json();
}

/** Approve a connect session (mints the agent's deploy token). Requires login + ai_apps.write. */
export async function approveConnectSession(sessionId: string): Promise<{ status: ConnectStatus } | null> {
  const response = await customFetch(
    `${AI_APPS_API_URL}/connect/${encodeURIComponent(sessionId)}/approve`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' } },
    true,
  );

  if (!response) {
    return null;
  }
  // 403 (no permission / no member) still returns a body we can surface as denied.
  if (response.status === 403) {
    return { status: 'denied' };
  }
  if (!response.ok) {
    return null;
  }

  return response.json();
}
