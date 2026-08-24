/**
 * Review-only URL states, for the design canvas at `/design-canvas/job-board`.
 *
 * DELETE WITH: the `design-canvas/` folder.
 *
 * **Why this file exists.** The canvas photographs real routes — it never draws a
 * stand-in for a screen — so every state it holds a frame of has to be reachable
 * at a URL. Most of this board's states already are: `?viewer=` picks the entry
 * state, `?profile=1` opens the drawer, `?email=1` opens the email artifact, and
 * the whole filter rail is URL-backed through `useMockJobsFilterStore`. What is
 * NOT reachable is the overlays, because they are parent-held state opened by a
 * press: the sign-up modal, the apply modal, and the beats inside them.
 *
 * That gap is the difference between a canvas of destinations and a canvas that
 * shows what happens between them — the field focused and empty, the field
 * filled, the press refused — which is the part a reviewer cannot judge from a
 * gallery of finished screens.
 *
 * **These are affordances, not features.** Nothing on the board links to any of
 * them, none of them can be reached by a person using the product, and each only
 * forces a state the surface already holds. They are concentrated here, and read
 * in exactly one place (`JobBoardPrototype`'s mount effect), so deleting the
 * canvas is deleting this file and one block.
 */

import type { ParseScenario } from '../profile-shared/ExperienceImport/parseMocks';
import type { BoardViewer } from './viewerState';

/** The query key the canvas appends. Fixed by `design-canvas/core` — see its `types.ts`. */
export const CANVAS_STATE_PARAM = 'canvas';

/**
 * What a canvas state does to the board, as data rather than as a branch.
 *
 * Every field is optional and every one is applied on top of whatever `?viewer=`
 * already seeded, so a state says only what it CHANGES. That ordering matters:
 * `apply-letter-filled` is meaningless on an empty profile, so it names the
 * viewer it needs rather than trusting the URL to carry one.
 */
export interface CanvasStateSpec {
  /** Seeds the entry state first, exactly as the Preview-as switch does. */
  viewer?: BoardViewer;
  /**
   * Opens the account form. `'generic'` is the header/banner door and carries no
   * role; `'role'` is Apply-while-logged-out, which names the role in its header
   * and resumes on it. The two render different copy, so they are two frames.
   */
  signUp?: 'generic' | 'role';
  /** Fills the account form, so the frame shows a form with answers in it rather than placeholders. */
  signUpFilled?: boolean;
  /**
   * Runs the form's own yup validation with nothing entered, so the frame shows
   * the refusal in the words it really renders ("Email is required"). The one
   * beat that cannot be faked from outside the form — see `JobSignUpModal`.
   */
  signUpRefused?: boolean;
  /** Opens the apply modal on a role, which is the profile read-back plus the letter. */
  apply?: boolean;
  /** Seeds the cover letter, for the difference between an empty letter and a written one. */
  coverLetter?: string;
  /** Opens the profile drawer. Also reachable as `?profile=1`; here so a state can combine it. */
  drawer?: boolean;
  /**
   * Opens the Experience card's importer, and pins which beat of it to show.
   *
   * Every one of these lives inside component state that a person reaches by
   * pressing: the importer opens on a press, a door opens on a press, and the
   * review card exists for the 1.8 seconds after a file is read. `scenario`
   * names which fixture came back — the same three `parseMocks` resolves, so a
   * frame can never show a parse the real pipeline would not produce.
   */
  import?: {
    source?: 'resume' | 'linkedin';
    status?: 'idle' | 'reading' | 'nothing-found';
    fileName?: string;
    scenario?: ParseScenario;
  };
}

/**
 * The letter the "written" frames show.
 *
 * Long enough to wrap, specific enough to be worth reading, and the same text the
 * seeded applications use — the board and its artifacts should quote one person,
 * not three different ones.
 */
const SAMPLE_COVER_LETTER =
  'I built the transport layer this role touches — QUIC upgrade paths at Lattice, and the libp2p maintainer seat before that. Ecosystem growth here means talking to the teams already shipping on it, which is the half I have been doing informally for two years.';

/**
 * Every state the canvas can pin, keyed by the name its declaration uses.
 *
 * Kept deliberately small: a state earns a place here only when it is a frame on
 * the canvas that no existing parameter can reach. Anything `?viewer=`, `?scope=`,
 * `?profile=1`, `?email=1` or the filter rail already produces is declared with
 * those instead, because a review-only flag that duplicates a real one is a
 * second way for the two to disagree.
 */
export const CANVAS_STATES: Record<string, CanvasStateSpec> = {
  /* The account form, both doors. */
  'signup-generic': { viewer: 'logged-out', signUp: 'generic' },
  'signup-on-role': { viewer: 'logged-out', signUp: 'role' },
  'signup-filled': { viewer: 'logged-out', signUp: 'role', signUpFilled: true },
  'signup-refused': { viewer: 'logged-out', signUp: 'role', signUpRefused: true },

  /* The apply modal. `profile-ready` because a finished profile is what sends
     Apply straight to the letter — on an empty one the press opens the drawer
     instead, which is a different frame and already reachable. */
  'apply-letter-empty': { viewer: 'profile-ready', apply: true },
  'apply-letter-filled': { viewer: 'profile-ready', apply: true, coverLetter: SAMPLE_COVER_LETTER },

  /* The drawer, on the way to an application rather than opened from the title
     line — so it names the role it is holding up, which `?profile=1` alone does
     not. */
  'drawer-pending-apply': { viewer: 'profile-incomplete', apply: true, drawer: true },

  /* Filling the profile from a document. `profile-incomplete` throughout, because
     the importer is only offered while the Experience section is empty — an
     import offer over a history someone has already written is nagging, and the
     drawer hides it once there are entries. */
  /* There is no `import-doors` state, deliberately. The doors live inline in the
     empty Experience section, so a state that opened them would render exactly
     what `?viewer=profile-incomplete&profile=1` already renders — two frames of
     one screen, which the oracle fails and a reader cannot tell apart. The doors
     are the `drawer-empty` frame, and the import flow starts there. */
  'import-resume': { viewer: 'profile-incomplete', drawer: true, import: { source: 'resume' } },
  'import-linkedin': { viewer: 'profile-incomplete', drawer: true, import: { source: 'linkedin' } },
  'import-reading': {
    viewer: 'profile-incomplete',
    drawer: true,
    import: { source: 'resume', status: 'reading', fileName: 'polina-bublii-cv.pdf' },
  },
  'import-nothing-found': {
    viewer: 'profile-incomplete',
    drawer: true,
    import: { source: 'resume', status: 'nothing-found' },
  },
  'import-review': { viewer: 'profile-incomplete', drawer: true, import: { scenario: 'three-roles' } },
  /* The one parse that cannot be saved as it stands: the record requires a start
     date and this document did not give one. It is a frame rather than an edge
     case because it is the common failure — plenty of CVs write "2021 – present"
     with no month. */
  'import-review-missing-date': {
    viewer: 'profile-incomplete',
    drawer: true,
    import: { scenario: 'missing-date' },
  },
};

/** Reads the pinned state off a query string. Unknown or absent → nothing pinned. */
export function readCanvasState(search: string): CanvasStateSpec | null {
  try {
    const raw = new URLSearchParams(search).get(CANVAS_STATE_PARAM);
    if (!raw) return null;
    return CANVAS_STATES[raw] ?? null;
  } catch {
    /* No parsable query — the board opens in its default state, which is the
       state it would have been in anyway. */
    return null;
  }
}
