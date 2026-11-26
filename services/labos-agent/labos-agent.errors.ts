import type { LabosAgentChatErrorCode, LabosAgentClosedStatus } from '@/types/labos-agent.types';

/** One typed error for every C1 failure. `status` 0 means no response. */
export class LabosAgentError extends Error {
  readonly status: number;
  readonly code: LabosAgentChatErrorCode;
  readonly retryAfterSeconds?: number;
  /** C2 409 `PROPOSAL_CLOSED` only: the stored proposal status. Undefined when the body has none. */
  readonly closedStatus?: LabosAgentClosedStatus;
  /** C1 404 only (S6, contract 10.4): the 0-based index of the failed item in `mentions`. Absent for `context`. */
  readonly mentionIndex?: number;
  /** LAB-3457, C5 409 `DRAFT_CLOSED` only: how the draft closed. */
  readonly draftStatus?: 'sent' | 'cancelled';
  /** LAB-3457: the `message` of the error body as sent, when it had one (C5 passes C3's own messages through). */
  bodyMessage?: string;

  constructor(
    status: number,
    code: LabosAgentChatErrorCode,
    message: string,
    retryAfterSeconds?: number,
    closedStatus?: LabosAgentClosedStatus,
    mentionIndex?: number,
    draftStatus?: 'sent' | 'cancelled',
  ) {
    super(message);
    this.name = 'LabosAgentError';
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
    this.closedStatus = closedStatus;
    this.mentionIndex = mentionIndex;
    this.draftStatus = draftStatus;
  }
}

/** The text the backend appends to `content` when the model stalls (husky-ai.service `HUSKY_SEARCH_STALLED_NOTICE`). */
export const LABOS_AGENT_STALL_MARKER = 'The answer was cut short because the AI provider stopped responding';

export const isStalledAnswer = (content: string) => content.includes(LABOS_AGENT_STALL_MARKER);
