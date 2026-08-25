/**
 * Which card offers "fill this in from a CV" — asked once, answered once.
 *
 * There are two possible hosts and one mechanism:
 *
 *  - `'top-card'` — the drawer's own "Start with your CV", above the header
 *    card. Right while the profile is blank, because a CV answers the
 *    **required current role** as well as location, skills and the work history.
 *    Offering it inside the Experience section then describes it as smaller than
 *    it is and buries it four cards down; a control that answers the questions
 *    above it belongs above them.
 *  - `'experience-section'` — the Experience card's own empty row, next to the
 *    section it fills. Right once anything is filled in: that person is already
 *    doing this by hand, and a slab at the top telling them to start over is
 *    noise.
 *  - `'off'` — the flag is down, or nobody should be offered it right now.
 *
 * **A function returning one host rather than two booleans on the call site.**
 * Two entry points to one mechanism on one screen is a choice the person cannot
 * get right or wrong, and two independent expressions is exactly how that ships:
 * one gets a new condition, the other doesn't, and both doors open. Here the
 * drawer derives both props from a single answer, so "never both" is not a rule
 * anyone has to remember.
 */
export type CvImportHost = 'top-card' | 'experience-section' | 'off';

export interface CvImportHostInput {
  /** `SHOW_CV_IMPORT`. Down means no host, whatever else is true. */
  enabled: boolean;
  /** The drawer's own gate expression — the role that blocks applying. */
  hasRole: boolean;
  hasLocation: boolean;
  skillCount: number;
  experienceCount: number;
  /**
   * The row count is not in yet.
   *
   * In the test because without it a profile that *does* have history reads as
   * blank for one render — the count is 0 while the query is in flight — so the
   * top card would appear and then vanish under the reader. Withholding both
   * hosts for that render is the quiet failure; flashing the wrong one is not.
   */
  experiencesLoading: boolean;
  /**
   * Someone hit a parse dead end and pressed "Add manually".
   *
   * The Add form lives inside the Experience section and cannot be opened from
   * the top card, so the drawer stands down and the section takes the importer —
   * and its Add button — back. A real destination rather than a dismissal.
   */
  handedOff: boolean;
}

export function pickCvImportHost(input: CvImportHostInput): CvImportHost {
  const { enabled, hasRole, hasLocation, skillCount, experienceCount, experiencesLoading, handedOff } = input;

  if (!enabled) return 'off';
  if (experiencesLoading) return 'off';

  /* Deliberately wider than "no experience rows" — see `'top-card'` above. Bio
     is left out on purpose: someone who wrote a bio and nothing else has still
     not started on the facts a CV carries. */
  const profileIsBlank = !hasRole && !hasLocation && skillCount === 0 && experienceCount === 0;

  if (profileIsBlank && !handedOff) return 'top-card';
  return 'experience-section';
}
