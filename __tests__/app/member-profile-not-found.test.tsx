/**
 * @jest-environment node
 */
/**
 * LAB-2922: a member profile answers "not found" only when the API reports no member a signed-out visitor may see, and
 * the visitor is signed out. `getMember` also answers 404 for a member who exists but is not public yet (a pending
 * member opening their own profile), so a signed-in viewer is left to the browser, as before.
 */
const mockNotFound = jest.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
jest.mock('next/navigation', () => ({ notFound: () => mockNotFound() }));

let mockIsLoggedIn = false;
jest.mock('@/utils/next-helpers', () => ({
  getCookiesFromHeaders: async () => ({ isLoggedIn: mockIsLoggedIn }),
}));

const mockGetMember = jest.fn();
jest.mock('@/services/members.service', () => ({ getMember: (...args: unknown[]) => mockGetMember(...args) }));

import MemberLayout, { generateMetadata } from '@/app/members/[id]/layout';

const props = { params: Promise.resolve({ id: 'member-1' }), children: 'profile' };
const NOT_FOUND = { error: { status: 404, statusText: 'Member not found' } };
const MEMBER = { data: { formattedData: { name: 'Ada', bio: '<p>Builds things</p>', profile: null } } };

beforeEach(() => {
  mockNotFound.mockClear();
  mockGetMember.mockReset();
  mockIsLoggedIn = false;
});

it('answers not found to a signed-out visitor when the API says 404', async () => {
  mockGetMember.mockResolvedValue(NOT_FOUND);

  await expect(MemberLayout(props)).rejects.toThrow('NEXT_NOT_FOUND');
  await expect(generateMetadata(props)).rejects.toThrow('NEXT_NOT_FOUND');
});

it('leaves a signed-in viewer to the browser', async () => {
  mockIsLoggedIn = true;
  mockGetMember.mockResolvedValue(NOT_FOUND);

  await expect(MemberLayout(props)).resolves.toBe('profile');
  expect(mockNotFound).not.toHaveBeenCalled();
});

it('does not answer not found for an outage', async () => {
  mockGetMember.mockResolvedValue({ error: { status: 503, statusText: 'Service Unavailable' } });

  await expect(MemberLayout(props)).resolves.toBe('profile');
  await expect(generateMetadata(props)).resolves.toMatchObject({ title: 'Member | Protocol Labs Directory' });
  expect(mockNotFound).not.toHaveBeenCalled();
});

it('confirms a cached 404 uncached before answering not found', async () => {
  // Cached: not found (stale). Fresh: the member was approved since.
  mockGetMember.mockImplementation(async (...args: unknown[]) => (args[5] ? MEMBER : NOT_FOUND));

  await expect(MemberLayout(props)).resolves.toBe('profile');
  expect(mockNotFound).not.toHaveBeenCalled();
});
