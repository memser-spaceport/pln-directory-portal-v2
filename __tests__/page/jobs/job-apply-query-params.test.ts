import {
  JOB_QUERY_PARAMS,
  jobApplyHref,
  jobApplyQueryParams,
  openExternalApply,
} from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';

const APPLY_URL = 'https://jobs.example.com/roles/42';

describe('jobApplyQueryParams', () => {
  it('always attributes the source to the directory', () => {
    expect(jobApplyQueryParams('job-board')).toContain('utm_source=os.pl.xyz');
    expect(jobApplyQueryParams('team-profile')).toContain('utm_source=os.pl.xyz');
  });

  it('reports a team-profile click as team_profile, not as board traffic', () => {
    expect(jobApplyQueryParams('team-profile')).toBe('utm_source=os.pl.xyz&utm_medium=team_profile');
  });

  it('reports the board as job_board', () => {
    expect(jobApplyQueryParams('job-board')).toBe('utm_source=os.pl.xyz&utm_medium=job_board');
  });

  it('falls back to job_board for any other surface rather than emitting an empty medium', () => {
    expect(jobApplyQueryParams('home-feed' as never)).toBe('utm_source=os.pl.xyz&utm_medium=job_board');
  });
});

describe('JOB_QUERY_PARAMS', () => {
  it('is the board variant, kept in sync with the builder', () => {
    expect(JOB_QUERY_PARAMS).toBe(jobApplyQueryParams('job-board'));
  });
});

describe('jobApplyHref', () => {
  it('appends the params to the employer posting', () => {
    expect(jobApplyHref(APPLY_URL, 'job-board')).toBe(`${APPLY_URL}?utm_source=os.pl.xyz&utm_medium=job_board`);
    expect(jobApplyHref(APPLY_URL, 'team-profile')).toBe(`${APPLY_URL}?utm_source=os.pl.xyz&utm_medium=team_profile`);
  });

  it.each([null, undefined, ''])('returns null for %p, so callers render nothing rather than a bare "?"', (url) => {
    expect(jobApplyHref(url, 'job-board')).toBeNull();
  });

  it('produces a URL whose params parse back out', () => {
    const url = new URL(jobApplyHref(APPLY_URL, 'team-profile') as string);

    expect(url.searchParams.get('utm_source')).toBe('os.pl.xyz');
    expect(url.searchParams.get('utm_medium')).toBe('team_profile');
    expect(url.origin + url.pathname).toBe(APPLY_URL);
  });
});

describe('openExternalApply', () => {
  const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

  beforeEach(() => openSpy.mockClear());
  afterAll(() => openSpy.mockRestore());

  it('opens the attributed posting in a new tab, opener-safe', () => {
    openExternalApply(APPLY_URL, 'job-board');

    expect(openSpy).toHaveBeenCalledWith(
      `${APPLY_URL}?utm_source=os.pl.xyz&utm_medium=job_board`,
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('carries the surface through to the opened link', () => {
    openExternalApply(APPLY_URL, 'team-profile');

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('utm_medium=team_profile'),
      '_blank',
      expect.any(String),
    );
  });

  it.each([null, undefined, ''])('opens nothing when there is no posting to open (%p)', (url) => {
    openExternalApply(url, 'job-board');

    expect(openSpy).not.toHaveBeenCalled();
  });
});
