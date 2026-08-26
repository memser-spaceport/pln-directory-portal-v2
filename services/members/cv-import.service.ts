import { customFetch } from '@/utils/fetch-wrapper';
import type {
  ParsedExperience,
  ParsedProfile,
} from '@/components/page/member-details/ExperienceDetails/components/ExperienceImport';

/**
 * The three calls behind "fill my Experience section from a CV".
 *
 * **This file is the only place that knows the wire format**, which is what made
 * the switch from the assumed contract to the shipped one a one-file edit: the
 * panel takes an injected `onParse`, the review hands back a UI-shaped
 * selection, and the host maps one to the other.
 *
 * **The parse is asynchronous, and that is hidden here.** The backend accepts
 * the upload with a 202 and does the extraction in the background; `parseCv`
 * uploads, then polls `/cv-imports/latest` until the row reaches a terminal
 * status, and resolves with the payload. Everything upstream still sees one
 * promise that either resolves with a profile or throws — the panel has no idea
 * there is a poll loop under it.
 *
 * Contract: `apps/web-api/src/member-cv-imports/` and
 * `libs/contracts/src/schema/member-cv-import.ts` in the backend repo.
 */

const BASE = `${process.env.DIRECTORY_API_URL}/v1/members`;

/* ------------------------------------------------------------------ parse --- */

/**
 * Why a category and not just a status code.
 *
 * The groups are shown to the person in different places, so the distinction
 * has to survive the trip out of this file:
 *
 * - `rejected` — a statement about *the file* (too big, not a PDF, no
 *   extractable text). Belongs in the dropzone's inline error strip, beside the
 *   file it is about.
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
  /* The upload validates synchronously and answers 400 for all of "not a PDF",
     "over 5MB" and "empty file" (`assertPdfFile`), 413 if the proxy in front of
     the app gets there first. Both are things the person fixes by bringing a
     different file. */
  if (status === 400 || status === 413 || status === 415 || status === 422) return 'rejected';
  return 'server';
};

/**
 * The parse row's lifecycle, straight from `MemberCvImportStatusSchema`.
 *
 * `NOTHING_FOUND` is a success in HTTP terms and a dead end in the UI: the
 * document was read and carried no positions. It is deliberately not an error —
 * see `parseCv`, which resolves it as an empty profile so the panel can say
 * something true about the document rather than about us.
 */
type CvImportStatus = 'PROCESSING' | 'SUCCEEDED' | 'NOTHING_FOUND' | 'FAILED';

interface CvImportLatest {
  uid: string;
  status: CvImportStatus;
  originalFilename: string;
  payload?: Omit<ParsedProfile, 'importUid'>;
  error?: { code: string; message: string };
}

/**
 * How long to wait for a background parse, and how often to ask.
 *
 * The ceiling is the one `useParseCv` already used for the whole read, kept
 * because it is the same promise from the panel's point of view — the person is
 * watching "Reading your-cv.pdf…" either way. A parse that never finishes would
 * otherwise leave that spinning forever with only a Cancel that reads as their
 * fault.
 *
 * 2s between polls, the interval the contract handoff names: the work is an S3
 * write plus a PDF extraction plus an LLM call, so the useful range is seconds
 * not milliseconds, and a tighter loop would spend requests to learn nothing.
 */
const POLL_INTERVAL_MS = 2_000;
const PARSE_TIMEOUT_MS = 60_000;

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new CvParseError('aborted'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new CvParseError('aborted'));
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });

/**
 * Hands the file over. Returns the import's uid, which every later call in this
 * flow is scoped to — `apply` rejects with a 409 if the uid it is given is not
 * the row's current one, so a stale review cannot write a newer parse's rows.
 */
async function uploadCv(uid: string, file: File, signal?: AbortSignal): Promise<string> {
  const body = new FormData();
  body.append('file', file);

  const response = await request(
    `${BASE}/${uid}/cv-imports`,
    {
      method: 'POST',
      body,
      /* NO Content-Type. `customFetch` spreads these options and adds only
         Authorization, so leaving it off lets the browser set
         `multipart/form-data; boundary=…` itself. Setting it by hand omits the
         boundary and the server cannot parse the body. */
      signal,
    },
    signal,
  );

  if (!response.ok) {
    throw new CvParseError(parseFailureFor(response.status), response.status, await readErrorMessage(response));
  }

  const accepted = (await response.json()) as { uid?: string };
  if (!accepted?.uid) {
    /* A 202 with no uid leaves nothing to poll for, and guessing would mean
       polling somebody else's row. */
    throw new CvParseError('server', response.status);
  }
  return accepted.uid;
}

/** One look at the row. Kept separate so the poll loop reads as a loop. */
async function fetchLatest(uid: string, signal?: AbortSignal): Promise<CvImportLatest> {
  const response = await request(`${BASE}/${uid}/cv-imports/latest`, { method: 'GET', signal }, signal);

  if (!response.ok) {
    /* Not `parseFailureFor`: a 404 here means the row vanished between the
       upload and the poll, which is our problem and not the document's. */
    throw new CvParseError('server', response.status, await readErrorMessage(response));
  }

  return (await response.json()) as CvImportLatest;
}

/**
 * Reads a document and returns what it said.
 *
 * Nothing is written to the profile — the result is a proposal until the review
 * card's Save, which is `applyCvImport`.
 *
 * Resolving with `experiences: []` is a valid answer (a portfolio, a scan, a
 * layout the extractor can't follow) and is deliberately **not** an error: the
 * panel has a dead end for it that says something true about the document. That
 * is what `NOTHING_FOUND` becomes here.
 */
export async function parseCv(uid: string, file: File, signal?: AbortSignal): Promise<ParsedProfile> {
  const importUid = await uploadCv(uid, file, signal);

  const deadline = Date.now() + PARSE_TIMEOUT_MS;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const latest = await fetchLatest(uid, signal);

    /* Someone else's upload landed while we were waiting — a second tab, or a
       newer file in this one. Ours is no longer the row being reported on, so
       there is nothing to resolve and nothing to complain about. */
    if (latest.uid !== importUid) throw new CvParseError('aborted');

    if (latest.status === 'SUCCEEDED') {
      if (!latest.payload) throw new CvParseError('server');
      return { ...latest.payload, importUid };
    }

    if (latest.status === 'NOTHING_FOUND') {
      /* The document was read and carried nothing. `importUid` still travels,
         because the empty result is a real parse the person may still act on
         from the review card. */
      return { role: '', location: '', skills: [], experiences: [], importUid };
    }

    if (latest.status === 'FAILED') {
      /* The server's own codes are not the UI's categories. It emits exactly
         two (`runParse`): `UNREADABLE_PDF` when the PDF yields no extractable
         text — true of a scan or an image-only export, and a statement about
         the document — and `PARSE_FAILED` for anything that threw on our side.
         Only the first is the person's to act on.

         Unknown codes fall to `server` deliberately: a new code we have not
         seen is more likely to be a new way for us to break than a new way for
         their file to be wrong, and blaming a document that is fine sends
         someone off to fix nothing. */
      const blamesTheFile = (latest.error?.code ?? '').toUpperCase() === 'UNREADABLE_PDF';
      throw new CvParseError(blamesTheFile ? 'rejected' : 'server', 0, latest.error?.message);
    }

    if (Date.now() >= deadline) {
      /* Indistinguishable from a failure downstream, which is correct: "we
         couldn't read that file just now" is true, and silence is reserved for
         aborts the person asked for. */
      throw new CvParseError('server');
    }

    await sleep(POLL_INTERVAL_MS, signal);
  }
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
 * `role` and `location` carry "leave it alone" in-band as `''`, so a member who
 * already has both sends the same request shape as one who has neither. That is
 * the server's rule too, not just a convention: it fills a field only when the
 * member's own is blank (`shouldFillRole`, `shouldFillLocation`) and never
 * overwrites an answer given by hand.
 */
export interface CvImportApplyPayload {
  /**
   * Which parse is being agreed to.
   *
   * The server rejects a uid that is not the row's current one with a 409 — so
   * if a newer CV was uploaded in another tab while this review sat open, Save
   * fails loudly instead of writing rows the person never saw.
   */
  importUid: string;
  /** `''` means don't touch. */
  role: string;
  /**
   * A place as text, resolved server-side.
   *
   * `''` means don't touch. Not a structured location: the endpoint geocodes
   * this string itself and answers `locationApplied` to say whether it managed
   * it — see `CvImportApplyResult`.
   */
  location: string;
  /** Titles. The server resolves them against the skills catalogue and unions
   *  them with what the member already has — the FE has no uid to offer. */
  skills: string[];
  /** Appended, never replacing. Only the rows that were left ticked. */
  experiences: Array<Omit<ParsedExperience, 'key'>>;
}

/**
 * What the server did, which is not always what was asked.
 *
 * `locationApplied` is the one that can disagree with the request: the string is
 * geocoded, and a place it cannot resolve is skipped silently rather than
 * failing the whole write. The rest of the import still lands.
 */
export interface CvImportApplyResult {
  uid: string;
  role: string | null;
  locationApplied: boolean;
  skillsAdded: string[];
  experiencesAdded: number;
}

export class CvImportApplyError extends Error {
  readonly status: number;
  /**
   * The parse this review was of is no longer the member's latest — a newer CV
   * was uploaded, or the row is not in a state that can be applied. The only
   * honest recovery is to re-read, so this is worth telling apart from a
   * generic failure.
   */
  readonly stale: boolean;

  constructor(status: number, message?: string) {
    super(message ?? 'Failed to save the imported experience');
    this.name = 'CvImportApplyError';
    this.status = status;
    this.stale = status === 409;
  }
}

/**
 * Commits the agreed selection in one request.
 *
 * One endpoint rather than a client-side fan-out across `POST /member-experiences`,
 * `PUT /members/{uid}` and `PATCH /members/{uid}`: those are three writes with no
 * transaction between them, and "three positions saved, role didn't" is a state
 * with no honest error message and no way back. The server runs the lot inside
 * one `$transaction`.
 */
export async function applyCvImport(uid: string, payload: CvImportApplyPayload): Promise<CvImportApplyResult> {
  let response: Response | undefined;

  try {
    response = await customFetch(
      `${BASE}/${uid}/cv-imports/apply`,
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
    throw new CvImportApplyError(response.status, await readErrorMessage(response));
  }

  return (await response.json()) as CvImportApplyResult;
}

/* ----------------------------------------------------------------- shared --- */

/**
 * `customFetch`, with the two ways it can fail to produce a response turned into
 * the categories this flow speaks.
 *
 * `fetch` rejects on a dropped connection and on abort, and `customFetch` does
 * not catch either; it also returns `undefined` when it decides the session is
 * over and starts a logout. An abort is the person's own doing and must never be
 * dressed up as a failure.
 */
async function request(url: string, init: RequestInit, signal?: AbortSignal): Promise<Response> {
  let response: Response | undefined;
  try {
    response = await customFetch(url, init, true);
  } catch (error) {
    if ((error instanceof Error && error.name === 'AbortError') || signal?.aborted) {
      throw new CvParseError('aborted');
    }
    throw new CvParseError('network');
  }
  if (!response) throw new CvParseError('network');
  return response;
}

/**
 * A failed response's message, if it has a readable one.
 *
 * Guarded because an error response is exactly where a non-JSON body turns up —
 * a gateway's HTML 502, an empty 413 from the proxy in front of the app — and a
 * `json()` that throws there would replace a useful status code with a parse
 * error.
 */
async function readErrorMessage(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { message?: string } | null;
    return body?.message;
  } catch {
    return undefined;
  }
}
