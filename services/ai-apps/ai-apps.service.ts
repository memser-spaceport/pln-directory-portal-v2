import { customFetch } from '@/utils/fetch-wrapper';

const AI_APPS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/ai-apps`;

export interface AiApp {
  uid: string;
  memberUid: string;
  appId: string;
  name: string;
  description: string;
  status: string;
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

export async function fetchAiApp(uid: string): Promise<AiApp | null> {
  const response = await customFetch(`${AI_APPS_API_URL}/${uid}`, { method: 'GET' }, true);

  if (!response || !response.ok) {
    return null;
  }

  return response.json();
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
