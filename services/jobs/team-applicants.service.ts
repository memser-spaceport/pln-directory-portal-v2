import {
  ApplicantCount,
  applicantCountsResponseSchema,
  ApplicantKind,
  ApplicantReviewedResult,
  applicantReviewedResponseSchema,
  ApplicantSeenResult,
  applicantSeenResponseSchema,
  roleApplicantsResponseSchema,
  TeamApplicant,
} from '@/schema/team-applicants';
import {
  contactSuggestedResponseSchema,
  matchCriteriaResponseSchema,
  RoleCriterion,
  SuggestedCandidate,
  selectShownSuggestions,
  suggestedCandidatesResponseSchema,
} from '@/schema/suggested-candidates';
import {
  contactSuggestedCandidateMock,
  type MockAnswer,
  overlaySuggestedMock,
  saveMatchCriteriaMock,
} from '@/services/jobs/suggested-candidates.mock';
import { customFetch } from '@/utils/fetch-wrapper';

/**
 * A team's own applicants — the other direction from every other read in this
 * folder, which is scoped to the calling member.
 *
 * **The explicit return types below ARE the contract**, and they survived the
 * cutover unchanged: this shipped mocked behind `SHOW_TEAM_APPLICANTS` while the
 * endpoints were written to these same schemas (backend #3438, LAB-2580), so
 * swapping the transport in touched no consumer and no component.
 *
 * The schemas still parse every response. A server that drifts from them fails
 * here rather than three components later — which is why they were written
 * first, and why they stay now that there is a real server behind them.
 */

const JOB_OPENINGS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/job-openings`;

/**
 * The URL's spelling of a row's kind.
 *
 * The API routes on `applications` / `interests`; the app says `application` /
 * `interest`, because a single row is one of them. One mapping, here, rather
 * than a plural leaking into the UI's vocabulary to save a function.
 */
const KIND_PATH: Record<ApplicantKind, string> = {
  application: 'applications',
  interest: 'interests',
};

/**
 * A write with a JSON content type and an empty body, for endpoints that take
 * none.
 *
 * Not ceremony — it is the fix for a real 415. `customFetch` adds
 * `Authorization` and nothing else, so a bodyless POST goes out with no
 * `Content-Type` and the API's validation layer answers "Unsupported Content
 * Type" before the handler runs. `job-interests.service.ts` carries the same
 * note and the same shape.
 */
const jsonWrite = (body: unknown = {}, method: 'POST' | 'PUT' = 'POST') => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export type { ApplicantCount, ApplicantKind, TeamApplicant };

/**
 * TEMPORARY (LAB-2847): routes the Suggested tab's two writes, and an overlay
 * on its read, through `suggested-candidates.mock.ts` instead of the API.
 *
 * **Off by default — the real endpoints (backend #3509, LAB-2846) are used.**
 * Flip it to `true` locally while the dev API you point at does not have those
 * routes yet: the read still comes from the server, the mock fills in
 * `criteria` / `contactedAt` and answers the two writes from session state.
 * Cutover (tasks.md, "Workflow follow-up") deletes this constant and the mock
 * module; no hook or component reads it.
 */
export const SUGGESTED_ACTIONS_MOCKED: boolean = false;

/** What the Suggested tab reads in one request: the people, and the role's criteria. */
export interface SuggestedCandidatesResult {
  suggestions: SuggestedCandidate[];
  /** `null` when the backend sent no criteria (an older backend) — the page then offers no "Edit criteria". */
  criteria: RoleCriterion[] | null;
  /** The lead's own words about who they are looking for (LAB-2853); `null` when none is saved or the backend sends none. */
  criteriaPrompt: string | null;
}

/** What a criteria save answers: the switches and the prompt as saved. */
export interface SavedMatchCriteria {
  criteria: RoleCriterion[];
  prompt: string | null;
}

/**
 * A refusal from the applicants endpoints.
 *
 * Its own class rather than a reuse of `JobInterestError`, for the reason that
 * one gives about `JobApplicationError`: callers tell them apart with
 * `instanceof`, and these two failures mean different things. This is the third
 * such class in the folder — at a fourth, lift the body reading into a shared
 * `job-openings-error` module rather than copying it again.
 */
export class TeamApplicantsError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'TeamApplicantsError';
    this.status = status;
  }
}

/** The lead is not a lead of this team (or not an admin). */
export const isApplicantsForbiddenError = (error: unknown): boolean =>
  error instanceof TeamApplicantsError && error.status === 403;

/**
 * Someone on the team already contacted this member about this role. The page
 * treats it as success: the member got one message, which is the point.
 */
export const isAlreadyContactedError = (error: unknown): boolean =>
  error instanceof TeamApplicantsError && error.status === 409;

/**
 * The server's own message, when it sent one worth reading.
 *
 * `customFetch` resolves to `undefined` when it gives up and logs the session
 * out — there is no response to read and the reload it triggers is already under
 * way, so this only has to not throw on the way there.
 */
async function errorFrom(response: Response | undefined, fallback: string): Promise<TeamApplicantsError> {
  if (!response) {
    return new TeamApplicantsError(401, 'Your session expired. Sign in and try again.');
  }

  let message = fallback;
  try {
    const body = await response.json();
    const serverMessage = body?.message ?? body?.status?.message;
    if (typeof serverMessage === 'string' && serverMessage.trim()) {
      message = serverMessage;
    }
  } catch {
    // A body we can't read is not worth failing differently over.
  }
  return new TeamApplicantsError(response.status, message);
}

/** A mock answer through the same refusal path a real one takes. TEMPORARY, with the mock. */
function fromMock({ status, body }: MockAnswer): unknown {
  if (status >= 400) {
    const message = (body as { message?: string } | null)?.message ?? 'Request failed';
    throw new TeamApplicantsError(status, message);
  }
  return body;
}

/**
 * Counts for every open role this team has, for the profile's count line and
 * the picker's `● M new`.
 *
 * Counts only — the roles themselves come from the jobs list the profile
 * already fetches. A role absent from the answer has nobody.
 */
export async function fetchApplicantCounts(teamUid: string): Promise<ApplicantCount[]> {
  const response = await customFetch(
    `${JOB_OPENINGS_API_URL}/teams/${encodeURIComponent(teamUid)}/applicant-counts`,
    { method: 'GET' },
    true,
  );

  if (!response?.ok) {
    throw await errorFrom(response, 'Could not load applicant counts');
  }

  return applicantCountsResponseSchema.parse(await response.json()).counts;
}

/**
 * One role's two lists, newest first, each row tagged with the list it came
 * from so a row that has lost its envelope still knows what it writes to.
 */
export async function fetchRoleApplicants(
  teamUid: string,
  roleUid: string,
): Promise<{ applications: TeamApplicant[]; interests: TeamApplicant[] }> {
  const response = await customFetch(
    `${JOB_OPENINGS_API_URL}/teams/${encodeURIComponent(teamUid)}/roles/${encodeURIComponent(roleUid)}/applicants`,
    { method: 'GET' },
    true,
  );

  if (!response?.ok) {
    throw await errorFrom(response, 'Could not load applicants');
  }

  const { applications, interests } = roleApplicantsResponseSchema.parse(await response.json());

  /* `kind` is the app's, not the wire's: the API answers two named arrays, and a
     row that leaves its array — into the pane, into a `seen` write — has to keep
     knowing which one it came from. */
  return {
    applications: applications.map((row) => ({ ...row, kind: 'application' as const })),
    interests: interests.map((row) => ({ ...row, kind: 'interest' as const })),
  };
}

/**
 * A live role's suggested candidates (LAB-2771): the top matches the product
 * proposes, best first. The server returns an empty list for a role that is
 * not live and answers 403 to anyone outside the hiring team.
 *
 * Also the role's match criteria (LAB-2847), which arrive in the same answer.
 * `null` when the server did not send them, so the page can tell "an older
 * backend" from "a role with no criteria" (`[]`).
 */
export async function fetchSuggestedCandidates(roleUid: string): Promise<SuggestedCandidatesResult> {
  const response = await customFetch(
    `${JOB_OPENINGS_API_URL}/${encodeURIComponent(roleUid)}/suggested-candidates`,
    { method: 'GET' },
    true,
  );

  if (!response?.ok) {
    throw await errorFrom(response, 'Could not load suggested candidates');
  }

  const parsed = suggestedCandidatesResponseSchema.parse(await response.json());
  const { suggestions, criteria, criteriaPrompt } = SUGGESTED_ACTIONS_MOCKED
    ? overlaySuggestedMock(roleUid, parsed)
    : parsed;

  return {
    suggestions: selectShownSuggestions(suggestions),
    criteria: criteria ?? null,
    criteriaPrompt: criteriaPrompt ?? null,
  };
}

/**
 * Switch some of the role's requirements off for matching (LAB-2847), and save
 * the lead's own words about who they are looking for (LAB-2853). Takes the
 * texts to switch OFF (every other requirement is on) and the prompt. Answers
 * both as saved, and the caller writes that back rather than trusting the
 * press.
 *
 * `prompt` is always sent. On the endpoint a missing `prompt` keeps the saved
 * one, and `null` or `""` clears it, so the modal sends `null` for an empty box
 * to clear it on purpose.
 *
 * 400 for an unknown text, all of them off or a prompt over 500 characters,
 * 403 outside the team, 409 when the posting has no criteria extracted yet.
 */
export async function saveMatchCriteria(
  roleUid: string,
  disabled: string[],
  prompt: string | null,
): Promise<SavedMatchCriteria> {
  const parsed = SUGGESTED_ACTIONS_MOCKED
    ? matchCriteriaResponseSchema.parse(fromMock(await saveMatchCriteriaMock(roleUid, disabled, prompt)))
    : await putMatchCriteria(roleUid, disabled, prompt);

  /* A backend without the prompt answers none. `null` then, not what was
     sent: the page should not claim a prompt the server never kept. */
  return { criteria: parsed.criteria, prompt: parsed.prompt ?? null };
}

async function putMatchCriteria(roleUid: string, disabled: string[], prompt: string | null) {
  const response = await customFetch(
    `${JOB_OPENINGS_API_URL}/${encodeURIComponent(roleUid)}/match-criteria`,
    jsonWrite({ disabled, prompt }, 'PUT'),
    true,
  );

  if (!response?.ok) {
    throw await errorFrom(response, 'Could not save the criteria. Please try again.');
  }

  return matchCriteriaResponseSchema.parse(await response.json());
}

/**
 * Send a suggested member a message through the platform (LAB-2847). Answers
 * when it went out.
 *
 * 409 means a lead already contacted them for this role — see
 * `isAlreadyContactedError`. A 500 keeps no record, so a retry is allowed.
 */
export async function contactSuggestedCandidate(
  roleUid: string,
  memberUid: string,
  message: string,
): Promise<{ contactedAt: string }> {
  if (SUGGESTED_ACTIONS_MOCKED) {
    return contactSuggestedResponseSchema.parse(
      fromMock(await contactSuggestedCandidateMock(roleUid, memberUid, message)),
    );
  }

  const response = await customFetch(
    `${JOB_OPENINGS_API_URL}/${encodeURIComponent(roleUid)}/suggested-candidates/${encodeURIComponent(memberUid)}/contact`,
    jsonWrite({ message }),
    true,
  );

  if (!response?.ok) {
    throw await errorFrom(response, 'Could not send your message. Please try again.');
  }

  return contactSuggestedResponseSchema.parse(await response.json());
}

/**
 * The team's tick, both directions through one call.
 *
 * Idempotent and it answers with the post-write state, so the caller corrects
 * the screen from the server rather than from what it assumed the press meant.
 */
export async function setApplicantReviewed(
  kind: ApplicantKind,
  uid: string,
  reviewed: boolean,
): Promise<ApplicantReviewedResult> {
  const response = await customFetch(
    `${JOB_OPENINGS_API_URL}/${KIND_PATH[kind]}/${encodeURIComponent(uid)}/reviewed`,
    jsonWrite({ reviewed }),
    true,
  );

  if (!response?.ok) {
    throw await errorFrom(response, 'Could not update this applicant');
  }

  return applicantReviewedResponseSchema.parse(await response.json());
}

/**
 * This viewer has opened this row. Per-lead, so it clears the `● New` tint for
 * them and leaves a co-lead's alone.
 *
 * Fire-and-forget at the call site: a failed `seen` costs a stale badge, which
 * is not worth a rollback or a toast.
 */
export async function markApplicantSeen(kind: ApplicantKind, uid: string): Promise<ApplicantSeenResult> {
  const response = await customFetch(
    `${JOB_OPENINGS_API_URL}/${KIND_PATH[kind]}/${encodeURIComponent(uid)}/seen`,
    jsonWrite(),
    true,
  );

  if (!response?.ok) {
    throw await errorFrom(response, 'Could not mark this applicant as read');
  }

  return applicantSeenResponseSchema.parse(await response.json());
}
