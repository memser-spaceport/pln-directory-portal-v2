import { customFetch } from '@/utils/fetch-wrapper';

const AGENT_SESSIONS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/agent-sessions`;

export interface AgentSession {
  id: string;
  repository_key: string;
  repository_url: string;
  base_branch: string;
  working_branch: string | null;
  prompt: string;
  status: string;
  create_feature_environment: boolean;
  kubernetes_namespace: string | null;
  kubernetes_job_name: string | null;
  commit_sha: string | null;
  pull_request_number: number | null;
  pull_request_url: string | null;
  feature_environment_name: string | null;
  feature_environment_url: string | null;
  feature_environment_status: string | null;
  error_code: string | null;
  error_message: string | null;
  requested_by: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface AgentSessionRepository {
  key: string;
  displayName: string;
  defaultBranch: string;
  enabled: boolean;
}

export interface AgentSessionProgressStep {
  key: string;
  eventType: string;
  reached: boolean;
  status: string;
  message: string | null;
  metadata: Record<string, unknown>;
  createdAt: string | null;
}

export interface AgentSessionProgress {
  taskId: string;
  status: string;
  errorMessage: string | null;
  terminal: {
    eventType: string;
    status: string;
    message: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
  } | null;
  steps: AgentSessionProgressStep[];
}

export interface CreateAgentSessionInput {
  repository: string;
  baseBranch?: string;
  prompt: string;
  createFeatureEnvironment?: boolean;
}

async function parseJson<T>(response: Response | undefined, fallbackMessage: string): Promise<T> {
  if (!response) {
    throw new Error(fallbackMessage);
  }
  if (!response.ok) {
    let detail = fallbackMessage;
    try {
      const body = await response.json();
      detail = body?.message || body?.error || detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(typeof detail === 'string' ? detail : fallbackMessage);
  }
  return response.json() as Promise<T>;
}

export async function fetchAgentSessions(): Promise<AgentSession[]> {
  const response = await customFetch(`${AGENT_SESSIONS_API_URL}?limit=100`, { method: 'GET' }, true);
  const data = await parseJson<{ items: AgentSession[] }>(response, 'Failed to load agent sessions');
  return data.items ?? [];
}

export async function fetchAgentSession(id: string): Promise<AgentSession> {
  const response = await customFetch(`${AGENT_SESSIONS_API_URL}/${encodeURIComponent(id)}`, { method: 'GET' }, true);
  return parseJson<AgentSession>(response, 'Failed to load agent session');
}

export async function fetchAgentSessionProgress(id: string): Promise<AgentSessionProgress> {
  const response = await customFetch(
    `${AGENT_SESSIONS_API_URL}/${encodeURIComponent(id)}/progress`,
    { method: 'GET' },
    true,
  );
  return parseJson<AgentSessionProgress>(response, 'Failed to load session progress');
}

export async function fetchAgentSessionRepositories(): Promise<AgentSessionRepository[]> {
  const response = await customFetch(`${AGENT_SESSIONS_API_URL}/repositories`, { method: 'GET' }, true);
  const data = await parseJson<{ items: AgentSessionRepository[] }>(response, 'Failed to load repositories');
  return data.items ?? [];
}

export async function createAgentSession(input: CreateAgentSessionInput): Promise<AgentSession> {
  const response = await customFetch(
    AGENT_SESSIONS_API_URL,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    true,
  );
  return parseJson<AgentSession>(response, 'Failed to create agent session');
}
