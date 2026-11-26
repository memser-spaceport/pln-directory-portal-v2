export enum LabosAgentQueryKeys {
  ACCESS = 'labos-agent-access',
  /** LAB-3457: T1, the history list. */
  THREADS = 'labos-agent-threads',
  /** LAB-3457: T2, one thread with its turns. */
  THREAD = 'labos-agent-thread',
}

export const LABOS_AGENT_ENDPOINTS = {
  chat: '/v1/labos-agent/chat',
  access: '/v1/labos-agent/access',
  confirm: '/v1/labos-agent/actions/confirm',
  mentions: '/v1/labos-agent/mentions',
  /** LAB-3457: T1 (GET); `threads/:threadId` is T2 (GET) and T3 (DELETE). */
  threads: '/v1/labos-agent/threads',
  /** LAB-3457: C5. */
  draftConfirm: '/v1/labos-agent/drafts/confirm',
} as const;

/** LAB-3457: the T1 page size of the history rail (the backend allows 1 to 50). */
export const LABOS_AGENT_THREADS_PAGE_SIZE = 50;

/** C1 request limits. */
export const LABOS_AGENT_MESSAGE_MAX = 2000;

/** S6 (contract 10.3): at most 5 mentions in one C1 message. */
export const LABOS_AGENT_MAX_MENTIONS = 5;

/** S6-F8: the picker calls C4 this long after the last key (the Forum mention debounce). */
export const LABOS_AGENT_MENTION_DEBOUNCE_MS = 300;

/** S6-F1: the `@` query is up to 30 characters (the prototype rule). C4 allows 64. */
export const LABOS_AGENT_MENTION_QUERY_MAX = 30;

/** S6 picker texts. Fixed by LAB-3318 and contract 10.9. */
export const LABOS_AGENT_MENTION_TEXT = {
  addTooltip: 'Add a page, story, team or member (or type @)',
  hintEmpty: 'Mention a page, story, team or member',
  hintMatching: (query: string) => `Matching "${query}"`,
  searchFailed: 'Search is not available. Try again.',
  limitReached: `You can add up to 5 items.`,
  placeholderIntro: 'Ask, request an intro, or type @ to add context',
  placeholderOther: 'Ask, tell it what to do, or type @ to add context',
  /** LAB-3318 (D7): below 768px wide, for all members, so the empty composer keeps one line at 390px. */
  placeholderNarrow: 'Ask, or type @ to add context',
  noContext: "I'm not reading any page right now. Add one with + or type @ to point me at a story, team or member.",
  mentionNotFound: (label: string) => `The agent cannot read ${label}. Remove it and ask again.`,
  /** Oleg, #labos-team: with the ellipsis character (U+2026). */
  searching: 'Searching…',
  mentionNotFoundUnknown: 'The agent cannot read one of the items you added. Remove it and ask again.',
} as const;

/**
 * The local feature gate. On since D1 landed (LAB-3344, option A: staff and the pilot list). The backend gate
 * (`GET /v1/labos-agent/access`, the `labos_agent_pilot` policy) still decides for each member.
 * `localStorage['labos-agent'] = 'off'` turns it off in one browser.
 */
export const LABOS_AGENT_ENABLED_BY_DEFAULT = true;

/** The panel talks to the live C1 endpoint. `true` makes the mock the default again. */
export const LABOS_AGENT_MOCK_BY_DEFAULT = false;

/** localStorage key. The value `on` turns the gate on in this browser, for development and QA. */
export const LABOS_AGENT_GATE_STORAGE_KEY = 'labos-agent';

/** localStorage key. The value `mock` sends chat to the mock client in this browser, for development and QA. */
export const LABOS_AGENT_API_STORAGE_KEY = 'labos-agent-api';

/** LAB-3429 texts, verbatim from the prototype `prototypes/entries/agent` (design LAB-3389, update of 2026-11-25). */
export const LABOS_AGENT_HANDOFF_TEXT = {
  action: 'AI agent chat',
  actionAria: 'Open in AI agent chat (new tab)',
  tooltip: 'Open this chat in AI agent chat (new tab)',
  tooltipDisabled: 'Ask something first, then continue in AI agent chat',
  error: 'Couldn’t open this chat in AI agent chat.',
  retry: 'Retry',
  dismiss: 'Dismiss',
  historyTrigger: 'Agent history',
  historyTitle: 'History',
  historyLink: 'All AI agent chats',
  historyLinkAria: 'All AI agent chats (opens in a new tab)',
  resizeAria: 'Resize the agent panel',
  resizeTitle: 'Drag to resize · double-click to reset',
} as const;

/** LAB-3429 Decision 4: the page chip. `Context` and `Not in context` sit before the page name. */
export const LABOS_AGENT_CONTEXT_TEXT = {
  attached: 'Context',
  removed: 'Not in context',
  locked: 'Can’t read this page',
  lockedTitle:
    'The agent can’t read this page: settings and notifications stay private. Ask anyway, or add something with +.',
  pickerTitle: 'Add context',
} as const;

/**
 * LAB-3457: AI agent chat (`/ai-search`) runs on the agent for members inside the gate. Texts verbatim from Polina's
 * prototype `prototypes/entries/ai-search-page` (develop a68f8a668, PR #3735 "AI search merged with AI agent").
 */
export const LABOS_AGENT_PAGE_TEXT = {
  placeholder: 'Ask, request an intro, or type @',
  line: 'Ask about the network, or make a request.',
  tryAsking: 'Try asking',
  makeRequest: 'Make a request',
  composerAria: 'Message the agent',
  chipsAria: 'What the agent reads',
} as const;

/** LAB-3457: the new chat shows 3 questions and up to 3 requests (prototype `ai-search-page`, two columns of three). */
export const LABOS_AGENT_PAGE_PROMPT_COUNT = 3;

/** LAB-3457: the store key of a page chat. One chat per thread. */
export const labosAgentPageChatKey = (threadId: string) => `ai-search:${threadId}`;
