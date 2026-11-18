/**
 * LabOS agent v0 (LAB-3272). Wire types follow the C1 contract
 * (`contracts/lab-3272-labos-agent-api.md` in the LabOS Team project files).
 */

/** The pages the agent knows. S3 adds `intro` (contract 8.1). S5 adds more values. */
export type LabosAgentPage = 'news-story' | 'home' | 'intro';

/** The member or team of an intro draft (contract 8.1). Lower case, as in `proposals`. */
export interface LabosAgentIntroTarget {
  type: 'member' | 'team';
  uid: string;
}

/** What the C1 request sends as `context`. */
export type LabosAgentChatContext =
  | { page: 'news-story'; newsUid: string }
  | { page: 'home' }
  | { page: 'intro'; introTarget: LabosAgentIntroTarget };

/** Where "Ask the agent" sits for an intro. The same values as the intro request events (LAB-3296). */
export type LabosAgentIntroEntryPoint = 'member-header' | 'team-header' | 'suggested-tab';

/**
 * What a caller passes to `openAgent`. `label` is for the context chip in the panel only. The client never sends it.
 * S2–S5 add their own context shapes here.
 */
export type LabosAgentOpenContext =
  | { page: 'news-story'; newsUid: string; label?: string }
  | { page: 'home'; label?: string }
  /** S3: `entryPoint` is for the intro events only. The client never sends it. */
  | { page: 'intro'; introTarget: LabosAgentIntroTarget; label?: string; entryPoint?: LabosAgentIntroEntryPoint };

export interface LabosAgentChatRequest {
  threadId: string;
  chatId: string;
  message: string;
  context?: LabosAgentChatContext;
}

export interface LabosAgentSourceRef {
  type: string;
  uid?: string;
  title: string;
  url?: string;
}

/** The 4 propose-only tools of S2 (contract section 3). Only C2 runs them. */
export type LabosAgentProposalTool = 'update_my_profile' | 'add_experience' | 'update_experience' | 'update_team';

export type LabosAgentChangeValue = string | number | boolean | string[] | null;

/** One field of a proposed edit, with its old and new value, for the action card. */
export interface LabosAgentProposalChange {
  field: string;
  label: string;
  oldValue: LabosAgentChangeValue;
  newValue: LabosAgentChangeValue;
}

/** An action proposal in the C1 stream (contract section 4). One proposal is one edit and one card. */
export interface LabosAgentProposal {
  proposalId: string;
  tool: LabosAgentProposalTool;
  title: string;
  targetType: 'member' | 'team';
  targetUid?: string;
  changes: LabosAgentProposalChange[];
  expiresAt?: string;
}

export type LabosAgentDecision = 'confirm' | 'cancel';

/** C2 request: `POST /v1/labos-agent/actions/confirm`. The client never sends the tool arguments. */
export interface LabosAgentConfirmRequest {
  proposalId: string;
  decision: LabosAgentDecision;
}

/** C2 response: 200. */
export interface LabosAgentConfirmResponse {
  proposalId: string;
  status: 'done' | 'cancelled';
  tool?: LabosAgentProposalTool;
  summary: string;
  result?: unknown;
}

/**
 * The stored proposal status in a C2 409 `PROPOSAL_CLOSED` body (backend PR #3741). Absent on an older backend.
 * `failed`: an earlier Confirm ran and the write failed. The backend can also send `pending`; the client treats
 * `pending` and any unknown value as absent.
 */
export type LabosAgentClosedStatus = 'done' | 'cancelled' | 'failed';

/** A C2 error body. `status` comes only with a 409 `PROPOSAL_CLOSED`, as sent; the client keeps only the known values. */
export interface LabosAgentConfirmErrorBody {
  statusCode?: number;
  code: LabosAgentChatErrorCode;
  message?: string;
  status?: LabosAgentClosedStatus | 'pending' | string;
}

/**
 * An intro draft in the C1 stream (contract 8.2). The member edits it and presses Send. The frontend sends it with
 * C3 (`POST /v1/intro-requests`). The agent never sends. `draftId` is a client key only; no API reads it.
 */
export interface LabosAgentDraft {
  draftId: string;
  kind: 'intro';
  /** `uid` and `name` come from the database, not from the model. */
  target: LabosAgentIntroTarget & { name: string };
  text: string;
  minLength: number;
  maxLength: number;
  /** Always `agent`. For the events only. It never goes in the C3 body. */
  source: 'agent';
}

/** The full C1 body after the stream ends. `proposals` holds the S2 action proposals, `drafts` the S3 intro drafts. */
export interface LabosAgentChatResponse {
  steps: string[];
  content: string;
  sources: string[];
  sourceRefs: LabosAgentSourceRef[];
  followUpQuestions: string[];
  actions: unknown[];
  proposals: LabosAgentProposal[];
  drafts: LabosAgentDraft[];
}

export type LabosAgentChatErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'AGENT_NOT_ENABLED'
  | 'NEWS_NOT_FOUND'
  /** C1, S3: `context.introTarget` does not exist (contract 8.5). */
  | 'INTRO_TARGET_NOT_FOUND'
  | 'RATE_LIMITED'
  /** C2 only. */
  | 'ACTION_NOT_ALLOWED'
  | 'PROPOSAL_NOT_FOUND'
  | 'PROPOSAL_CLOSED'
  | 'PROPOSAL_EXPIRED'
  | 'ACTION_FAILED'
  /** The connection broke after the stream started, or the request never reached the server. */
  | 'STREAM_FAILED'
  | 'UNKNOWN';

export interface LabosAgentAccess {
  enabled: boolean;
}

export interface LabosAgentStreamOptions {
  signal?: AbortSignal;
  /** Called with the partial body each time a chunk arrives. */
  onUpdate?: (partial: Partial<LabosAgentChatResponse>) => void;
}

/** The one seam between the panel and the agent API (C1, C2). The real and the mock client both implement it. */
export interface LabosAgentClient {
  getAccess: () => Promise<LabosAgentAccess>;
  chat: (request: LabosAgentChatRequest, options?: LabosAgentStreamOptions) => Promise<LabosAgentChatResponse>;
  confirmAction: (request: LabosAgentConfirmRequest) => Promise<LabosAgentConfirmResponse>;
}

/**
 * The state of one action card. `pending`: Confirm and Cancel show. `saving`: C2 runs. `done`, `cancelled`,
 * `forbidden` and `error` without `canRetry` are final: the card has no buttons. `error` with `canRetry` shows Retry.
 */
export type LabosAgentCardStatus = 'pending' | 'saving' | 'done' | 'cancelled' | 'forbidden' | 'error';

export interface LabosAgentCardState {
  status: LabosAgentCardStatus;
  /** `saving` only: the decision in flight. */
  decision?: LabosAgentDecision;
  /** The C2 `summary` after a confirm. */
  summary?: string;
  /** The text the card shows for `forbidden` and `error`. */
  message?: string;
  /** `error` only: true when Retry can help (no answer, 401 or a server error). */
  canRetry?: boolean;
}

/**
 * The state of one intro draft card (S3). `open`: the field, Send and Cancel show. `sending`: C3 runs. `sent` and
 * `cancelled` are final: the card is closed. `forbidden` (403): the message shows and Send is gone. `error`: the
 * message shows, and the field and Send stay.
 */
export type LabosAgentDraftStatus = 'open' | 'sending' | 'sent' | 'cancelled' | 'forbidden' | 'error';

export interface LabosAgentDraftCardState {
  status: LabosAgentDraftStatus;
  /** The member's edited text. It stays after an error. */
  text: string;
  /** The text the card shows for `forbidden` and `error`. */
  message?: string;
}

export type LabosAgentTurnStatus = 'working' | 'done' | 'stopped' | 'stalled' | 'error';

/** One message and the agent's answer to it. */
export interface LabosAgentTurn {
  /** The C1 `chatId` of this turn. */
  id: string;
  message: string;
  status: LabosAgentTurnStatus;
  steps: string[];
  content: string;
  sources: string[];
  sourceRefs: LabosAgentSourceRef[];
  followUpQuestions: string[];
  /** The action proposals of the answer. One card each. */
  proposals: LabosAgentProposal[];
  /** Card state by `proposalId`. No entry: `pending`. */
  cards: Record<string, LabosAgentCardState>;
  /** The intro drafts of the answer (S3). One draft card each. */
  drafts: LabosAgentDraft[];
  /** Draft card state by `draftId`. No entry: `open` with the draft text. */
  draftCards: Record<string, LabosAgentDraftCardState>;
  error?: { code: LabosAgentChatErrorCode; status: number; message: string };
  startedAt: number;
  endedAt?: number;
}

/** One chat: the C1 `threadId` and its turns. The store keeps one per context. */
export interface LabosAgentChat {
  threadId: string;
  turns: LabosAgentTurn[];
}
