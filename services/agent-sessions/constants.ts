export enum AgentSessionsQueryKeys {
  LIST = 'agent-sessions-list',
  DETAIL = 'agent-session-detail',
  PROGRESS = 'agent-session-progress',
  REPOSITORIES = 'agent-session-repositories',
}

export const TERMINAL_SESSION_STATUSES = new Set(['ready', 'failed', 'cancelled', 'merged', 'closed', 'deleted']);
