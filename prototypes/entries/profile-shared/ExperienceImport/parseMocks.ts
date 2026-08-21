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

export type ParseScenario = 'three-roles' | 'missing-date' | 'nothing-found';

export const PARSE_SCENARIOS: Array<{ value: ParseScenario; label: string }> = [
  { value: 'three-roles', label: 'Three roles' },
  { value: 'missing-date', label: 'Missing a start date' },
  { value: 'nothing-found', label: 'Nothing found' },
];

/** How long the reading state is worth looking at. */
const PARSE_DELAY_MS = 1800;

const EMPTY_RESULT: ParsedProfile = { role: '', location: '', skills: [], experiences: [] };

/**
 * Seeded from the same network the board describes — `Lattice Compute` and
 * `libp2p` are the names `FILLED_PROFILE` and the board's own mocks use. A
 * fixture naming companies from a different universe would make the review read
 * as somebody else's résumé landing in your profile.
 */
const THREE_ROLES: ParsedProfile = {
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
 * The realistic-bad case: the current role reads "2021 – present" with no month,
 * so the year alone can't fill a month/year field and the parser returns nothing
 * rather than guessing January. Location is missing for the same reason — the
 * document simply didn't carry one.
 */
const MISSING_DATE: ParsedProfile = {
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
  'nothing-found': EMPTY_RESULT,
};

/**
 * Rejecting with this rather than resolving empty: cancelling is not the same
 * answer as "nothing found", and only one of the two should show that message.
 */
export const PARSE_CANCELLED = Symbol('parse-cancelled');

/**
 * Resolves to what the document said, after a beat. A file that can't be read
 * resolves *empty* rather than throwing — "we couldn't find any roles in that
 * file" is the same sentence either way, and the person can do the same thing
 * about it.
 *
 * Returns a `cancel` alongside the promise, so the reading state can be backed
 * out of: someone who dropped the wrong file shouldn't have to wait for it.
 */
export function parseDocument(scenario: ParseScenario): {
  result: Promise<ParsedProfile>;
  cancel: () => void;
} {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectResult: ((reason: unknown) => void) | undefined;

  /* The executor runs synchronously, so `rejectResult` is always assigned
     before anything can reach `cancel`. */
  const result = new Promise<ParsedProfile>((resolve, reject) => {
    rejectResult = reject;
    timer = setTimeout(() => resolve(RESULTS[scenario] ?? EMPTY_RESULT), PARSE_DELAY_MS);
  });

  const cancel = () => {
    if (timer) clearTimeout(timer);
    rejectResult?.(PARSE_CANCELLED);
  };

  return { result, cancel };
}
