import { getJobProfileReviewed, setJobProfileReviewed } from '@/services/jobs/job-profile-reviewed';

const STORAGE_KEY = 'directory:jobProfileReviewed';

/**
 * The store behind "My profile is complete".
 *
 * The tick is asked once and remembered, so what this file is really guarding is
 * that it is remembered *for the right person* and that nothing but a genuine
 * stored `true` ever counts as a confirmation.
 */
describe('the job profile reviewed store', () => {
  beforeEach(() => window.localStorage.clear());

  it('remembers a confirmation across reads', () => {
    expect(getJobProfileReviewed('m1')).toBe(false);

    setJobProfileReviewed('m1', true);

    expect(getJobProfileReviewed('m1')).toBe(true);
  });

  /**
   * The reason this is keyed at all.
   *
   * localStorage belongs to the browser, not the account — one laptop can sign in
   * as two people. A confirmation is a claim about a specific profile, so handing
   * the second person the first person's tick would be the flow making that claim
   * on their behalf, which is the one thing it exists to prevent.
   */
  it('keeps one member’s confirmation away from another’s', () => {
    setJobProfileReviewed('m1', true);

    expect(getJobProfileReviewed('m2')).toBe(false);
  });

  /* Unticking is an answer, not an absence. A store that only ever recorded
     `true` would keep confirming on the next visit for someone who has just said
     they no longer stand behind the profile. */
  it('records an untick rather than forgetting it', () => {
    setJobProfileReviewed('m1', true);
    setJobProfileReviewed('m1', false);

    expect(getJobProfileReviewed('m1')).toBe(false);
  });

  it('holds several members at once', () => {
    setJobProfileReviewed('m1', true);
    setJobProfileReviewed('m2', true);
    setJobProfileReviewed('m1', false);

    expect(getJobProfileReviewed('m1')).toBe(false);
    expect(getJobProfileReviewed('m2')).toBe(true);
  });

  /**
   * Anything that is not a stored `true` asks again.
   *
   * These are the shapes a bare truthiness check would wave through: a string
   * `"true"`, an array, a non-boolean value under the uid. None of them is a
   * confirmation anybody made, and the safe direction for this particular flag is
   * always "ask".
   */
  it.each([
    ['not JSON at all', 'nonsense{'],
    ['a JSON string', '"true"'],
    ['a JSON array', '["m1"]'],
    ['null', 'null'],
    ['a truthy non-boolean under the uid', '{"m1":"yes"}'],
    ['a number under the uid', '{"m1":1}'],
  ])('does not read %s as a confirmation', (_label, raw) => {
    window.localStorage.setItem(STORAGE_KEY, raw);

    expect(getJobProfileReviewed('m1')).toBe(false);
  });

  /* A logged-out visitor has no uid, and the consent never renders for them —
     but the store is the thing that must not invent an answer if it ever does. */
  it('answers no and writes nothing without a member uid', () => {
    setJobProfileReviewed(undefined, true);

    expect(getJobProfileReviewed(undefined)).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  /* Best-effort: a store that cannot be written is one extra click, and a store
     that throws takes the apply flow down with it. */
  it('survives a localStorage that refuses to write', () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => setJobProfileReviewed('m1', true)).not.toThrow();

    setItem.mockRestore();
  });
});
