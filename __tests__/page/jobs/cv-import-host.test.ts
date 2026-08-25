import { pickCvImportHost, type CvImportHostInput } from '@/components/page/jobs/JobProfileDrawer/cvImportHost';

/**
 * One mechanism, two possible hosts, never both.
 *
 * The rule this guards is a *placement* rule, and placement bugs are the kind
 * that look fine in a screenshot of the happy path: the top card and the
 * section's empty-row door render perfectly well side by side, they are just two
 * doors to the same room. So the assertions that matter most here are the
 * negative ones.
 */
const blank: CvImportHostInput = {
  enabled: true,
  hasRole: false,
  experienceCount: 0,
  experiencesLoading: false,
  handedOff: false,
};

describe('which card hosts the CV importer', () => {
  it('puts it at the top of the drawer when there is nothing a CV would supply', () => {
    expect(pickCvImportHost(blank)).toBe('top-card');
  });

  /**
   * The two things that mean the card is no longer the right *first* move: the
   * required field it exists to fill is already answered, or the person has
   * already written the history out by hand and a card saying "start with your
   * CV" would be telling them to start over.
   */
  it.each([
    ['a role', { hasRole: true }],
    ['work history', { experienceCount: 1 }],
  ])('hands it back to the Experience section once the profile has %s', (_label, filled) => {
    expect(pickCvImportHost({ ...blank, ...filled })).toBe('experience-section');
  });

  /**
   * The whole rule, as a table — and the regression it shipped with.
   *
   * The blank test used to also require an empty location and no skills. That
   * argument holds against the prototype's own `EMPTY_PROFILE` and breaks
   * against production's data, because the profile is already partly filled
   * before anyone reaches this drawer: `/sign-up` collects Professional skills
   * and the board's sign-up modal collects the current role. So "has skills"
   * never meant "has started filling this in by hand" — it meant "came through
   * the front door", and the card was silently withheld from most of the people
   * it was built for.
   *
   * Only these two inputs decide it now. If a third ever gets added to the blank
   * test, this table is what should have to change to allow it.
   */
  it.each([
    [false, 0, 'top-card'],
    [true, 0, 'experience-section'],
    [false, 4, 'experience-section'],
    [true, 4, 'experience-section'],
  ] as const)('role=%s history=%s → %s', (hasRole, experienceCount, expected) => {
    expect(pickCvImportHost({ ...blank, hasRole, experienceCount })).toBe(expected);
  });

  it('offers nothing at all when the flag is down', () => {
    expect(pickCvImportHost({ ...blank, enabled: false })).toBe('off');
    expect(pickCvImportHost({ ...blank, enabled: false, hasRole: true })).toBe('off');
  });

  /**
   * The flash this exists to prevent: a profile that *does* have history reads
   * as blank while the row query is in flight, because the count is 0 until it
   * lands. Without the guard the top card appears and then vanishes under the
   * reader. Withholding both hosts for that render is the quiet failure;
   * flashing the wrong one is not.
   */
  it('withholds both hosts until the row count is in', () => {
    expect(pickCvImportHost({ ...blank, experiencesLoading: true })).toBe('off');
    expect(pickCvImportHost({ ...blank, experiencesLoading: true, experienceCount: 4 })).toBe('off');
  });

  /**
   * "Add manually" out of a parse dead end. The Add form lives inside the
   * Experience section and cannot be opened from the top card, so the drawer
   * stands down and the section takes the importer — and its Add button — back.
   * A real destination rather than a dismissal into nothing.
   */
  it('hands off to the section when someone chooses to type it in', () => {
    expect(pickCvImportHost({ ...blank, handedOff: true })).toBe('experience-section');
  });

  it('still offers nothing after a hand-off if the flag is down', () => {
    expect(pickCvImportHost({ ...blank, handedOff: true, enabled: false })).toBe('off');
  });

  /**
   * The flag is the outermost gate, over every combination of the rest.
   *
   * Worth exhausting rather than spot-checking, because this is what keeps an
   * unshipped feature dark: the endpoints behind the importer
   * (`/cv-import/parse`, `/cv-import/apply`) are another team's work, so a state
   * that leaked past the flag would be a door that 404s. A future condition
   * added below the `!enabled` early return would be caught here.
   */
  it('stays off for every profile shape while the flag is down', () => {
    const flags = [true, false];
    for (const hasRole of flags) {
      for (const experiencesLoading of flags) {
        for (const handedOff of flags) {
          for (const experienceCount of [0, 5]) {
            expect(
              pickCvImportHost({
                enabled: false,
                hasRole,
                experienceCount,
                experiencesLoading,
                handedOff,
              }),
            ).toBe('off');
          }
        }
      }
    }
  });
});
