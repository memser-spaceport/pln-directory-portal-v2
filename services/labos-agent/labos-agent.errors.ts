import type { LabosAgentChatErrorCode, LabosAgentClosedStatus } from '@/types/labos-agent.types';

/** One typed error for every C1 failure. `status` 0 means no response. */
export class LabosAgentError extends Error {
  readonly status: number;
  readonly code: LabosAgentChatErrorCode;
  readonly retryAfterSeconds?: number;
  /** C2 409 `PROPOSAL_CLOSED` only: the stored proposal status. Undefined when the body has none. */
  readonly closedStatus?: LabosAgentClosedStatus;

  constructor(
    status: number,
    code: LabosAgentChatErrorCode,
    message: string,
    retryAfterSeconds?: number,
    closedStatus?: LabosAgentClosedStatus,
  ) {
    super(message);
    this.name = 'LabosAgentError';
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
    this.closedStatus = closedStatus;
  }
}

/** The text the backend appends to `content` when the model stalls (husky-ai.service `HUSKY_SEARCH_STALLED_NOTICE`). */
export const LABOS_AGENT_STALL_MARKER = 'The answer was cut short because the AI provider stopped responding';

export const isStalledAnswer = (content: string) => content.includes(LABOS_AGENT_STALL_MARKER);
