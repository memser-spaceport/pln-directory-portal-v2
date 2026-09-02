import {
  PENDING_APPLY_PARAM,
  PENDING_NEWEST_PARAM,
  pickNewestRole,
  stripPendingApplyFromUrl,
  withPendingApply,
  withPendingNewestRole,
} from '@/services/jobs/job-apply-resume';
import type { IJobRole, IJobTeamGroup } from '@/types/jobs.types';

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
    expect(withPendingApply(`?${PENDING_NEWEST_PARAM}=1`, undefined)).toBe('');
  });

  it('replaces a stale role rather than appending a second one', () => {
    const result = withPendingApply(`?${PENDING_APPLY_PARAM}=old-role`, 'new-role');

    expect(new URLSearchParams(result).getAll(PENDING_APPLY_PARAM)).toEqual(['new-role']);
  });

  it('encodes a uid safely', () => {
    const result = withPendingApply('', 'role/with space&amp');
    expect(new URLSearchParams(result).get(PENDING_APPLY_PARAM)).toBe('role/with space&amp');
  });

  it('clears a pending newest-role resume — the two instructions are mutually exclusive', () => {
    const result = withPendingApply(`?${PENDING_NEWEST_PARAM}=1`, 'role-1');
    const params = new URLSearchParams(result);

    expect(params.get(PENDING_APPLY_PARAM)).toBe('role-1');
    expect(params.get(PENDING_NEWEST_PARAM)).toBeNull();
  });
});

describe('withPendingNewestRole', () => {
  it('adds the newest-role resume to an empty search string', () => {
    expect(withPendingNewestRole('')).toBe(`?${PENDING_NEWEST_PARAM}=1`);
  });

  it('keeps the filters someone narrowed before signing up', () => {
    const result = withPendingNewestRole('?roleCategory=Engineering');
    const params = new URLSearchParams(result);

    expect(params.get('roleCategory')).toBe('Engineering');
    expect(params.get(PENDING_NEWEST_PARAM)).toBe('1');
  });

  it('clears a pending apply — the two instructions are mutually exclusive', () => {
    const result = withPendingNewestRole(`?${PENDING_APPLY_PARAM}=role-1`);
    const params = new URLSearchParams(result);

    expect(params.get(PENDING_NEWEST_PARAM)).toBe('1');
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
    setUrl(`/jobs?roleCategory=Engineering&${PENDING_NEWEST_PARAM}=1`);

    stripPendingApplyFromUrl();

    const params = new URLSearchParams(window.location.search);
    expect(params.get(PENDING_NEWEST_PARAM)).toBeNull();
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

/**
 * Which role a job-less sign-up lands on.
 *
 * Resolved against the board as it loads back, not as it was when the form was
 * submitted — a fresher posting can arrive while Privy is on screen, which is
 * why the URL carries a flag rather than a uid.
 */
describe('pickNewestRole', () => {
  const role = (uid: string, dates: Partial<IJobRole>): IJobRole =>
    ({ uid, roleTitle: uid, postedDate: null, detectionDate: null, lastUpdated: '', ...dates }) as IJobRole;

  const group = (teamUid: string, roles: IJobRole[]): IJobTeamGroup =>
    ({ team: { uid: teamUid, name: teamUid }, totalRoles: roles.length, roles }) as unknown as IJobTeamGroup;

  it('returns null for an empty board', () => {
    expect(pickNewestRole([])).toBeNull();
    expect(pickNewestRole([group('t1', [])])).toBeNull();
  });

  it('picks the newest role across every team, not within one', () => {
    const older = role('older', { postedDate: '2026-01-01T00:00:00.000Z' });
    const newest = role('newest', { postedDate: '2026-08-01T00:00:00.000Z' });

    const picked = pickNewestRole([group('t1', [older]), group('t2', [newest])]);

    expect(picked?.role.uid).toBe('newest');
    expect(picked?.team.uid).toBe('t2');
  });

  /* `getJobDate`'s own fallback order. A role with only a detection date is
     still comparable against one with a posted date. */
  it('falls back through postedDate → detectionDate → lastUpdated', () => {
    const detected = role('detected', { detectionDate: '2026-08-02T00:00:00.000Z' });
    const posted = role('posted', { postedDate: '2026-08-01T00:00:00.000Z' });

    expect(pickNewestRole([group('t1', [posted, detected])])?.role.uid).toBe('detected');
  });

  /* Parsed, not string-compared. These two sort one way as strings and the other
     way as dates, so this is the assertion that fails if the comparator ever
     goes back to `>` on the raw values. */
  it('compares dates rather than the strings they are written as', () => {
    const older = role('older', { postedDate: '2026-01-09T00:00:00.000Z' });
    const newer = role('newer', { postedDate: 'Fri, 10 Jan 2026 00:00:00 GMT' });

    expect(pickNewestRole([group('t1', [older, newer])])?.role.uid).toBe('newer');
  });

  /* A broken date must never beat a good one — but a board of nothing but broken
     dates still has to yield a role, because the alternative is sending someone
     who just signed up to an empty screen. */
  it('never lets an unparseable date win, and still returns something when all of them are', () => {
    const broken = role('broken', { postedDate: 'not a date' });
    const good = role('good', { postedDate: '2026-01-01T00:00:00.000Z' });

    expect(pickNewestRole([group('t1', [broken, good])])?.role.uid).toBe('good');
    expect(pickNewestRole([group('t1', [good, broken])])?.role.uid).toBe('good');
    expect(pickNewestRole([group('t1', [broken])])?.role.uid).toBe('broken');
  });
});
