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
  url: string;
  httpUrl: string;
  host: string;
  port: number;
  deploymentId: string;
  createdAt: string;
  updatedAt: string;
  member: {
    uid: string;
    name: string;
  };
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
    { method: 'POST' },
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
