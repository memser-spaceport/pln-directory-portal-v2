/**
 * Review-only URL states, for the design canvas at `/design-canvas/job-board`.
 *
 * DELETE WITH: the `design-canvas/` folder.
 *
 * **Why this file exists.** The canvas photographs real routes — it never draws a
 * stand-in for a screen — so every state it holds a frame of has to be reachable
 * at a URL. Most of this board's states already are: `?viewer=` picks the entry
 * state, `?profile=1` opens the profile editor, `?email=1` opens the email artifact, and
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
import type { ListingStatus } from './listings';

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
   * Opens the account form — the header/banner `Sign up` door.
   *
   * A boolean where it was `'generic' | 'role'`. The `'role'` variant pinned
   * Apply-while-logged-out, which opened this same modal with the job named in
   * its header; that door is the apply flow's `flow: 'profile'` details step
   * now, and it is pinned as such. One door, one frame.
   */
  signUp?: boolean;
  /** Fills the account form, so the frame shows a form with answers in it rather than placeholders. */
  signUpFilled?: boolean;
  /**
   * Runs the form's own yup validation with nothing entered, so the frame shows
   * the refusal in the words it really renders ("Email is required"). The one
   * beat that cannot be faked from outside the form — see `JobSignUpModal`.
   */
  signUpRefused?: boolean;
  /**
   * Opens the apply flow on a role, at the named step.
   *
   * One field where there were three (`apply`, `drawer`, and the two together
   * meaning "the drawer with a role pending"). That combination existed because
   * the flow was three components and a state had to say which of them was
   * mounted; there is one now, and a step is the whole answer.
   */
  flow?: 'review' | 'profile' | 'application';
  /** Seeds the cover letter, for the difference between an empty letter and a written one. */
  coverLetter?: string;
  /** Opens the "Remove CV" confirmation over the profile step's resting CV card. */
  removeCv?: boolean;
  /** Opens the **Submit a job** form — the toolbar door a lead or admin has. */
  submitJob?: boolean;
  /** Fills that form in, so the frame shows answers rather than placeholders. */
  submitJobFilled?: boolean;
  /**
   * With `flow: 'review'`: opens the drawer on the lead's own listing in the
   * named state rather than on the sample role — the frames that show what the
   * footer holds for a listing's owner. The three states are three different
   * Filecoin roles, so this picks the role as well as the pill.
   */
  manageJob?: ListingStatus;
  /**
   * Opens the Experience card's importer, and pins which beat of it to show.
   *
   * Every one of these lives inside component state that a person reaches by
   * pressing: the drop area opens on a press, and the review card exists for the
   * 1.8 seconds after a file is read. `scenario` names which fixture came back —
   * the same three `parseMocks` resolves, so a frame can never show a parse the
   * real pipeline would not produce.
   *
   * `source` used to sit here, choosing between a resume door and a LinkedIn
   * one. There is a single door now, so `open` is the whole question.
   */
  import?: {
    open?: boolean;
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
  /* The account form's one remaining door: `Sign up`, pressed without a job in
     hand. (`signup-on-role` is gone — Apply while logged out is a step of the
     flow now, pinned as `flow-details-*` below.) */
  'signup-generic': { viewer: 'logged-out', signUp: true },
  'signup-filled': { viewer: 'logged-out', signUp: true, signUpFilled: true },
  'signup-refused': { viewer: 'logged-out', signUp: true, signUpRefused: true },

  /* The flow's first step: the job, read in the app, with Apply under it. The
     rail above it is the frame's whole point — it is where a reader can see that
     applying is three named places, and that one of them is already ticked. Two
     viewers, because the rail and the footer both differ: a finished profile
     shows step 2 checked and promises one press, an empty one shows it waiting. */
  'flow-review-ready': { viewer: 'profile-ready', flow: 'review' },
  'flow-review-incomplete': { viewer: 'profile-incomplete', flow: 'review' },
  /* And the same first step for someone with no account at all — the frame that
     shows the rail reading `Review job · Your details · Application`, which is
     the whole point of folding sign-up into the flow. */
  'flow-review-logged-out': { viewer: 'logged-out', flow: 'review' },

  /* Step 2 for a visitor with no account: the details that open one. Two
     viewers' worth of one position, so the canvas can hold this beside
     `drawer-pending-apply` and show that the rail keeps its shape either way. */
  'flow-details-empty': { viewer: 'logged-out', flow: 'profile' },

  /* The last step. `profile-ready` because a finished profile is what sends
     Apply straight here — on an empty one the press lands on the profile step
     instead, which is a different frame and pinned below. */
  'apply-letter-empty': { viewer: 'profile-ready', flow: 'application' },
  'apply-letter-filled': { viewer: 'profile-ready', flow: 'application', coverLetter: SAMPLE_COVER_LETTER },

  /* The middle step, reached on the way to an application rather than from a
     banner — so it names the role it is holding up, which `?profile=1` alone
     does not. */
  'drawer-pending-apply': { viewer: 'profile-incomplete', flow: 'profile' },

  /* Filling the profile from a document. `profile-incomplete` throughout, because
     the importer is only offered while the Experience section is empty — an
     import offer over a history someone has already written is nagging, and the
     drawer hides it once there are entries. */
  /* There is no state for the offer itself, deliberately. It stands in a card at
     the top of the drawer with its drop area already open, so a state that
     showed it would render exactly what `?viewer=profile-incomplete&profile=1`
     already renders — two frames of one screen, which a reader cannot tell
     apart. The offer is the `drawer-empty` frame, and the import starts there.

     Two states used to sit here and both are gone with what they photographed:
     `import-resume`, from when the offer was a pill you had to press, and
     `import-linkedin`, from when a second door led to this same drop area. */
  'import-reading': {
    viewer: 'profile-incomplete',
    flow: 'profile',
    import: { open: true, status: 'reading', fileName: 'polina-bublii-cv.pdf' },
  },
  'import-nothing-found': {
    viewer: 'profile-incomplete',
    flow: 'profile',
    import: { open: true, status: 'nothing-found' },
  },
  'import-review': { viewer: 'profile-incomplete', flow: 'profile', import: { scenario: 'three-roles' } },
  /* The one parse that cannot be saved as it stands: the record requires a start
     date and this document did not give one. It is a frame rather than an edge
     case because it is the common failure — plenty of CVs write "2021 – present"
     with no month. */
  'import-review-missing-date': {
    viewer: 'profile-incomplete',
    flow: 'profile',
    import: { scenario: 'missing-date' },
  },

  /* --- The kept CV ---------------------------------------------------------
     The returning member's profile carries a file (`FILLED_PROFILE.cv`), so its
     profile step opens on the resting card: the file row, Replace and Remove in
     the header. The flow normally skips that step for a finished profile;
     `flow: 'profile'` opens it the way "Edit profile" on the letter does. */
  'cv-resting': { viewer: 'profile-ready', flow: 'profile' },
  /* Replace pressed and a file chosen: the section is the reading row, with
     Cancel beside the title as the way back to the file. */
  'cv-replace-reading': {
    viewer: 'profile-ready',
    flow: 'profile',
    import: { open: true, status: 'reading', fileName: 'polina-bublii-cv-2026.pdf' },
  },
  /* Remove pressed: the confirmation, over the card it is about. */
  'cv-remove-confirm': { viewer: 'profile-ready', flow: 'profile', removeCv: true },

  /* --- Posting a job ---------------------------------------------------------
     The lead's door and what is behind it. The board states these sit between
     (`?viewer=team-lead`, `&scope=manage`, `?viewer=directory-admin`) are plain
     parameters and are declared as such; only the overlays need a pin. */
  'submit-job-empty': { viewer: 'team-lead', submitJob: true },
  'submit-job-filled': { viewer: 'team-lead', submitJob: true, submitJobFilled: true },
  /* The admin's form: one more field, the team, because an admin posts for any. */
  'submit-job-admin': { viewer: 'directory-admin', submitJob: true },
  /* The drawer on the lead's own listings, one per state — what the footer holds
     when the reader owns the job rather than applies to it. */
  'manage-drawer-in-review': { viewer: 'team-lead', flow: 'review', manageJob: 'in-review' },
  'manage-drawer-live': { viewer: 'team-lead', flow: 'review', manageJob: 'live' },
  'manage-drawer-inactive': { viewer: 'team-lead', flow: 'review', manageJob: 'inactive' },
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
