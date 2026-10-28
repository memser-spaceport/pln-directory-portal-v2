import { customFetch } from '@/utils/fetch-wrapper';
import type { McpAccessRequest, McpConnection, McpLevels } from './types';

const MCP_API_URL = `${process.env.DIRECTORY_API_URL}/v1/mcp`;

export type McpAuthorization = {
  uid: string;
  clientName: string;
  connectedAt: string;
  lastUsedAt: string | null;
};

export async function fetchMcpAuthorizations(): Promise<McpAuthorization[]> {
  const response = await customFetch(`${MCP_API_URL}/authorizations`, { method: 'GET' }, true);
  if (!response || !response.ok) {
    return [];
  }
  const data = await response.json();
  return data.items ?? [];
}

export async function revokeMcpAuthorization(uid: string): Promise<boolean> {
  const response = await customFetch(
    `${MCP_API_URL}/authorizations/${encodeURIComponent(uid)}`,
    { method: 'DELETE' },
    true,
  );
  return !!response?.ok;
}

/** Settings → MCP connections (LAB-2995). Throws on failure so the page can show its error state. */
export async function fetchMcpConnections(): Promise<McpConnection[]> {
  const response = await customFetch(`${MCP_API_URL}/authorizations`, { method: 'GET' }, true);
  if (!response || !response.ok) {
    throw new Error('Failed to load MCP connections');
  }
  const data = await response.json();
  // An API without scope levels (before LAB-2996) returns neither field: treat it as no editable scopes.
  return (data.items ?? []).map((item: Partial<McpConnection> & Pick<McpConnection, 'uid' | 'clientName'>) => ({
    ...item,
    connectedAt: item.connectedAt ?? new Date(0).toISOString(),
    lastUsedAt: item.lastUsedAt ?? null,
    status: item.status ?? 'active',
    scopes: item.scopes ?? [],
  }));
}

/** Saves all of a connection's scope levels in one call; returns the updated connection. */
export async function updateMcpScopes(
  uid: string,
  body: { levels: McpLevels; requestUid?: string },
): Promise<McpConnection> {
  const response = await customFetch(
    `${MCP_API_URL}/authorizations/${encodeURIComponent(uid)}/scopes`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    true,
  );
  if (!response || !response.ok) {
    throw new Error(`Failed to save MCP permissions (${response?.status ?? 'network'})`);
  }
  return response.json();
}

/** A refused agent call the member can allow. `null` when it isn't the member's or doesn't exist. */
export async function fetchMcpAccessRequest(uid: string): Promise<McpAccessRequest | null> {
  const response = await customFetch(
    `${MCP_API_URL}/access-requests/${encodeURIComponent(uid)}`,
    { method: 'GET' },
    true,
  );
  if (response?.status === 404) {
    return null;
  }
  if (!response || !response.ok) {
    throw new Error('Failed to load MCP access request');
  }
  return response.json();
}

export type McpOAuthClientInfo = {
  client_id: string;
  client_name: string;
  redirect_host: string | null;
  redirect_uri_registered: boolean;
};

export async function fetchMcpOAuthClient(
  clientId: string,
  redirectUri: string,
): Promise<McpOAuthClientInfo | { error: 'not_found' | 'failed' }> {
  try {
    const query = new URLSearchParams({ redirect_uri: redirectUri });
    const response = await fetch(
      `${process.env.DIRECTORY_API_URL}/oauth/clients/${encodeURIComponent(clientId)}?${query.toString()}`,
      { cache: 'no-store' },
    );
    if (response.status === 404) {
      return { error: 'not_found' };
    }
    if (!response.ok) {
      return { error: 'failed' };
    }
    const data = (await response.json()) as McpOAuthClientInfo;
    if (typeof data?.client_name !== 'string' || typeof data.redirect_uri_registered !== 'boolean') {
      return { error: 'failed' };
    }
    return data;
  } catch {
    return { error: 'failed' };
  }
}

export async function approveMcpOAuth(body: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  state?: string;
  resource?: string;
  /** The member ticked "Make changes for me". False = read-only grant. */
  allowChanges: boolean;
}): Promise<{ redirectUrl: string } | { error: 'forbidden' | 'failed' }> {
  const response = await customFetch(
    `${MCP_API_URL}/oauth/approve`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    true,
  );
  if (!response) {
    return { error: 'failed' };
  }
  if (response.status === 403) {
    return { error: 'forbidden' };
  }
  if (!response.ok) {
    return { error: 'failed' };
  }
  return response.json();
}
