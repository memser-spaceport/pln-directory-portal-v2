import { customFetch } from '@/utils/fetch-wrapper';

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

export async function approveMcpOAuth(body: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  state?: string;
  resource?: string;
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
