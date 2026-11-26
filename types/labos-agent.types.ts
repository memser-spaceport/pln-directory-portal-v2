/**
 * LabOS agent v0 (LAB-3272). Wire types follow the C1 contract
 * (`contracts/lab-3272-labos-agent-api.md` in the LabOS Team project files).
 */

/** The pages the agent knows. S3 adds `intro` (contract 8.1). S5 adds `member`, `team`, `job`, `profile` (contract 9.2). */
export type LabosAgentPage = 'news-story' | 'home' | 'intro' | 'member' | 'team' | 'job' | 'profile';

/** The member or team of an intro draft (contract 8.1). Lower case, as in `proposals`. */
export interface LabosAgentIntroTarget {
  type: 'member' | 'team';
  uid: string;
}

/** What the C1 request sends as `context`. */
export type LabosAgentChatContext =
  | { page: 'news-story'; newsUid: string }
  | { page: 'home' }
  | { page: 'intro'; introTarget: LabosAgentIntroTarget }
  /** S5 (contract 9.2): one id for each page, 1 to 64 characters. `job` with no `jobUid` is the job board. */
  | { page: 'member'; memberUid: string }
  | { page: 'team'; teamUid: string }
  | { page: 'job'; jobUid?: string }
  /** The member's own profile. No id: the backend reads the member from the session. */
  | { page: 'profile' };

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
  | { page: 'intro'; introTarget: LabosAgentIntroTarget; label?: string; entryPoint?: LabosAgentIntroEntryPoint }
  /**
   * S5 (LAB-3302): the page chips of the corner and Ctrl/⌘ J. `toChatContext` sends the page and its id
   * (contract 9.2). The label stays in the browser.
   */
  | { page: 'member'; memberUid: string; label?: string }
  | { page: 'team'; teamUid: string; label?: string }
  | { page: 'job'; jobUid?: string; label?: string }
  | { page: 'profile'; label?: string };

/** Every page an open context can name, the C1 values and the S5 client-only values. */
export type LabosAgentOpenPage = LabosAgentOpenContext['page'];

/** S6 (LAB-3318, contract 10.3): the pages a member can mention. `job` is the job board. */
export type LabosAgentMentionPage = 'home' | 'job' | 'profile';

/**
 * One item in the C1 `mentions` array (contract 10.3). Only `type` and `uid`, or `type` and `page`. The chip label
 * stays in the browser: the backend rejects an extra key.
 */
export type LabosAgentMention =
  | { type: 'member'; uid: string }
  | { type: 'team'; uid: string }
  | { type: 'news'; uid: string }
  | { type: 'page'; page: LabosAgentMentionPage };

export interface LabosAgentChatRequest {
  threadId: string;
  chatId: string;
  message: string;
  context?: LabosAgentChatContext;
  /** S6: 1 to 5 items, in the order of the chips. Absent when the member picked none. */
  mentions?: LabosAgentMention[];
  /** LAB-3362 (contract 11.1): the newest waiting intro card. Absent when no card waits. */
  introDraft?: LabosAgentChatIntroDraft;
  /** LAB-3457: `true` saves the finished turn in thread `threadId` (T1, T2). A stopped or failed turn is not saved. */
  persist?: boolean;
}

/** LAB-3362 (contract 11.1): the target of a waiting intro card and its current text (1 to 3500 characters). */
export interface LabosAgentChatIntroDraft {
  target: LabosAgentIntroTarget;
  text: string;
}

/** The C4 item types (contract 10.2). Pages are a frontend list (10.5). */
export type LabosAgentMentionSearchType = 'member' | 'team' | 'news';

/** C4 request: `GET /v1/labos-agent/mentions?q=&types=&limit=`. */
export interface LabosAgentMentionsQuery {
  /** 0 to 64 characters after trim. Empty gives the default list (10.2.3). */
  q: string;
  types?: LabosAgentMentionSearchType[];
  /** 1 to 10 for each type. The backend default is 5. */
  limit?: number;
}

/** C4 member row. No email, phone, handles, Telegram, office hours or bio. */
export interface LabosAgentMentionMember {
  type: 'member';
  uid: string;
  name: string;
  imageUrl: string | null;
  teamName: string | null;
  role: string | null;
}

/** C4 team row. `shortDescription` is cut to 140 characters. */
export interface LabosAgentMentionTeam {
  type: 'team';
  uid: string;
  name: string;
  logoUrl: string | null;
  shortDescription: string | null;
}

/** C4 news row. `eventDate` is ISO. */
export interface LabosAgentMentionNews {
  type: 'news';
  uid: string;
  title: string;
  teamUid: string;
  teamName: string;
  eventDate: string;
}

/** C4 response 200. Each key is always present. `q` is the trimmed query of this response. */
export interface LabosAgentMentionsResponse {
  q: string;
  members: LabosAgentMentionMember[];
  teams: LabosAgentMentionTeam[];
  news: LabosAgentMentionNews[];
}

/** The picker groups, in the order of S6-F6. */
export type LabosAgentPickerGroupKind = 'page' | 'news' | 'team' | 'member';

/**
 * One row of the @mention picker. `mention` is what C1 gets. A row with `restoresPage` is the current page after the
 * member removed its chip (contract 10.5): a pick turns the page chip back on and adds no mention.
 */
export interface LabosAgentPickerItem {
  /** The mention key (`member:<uid>`, `page:home`, ...). Unique in the picker. */
  key: string;
  kind: LabosAgentPickerGroupKind;
  /** The full name for the row and the chip. */
  label: string;
  /** The second line of the row: team and role, team name, or a page hint. */
  meta?: string;
  /** The short text that an `@` pick puts in the message (`@<name> `). */
  mentionName: string;
  imageUrl?: string | null;
  mention?: LabosAgentMention;
  restoresPage?: true;
}

/** A mention chip in the composer. `failed`: C1 gave a 404 for this item (S6-F17). */
export interface LabosAgentMentionChip {
  key: string;
  label: string;
  kind: LabosAgentPickerGroupKind;
  mention: LabosAgentMention;
  failed?: true;
}

export interface LabosAgentSourceRef {
  type: string;
  title: string;
  /** C1 (backend PR #3754): a LabOS path, for example `/?news=<uid>`. */
  directoryLink?: string;
  /** C1 (backend PR #3754): a web page. */
  externalUrl?: string;
  /** Older body and the mock: the news uid. */
  uid?: string;
  /** Older body and the mock: a web page. */
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
  /**
   * LAB-3297 V0-R4: optional counts in the C1 final chunk, for the `agent-answer-shown` event only. Absent when the
   * backend does not send them. The panel shows none of them.
   */
  toolCount?: number;
  usedWebSearch?: boolean;
  sourceCount?: number;
}

export type LabosAgentChatErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'AGENT_NOT_ENABLED'
  | 'NEWS_NOT_FOUND'
  /** C1, S3: `context.introTarget` does not exist (contract 8.5). */
  | 'INTRO_TARGET_NOT_FOUND'
  /** C1, S5: the page of `context` does not exist, or the member cannot see it (contract 9.3). */
  | 'MEMBER_NOT_FOUND'
  | 'TEAM_NOT_FOUND'
  | 'JOB_NOT_FOUND'
  | 'RATE_LIMITED'
  /** C2 only. */
  | 'ACTION_NOT_ALLOWED'
  | 'PROPOSAL_NOT_FOUND'
  | 'PROPOSAL_CLOSED'
  | 'PROPOSAL_EXPIRED'
  | 'ACTION_FAILED'
  /** LAB-3457: C1 (before the stream), T2, T3, C5: the thread is not the member's, or it was deleted. */
  | 'THREAD_NOT_FOUND'
  /** LAB-3457, C5 only. */
  | 'DRAFT_NOT_FOUND'
  | 'DRAFT_CLOSED'
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
  /** S6: C4, the @mention picker search. */
  searchMentions: (
    query: LabosAgentMentionsQuery,
    options?: { signal?: AbortSignal },
  ) => Promise<LabosAgentMentionsResponse>;
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
  error?: {
    code: LabosAgentChatErrorCode;
    status: number;
    message: string;
    /** S6: C1 gave this 404 for `mentions[mentionIndex]`, not for `context` (contract 10.4). */
    mentionIndex?: number;
  };
  /** S6: the mention chips of this message, in order. Retry sends them again. */
  mentions?: LabosAgentMentionChip[];
  /**
   * S6-F20: the first turn of the chat had no `context` and no `mentions`. The panel shows the fixed no-context line
   * above its answer.
   */
  readsNothing?: true;
  /** S6-F17: the panel put the chips of this failed turn back in the composer. It does that once only. */
  mentionsRestored?: true;
  /** S5-C29: the panel put the text of this failed turn back in the composer. It does that once only. */
  textRestored?: boolean;
  /**
   * LAB-3457: the thread the backend saved this turn in (C1 `persist: true` and a finished answer, or a turn read from
   * T2). Its intro drafts go to C5, not C3. Absent: not saved.
   */
  savedIn?: string;
  /** LAB-3457: read from T2, finished before this page visit. It has no duration: the toggle says "Worked · N steps". */
  restored?: true;
  startedAt: number;
  endedAt?: number;
}

/**
 * LAB-3297: where the member opened the agent. `job-apply` comes with S4 (not in v0). LAB-3457: `ai-search-page` is
 * the AI agent chat page, the agent's full-page surface.
 */
export type LabosAgentEntryPoint =
  | 'news-story'
  | 'intro-entry'
  | 'job-apply'
  | 'corner'
  | 'shortcut'
  | 'ai-search-page';

/** LAB-3457: where the agent runs. `panel` is the dock, `page` is AI agent chat (`/ai-search`). */
export type LabosAgentSurface = 'panel' | 'page';

/**
 * LAB-3297: one dock session, from the open of the panel to its close. For the agent events only. `conversationId`
 * is a random UUID made in the browser. It is not a server ID and holds no member data.
 */
export interface LabosAgentSession {
  conversationId: string;
  entryPoint: LabosAgentEntryPoint;
  /** The context of the open. A new context while the panel is open starts a new session. */
  context: LabosAgentOpenContext | null;
  /** The page chip was on at the open. */
  contextAttached: boolean;
  openedAt: number;
  /** Messages sent in this session, retries included. */
  turnCount: number;
  /** Action cards and draft cards that showed in this session. */
  actionCount: number;
  /** Cards that the member confirmed or sent in this session. */
  confirmedCount: number;
}

/** One chat: the C1 `threadId` and its turns. The store keeps one per context. */
export interface LabosAgentChat {
  threadId: string;
  turns: LabosAgentTurn[];
  /**
   * S5-C29: C1 gave a page 404 (`MEMBER_NOT_FOUND`, `TEAM_NOT_FOUND`, `JOB_NOT_FOUND`) in this chat. A new open of
   * this context then starts with the chip off, so a second send does not get the same 404.
   */
  pageUnreadable?: true;
}

/*
 * LAB-3457: one chat history for the panel and AI agent chat (backend contract `lab-3457-be-contract.md`, types in the
 * backend `libs/contracts/src/schema/labos-agent.ts`). Old AI search threads and agent threads are in one list.
 *   T1 GET    /v1/labos-agent/threads?page&limit
 *   T2 GET    /v1/labos-agent/threads/:threadId
 *   T3 DELETE /v1/labos-agent/threads/:threadId   (soft delete)
 *   C5 POST   /v1/labos-agent/drafts/confirm      (send or cancel a saved intro draft)
 */

/** Where a thread started. An old thread with no source is `ai-search`. */
export type LabosAgentThreadSource = 'ai-search' | 'agent';

/** One row of T1. `title` is never empty. `context`: the C1 context of the first agent turn. Times are ISO. */
export interface LabosAgentThreadListItem {
  threadId: string;
  title: string;
  source: LabosAgentThreadSource;
  context?: LabosAgentChatContext;
  createdAt: string;
  updatedAt: string;
}

/** T1 query. `page` starts at 1 (1 to 10000); `limit` is 1 to 50, 20 by default. */
export interface LabosAgentThreadsQuery {
  page?: number;
  limit?: number;
}

/** T1 response: newest `updatedAt` first. */
export interface LabosAgentThreadList {
  page: number;
  limit: number;
  total: number;
  items: LabosAgentThreadListItem[];
}

/** A saved action card's state. An `open` card past `expiresAt` comes as `expired`. Only `open` goes to C2. */
export type LabosAgentStoredProposalStatus = 'open' | 'done' | 'cancelled' | 'failed' | 'expired';

/** A saved action card: the C1 proposal and its state. `summary`: the C2 summary after `done` or `cancelled`. */
export type LabosAgentStoredProposal = LabosAgentProposal & {
  status: LabosAgentStoredProposalStatus;
  summary?: string;
};

/** A saved intro draft card's state. Only `open` goes to C5. */
export type LabosAgentStoredDraftStatus = 'open' | 'sent' | 'cancelled';

/** A saved intro draft card: the C1 draft and its state. After `sent`, `text` is the text that went. */
export type LabosAgentStoredDraft = LabosAgentDraft & {
  status: LabosAgentStoredDraftStatus;
  introRequestUid?: string;
  sentAt?: string;
};

interface LabosAgentThreadTurnBase {
  /** The C1 `chatId` (the AI search `questionId`). */
  chatId: string;
  question: string;
  content: string;
  sources: string[];
  sourceRefs: LabosAgentSourceRef[];
  followUpQuestions: string[];
  /** AI search directory result cards. */
  actions: unknown[];
  /** ISO, or null for an old turn with no time. */
  createdAt: string | null;
}

/** An old AI search turn: shown as saved, with no steps and no cards. */
export interface LabosAgentLegacyThreadTurn extends LabosAgentThreadTurnBase {
  kind: 'ai-search';
}

/** A saved agent turn: what the member saw when it finished. */
export interface LabosAgentSavedThreadTurn extends LabosAgentThreadTurnBase {
  kind: 'agent';
  steps: string[];
  context?: LabosAgentChatContext;
  mentions?: LabosAgentMention[];
  toolCount?: number;
  usedWebSearch?: boolean;
  sourceCount?: number;
  proposals: LabosAgentStoredProposal[];
  drafts: LabosAgentStoredDraft[];
}

export type LabosAgentThreadTurn = LabosAgentLegacyThreadTurn | LabosAgentSavedThreadTurn;

/** T2 response: the thread and its turns, oldest first. */
export interface LabosAgentThread extends LabosAgentThreadListItem {
  turns: LabosAgentThreadTurn[];
}

/** C5 request. `text` (20 to 3500 characters after trim) goes with `send` only. The target is the saved one. */
export interface LabosAgentDraftConfirmRequest {
  threadId: string;
  draftId: string;
  decision: 'send' | 'cancel';
  text?: string;
}

/** C5 response: 200. */
export interface LabosAgentDraftConfirmResponse {
  draftId: string;
  status: 'sent' | 'cancelled';
  introRequestUid?: string;
}

/** The history seam (T1, T2, T3, C5). The real and the mock client both implement it. */
export interface LabosAgentHistoryClient {
  listThreads: (query?: LabosAgentThreadsQuery) => Promise<LabosAgentThreadList>;
  getThread: (threadId: string) => Promise<LabosAgentThread>;
  deleteThread: (threadId: string) => Promise<void>;
  confirmDraft: (request: LabosAgentDraftConfirmRequest) => Promise<LabosAgentDraftConfirmResponse>;
}
