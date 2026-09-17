/**
 * The guard that stopped every member profile reloading forever.
 *
 * `getStoredCv` goes through `customFetch(..., true)`, and that wrapper answers
 * a missing refresh token with `logoutUser()` followed by
 * `window.location.reload()`. So an auto-firing query that runs while signed out
 * does not fail — it reloads the page, remounts, fires again, and loops. This
 * predicate is what keeps it from running.
 *
 * `SHOW_CV_IMPORT` is read from the environment at module load and is NOT set in
 * jest, so the real constant is `false` here and every case below would pass
 * against a broken implementation. The module is mocked per-case instead, and
 * the flag-off case is asserted explicitly rather than inherited.
 */

const loadWithFlag = (showCvImport: boolean) => {
  let enabled: typeof import('@/services/members/hooks/useStoredCv').storedCvQueryEnabled;
  jest.isolateModules(() => {
    jest.doMock('@/services/members/constants', () => ({
      ...jest.requireActual('@/services/members/constants'),
      SHOW_CV_IMPORT: showCvImport,
    }));
    enabled = require('@/services/members/hooks/useStoredCv').storedCvQueryEnabled;
  });
  return enabled!;
};

describe('storedCvQueryEnabled', () => {
  const uid = 'member-1';
  const authToken = 'token';

  it('runs for a signed-in member on a profile', () => {
    expect(loadWithFlag(true)({ uid, authToken })).toBe(true);
  });

  /* The regression. A signed-out reader on a member profile used to fire this,
     and customFetch turned the refusal into a reload loop. */
  it('does not run without a session', () => {
    expect(loadWithFlag(true)({ uid, authToken: undefined })).toBe(false);
    expect(loadWithFlag(true)({ uid, authToken: '' })).toBe(false);
  });

  it('does not run without a member', () => {
    expect(loadWithFlag(true)({ uid: undefined, authToken })).toBe(false);
    expect(loadWithFlag(true)({ uid: '', authToken })).toBe(false);
  });

  it('does not run behind a dark flag', () => {
    expect(loadWithFlag(false)({ uid, authToken })).toBe(false);
  });

  /* React Query v5 validates `enabled` and throws on a falsy non-boolean, which
     has taken this app down before — so the predicate must return a real
     boolean, never a coincidentally-falsy `undefined` or `''`. */
  it('always answers with a boolean', () => {
    for (const result of [
      loadWithFlag(true)({ uid, authToken }),
      loadWithFlag(true)({ uid: undefined, authToken: undefined }),
      loadWithFlag(false)({ uid, authToken }),
    ]) {
      expect(typeof result).toBe('boolean');
    }
  });
});
