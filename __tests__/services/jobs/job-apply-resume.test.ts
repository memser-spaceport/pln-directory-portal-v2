import {
  PENDING_APPLY_PARAM,
  PENDING_INTEREST_PARAM,
  stripResumeParamsFromUrl,
  withPendingApply,
  withPendingInterest,
} from '@/services/jobs/job-apply-resume';

describe('withPendingApply', () => {
  it('adds the role to an empty search string', () => {
    expect(withPendingApply('', 'role-1')).toBe(`?${PENDING_APPLY_PARAM}=role-1`);
  });

  it('keeps the filters someone narrowed before signing up', () => {
    const result = withPendingApply('?roleCategory=Engineering&seniority=Senior', 'role-1');
    const params = new URLSearchParams(result);

    expect(params.get('roleCategory')).toBe('Engineering');
    expect(params.get('seniority')).toBe('Senior');
    expect(params.get(PENDING_APPLY_PARAM)).toBe('role-1');
  });

  it('keeps the rest of the search string when there is no role', () => {
    expect(withPendingApply('?roleCategory=Engineering', undefined)).toBe('?roleCategory=Engineering');
    expect(withPendingApply('', undefined)).toBe('');
  });

  it('CLEARS a stale role when none is given — signing in must not inherit an abandoned sign-up', () => {
    expect(withPendingApply(`?${PENDING_APPLY_PARAM}=abandoned-role`, undefined)).toBe('');
    expect(withPendingApply(`?roleCategory=Engineering&${PENDING_APPLY_PARAM}=abandoned-role`, undefined)).toBe(
      '?roleCategory=Engineering',
    );
  });

  it('replaces a stale role rather than appending a second one', () => {
    const result = withPendingApply(`?${PENDING_APPLY_PARAM}=old-role`, 'new-role');

    expect(new URLSearchParams(result).getAll(PENDING_APPLY_PARAM)).toEqual(['new-role']);
  });

  it('encodes a uid safely', () => {
    const result = withPendingApply('', 'role/with space&amp');
    expect(new URLSearchParams(result).get(PENDING_APPLY_PARAM)).toBe('role/with space&amp');
  });
});

describe('withPendingInterest', () => {
  it('adds the role to an empty search string', () => {
    expect(withPendingInterest('', 'role-1')).toBe(`?${PENDING_INTEREST_PARAM}=role-1`);
  });

  /* The removal half matters more here than it does for `applyTo`. A stale
     `applyTo` reopens a drawer; a stale `interestIn` WRITES — it would signal
     interest in a role the person walked away from an hour earlier. */
  it('CLEARS a stale intent when none is given', () => {
    expect(withPendingInterest(`?${PENDING_INTEREST_PARAM}=abandoned-role`, undefined)).toBe('');
    expect(withPendingInterest(`?roleCategory=Engineering&${PENDING_INTEREST_PARAM}=x`, undefined)).toBe(
      '?roleCategory=Engineering',
    );
  });

  it('replaces a stale intent rather than appending a second one', () => {
    const result = withPendingInterest(`?${PENDING_INTEREST_PARAM}=old-role`, 'new-role');

    expect(new URLSearchParams(result).getAll(PENDING_INTEREST_PARAM)).toEqual(['new-role']);
  });

  /* The two intents are independent, and composing them is exactly what
     `pushLogin` does on every trip: one is set, the other is cleared. A door
     that meant "apply" must not leave an interest behind, and vice versa. */
  it('composes with withPendingApply so each door clears the other intent', () => {
    const fromApplyDoor = withPendingInterest(withPendingApply(`?${PENDING_INTEREST_PARAM}=stale`, 'role-1'), undefined);
    expect(new URLSearchParams(fromApplyDoor).get(PENDING_APPLY_PARAM)).toBe('role-1');
    expect(new URLSearchParams(fromApplyDoor).get(PENDING_INTEREST_PARAM)).toBeNull();

    const fromInterestDoor = withPendingInterest(
      withPendingApply(`?${PENDING_APPLY_PARAM}=stale`, undefined),
      'role-2',
    );
    expect(new URLSearchParams(fromInterestDoor).get(PENDING_INTEREST_PARAM)).toBe('role-2');
    expect(new URLSearchParams(fromInterestDoor).get(PENDING_APPLY_PARAM)).toBeNull();
  });

  it('keeps the filters someone narrowed before pressing', () => {
    const result = withPendingInterest('?roleCategory=Engineering', 'role-1');

    expect(new URLSearchParams(result).get('roleCategory')).toBe('Engineering');
  });
});

describe('stripResumeParamsFromUrl', () => {
  const setUrl = (url: string) => window.history.replaceState({}, '', url);

  it('removes the parameter without touching the rest of the query', () => {
    setUrl(`/jobs?roleCategory=Engineering&${PENDING_APPLY_PARAM}=role-1&sort=newest`);

    stripResumeParamsFromUrl();

    const params = new URLSearchParams(window.location.search);
    expect(params.get(PENDING_APPLY_PARAM)).toBeNull();
    expect(params.get('roleCategory')).toBe('Engineering');
    expect(params.get('sort')).toBe('newest');
  });

  it('leaves a bare path bare rather than trailing a "?"', () => {
    setUrl(`/jobs?${PENDING_APPLY_PARAM}=role-1`);

    stripResumeParamsFromUrl();

    expect(window.location.search).toBe('');
    expect(window.location.pathname).toBe('/jobs');
  });

  it('also removes a pending profile resume', () => {
    setUrl(`/jobs?roleCategory=Engineering&${PENDING_APPLY_PARAM}=role-1`);

    stripResumeParamsFromUrl();

    const params = new URLSearchParams(window.location.search);
    expect(params.get(PENDING_APPLY_PARAM)).toBeNull();
    expect(params.get('roleCategory')).toBe('Engineering');
  });

  it('is a no-op when the parameter was never there', () => {
    setUrl('/jobs?roleCategory=Engineering');

    stripResumeParamsFromUrl();

    expect(window.location.search).toBe('?roleCategory=Engineering');
  });

  /* The round trip writes `prefillEmail` and nothing removes it: `AuthInfo`
     copies it into localStorage and leaves it, and `clearPrivyParams` only
     strips `privy_*`. It matters more now the flow reaches team profiles —
     `/teams/<uid>?prefillEmail=…` is the kind of URL people paste around. */
  it('takes the email prefill with it', () => {
    setUrl(`/teams/team-1?prefillEmail=someone%40example.com&${PENDING_APPLY_PARAM}=role-1`);

    stripResumeParamsFromUrl();

    expect(window.location.search).toBe('');
    expect(window.location.pathname).toBe('/teams/team-1');
  });

  it('cleans up a stranded prefill even with no resume left to act on', () => {
    setUrl('/teams/team-1?prefillEmail=someone%40example.com&tab=roles');

    stripResumeParamsFromUrl();

    const params = new URLSearchParams(window.location.search);
    expect(params.get('prefillEmail')).toBeNull();
    expect(params.get('tab')).toBe('roles');
  });

  it('does not navigate — the board underneath must not re-render mid-flow', () => {
    setUrl(`/jobs?${PENDING_APPLY_PARAM}=role-1`);
    const pushSpy = jest.spyOn(window.history, 'pushState');

    stripResumeParamsFromUrl();

    expect(pushSpy).not.toHaveBeenCalled();
    pushSpy.mockRestore();
  });

  it('carries the interest intent out with the rest — a one-time write must not replay', () => {
    setUrl(`/jobs?${PENDING_INTEREST_PARAM}=role-1&${PENDING_APPLY_PARAM}=role-2&sort=newest`);

    stripResumeParamsFromUrl();

    const params = new URLSearchParams(window.location.search);
    expect(params.get(PENDING_INTEREST_PARAM)).toBeNull();
    expect(params.get(PENDING_APPLY_PARAM)).toBeNull();
    expect(params.get('sort')).toBe('newest');
  });
});
