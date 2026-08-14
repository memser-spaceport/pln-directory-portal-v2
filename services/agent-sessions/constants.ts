export enum AgentSessionsQueryKeys {
  LIST = 'agent-sessions-list',
  DETAIL = 'agent-session-detail',
  PROGRESS = 'agent-session-progress',
  REPOSITORIES = 'agent-session-repositories',
  MESSAGES = 'agent-session-messages',
}

export const TERMINAL_SESSION_STATUSES = new Set(['ready', 'failed', 'cancelled', 'merged', 'closed', 'deleted']);

/** The agent has asked something and will not proceed until an admin answers. */
export const WAITING_FOR_INPUT_STATUS = 'waiting_for_input';

/**
 * A denylist, deliberately — not an allowlist.
 *
 * `status` messages are step narration ("Cloning repository", "Running: git diff
 * --check") that already renders in the Progress panel, so the chat hides them.
 * Everything else renders, including message types that don't exist yet: the safe
 * failure mode is an unexpected bubble appearing, never an agent message silently
 * vanishing from the conversation.
 */
export const HIDDEN_MESSAGE_TYPES = new Set(['status']);
