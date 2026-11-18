import {
  IntroRequestError,
  messageForIntroRequestFailure,
  type IntroRequestTargetType,
} from '@/services/intro-requests/intro-requests.service';
import type { LabosAgentDraft, LabosAgentDraftCardState } from '@/types/labos-agent.types';

/** The C3 text after a 200 (the modal's text). */
export { INTRO_REQUEST_RECEIVED_MESSAGE as DRAFT_SENT_MESSAGE } from '@/services/intro-requests/intro-requests.service';

export const DRAFT_SIGN_IN_MESSAGE = 'Sign in again, then press Send. Your text is kept.';
export const DRAFT_RATE_LIMITED_MESSAGE = 'Try again in a moment.';
export const DRAFT_SEND_FAILED_MESSAGE = 'The request could not be sent. Try again.';

/** The C3 body from a draft card (contract 8.4, S3-R12). Exactly `{ type, targetId, text }`: no `source`, no id. */
export function toIntroRequestBody(
  draft: LabosAgentDraft,
  text: string,
): { type: IntroRequestTargetType; targetId: string; text: string } {
  return {
    type: draft.target.type === 'team' ? 'TEAM' : 'MEMBER',
    targetId: draft.target.uid,
    text: text.trim(),
  };
}

/** The HTTP status of a failed C3 call. `0`: no response (network). */
export const introErrorStatus = (error: unknown) => (error instanceof IntroRequestError ? error.status : 0);

/**
 * The card state after a failed C3 call (contract 8.5, S3-R15). The edited text always stays. A 403 hides Send.
 * 403 and 404 show the API `message` through `messageForIntroRequestFailure` (in `createIntroRequest`).
 */
export function draftErrorState(error: unknown, text: string): LabosAgentDraftCardState {
  const status = introErrorStatus(error);
  if (status === 403) {
    const message = error instanceof IntroRequestError ? error.message : messageForIntroRequestFailure(403, null);
    return { status: 'forbidden', text, message };
  }
  if (status === 404) {
    const message = error instanceof IntroRequestError ? error.message : messageForIntroRequestFailure(404, null);
    return { status: 'error', text, message };
  }
  if (status === 401) return { status: 'error', text, message: DRAFT_SIGN_IN_MESSAGE };
  if (status === 429) return { status: 'error', text, message: DRAFT_RATE_LIMITED_MESSAGE };
  // 422 (`Input validation failed: …`), 5xx and no response: one plain message, not the API text.
  return { status: 'error', text, message: DRAFT_SEND_FAILED_MESSAGE };
}
