import { applicantsEarlyRedirect } from '@/components/page/team-details/TeamApplicants/applicantsEarlyRedirect';

/**
 * Where the Candidates page sends a reader before it fetches the team.
 *
 * Tested as a rule, like `canReadApplicants`, because the page's refusal is a
 * thrown `redirect()`. The page passes this function's answer straight to it.
 */

const ask = (over: Partial<Parameters<typeof applicantsEarlyRedirect>[0]>) =>
  applicantsEarlyRedirect({
    flagOn: true,
    isLoggedIn: false,
    teamId: 'team-1',
    searchParams: { role: 'role-1', suggested: 'member-1' },
    ...over,
  });

/* The page the sign-in screen sends the reader back to, decoded the way the
   login flow reads it (`URLSearchParams.get` decodes once). */
const backlinkOf = (target: string | null) => {
  const url = new URL(target ?? '', 'https://directory.test');
  expect(url.pathname).toBe('/members');
  expect(url.hash).toBe('#login');
  return url.searchParams.get('backlink');
};

describe('applicantsEarlyRedirect', () => {
  it('sends a signed-out visitor to sign-in, not to the team profile', () => {
    const target = ask({});

    expect(target).not.toBe('/teams/team-1');
    expect(target?.startsWith('/members?backlink=')).toBe(true);
    expect(target?.endsWith('#login')).toBe(true);
  });

  it('brings the visitor back to the same role and suggested person after sign-in', () => {
    expect(backlinkOf(ask({}))).toBe('/teams/team-1/applicants?role=role-1&suggested=member-1');
  });

  it('keeps the candidate as well when the link names one', () => {
    const target = ask({ searchParams: { role: 'role-1', candidate: 'cand-1' } });

    expect(backlinkOf(target)).toBe('/teams/team-1/applicants?role=role-1&candidate=cand-1');
  });

  it('keeps only role, candidate and suggested from the link', () => {
    const target = ask({
      searchParams: {
        role: 'role-1',
        candidate: 'cand-1',
        suggested: 'member-1',
        utm_source: 'email',
        backlink: 'https://evil.example',
      } as Parameters<typeof applicantsEarlyRedirect>[0]['searchParams'],
    });

    expect(backlinkOf(target)).toBe('/teams/team-1/applicants?role=role-1&candidate=cand-1&suggested=member-1');
  });

  it('returns to the bare page when the link has no fields', () => {
    expect(backlinkOf(ask({ searchParams: {} }))).toBe('/teams/team-1/applicants');
    expect(backlinkOf(ask({ searchParams: undefined }))).toBe('/teams/team-1/applicants');
  });

  it('drops empty and repeated fields rather than guessing', () => {
    const target = ask({
      searchParams: { role: '', suggested: ['a', 'b'] } as unknown as Parameters<
        typeof applicantsEarlyRedirect
      >[0]['searchParams'],
    });

    expect(backlinkOf(target)).toBe('/teams/team-1/applicants');
  });

  it('encodes values so they cannot add fields to the return link', () => {
    const target = ask({ searchParams: { role: 'r&x=1' } });

    expect(backlinkOf(target)).toBe('/teams/team-1/applicants?role=r%26x%3D1');
  });

  /* `isLoggedIn` is `''` for a signed-out request, as for `canReadApplicants`. */
  it("treats the header's empty string as signed out", () => {
    expect(backlinkOf(ask({ isLoggedIn: '' }))).toBe('/teams/team-1/applicants?role=role-1&suggested=member-1');
  });

  it('sends a signed-out visitor to the team profile while the feature is off', () => {
    expect(ask({ flagOn: false })).toBe('/teams/team-1');
  });

  it('sends a signed-in reader to the team profile while the feature is off', () => {
    expect(ask({ flagOn: false, isLoggedIn: true })).toBe('/teams/team-1');
  });

  /* The rest of the rule (lead of this team, admin, not Protocol Labs) needs the
     team, so it is asked later by `canReadApplicants`, which keeps sending a
     signed-in stranger to the team profile. */
  it('lets a signed-in reader through to the team check', () => {
    expect(ask({ isLoggedIn: true })).toBeNull();
  });
});
