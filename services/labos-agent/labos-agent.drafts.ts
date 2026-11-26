import { introRequestTargetKey, isIntroRequestSent } from '@/services/intro-requests/intro-request-entry-registry';
import {
  IntroRequestError,
  messageForIntroRequestFailure,
  type IntroRequestTargetType,
} from '@/services/intro-requests/intro-requests.service';
import type { LabosAgentDraft, LabosAgentDraftCardState } from '@/types/labos-agent.types';

import { LabosAgentError } from './labos-agent.errors';

/** The C3 text after a 200 (the modal's text). */
export { INTRO_REQUEST_RECEIVED_MESSAGE as DRAFT_SENT_MESSAGE } from '@/services/intro-requests/intro-requests.service';

/** On a 401, `customFetch` signs the member out and reloads the page, so the chat and the text are gone. */
export const DRAFT_SIGN_IN_MESSAGE = 'Your session ended. Sign in again, then ask the agent for a new draft.';
export const DRAFT_ALREADY_SENT_MESSAGE = 'Intro already requested';
/** LAB-3362: an older waiting card after a newer draft for the same target came in a later turn. */
export const DRAFT_REPLACED_MESSAGE = 'Replaced by a newer draft';
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

/** The key of a draft target in the page registry and in `sentIntroTargets`, for example `MEMBER:<uid>`. */
export const draftTargetKey = (draft: LabosAgentDraft) =>
  introRequestTargetKey(draft.target.type === 'team' ? 'TEAM' : 'MEMBER', draft.target.uid);

/**
 * True when the target already has an intro request in this page visit: a send from a draft card (`sentIntroTargets`),
 * or the page's "Intro requested" state (the Request an intro registry). C3 has no duplicate check.
 */
export const isDraftTargetSent = (draft: LabosAgentDraft, sentIntroTargets: Record<string, true>) => {
  const key = draftTargetKey(draft);
  return !!sentIntroTargets[key] || isIntroRequestSent(key);
};

/** The HTTP status of a failed C3 call. `0`: no response (network). */
export const introErrorStatus = (error: unknown) =>
  error instanceof IntroRequestError || error instanceof LabosAgentError ? error.status : 0;

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

/**
 * LAB-3457: the card state after a failed C5 call (a saved draft). C3's own errors pass through C5, so a 403 hides
 * Send and a 404 shows the API message, as with C3. A 409 `DRAFT_CLOSED` shows how the draft closed: sent or
 * cancelled (in another tab, or by an earlier press). The edited text always stays.
 */
export function draftConfirmErrorState(error: unknown, text: string): LabosAgentDraftCardState {
  if (!(error instanceof LabosAgentError)) return { status: 'error', text, message: DRAFT_SEND_FAILED_MESSAGE };
  if (error.code === 'DRAFT_CLOSED') return { status: error.draftStatus === 'cancelled' ? 'cancelled' : 'sent', text };
  const body = { message: error.bodyMessage };
  if (error.status === 403) return { status: 'forbidden', text, message: messageForIntroRequestFailure(403, body) };
  if (error.status === 404) return { status: 'error', text, message: messageForIntroRequestFailure(404, body) };
  if (error.status === 401) return { status: 'error', text, message: DRAFT_SIGN_IN_MESSAGE };
  if (error.status === 429) return { status: 'error', text, message: DRAFT_RATE_LIMITED_MESSAGE };
  return { status: 'error', text, message: DRAFT_SEND_FAILED_MESSAGE };
}
