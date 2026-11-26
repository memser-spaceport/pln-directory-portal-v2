import {
  AI_SEARCH_HISTORY_PARAM,
  AI_SEARCH_PENDING_QUESTIONS_KEY_PREFIX,
} from '@/components/constants/aiSearchHandoff';
import type { LabosAgentOpenContext, LabosAgentTurn } from '@/types/labos-agent.types';
import { getUniqueId } from '@/utils/common.utils';
import { PAGE_ROUTES } from '@/utils/constants';
import { customFetch } from '@/utils/fetch-wrapper';

/**
 * LAB-3429 Decision 1: "AI agent chat" in the agent header. The press copies the chat's questions into a NEW AI agent
 * chat thread (`/v1/husky/threads`, the AI Search threads) and opens it in a new tab, where AI agent chat answers them
 * again. The agent chat stays as it is; the two histories stay separate. Only the questions travel: no answers,
 * cards or steps.
 *
 * Scope (t1, 2026-11-26, option B): AI Search has no member scope on the backend (`HuskyChatSchema` takes no scope),
 * so while the agent reads a member profile, one line goes before the first question:
 * "About <member name> (<profile URL>):". A deviation from the design's `about=member`.
 */

/** `/ai-search?history=open`: AI agent chat with its History rail open (Decision 2). */
export const AI_SEARCH_HISTORY_URL = `${PAGE_ROUTES.HUSKY}?${AI_SEARCH_HISTORY_PARAM}=open`;

/** Decision 1: the action shows once the chat has one answer. */
export const canOpenInAiSearch = (turns: LabosAgentTurn[]) => turns.some((t) => t.status === 'done');

/** The member's questions that got an answer, in order. */
export const handoffQuestions = (turns: LabosAgentTurn[]): string[] =>
  turns
    .filter((t) => t.status === 'done')
    .map((t) => t.message.trim())
    .filter(Boolean);

/** The member whose profile the agent reads, or `null`. The member's own profile (`profile`) is not a member scope. */
export const scopedMemberUid = (context: LabosAgentOpenContext | null, readsPage: boolean): string | null =>
  readsPage && context?.page === 'member' ? context.memberUid : null;

/** The line before the first question. No name (the lookup failed): the profile URL alone names the member. */
export function memberScopeLine(name: string | null, profileUrl: string): string {
  return name ? `About ${name} (${profileUrl}):` : `About this member (${profileUrl}):`;
}

/** The questions of the new thread: the scope line goes before the first one, on the same line. */
export function withMemberScope(questions: string[], scopeLine: string | null): string[] {
  if (!scopeLine || questions.length === 0) return questions;
  const [first, ...rest] = questions;
  return [`${scopeLine} ${first}`, ...rest];
}

const apiUrl = (path: string) => `${process.env.DIRECTORY_API_URL}${path}`;

/**
 * The member's name for the scope line. Any failure gives `null`: the line then names the profile URL only.
 * The plain member endpoint: the API answers `?select=name` with a 400 ("Database field validation error").
 */
async function memberName(uid: string): Promise<string | null> {
  try {
    const response = await fetch(apiUrl(`/v1/members/${encodeURIComponent(uid)}`), { method: 'GET' });
    if (!response.ok) return null;
    const body = (await response.json()) as { name?: unknown };
    return typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : null;
  } catch {
    return null;
  }
}

const postJson = (path: string, body: object) =>
  customFetch(
    apiUrl(path),
    { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    true,
  );

/**
 * Saves a new thread: `POST /v1/husky/threads` and its title (`POST /v1/husky/threads/:id/basic-info`, the first
 * question). The History rail lists only threads with a title, so a thread without one counts as not saved.
 */
async function saveThread(threadId: string, firstQuestion: string): Promise<boolean> {
  const created = await postJson('/v1/husky/threads', { threadId });
  if (!created?.ok) return false;
  const titled = await postJson(`/v1/husky/threads/${encodeURIComponent(threadId)}/basic-info`, {
    question: firstQuestion,
  });
  return !!titled?.ok;
}

/** Leaves the questions for the new tab. False when storage is blocked: the tab would open an empty thread. */
function leaveQuestions(threadId: string, questions: string[]): boolean {
  try {
    window.localStorage.setItem(AI_SEARCH_PENDING_QUESTIONS_KEY_PREFIX + threadId, JSON.stringify(questions));
    return true;
  } catch {
    return false;
  }
}

function forgetQuestions(threadId: string) {
  try {
    window.localStorage.removeItem(AI_SEARCH_PENDING_QUESTIONS_KEY_PREFIX + threadId);
  } catch {
    /* Nothing was left. */
  }
}

export interface OpenInAiSearchInput {
  questions: string[];
  /** The member the agent reads (`scopedMemberUid`), for the scope line. */
  memberUid?: string | null;
}

/**
 * The press. The new tab opens at once, inside the click (an `await` first would let a popup blocker eat it). Then the
 * local checks, before anything is saved: a blocked tab or blocked storage fails here, so a failure leaves no thread in
 * the History rail and a Retry adds none. Then the thread is saved and the tab goes to it. A failure closes the tab and
 * gives `false`: the member stays in the agent with the error line and Retry.
 */
export async function openInAiSearch({ questions, memberUid }: OpenInAiSearchInput): Promise<boolean> {
  if (questions.length === 0) return false;
  let tab: Window | null = null;
  try {
    tab = window.open('', '_blank');
    // The thread does not need its opener. `noopener` in `open` would return no window to send on.
    if (tab) tab.opener = null;
  } catch {
    tab = null;
  }
  // Blocked: no thread. A Retry is a new click, which may open the tab.
  if (!tab) return false;

  const threadId = getUniqueId();
  try {
    const profileUrl = memberUid ? `${window.location.origin}/members/${encodeURIComponent(memberUid)}` : null;
    const name = memberUid ? await memberName(memberUid) : null;
    const thread = withMemberScope(questions, profileUrl ? memberScopeLine(name, profileUrl) : null);

    // The questions go in storage first: blocked storage fails before any thread is made.
    if (tab.closed || !leaveQuestions(threadId, thread)) {
      tab.close();
      return false;
    }
    if (!(await saveThread(threadId, thread[0]))) {
      forgetQuestions(threadId);
      tab.close();
      return false;
    }
    if (tab.closed) {
      // The member closed the tab while the thread saved. The thread is in History, and its questions wait in
      // storage: opening it from History asks them.
      return true;
    }
    tab.location.href = `${PAGE_ROUTES.HUSKY}/${threadId}`;
    return true;
  } catch {
    tab.close();
    forgetQuestions(threadId);
    return false;
  }
}
