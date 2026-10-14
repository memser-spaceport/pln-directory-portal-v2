import {
  CONTACT_MESSAGE_MAX_LENGTH,
  CRITERIA_PROMPT_MAX_LENGTH,
  type RoleCriterion,
  type suggestedCandidatesResponseSchema,
} from '@/schema/suggested-candidates';
import type { z } from 'zod';

/**
 * TEMPORARY (LAB-2847) — a session-only stand-in for the Suggested tab's two
 * writes, until the LAB-2846 routes reach the dev API.
 *
 * **Used only when `SUGGESTED_ACTIONS_MOCKED` in `team-applicants.service.ts` is
 * `true`.** It is `false` by default, so the real API answers. Flip it locally to
 * click through the modals against a dev API without the routes:
 *
 * - the suggestions still come from the server; `overlaySuggestedMock` fills in
 *   the role's `criteria` (from the people's own requirement texts when the
 *   server sent none), the role's `criteriaPrompt` (LAB-2853) and each
 *   person's `contactedAt`;
 * - `PUT match-criteria` and `POST …/contact` are answered here, from a `Map`
 *   that lives as long as the page does. Nothing is sent to anyone.
 *
 * Error paths, so they can be clicked through:
 * - **contact 409**: contact the same person twice for the same role (state
 *   lives in memory, so a full page load forgets it — "Contacted after a
 *   reload" can only be checked against the real API);
 * - **contact 500**: put {@link MOCK_FAIL_MARKER} anywhere in the message;
 * - **criteria 500**: set {@link MOCK_FAIL_CRITERIA_SAVE} to `true`.
 *
 * Answers are `{ status, body }`, shaped as the real endpoints answer, and the
 * service runs them through the same parse and refusal path as a response.
 * Cutover deletes this file, its test and the switch.
 */

/** A message containing this fails the contact with a 500. */
export const MOCK_FAIL_MARKER = '#fail';

/** Set to `true` locally to make every criteria save fail with a 500. */
export const MOCK_FAIL_CRITERIA_SAVE = false;

export interface MockAnswer {
  status: number;
  body: unknown;
}

type SuggestedResponse = z.infer<typeof suggestedCandidatesResponseSchema>;

/** Role uid → the texts switched off. */
const disabledByRole = new Map<string, Set<string>>();
/** Role uid → the lead's saved prompt (LAB-2853). */
const promptByRole = new Map<string, string>();
/** Role uid → the criteria texts the last read showed, so a save can refuse an unknown one. */
const knownByRole = new Map<string, string[]>();
/** `roleUid:memberUid` → when they were contacted. */
const contactedAt = new Map<string, string>();

const contactKey = (roleUid: string, memberUid: string) => `${roleUid}:${memberUid}`;

const latency = () => new Promise<void>((resolve) => setTimeout(resolve, process.env.NODE_ENV === 'test' ? 0 : 400));

const criteriaFor = (roleUid: string, texts: string[], serverEnabled?: Map<string, boolean>): RoleCriterion[] => {
  const disabled = disabledByRole.get(roleUid);
  return texts.map((text) => ({
    text,
    enabled: disabled ? !disabled.has(text) : (serverEnabled?.get(text) ?? true),
  }));
};

/** Fills `criteria`, `criteriaPrompt` and `contactedAt` on a real read from the session state. */
export function overlaySuggestedMock(roleUid: string, response: SuggestedResponse): SuggestedResponse {
  const serverEnabled = response.criteria ? new Map(response.criteria.map((c) => [c.text, c.enabled])) : undefined;
  const texts = response.criteria
    ? response.criteria.map((c) => c.text)
    : Array.from(new Set(response.suggestions.flatMap((row) => row.criteria.map((c) => c.text))));
  knownByRole.set(roleUid, texts);

  return {
    ...response,
    criteria: criteriaFor(roleUid, texts, serverEnabled),
    criteriaPrompt: promptByRole.has(roleUid) ? promptByRole.get(roleUid) || null : (response.criteriaPrompt ?? null),
    suggestions: response.suggestions.map((row) => ({
      ...row,
      contactedAt: contactedAt.get(contactKey(roleUid, row.memberUid)) ?? row.contactedAt ?? null,
    })),
  };
}

/**
 * `PUT /v1/job-openings/:roleUid/match-criteria`, answered from session state.
 * `prompt` follows the endpoint: `undefined` keeps the saved one, and `null` or
 * blank clears it.
 */
export async function saveMatchCriteriaMock(
  roleUid: string,
  disabled: string[],
  prompt?: string | null,
): Promise<MockAnswer> {
  await latency();
  const known = knownByRole.get(roleUid);
  if (!known?.length) return { status: 409, body: { message: 'No criteria extracted for this role yet' } };
  if (!Array.isArray(disabled) || disabled.some((text) => !known.includes(text))) {
    return { status: 400, body: { message: 'Unknown criterion' } };
  }
  if (known.every((text) => disabled.includes(text))) {
    return { status: 400, body: { message: 'At least one criterion must stay enabled' } };
  }
  const trimmed = typeof prompt === 'string' ? prompt.trim() : prompt;
  if (typeof trimmed === 'string' && trimmed.length > CRITERIA_PROMPT_MAX_LENGTH) {
    return { status: 400, body: { message: `Prompt must be at most ${CRITERIA_PROMPT_MAX_LENGTH} characters` } };
  }
  if (MOCK_FAIL_CRITERIA_SAVE) return { status: 500, body: { message: 'Mock: criteria save failed' } };

  disabledByRole.set(roleUid, new Set(disabled));
  if (trimmed !== undefined) promptByRole.set(roleUid, trimmed || '');
  return {
    status: 200,
    body: { criteria: criteriaFor(roleUid, known), prompt: promptByRole.get(roleUid) || null },
  };
}

/** `POST …/suggested-candidates/:memberUid/contact`, answered from session state. */
export async function contactSuggestedCandidateMock(
  roleUid: string,
  memberUid: string,
  message: string,
): Promise<MockAnswer> {
  await latency();
  const text = typeof message === 'string' ? message.trim() : '';
  if (!text || text.length > CONTACT_MESSAGE_MAX_LENGTH) {
    return { status: 400, body: { message: 'Message must be 1 to 2000 characters' } };
  }
  const key = contactKey(roleUid, memberUid);
  if (contactedAt.has(key)) return { status: 409, body: { message: 'Already contacted' } };
  if (text.includes(MOCK_FAIL_MARKER)) return { status: 500, body: { message: 'Mock: the message could not be sent' } };

  const at = new Date().toISOString();
  contactedAt.set(key, at);
  return { status: 201, body: { contactedAt: at } };
}

/** Test-only: forget the session state. */
export function resetSuggestedMock() {
  disabledByRole.clear();
  promptByRole.clear();
  knownByRole.clear();
  contactedAt.clear();
}
