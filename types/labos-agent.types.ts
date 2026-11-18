/**
 * LabOS agent v0 (LAB-3272). Wire types follow the C1 contract
 * (`contracts/lab-3272-labos-agent-api.md` in the LabOS Team project files).
 */

/** The pages the agent knows in S1. S5 adds more values. */
export type LabosAgentPage = 'news-story' | 'home';

/** What the C1 request sends as `context`. */
export type LabosAgentChatContext = { page: 'news-story'; newsUid: string } | { page: 'home' };

/**
 * What a caller passes to `openAgent`. `label` is for the context chip in the panel only. The client never sends it.
 * S2–S5 add their own context shapes here.
 */
export type LabosAgentOpenContext =
  | { page: 'news-story'; newsUid: string; label?: string }
  | { page: 'home'; label?: string };

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

/** The full C1 body after the stream ends. `proposals` stays empty in S1. */
export interface LabosAgentChatResponse {
  steps: string[];
  content: string;
  sources: string[];
  sourceRefs: LabosAgentSourceRef[];
  followUpQuestions: string[];
  actions: unknown[];
  proposals: unknown[];
}

export type LabosAgentChatErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'AGENT_NOT_ENABLED'
  | 'NEWS_NOT_FOUND'
  | 'RATE_LIMITED'
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

/** The one seam between the panel and the C1 API. The real and the mock client both implement it. */
export interface LabosAgentClient {
  getAccess: () => Promise<LabosAgentAccess>;
  chat: (request: LabosAgentChatRequest, options?: LabosAgentStreamOptions) => Promise<LabosAgentChatResponse>;
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
  error?: { code: LabosAgentChatErrorCode; status: number; message: string };
  startedAt: number;
  endedAt?: number;
}

/** One chat: the C1 `threadId` and its turns. The store keeps one per context. */
export interface LabosAgentChat {
  threadId: string;
  turns: LabosAgentTurn[];
}
