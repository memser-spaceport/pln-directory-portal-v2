/**
 * Review-only URL states, for the design canvas at `/design-canvas/cv-upload`.
 *
 * DELETE WITH: the `design-canvas/` folder.
 *
 * **Why this file exists.** The canvas photographs real routes — it never draws
 * a stand-in for a screen — so every state it holds a frame of has to be
 * reachable at a URL. This page has none: it opens blank, and every beat after
 * that is component state a person reaches by dropping a document. Without this
 * the canvas could only ever hold the empty profile, which is the one state
 * nobody needs a canvas to see.
 *
 * **These are affordances, not features.** Nothing on the page links to any of
 * them, none can be reached by a person using the product, and each only forces
 * a state the page already holds. They are read in exactly one place
 * (`OnboardingPrototype`'s mount effect), so deleting the canvas is deleting
 * this file and one block.
 *
 * **Every seeded profile comes out of `parseMocks`, never out of a fixture
 * written here.** A frame showing a history the real pipeline could not produce
 * would be a picture of a design that does not exist.
 */

import { experienceKey } from '../profile-shared/ExperienceImport/ExperienceImportReview';
import { parseResultFor } from '../profile-shared/ExperienceImport/parseMocks';
import type { ParsedProfile } from '../profile-shared/ExperienceImport/types';

/** The query key the canvas appends. Fixed by `design-canvas/core` — see its `types.ts`. */
export const CANVAS_STATE_PARAM = 'canvas';

/** What a canvas state does to this page, as data rather than as a branch. */
export interface OnboardingCanvasState {
  /**
   * A profile that has already been through an import, applied through the
   * page's own `applyImport` so a seeded history is merged by the same three
   * rules a real one is.
   */
  seed?: ParsedProfile;
  /** The review card, open and holding this parse. */
  review?: ParsedProfile;
  /**
   * The importer panel's own beat. Both of these live in `useState` inside
   * `ExperienceImportPanel`, which is why the panel takes canvas props at all.
   */
  panel?: { status?: 'reading' | 'nothing-found'; fileName?: string };
}

/** The document the profile is first filled from. */
const FIRST_CV = parseResultFor('three-roles');
/** The same person's CV a year later, which is what a re-upload carries. */
const SECOND_CV = parseResultFor('newer-cv');

/* What the newer CV adds, and only that: the review unticks everything already
   on the profile, so a frame of the merged result has to do the same. The match
   rule is imported rather than restated — see `experienceKey`. */
const alreadyThere = new Set(FIRST_CV.experiences.map(experienceKey));
const NEW_ROLES = SECOND_CV.experiences.filter((entry) => !alreadyThere.has(experienceKey(entry)));
const NEW_SKILLS = SECOND_CV.skills.filter(
  (skill) => !FIRST_CV.skills.some((have) => have.toLowerCase() === skill.toLowerCase()),
);

/**
 * The profile after both documents.
 *
 * Role and location stay the first CV's, because an import fills a blank and
 * never overwrites an answer that is already there — the same rule
 * `applyImport` applies, expressed here so the seed is one call rather than two
 * calls reading each other's stale state.
 */
const AFTER_BOTH: ParsedProfile = {
  ...FIRST_CV,
  skills: [...FIRST_CV.skills, ...NEW_SKILLS],
  experiences: [...FIRST_CV.experiences, ...NEW_ROLES],
};

/**
 * Every state the canvas can pin, keyed by the name its declaration uses.
 *
 * Kept small on purpose: a state earns a place here only when it is a frame on
 * the canvas that nothing else can reach. The blank profile is not in this list,
 * because the page already opens on it.
 */
export const CANVAS_STATES: Record<string, OnboardingCanvasState> = {
  /* Handing the document over. */
  reading: { panel: { status: 'reading', fileName: 'polina-bublii-cv.pdf' } },
  'nothing-found': { panel: { status: 'nothing-found' } },

  /* What came back. */
  review: { review: FIRST_CV },
  'review-missing-date': { review: parseResultFor('missing-date') },

  /* After the merge, which is also where the second import starts. */
  filled: { seed: FIRST_CV },

  /* The second import: the same profile, and a newer document over it. The
     review is reached from the Experience card here rather than from the card at
     the top, because the top card is gone the moment anything is filled in. */
  'update-review': { seed: FIRST_CV, review: SECOND_CV },
  'update-merged': { seed: AFTER_BOTH },
};

/** Reads the pinned state off a query string. Unknown or absent → nothing pinned. */
export function readCanvasState(search: string): OnboardingCanvasState | null {
  try {
    const raw = new URLSearchParams(search).get(CANVAS_STATE_PARAM);
    if (!raw) return null;
    return CANVAS_STATES[raw] ?? null;
  } catch {
    /* No parsable query — the page opens blank, which is the state it would have
       been in anyway. */
    return null;
  }
}
