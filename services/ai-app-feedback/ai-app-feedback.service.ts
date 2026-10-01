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
export interface OverlayFeedbackPin extends Omit<FeedbackPinInput, 'cropUrl'> {
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
  };
}

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
