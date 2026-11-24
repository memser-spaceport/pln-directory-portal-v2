// LAB-3382: `/sign-up` redirects only a guest from Sign in after Job Board Apply.
const mockRedirect = jest.fn((url: string) => {
  throw new Error(`REDIRECT ${url}`);
});
jest.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  RedirectType: { replace: 'replace' },
}));
const mockCookies = jest.fn();
jest.mock('@/utils/next-helpers', () => ({ getCookiesFromHeaders: () => mockCookies() }));
jest.mock('@/services/sign-up.service', () => ({ getSkillsData: async () => ({ skills: [] }) }));
jest.mock('@/components/page/sign-up/components/SignupWizard', () => ({ SignupWizard: () => null }));
const mockFlag = { on: true };
jest.mock('@/services/jobs/constants', () => ({
  get SHOW_JOB_BOARD_APPLY() {
    return mockFlag.on;
  },
}));

import Page from '@/app/sign-up/page';

const open = (returnTo?: string) => Page({ searchParams: Promise.resolve({ returnTo }) });
const expectWizard = async (returnTo?: string) => {
  expect(((await open(returnTo)) as { type: { name: string } }).type.name).toBe('SignupWizard');
  expect(mockRedirect).not.toHaveBeenCalled();
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFlag.on = true;
  mockCookies.mockResolvedValue({ isLoggedIn: false });
});

it.each(['/jobs?applySignIn=role1', '/jobs/openings/role1?applySignIn=role1'])(
  'sends a guest from %s back',
  async (r) => {
    await expect(open(r)).rejects.toThrow('REDIRECT /jobs/openings/role1?applySignUp=role1');
  },
);

it.each([undefined, '/jobs?roleCategory=X', '//evil.example/jobs?applySignIn=role1'])(
  'keeps the general wizard for %s',
  expectWizard,
);

it('keeps the general wizard when in-app Apply is off', async () => {
  mockFlag.on = false;
  await expectWizard('/jobs?applySignIn=role1');
});

it.each([
  { roles: ['DIRECTORYADMIN'], leadingTeams: [] },
  { roles: [], leadingTeams: ['t1'] },
])('keeps the general wizard for a signed-in admin or lead', async (userInfo) => {
  mockCookies.mockResolvedValue({ isLoggedIn: true, userInfo });
  await expectWizard('/jobs?applySignIn=role1');
});
