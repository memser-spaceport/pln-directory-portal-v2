/**
 * Which card offers "fill this in from a CV" — asked once, answered once.
 *
 * There are two possible hosts and one mechanism:
 *
 *  - `'top-card'` — the drawer's own "Start with your CV", above the header
 *    card. Right while there is no role and no work history, because a CV
 *    answers the **required current role** as well as the history. Offering it
 *    inside the Experience section then describes it as smaller than it is and
 *    buries it four cards down; a control that answers the questions above it
 *    belongs above them.
 *  - `'experience-section'` — the Experience card's own empty row (or its
 *    "Update from CV" header control), next to the section it fills. Right once
 *    a history exists: that person has already done this by hand, and a slab at
 *    the top telling them to start over is noise.
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
  /**
   * How many Experience rows the profile already has.
   *
   * With `hasRole`, the whole of the blank test — see `pickCvImportHost`. There
   * used to be `hasLocation` and `skillCount` here too; they were wrong for
   * production and are gone.
   */
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
  const { enabled, hasRole, experienceCount, experiencesLoading, handedOff } = input;

  if (!enabled) return 'off';
  if (experiencesLoading) return 'off';

  /**
   * Nothing a CV would supply, so a CV is the fastest way to supply it: no
   * current role, and no work history.
   *
   * **Narrower than the prototype's, on purpose.** The prototype also required
   * an empty location and no skills, on the argument that a CV fills those too
   * so the card is only right while *none* of them has an answer. That argument
   * holds against the prototype's own data and breaks against production's,
   * because the profile is already partly filled before anyone reaches this
   * drawer: `/sign-up` collects Professional skills, and the board's own
   * sign-up modal collects the current role. So "has skills" never meant "has
   * started filling this in by hand" — it meant "came through the front door",
   * and the widest test quietly withheld the card from most of the people it
   * was built for.
   *
   * What the two survivors mean is the thing the prototype was actually
   * reaching for. `hasRole` is the required field the card exists to fill;
   * `experienceCount` is the only real evidence that someone has already
   * written their history out by hand, which is the one case where a card
   * saying "start with your CV" is telling them to start over.
   *
   * Bio and location are left out for the same reason skills is: neither is
   * evidence of anything, and a member who set a location during onboarding has
   * not started on the facts a CV carries.
   */
  const profileIsBlank = !hasRole && experienceCount === 0;

  if (profileIsBlank && !handedOff) return 'top-card';
  return 'experience-section';
}
