import { customFetch } from '@/utils/fetch-wrapper';
import type { AiAppFeedbackStatus } from './constants';

export type { AiAppFeedbackStatus } from './constants';

const AI_APPS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/ai-apps`;

/**
 * Matches backend `WithMember<AiAppFeedback>` (apps/web-api/src/ai-apps/ai-apps.service.ts):
 * `memberUid` is replaced by a joined `member` object (null if the member record is gone).
 */
export interface AiAppFeedback {
  uid: string;
  appUid: string;
  text: string;
  status: AiAppFeedbackStatus;
  createdAt: string;
  member: { uid: string; name: string } | null;
}

/** GET /v1/ai-apps/feedback also tags each row with the app's name and how many elements it pinned. */
export interface AiAppFeedbackRow extends AiAppFeedback {
  appName: string;
  /** Absent from responses older than the pins table. */
  pinCount?: number;
  /** Replies under the item; absent from responses older than the comments table. */
  commentCount?: number;
}

export type AiAppEnvironment = 'prod' | 'preview';

/** One pinned element as POST /:uid/feedback takes it (backend FeedbackPinInputSchema). */
export interface FeedbackPinInput {
  n: number;
  env: AiAppEnvironment;
  pagePath: string;
  pageQuery: string | null;
  selector: string;
  tag: string;
  text: string;
  role: string | null;
  ariaLabel: string | null;
  component: string | null;
  source: string | null;
  rect: { x: number; y: number; w: number; h: number };
  viewportW: number;
  viewportH: number;
  note: string;
  cropUrl: string | null;
  /** Where in the element the member clicked, 0–1 of its box (BE #3467). Omitted when unknown. */
  ox?: number;
  oy?: number;
}

/** Where the feedback was left (backend FeedbackContextSchema). Viewport is the app frame's. */
export interface FeedbackContext {
  env: AiAppEnvironment;
  appPath: string;
  labosUrl: string;
  viewport: { w: number; h: number };
  pixelRatio: number;
  touch: boolean;
  userAgent: string;
  bridge: { version: number; capabilities: string[] } | null;
}

/** A pin as the overlay reads it: GET /:uid/feedback/pins and /pins/mine. */
export interface OverlayFeedbackPin extends Omit<FeedbackPinInput, 'cropUrl' | 'ox' | 'oy'> {
  uid: string;
  /** Where in the element the member clicked (0–1 of its box); null on older pins (they sit at its corner). */
  ox?: number | null;
  oy?: number | null;
  feedbackUid: string;
  cropUrl: string | null;
  createdAt: string;
  feedback: {
    uid: string;
    status: AiAppFeedbackStatus;
    createdAt: string;
    member: { uid: string; name: string; image: string | null } | null;
    /** Replies under the item. Absent until the backend has conversations — then the thread offers none. */
    commentCount?: number;
  };
}

/** One message in a feedback item's conversation: a reply, or the agent's note when it shipped the fix. */
export interface AiAppFeedbackComment {
  uid: string;
  text: string;
  kind: 'REPLY' | 'CLOSING_NOTE';
  createdAt: string;
  member: { uid: string; name: string; image: string | null } | null;
  /** Client-only: sent but not yet confirmed. */
  pending?: boolean;
}

/** Longest reply the API takes, in characters. */
export const FEEDBACK_COMMENT_MAX_LENGTH = 2000;

/**
 * POST /v1/ai-apps/:uid/feedback. `text` is the Quill HTML (pins included, for
 * people reading it); `pins` and `context` are the same pins as data, and where
 * the feedback was left. Both optional, matching SubmitFeedbackDto.
 */
export async function submitAiAppFeedback(
  appUid: string,
  text: string,
  extras: { pins?: FeedbackPinInput[]; context?: FeedbackContext } = {},
): Promise<boolean> {
  const response = await customFetch(
    `${AI_APPS_API_URL}/${appUid}/feedback`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        ...(extras.pins?.length ? { pins: extras.pins } : {}),
        ...(extras.context ? { context: extras.context } : {}),
      }),
    },
    true, // withAuth
  );

  if (!response?.ok) {
    throw new Error('Failed to submit AI App feedback');
  }

  return true;
}

/**
 * GET /v1/ai-apps/feedback - every reviewable row for the caller (directory
 * admins: all apps; everyone else: apps they created), newest first.
 */
export async function fetchAccessibleAiAppFeedback(): Promise<AiAppFeedbackRow[]> {
  const response = await customFetch(`${AI_APPS_API_URL}/feedback`, { method: 'GET' }, true);

  if (!response?.ok) {
    throw new Error('Failed to load AI App feedback');
  }

  return response.json();
}

/**
 * PATCH /v1/ai-apps/:uid/feedback/:feedbackUid - body is `{ status }`.
 * Restricted to the app's creator or a directory admin (same as the list GET).
 * Any of NEW / VIEWED / IMPLEMENTED is always allowed.
 */
export async function updateAiAppFeedbackStatus(
  appUid: string,
  feedbackUid: string,
  status: AiAppFeedbackStatus,
): Promise<AiAppFeedback> {
  const response = await customFetch(
    `${AI_APPS_API_URL}/${appUid}/feedback/${feedbackUid}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to update AI App feedback status');
  }

  return response.json();
}

/**
 * GET /v1/ai-apps/:uid/feedback/pins — every pin on the app's feedback, for the
 * creator and directory admins. Pins of IMPLEMENTED feedback only with
 * `includeResolved`. Both environments; the overlay labels the other one.
 */
export async function fetchAppFeedbackPins(
  appUid: string,
  { includeResolved = false }: { includeResolved?: boolean } = {},
): Promise<OverlayFeedbackPin[]> {
  const query = includeResolved ? '?includeResolved=true' : '';
  const response = await customFetch(`${AI_APPS_API_URL}/${appUid}/feedback/pins${query}`, { method: 'GET' }, true);
  if (!response?.ok) {
    throw new Error('Failed to load feedback pins');
  }
  return response.json();
}

/** GET /v1/ai-apps/:uid/feedback/pins/mine — the requester's own pins, resolved included. */
export async function fetchMyAppFeedbackPins(appUid: string): Promise<OverlayFeedbackPin[]> {
  const response = await customFetch(`${AI_APPS_API_URL}/${appUid}/feedback/pins/mine`, { method: 'GET' }, true);
  if (!response?.ok) {
    throw new Error('Failed to load your feedback pins');
  }
  return response.json();
}

const commentsUrl = (appUid: string, feedbackUid: string) =>
  `${AI_APPS_API_URL}/${appUid}/feedback/${feedbackUid}/comments`;

/**
 * GET /v1/ai-apps/:uid/feedback/:feedbackUid/comments — the item's conversation,
 * oldest first. Participants only: the app's creator, directory admins, and the
 * member who left the feedback.
 */
export async function fetchFeedbackComments(appUid: string, feedbackUid: string): Promise<AiAppFeedbackComment[]> {
  const response = await customFetch(commentsUrl(appUid, feedbackUid), { method: 'GET' }, true);
  if (!response?.ok) {
    throw new Error('Failed to load replies');
  }
  return response.json();
}

/** POST …/comments — a reply; the API tells the other participants. Plain text, 1–2000 chars. */
export async function postFeedbackComment(
  appUid: string,
  feedbackUid: string,
  text: string,
): Promise<AiAppFeedbackComment> {
  const response = await customFetch(
    commentsUrl(appUid, feedbackUid),
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) },
    true,
  );
  if (!response?.ok) {
    throw new Error('Failed to send reply');
  }
  return response.json();
}

/** DELETE …/comments/:commentUid — its author (or a directory admin). */
export async function deleteFeedbackComment(appUid: string, feedbackUid: string, commentUid: string): Promise<void> {
  const response = await customFetch(`${commentsUrl(appUid, feedbackUid)}/${commentUid}`, { method: 'DELETE' }, true);
  if (!response?.ok) {
    throw new Error('Failed to delete reply');
  }
}
