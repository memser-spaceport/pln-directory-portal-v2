import {
  PENDING_APPLY_PARAM,
  PENDING_PROFILE_PARAM,
  stripPendingApplyFromUrl,
  withPendingApply,
  withPendingProfile,
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
    expect(withPendingApply(`?${PENDING_PROFILE_PARAM}=1`, undefined)).toBe('');
  });

  it('replaces a stale role rather than appending a second one', () => {
    const result = withPendingApply(`?${PENDING_APPLY_PARAM}=old-role`, 'new-role');

    expect(new URLSearchParams(result).getAll(PENDING_APPLY_PARAM)).toEqual(['new-role']);
  });

  it('encodes a uid safely', () => {
    const result = withPendingApply('', 'role/with space&amp');
    expect(new URLSearchParams(result).get(PENDING_APPLY_PARAM)).toBe('role/with space&amp');
  });

  it('clears a pending profile resume — the two instructions are mutually exclusive', () => {
    const result = withPendingApply(`?${PENDING_PROFILE_PARAM}=1`, 'role-1');
    const params = new URLSearchParams(result);

    expect(params.get(PENDING_APPLY_PARAM)).toBe('role-1');
    expect(params.get(PENDING_PROFILE_PARAM)).toBeNull();
  });
});

describe('withPendingProfile', () => {
  it('adds the profile resume to an empty search string', () => {
    expect(withPendingProfile('')).toBe(`?${PENDING_PROFILE_PARAM}=1`);
  });

  it('keeps the filters someone narrowed before signing up', () => {
    const result = withPendingProfile('?roleCategory=Engineering');
    const params = new URLSearchParams(result);

    expect(params.get('roleCategory')).toBe('Engineering');
    expect(params.get(PENDING_PROFILE_PARAM)).toBe('1');
  });

  it('clears a pending apply — the two instructions are mutually exclusive', () => {
    const result = withPendingProfile(`?${PENDING_APPLY_PARAM}=role-1`);
    const params = new URLSearchParams(result);

    expect(params.get(PENDING_PROFILE_PARAM)).toBe('1');
    expect(params.get(PENDING_APPLY_PARAM)).toBeNull();
  });
});

describe('stripPendingApplyFromUrl', () => {
  const setUrl = (url: string) => window.history.replaceState({}, '', url);

  it('removes the parameter without touching the rest of the query', () => {
    setUrl(`/jobs?roleCategory=Engineering&${PENDING_APPLY_PARAM}=role-1&sort=newest`);

    stripPendingApplyFromUrl();

    const params = new URLSearchParams(window.location.search);
    expect(params.get(PENDING_APPLY_PARAM)).toBeNull();
    expect(params.get('roleCategory')).toBe('Engineering');
    expect(params.get('sort')).toBe('newest');
  });

  it('leaves a bare path bare rather than trailing a "?"', () => {
    setUrl(`/jobs?${PENDING_APPLY_PARAM}=role-1`);

    stripPendingApplyFromUrl();

    expect(window.location.search).toBe('');
    expect(window.location.pathname).toBe('/jobs');
  });

  it('also removes a pending profile resume', () => {
    setUrl(`/jobs?roleCategory=Engineering&${PENDING_PROFILE_PARAM}=1`);

    stripPendingApplyFromUrl();

    const params = new URLSearchParams(window.location.search);
    expect(params.get(PENDING_PROFILE_PARAM)).toBeNull();
    expect(params.get('roleCategory')).toBe('Engineering');
  });

  it('is a no-op when the parameter was never there', () => {
    setUrl('/jobs?roleCategory=Engineering');

    stripPendingApplyFromUrl();

    expect(window.location.search).toBe('?roleCategory=Engineering');
  });

  /* The round trip writes `prefillEmail` and nothing removes it: `AuthInfo`
     copies it into localStorage and leaves it, and `clearPrivyParams` only
     strips `privy_*`. It matters more now the flow reaches team profiles —
     `/teams/<uid>?prefillEmail=…` is the kind of URL people paste around. */
  it('takes the email prefill with it', () => {
    setUrl(`/teams/team-1?prefillEmail=someone%40example.com&${PENDING_APPLY_PARAM}=role-1`);

    stripPendingApplyFromUrl();

    expect(window.location.search).toBe('');
    expect(window.location.pathname).toBe('/teams/team-1');
  });

  it('cleans up a stranded prefill even with no resume left to act on', () => {
    setUrl('/teams/team-1?prefillEmail=someone%40example.com&tab=roles');

    stripPendingApplyFromUrl();

    const params = new URLSearchParams(window.location.search);
    expect(params.get('prefillEmail')).toBeNull();
    expect(params.get('tab')).toBe('roles');
  });

  it('does not navigate — the board underneath must not re-render mid-flow', () => {
    setUrl(`/jobs?${PENDING_APPLY_PARAM}=role-1`);
    const pushSpy = jest.spyOn(window.history, 'pushState');

    stripPendingApplyFromUrl();

    expect(pushSpy).not.toHaveBeenCalled();
    pushSpy.mockRestore();
  });
});
