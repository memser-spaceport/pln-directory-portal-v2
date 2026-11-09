/**
 * LAB-3190: the Candidates page's server gate, asked through the page itself.
 *
 * Protocol Labs' leads get the weekly suggested-candidates email, and every
 * link in it opens this page. The page used to gate on `canReadApplicants`,
 * which keeps PL out, so each link redirected a PL lead to the team profile.
 * It now gates on the Suggested tab's rule and shows PL the Suggested tab alone.
 */
const redirect = jest.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});
jest.mock('next/navigation', () => ({
  redirect: (url: string) => redirect(url),
  RedirectType: { replace: 'replace', push: 'push' },
}));

jest.mock('@/services/jobs/constants', () => ({
  ...jest.requireActual('@/services/jobs/constants'),
  SHOW_TEAM_APPLICANTS: true,
}));

const getCookiesFromHeaders = jest.fn();
jest.mock('@/utils/next-helpers', () => ({
  getCookiesFromHeaders: () => getCookiesFromHeaders(),
}));

const getTeam = jest.fn();
jest.mock('@/services/teams.service', () => ({
  getTeam: (...args: unknown[]) => getTeam(...args),
  getTeamUIDByAirtableId: jest.fn(),
}));

jest.mock('@/app/actions/jobs.actions', () => ({
  getJobsList: jest.fn().mockResolvedValue({ teams: [] }),
}));

/* The view is not under test, only the props the page hands it. */
jest.mock('@/components/page/team-details/TeamApplicants', () => ({
  TeamApplicantsView: () => null,
}));
jest.mock('@/components/core/error', () => ({ __esModule: true, default: () => null }));

import Page from '@/app/teams/[id]/applicants/page';

const PL_UID = 'cldvnyxaf01ynu21k62uopjvg';
/* `rbac` present: the cookie can speak to permissions, so a refusal redirects. */
const leadOf = (teamUid: string) => ({ uid: 'u1', leadingTeams: [teamUid], rbac: { effectivePermissions: [] } });

const open = async (teamUid: string, teamName: string, userInfo: unknown) => {
  getCookiesFromHeaders.mockResolvedValue({ userInfo, isLoggedIn: true });
  getTeam.mockResolvedValue({ data: { formatedData: { id: teamUid, name: teamName } } });
  const element: any = await Page({
    params: Promise.resolve({ id: teamUid }),
    searchParams: Promise.resolve({ role: 'role-1', tab: 'suggested', suggested: 'm-1' }),
  });
  return element.props.children.props;
};

beforeEach(() => {
  redirect.mockClear();
});

describe('Candidates page gate', () => {
  it('lets a Protocol Labs lead in from an email link, on the Suggested tab alone', async () => {
    const props = await open(PL_UID, 'Protocol Labs', leadOf(PL_UID));

    expect(redirect).not.toHaveBeenCalled();
    expect(props.suggestedOnly).toBe(true);
    expect(props.initialSuggestedMemberUid).toBe('m-1');
  });

  it('treats a seeded PL team, matched by name, the same way', async () => {
    const props = await open('pl-dev-seed', 'Protocol Labs', leadOf('pl-dev-seed'));

    expect(redirect).not.toHaveBeenCalled();
    expect(props.suggestedOnly).toBe(true);
  });

  it('keeps every tab for another team’s lead', async () => {
    const props = await open('team-1', 'Acme', leadOf('team-1'));

    expect(redirect).not.toHaveBeenCalled();
    expect(props.suggestedOnly).toBe(false);
  });

  it('still sends a non-lead to the team profile', async () => {
    await expect(open(PL_UID, 'Protocol Labs', leadOf('team-9'))).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith(`/teams/${PL_UID}`);
  });
});
