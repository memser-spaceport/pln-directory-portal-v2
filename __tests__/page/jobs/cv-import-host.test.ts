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
  experienceCount: 0,
  experiencesLoading: false,
  handedOff: false,
  hasStoredCv: false,
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

  /**
   * The in-flight guard is the outermost one now that the flag is gone, so it is
   * worth exhausting rather than spot-checking: a future condition added below
   * the `experiencesLoading` early return would be caught here.
   */
  it('stays off for every profile shape while the row count is in flight', () => {
    for (const handedOff of [true, false]) {
      for (const experienceCount of [0, 5]) {
        for (const hasStoredCv of [true, false]) {
          expect(pickCvImportHost({ experienceCount, experiencesLoading: true, handedOff, hasStoredCv })).toBe('off');
        }
      }
    }
  });

  /**
   * A kept CV settles the screen on its own.
   *
   * Not "an offer for people with no history" plus "a card for people with a
   * file" — one answer, decided before the offer questions are asked. Someone
   * who uploaded a CV *and* typed their roles in by hand holds a document, and
   * `experienceCount` has nothing to say about them.
   */
  describe('once a CV is already held', () => {
    it('draws the kept file instead of offering an upload', () => {
      expect(pickCvImportHost({ ...blank, hasStoredCv: true })).toBe('stored');
    });

    it('still draws it for someone who also has work history', () => {
      expect(pickCvImportHost({ ...blank, hasStoredCv: true, experienceCount: 5 })).toBe('stored');
    });

    it('still draws it after a hand-off', () => {
      expect(pickCvImportHost({ ...blank, hasStoredCv: true, handedOff: true })).toBe('stored');
    });

    /*
     * The reason `undefined` is its own case rather than falsy. Collapsing it
     * into "no CV" shows the upload offer for one render to someone who has
     * already uploaded, then swaps it for their file underneath them — the same
     * flash `experiencesLoading` exists to prevent.
     */
    it('withholds every host until the answer is in', () => {
      expect(pickCvImportHost({ ...blank, hasStoredCv: undefined })).toBe('off');
      expect(pickCvImportHost({ ...blank, hasStoredCv: undefined, experienceCount: 5 })).toBe('off');
    });
  });
});
