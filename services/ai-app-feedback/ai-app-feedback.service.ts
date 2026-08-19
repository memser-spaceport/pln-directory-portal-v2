import { customFetch } from '@/utils/fetch-wrapper';
import type { AiAppFeedbackStatus } from './constants';

export type { AiAppFeedbackStatus } from './constants';

const AI_APPS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/ai-apps`;

/**
 * Matches backend `WithMember<AiAppFeedback>` (apps/web-api/src/ai-apps/ai-apps.service.ts):
 * `memberUid` is replaced by a joined `member` object (null if the member record is gone).
 * No `appName` - the list endpoint is per-app, so the caller already knows it.
 */
export interface AiAppFeedback {
  uid: string;
  appUid: string;
  text: string;
  status: AiAppFeedbackStatus;
  createdAt: string;
  member: { uid: string; name: string } | null;
}

/** POST /v1/ai-apps/:uid/feedback - body field is `text`, matches SubmitFeedbackDto. */
export async function submitAiAppFeedback(appUid: string, text: string): Promise<boolean> {
  const response = await customFetch(
    `${AI_APPS_API_URL}/${appUid}/feedback`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    },
    true, // withAuth
  );

  if (!response?.ok) {
    throw new Error('Failed to submit AI App feedback');
  }

  return true;
}

/**
 * GET /v1/ai-apps/:uid/feedback - there is no global feedback-list endpoint; this is
 * scoped to one app and 403s server-side for anyone but the app's creator or a
 * directory admin. A 403/404 here means "not reviewable by this caller", not an
 * error, so callers fanning this out across many apps can treat it as empty.
 */
export async function fetchAiAppFeedbackForApp(appUid: string): Promise<AiAppFeedback[]> {
  const response = await customFetch(`${AI_APPS_API_URL}/${appUid}/feedback`, { method: 'GET' }, true);

  if (!response || !response.ok) {
    return [];
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
