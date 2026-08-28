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
  /**
   * How many Experience rows the profile already has — the whole of the test
   * now. `hasRole`, `hasLocation` and `skillCount` were all in here once; each
   * was a proxy for "has already started filling this in", and none of them
   * meant it. See `pickCvImportHost`.
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
  const { enabled, experienceCount, experiencesLoading, handedOff } = input;

  if (!enabled) return 'off';
  if (experiencesLoading) return 'off';

  /**
   * Nothing a CV would supply, so a CV is the fastest way to supply it.
   *
   * **Narrower than the prototype's, and narrower again than this was.** The
   * prototype required an empty location and no skills as well, on the argument
   * that a CV fills those too. That broke against production's data, because the
   * profile is already partly filled before anyone reaches this drawer:
   * `/sign-up` collects Professional skills and the board's sign-up modal
   * collects the current role. "Has skills" never meant "has started filling
   * this in by hand" — it meant "came through the front door", and the wide test
   * quietly withheld the card from most of the people it was built for.
   *
   * `hasRole` has since gone the same way, for the same reason and with more
   * force: it is the field the *sign-up form* fills, so requiring it to be empty
   * meant the card almost never appeared.
   *
   * What is left is the one thing that is real evidence of having written your
   * history out by hand, which is the only case where "start with your CV" is
   * telling someone to start over.
   */
  /* The offer stands until there is something to have uploaded.
     This used to also require `!hasRole` — a profile with a current role typed
     in read as "already started by hand", so the card stood down and the offer
     moved four cards into the Experience section. That was wrong for the people
     it was built for: the board's own sign-up modal collects the current role,
     so almost everyone arriving here has one and almost nobody saw the card.
     A role is one field; a CV is the work history, and having typed the former
     is no evidence of having written the latter. */
  if (experienceCount === 0 && !handedOff) return 'top-card';
  return 'experience-section';
}
