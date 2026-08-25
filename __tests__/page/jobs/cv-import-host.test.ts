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
  hasLocation: false,
  skillCount: 0,
  experienceCount: 0,
  experiencesLoading: false,
  handedOff: false,
};

describe('which card hosts the CV importer', () => {
  it('puts it at the top of the drawer while the profile is blank', () => {
    expect(pickCvImportHost(blank)).toBe('top-card');
  });

  /**
   * The whole reason the card is at the top rather than in the Experience
   * section: a CV answers the *required role*, so on a blank profile it is not
   * an Experience feature — it is the fastest route through every card below.
   * Each of these four is enough on its own to say "already started by hand".
   */
  it.each([
    ['a role', { hasRole: true }],
    ['a location', { hasLocation: true }],
    ['skills', { skillCount: 3 }],
    ['work history', { experienceCount: 1 }],
  ])('hands it back to the Experience section once the profile has %s', (_label, filled) => {
    expect(pickCvImportHost({ ...blank, ...filled })).toBe('experience-section');
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
      for (const hasLocation of flags) {
        for (const experiencesLoading of flags) {
          for (const handedOff of flags) {
            for (const skillCount of [0, 2]) {
              for (const experienceCount of [0, 5]) {
                expect(
                  pickCvImportHost({
                    enabled: false,
                    hasRole,
                    hasLocation,
                    skillCount,
                    experienceCount,
                    experiencesLoading,
                    handedOff,
                  }),
                ).toBe('off');
              }
            }
          }
        }
      }
    }
  });
});
