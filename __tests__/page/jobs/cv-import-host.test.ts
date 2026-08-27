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
  experienceCount: 0,
  experiencesLoading: false,
  handedOff: false,
};

describe('which card hosts the CV importer', () => {
  it('puts it at the top of the drawer when there is nothing a CV would supply', () => {
    expect(pickCvImportHost(blank)).toBe('top-card');
  });

  /**
   * The one thing that means the card is no longer the right first move: the
   * person has already written the history out by hand, and an offer to start
   * from a CV would be telling them to start over.
   */
  it('hands it back to the Experience section once there is work history', () => {
    expect(pickCvImportHost({ ...blank, experienceCount: 1 })).toBe('experience-section');
  });

  /**
   * The regression this replaces. `hasRole: true` used to send the offer four
   * cards down into the Experience section — and the board's own sign-up modal
   * collects the current role, so almost everyone arriving here had one and
   * almost nobody saw the card. A role is one field; a CV is the history.
   */
  it('still offers the card to someone who has a role but no history', () => {
    expect(pickCvImportHost({ ...blank, experienceCount: 0 })).toBe('top-card');
  });

  /**
   * The whole rule, as a table.
   *
   * It has been narrowed twice, both times for the same reason: every extra
   * input was a proxy for "has already started filling this in by hand", and
   * none of them meant it. Location and skills went first (`/sign-up` collects
   * skills), then the current role (the board's sign-up modal collects it).
   *
   * One input decides it now. If a second ever gets added, this table is what
   * should have to change to allow it.
   */
  it.each([
    [0, 'top-card'],
    [1, 'experience-section'],
    [4, 'experience-section'],
  ] as const)('history=%s → %s', (experienceCount, expected) => {
    expect(pickCvImportHost({ ...blank, experienceCount })).toBe(expected);
  });

  it('offers nothing at all when the flag is down', () => {
    expect(pickCvImportHost({ ...blank, enabled: false })).toBe('off');
    expect(pickCvImportHost({ ...blank, enabled: false, experienceCount: 4 })).toBe('off');
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
    for (const experiencesLoading of flags) {
      for (const handedOff of flags) {
        for (const experienceCount of [0, 5]) {
          expect(
            pickCvImportHost({
              enabled: false,
              experienceCount,
              experiencesLoading,
              handedOff,
            }),
          ).toBe('off');
        }
      }
    }
  });
});
