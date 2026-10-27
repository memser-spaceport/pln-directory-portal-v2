/**
 * @jest-environment node
 */
/**
 * The public member in the server HTML renders as a signed-out visitor sees it, so it is handed over only to a
 * signed-out visitor. A signed-in viewer gets the loader until their own fetch lands, never the signed-out view.
 */
let mockIsLoggedIn = false;
jest.mock('@/utils/next-helpers', () => ({
  getCookiesFromHeaders: async () => ({ isLoggedIn: mockIsLoggedIn }),
}));

const mockGetMember = jest.fn();
jest.mock('@/services/members.service', () => ({ getMember: (...args: unknown[]) => mockGetMember(...args) }));

jest.mock('@/components/page/member-details/MemberDetailsPage', () => ({ __esModule: true, default: () => null }));

import MemberPage from '@/app/members/[id]/page';

const props = { params: Promise.resolve({ id: 'member-1' }) };
const MEMBER = { data: { formattedData: { name: 'Ada' } } };

beforeEach(() => {
  mockGetMember.mockReset();
  mockIsLoggedIn = false;
});

it('passes the public member to a signed-out visitor', async () => {
  mockGetMember.mockResolvedValue(MEMBER);

  const page = await MemberPage(props);

  expect(page.props).toEqual({ memberId: 'member-1', serverMember: MEMBER });
});

it('passes no public member to a signed-in viewer', async () => {
  mockIsLoggedIn = true;

  const page = await MemberPage(props);

  expect(mockGetMember).not.toHaveBeenCalled();
  expect(page.props).toEqual({ memberId: 'member-1' });
});
