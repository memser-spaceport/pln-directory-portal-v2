import { storedCvQueryEnabled } from '@/services/members/hooks/useStoredCv';

/**
 * The guard that stopped every member profile reloading forever.
 *
 * `getStoredCv` goes through `customFetch(..., true)`, and that wrapper answers
 * a missing refresh token with `logoutUser()` followed by
 * `window.location.reload()`. So an auto-firing query that runs while signed out
 * does not fail — it reloads the page, remounts, fires again, and loops. This
 * predicate is what keeps it from running.
 *
 * It used to carry `SHOW_CV_IMPORT` as well, and this file loaded the module
 * through `jest.isolateModules` to control it: the flag was read from the
 * environment at module load and is unset in jest, so the real constant was
 * `false` and every case here would have passed against a broken implementation.
 * The flag is gone and so is that machinery — but the trap is worth remembering
 * the next time a module-load constant lands in a predicate.
 */
describe('storedCvQueryEnabled', () => {
  const uid = 'member-1';
  const authToken = 'token';

  it('runs for a signed-in member on a profile', () => {
    expect(storedCvQueryEnabled({ uid, authToken })).toBe(true);
  });

  /* The regression. A signed-out reader on a member profile used to fire this,
     and customFetch turned the refusal into a reload loop. */
  it('does not run without a session', () => {
    expect(storedCvQueryEnabled({ uid, authToken: undefined })).toBe(false);
    expect(storedCvQueryEnabled({ uid, authToken: '' })).toBe(false);
  });

  it('does not run without a member', () => {
    expect(storedCvQueryEnabled({ uid: undefined, authToken })).toBe(false);
    expect(storedCvQueryEnabled({ uid: '', authToken })).toBe(false);
  });

  /* React Query v5 validates `enabled` and throws on a falsy non-boolean, which
     has taken this app down before — so the predicate must return a real
     boolean, never a coincidentally-falsy `undefined` or `''`. */
  it('always answers with a boolean', () => {
    for (const result of [
      storedCvQueryEnabled({ uid, authToken }),
      storedCvQueryEnabled({ uid: undefined, authToken: undefined }),
      storedCvQueryEnabled({ uid: '', authToken: '' }),
    ]) {
      expect(typeof result).toBe('boolean');
    }
  });
});
