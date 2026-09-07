import type { ParsedProfile } from './types';

/**
 * The parser, mocked.
 *
 * Real extraction is a server round trip — pull the text out of the PDF/DOCX,
 * hand it to a structured-extraction call, get positions back. None of that can
 * live in a prototype (mocked-data-only), and none of it is what's being
 * reviewed: what's being reviewed is what the person sees while it happens and
 * what they're asked to confirm afterwards.
 *
 * So this returns a fixture after a delay, and which fixture is a *choice* the
 * reviewer makes. That switcher is scaffolding, and it should be deleted the day
 * a real parser lands — but until then a state nobody can reach is a state
 * nobody reviews, which is how "we found nothing" ships unread.
 */

export type ParseScenario = 'three-roles' | 'missing-date' | 'no-positions' | 'nothing-found' | 'newer-cv';

export const PARSE_SCENARIOS: Array<{ value: ParseScenario; label: string }> = [
  { value: 'three-roles', label: 'Three roles' },
  { value: 'missing-date', label: 'Missing a start date' },
  /* The half-read document, which is the case the dead end used to swallow.
     Worth a switch of its own precisely because it looks like a failure and
     isn't: the review has to open on it. */
  { value: 'no-positions', label: 'No positions, but other details' },
  { value: 'nothing-found', label: 'Nothing found' },
  /* The re-upload case. Only says anything over a history that is already
     saved, which is the state "Update from CV" is offered in. */
  { value: 'newer-cv', label: 'A newer CV' },
];

/**
 * How long the two beats *usually* take — what the panel's progress bar and its
 * "usually takes…" line are drawn against. Two, because production's `parseCv`
 * is two things in sequence: it posts the file (`uploadCv`), then polls the
 * extraction every 2s until it settles. The upload is the short one — a few-MB
 * document over an ordinary connection lands in about a second — and the
 * extraction (an S3 write, a PDF text pass and an LLM call) is what keeps the
 * person waiting. Production's ceiling on the whole thing is 60s.
 *
 * These are the prototype's guess at the typical case. The frontend should set
 * them from what the import row actually measures, because every sentence and
 * every pixel of the bar is derived from them: the bar reaches its hold point
 * at exactly this elapsed time, and the hint turns to "taking longer than
 * usual" the moment it passes.
 */
export const USUAL_UPLOAD_MS = 1_000;
export const USUAL_READ_MS = 8_000;

/**
 * What the mock actually takes. A little under the usual, so the bar is seen
 * doing its job and the review still opens before anyone reaches for Cancel.
 *
 * `?slow-cv` on the URL makes the read take three times the usual, which is
 * the only way to look at the overdue state — the hint switching, the bar
 * holding — without waiting on a real backend to have a bad day. Prototype
 * scaffolding: DELETE WITH the mock.
 */
const MOCK_UPLOAD_MS = 900;
const MOCK_READ_MS = 6_000;
const mockReadMs = () =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('slow-cv')
    ? USUAL_READ_MS * 3
    : MOCK_READ_MS;

const EMPTY_RESULT: ParsedProfile = { role: '', location: '', skills: [], experiences: [] };

/**
 * Seeded from the same network the board describes — `Lattice Compute` and
 * `libp2p` are the names `FILLED_PROFILE` and the board's own mocks use. A
 * fixture naming companies from a different universe would make the review read
 * as somebody else's résumé landing in your profile.
 */
const THREE_ROLES: ParsedProfile = {
  name: 'Polina Bublii',
  email: 'polina@latticecompute.xyz',
  role: 'Senior Protocol Engineer',
  location: 'Berlin, Germany',
  skills: ['Distributed Systems', 'Rust', 'libp2p', 'QUIC', 'Go'],
  experiences: [
    {
      key: 'parsed-1',
      title: 'Senior Protocol Engineer',
      company: 'Lattice Compute',
      description: '<p>Transport performance and connection upgrade paths.</p>',
      startDate: '2021-03',
      endDate: null,
      isCurrent: true,
      location: 'Berlin, Germany',
    },
    {
      key: 'parsed-2',
      title: 'Protocol Engineer',
      company: 'Meridian Labs',
      description: '<p>Consensus and peer discovery for a permissioned network.</p>',
      startDate: '2018-09',
      endDate: '2021-02',
      isCurrent: false,
      location: 'Remote',
    },
    {
      key: 'parsed-3',
      title: 'Backend Engineer',
      company: 'Northwind Systems',
      description: '<p>Storage services and the data pipeline behind them.</p>',
      startDate: '2016-01',
      endDate: '2018-08',
      isCurrent: false,
      location: 'Munich, Germany',
    },
  ],
};

/**
 * THE SECOND IMPORT: the same person's CV a year later.
 *
 * A re-upload only says anything over a history that is already saved, so this
 * fixture overlaps `THREE_ROLES` on purpose: a new current role on top, and the
 * same three roles under it with the Lattice one now ended. That end date is
 * exactly the field the duplicate match ignores, so the row still arrives
 * recognized rather than as a fourth job — which is the whole thing this
 * scenario exists to show.
 *
 * One skill is new, so the review's Skills group has something to offer as well.
 */
const NEWER_CV: ParsedProfile = {
  name: 'Polina Bublii',
  email: 'polina@fil.org',
  role: 'Protocol Lead',
  location: 'Berlin, Germany',
  skills: ['Distributed Systems', 'Rust', 'libp2p', 'QUIC', 'Go', 'Filecoin'],
  experiences: [
    {
      key: 'newer-1',
      title: 'Protocol Lead',
      company: 'Filecoin Foundation',
      description: '<p>Retrieval markets, and the transport work behind them.</p>',
      startDate: '2026-01',
      endDate: null,
      isCurrent: true,
      location: 'Berlin, Germany',
    },
    {
      key: 'newer-2',
      title: 'Senior Protocol Engineer',
      company: 'Lattice Compute',
      description: '<p>Transport performance and connection upgrade paths.</p>',
      /* The same start date as the saved row, which is what the match reads.
         The end date is new and the match does not look at it. */
      startDate: '2021-03',
      endDate: '2025-12',
      isCurrent: false,
      location: 'Berlin, Germany',
    },
    {
      key: 'newer-3',
      title: 'Protocol Engineer',
      company: 'Meridian Labs',
      description: '<p>Consensus and peer discovery for a permissioned network.</p>',
      startDate: '2018-09',
      endDate: '2021-02',
      isCurrent: false,
      location: 'Remote',
    },
    {
      key: 'newer-4',
      title: 'Backend Engineer',
      company: 'Northwind Systems',
      description: '<p>Storage services and the data pipeline behind them.</p>',
      startDate: '2016-01',
      endDate: '2018-08',
      isCurrent: false,
      location: 'Munich, Germany',
    },
  ],
};

/**
 * The realistic-bad case: the current role reads "2021 – present" with no month,
 * so the year alone can't fill a month/year field and the parser returns nothing
 * rather than guessing January. Location is missing for the same reason — the
 * document simply didn't carry one.
 */
const MISSING_DATE: ParsedProfile = {
  name: 'Polina Bublii',
  email: '',
  role: 'Senior Protocol Engineer',
  location: '',
  skills: ['Distributed Systems', 'Rust'],
  experiences: [
    {
      key: 'parsed-1',
      title: 'Senior Protocol Engineer',
      company: 'Lattice Compute',
      description: '',
      startDate: '',
      endDate: null,
      isCurrent: true,
      location: '',
    },
    {
      key: 'parsed-2',
      title: 'Protocol Engineer',
      company: 'Meridian Labs',
      description: '',
      startDate: '2018-09',
      endDate: '2021-02',
      isCurrent: false,
      location: 'Remote',
    },
  ],
};

/**
 * THE HALF-READ DOCUMENT — a real and common outcome, not an edge case.
 *
 * Positions are the hardest thing on a CV to extract: they are a layout, not a
 * list, and a two-column template, a table, or dates in a right-hand gutter all
 * defeat the pass that reads them. The headline, the location and the skills row
 * are comparatively easy, because they sit in running text.
 *
 * So this is a file that gave up everything except the work history. It used to
 * hit the dead end and be discarded whole — six usable facts thrown away, with
 * "we couldn't find any roles in that file" as the explanation. It now reaches
 * the review, which simply doesn't draw an Experience group.
 */
const NO_POSITIONS: ParsedProfile = {
  name: 'Polina Bublii',
  email: 'polina@latticecompute.xyz',
  role: 'Senior Protocol Engineer',
  location: 'Berlin, Germany',
  skills: ['Distributed Systems', 'Rust', 'libp2p', 'QUIC', 'Go'],
  experiences: [],
};

/**
 * DELETE WITH: the `design-canvas/` folder.
 *
 * The same fixtures, without the delay. The design canvas photographs a settled
 * page, so it needs the review card already holding a result rather than a
 * promise that resolves 1.8 seconds after the shutter. Reads the same record
 * `parseDocument` resolves to, so a frame can never show a parse the real
 * pipeline would not produce.
 */
export const parseResultFor = (scenario: ParseScenario): ParsedProfile => RESULTS[scenario] ?? EMPTY_RESULT;

const RESULTS: Record<ParseScenario, ParsedProfile> = {
  'three-roles': THREE_ROLES,
  'missing-date': MISSING_DATE,
  'no-positions': NO_POSITIONS,
  'nothing-found': EMPTY_RESULT,
  'newer-cv': NEWER_CV,
};

/**
 * Rejecting with this rather than resolving empty: cancelling is not the same
 * answer as "nothing found", and only one of the two should show that message.
 */
export const PARSE_CANCELLED = Symbol('parse-cancelled');

/**
 * Resolves to what the document said, after two beats: `uploaded` settles when
 * the file has landed, `result` when it has been read. A file that can't be
 * read resolves *empty* rather than throwing — "we couldn't read details from
 * that file" is the same sentence either way, and the person can do the same
 * thing about it.
 *
 * Note that resolving with *some* fields filled and no `experiences` is a normal
 * result, not a failure: see `NO_POSITIONS`. Only a wholly empty record raises
 * the dead end, which is the panel's call to make (`isEmptyParse`), not this
 * function's.
 *
 * Returns a `cancel` alongside the promises, so either beat can be backed out
 * of: someone who dropped the wrong file shouldn't have to wait for it. Only
 * `result` rejects on cancel; `uploaded` simply never settles, so a caller
 * waiting on it to advance the state has nothing to catch.
 */
export function parseDocument(scenario: ParseScenario): {
  uploaded: Promise<void>;
  result: Promise<ParsedProfile>;
  cancel: () => void;
} {
  let uploadTimer: ReturnType<typeof setTimeout> | undefined;
  let parseTimer: ReturnType<typeof setTimeout> | undefined;
  let rejectResult: ((reason: unknown) => void) | undefined;

  const uploaded = new Promise<void>((resolve) => {
    uploadTimer = setTimeout(resolve, MOCK_UPLOAD_MS);
  });

  /* The executor runs synchronously, so `rejectResult` is always assigned
     before anything can reach `cancel`. The read starts only once the upload
     has landed, the way production's poll starts only once the post returns. */
  const result = new Promise<ParsedProfile>((resolve, reject) => {
    rejectResult = reject;
    uploaded.then(() => {
      parseTimer = setTimeout(() => resolve(RESULTS[scenario] ?? EMPTY_RESULT), mockReadMs());
    });
  });

  const cancel = () => {
    if (uploadTimer) clearTimeout(uploadTimer);
    if (parseTimer) clearTimeout(parseTimer);
    rejectResult?.(PARSE_CANCELLED);
  };

  return { uploaded, result, cancel };
}
