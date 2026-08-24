import { customFetch } from '@/utils/fetch-wrapper';
import type { ResolvedLocation } from '@/services/location.service';
import type {
  ParsedExperience,
  ParsedProfile,
} from '@/components/page/member-details/ExperienceDetails/components/ExperienceImport';

/**
 * The two calls behind "fill my Experience section from a CV".
 *
 * **This file is the only place that knows the wire format.** The panel takes an
 * injected `onParse`, the review hands back a UI-shaped selection, and the host
 * maps one to the other — so if the backend lands on different paths, different
 * field names or a different failure taxonomy, the edit is here and the type
 * declarations below, not spread through four components.
 *
 * Neither endpoint exists yet; both are owned by the backend team. See
 * `docs/plans/2026-08-24-feat-job-profile-drawer-cv-import-plan.md` for the
 * handoff spec these signatures were written against.
 */

const BASE = `${process.env.DIRECTORY_API_URL}/v1/members`;

/* ------------------------------------------------------------------ parse --- */

/**
 * Why a category and not just a status code.
 *
 * The three groups are shown to the person in three different places, so the
 * distinction has to survive the trip out of this file:
 *
 * - `rejected` — a statement about *the file* (too big, wrong type, unreadable).
 *   Belongs in the dropzone's inline error strip, beside the file it is about,
 *   where the client-side size and extension complaints already appear.
 * - `server` / `network` — a statement about *us*. Belongs in the panel's failed
 *   dead end: "we couldn't read that file just now", with a Try again.
 * - `aborted` — not a failure at all. The person cancelled, or a newer read
 *   overtook this one. Nothing is shown; see the panel's `readToken`.
 *
 * Collapsing these would mean telling someone their CV is broken because our
 * parser fell over, which sends them off to fix a file that is fine.
 */
export type CvParseFailure = 'rejected' | 'server' | 'network' | 'aborted';

export class CvParseError extends Error {
  readonly category: CvParseFailure;
  readonly status: number;

  constructor(category: CvParseFailure, status = 0, message?: string) {
    super(message ?? `CV parse failed (${category})`);
    this.name = 'CvParseError';
    this.category = category;
    this.status = status;
  }
}

const parseFailureFor = (status: number): CvParseFailure => {
  /* 400 unreadable/corrupt, 413 too large, 415 unsupported type — all things
     the person can fix by bringing a different file. 422 is included because a
     validation rejection of the upload is the same kind of news. */
  if (status === 400 || status === 413 || status === 415 || status === 422) return 'rejected';
  return 'server';
};

/**
 * Reads a document and returns what it said. Nothing is stored server-side and
 * nothing is written to the profile — the result is a proposal until the review
 * card's Save.
 *
 * Resolving with `experiences: []` is a valid answer (a portfolio, a scan, a
 * layout the extractor can't follow) and is deliberately **not** an error: the
 * panel has a dead end for it that says something true about the document.
 */
export async function parseCv(uid: string, file: File, signal?: AbortSignal): Promise<ParsedProfile> {
  const body = new FormData();
  body.append('file', file);

  let response: Response | undefined;

  try {
    response = await customFetch(
      `${BASE}/${uid}/cv-import/parse`,
      {
        method: 'POST',
        body,
        /* NO Content-Type. `customFetch` spreads these options and adds only
           Authorization, so leaving it off lets the browser set
           `multipart/form-data; boundary=…` itself. Setting it by hand omits the
           boundary and the server cannot parse the body. */
        signal,
      },
      true,
    );
  } catch (error) {
    /* `fetch` rejects on a dropped connection and on abort; `customFetch` does
       not catch either. Abort is the person's own doing and must not be dressed
       up as a failure. */
    if (error instanceof Error && error.name === 'AbortError') {
      throw new CvParseError('aborted');
    }
    throw new CvParseError('network');
  }

  /* `customFetch` returns undefined when it decides the session is over and
     starts a logout. Nothing useful is coming; don't report it as the file's
     fault. */
  if (!response) throw new CvParseError('network');

  if (!response.ok) {
    throw new CvParseError(parseFailureFor(response.status), response.status, await readErrorMessage(response));
  }

  return (await response.json()) as ParsedProfile;
}

/* ------------------------------------------------------------------ apply --- */

/**
 * What Save sends.
 *
 * Deliberately not `ImportSelection` — that is the shape the review card works
 * in (a UI selection, with React keys on the rows), and this is the shape the
 * server stores. The host maps between them, which is also where `key` is
 * dropped: it is a React key and was never a record field.
 *
 * `role` and `location` carry "leave it alone" in-band — `''` and `null` — so
 * that a member who already has both sends the same request shape as one who
 * has neither. The server fills only what is blank; it never overwrites an
 * answer the person gave by hand.
 */
export interface CvImportApplyPayload {
  /** `''` means don't touch. */
  role: string;
  /** `null` means don't touch. */
  location: ResolvedLocation | null;
  /** Titles. The server resolves them against the skills catalogue and unions
   *  them with what the member already has — the FE has no uid to offer. */
  skills: string[];
  /** Appended, never replacing. Only the rows that were left ticked. */
  experiences: Array<Omit<ParsedExperience, 'key'>>;
}

export class CvImportApplyError extends Error {
  readonly status: number;
  /**
   * Skill titles the server could not resolve.
   *
   * Present only if the backend team chooses rejection over minting — that
   * decision is still open, and it is the one thing that would need a surface
   * inside the review card rather than a generic error line. Empty until then.
   */
  readonly unresolvedSkills: string[];

  constructor(status: number, message?: string, unresolvedSkills: string[] = []) {
    super(message ?? 'Failed to save the imported experience');
    this.name = 'CvImportApplyError';
    this.status = status;
    this.unresolvedSkills = unresolvedSkills;
  }
}

/**
 * Commits the agreed selection in one request.
 *
 * One endpoint rather than a client-side fan-out across `POST /member-experiences`,
 * `PUT /members/{uid}` and `PATCH /members/{uid}`: those are three writes with no
 * transaction between them, and "three positions saved, role didn't" is a state
 * with no honest error message and no way back.
 */
export async function applyCvImport(uid: string, payload: CvImportApplyPayload): Promise<void> {
  let response: Response | undefined;

  try {
    response = await customFetch(
      `${BASE}/${uid}/cv-import/apply`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      },
      true,
    );
  } catch {
    throw new CvImportApplyError(0);
  }

  if (!response) throw new CvImportApplyError(0);

  if (!response.ok) {
    const detail = await readErrorBody(response);
    throw new CvImportApplyError(
      response.status,
      detail?.message,
      Array.isArray(detail?.unresolvedSkills) ? detail.unresolvedSkills : [],
    );
  }
}

/* ----------------------------------------------------------------- shared --- */

type ErrorBody = { message?: string; unresolvedSkills?: unknown } | null;

/**
 * A failed response's body, if it has a readable one.
 *
 * Guarded because an error response is exactly where a non-JSON body turns up —
 * a gateway's HTML 502, an empty 413 from the proxy in front of the app — and a
 * `json()` that throws there would replace a useful status code with a parse
 * error.
 */
async function readErrorBody(response: Response): Promise<ErrorBody> {
  try {
    return (await response.json()) as ErrorBody;
  } catch {
    return null;
  }
}

async function readErrorMessage(response: Response): Promise<string | undefined> {
  return (await readErrorBody(response))?.message;
}
