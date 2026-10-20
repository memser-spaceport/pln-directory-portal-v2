/**
 * @jest-environment node
 */
/**
 * LAB-2922: `/teams` fetches page 1 on the server, for the URL's filters and with the viewer's token, the way the
 * browser does. Its key must be the query the list builds once the filter store holds the same URL, or the list would
 * never show it after hydration.
 */
const mockGetTeamList = jest.fn();
jest.mock('@/app/actions/teams.actions', () => ({
  getTeamList: (...args: unknown[]) => mockGetTeamList(...args),
}));

import { getServerTeamsPage } from '@/services/teams/getServerTeamsPage';
import { buildTeamsListQuery } from '@/services/teams/teamsListQuery';

beforeEach(() => mockGetTeamList.mockReset());

it('fetches page 1 for the URL filters with the viewer token, keyed on the list query', async () => {
  mockGetTeamList.mockResolvedValue({ data: [{ id: 'team-1', name: 'Lab Team' }], totalItems: 7, followingTotal: 2 });

  const page = await getServerTeamsPage({ searchBy: 'lab', sort: 'Name,Asc' }, 'token-1');

  // What the store holds after the URL sync: every param, as strings.
  const key = buildTeamsListQuery({ searchBy: 'lab', sort: 'Name,Asc' } as never);
  expect(mockGetTeamList).toHaveBeenCalledWith(key, 1, expect.any(Number), 'token-1');
  expect(page).toEqual({ key, items: [{ id: 'team-1', name: 'Lab Team' }], total: 7, followingTotal: 2 });
});

it('keeps the last value of a repeated param, as the store does', async () => {
  mockGetTeamList.mockResolvedValue({ data: [], totalItems: 0, followingTotal: 0 });

  const page = await getServerTeamsPage({ searchBy: ['first', 'last'] }, undefined);

  expect(page?.key).toBe(buildTeamsListQuery({ searchBy: 'last' } as never));
});

it('returns nothing when the API fails, so the browser loads the list', async () => {
  mockGetTeamList.mockResolvedValue({ isError: true });
  await expect(getServerTeamsPage({}, undefined)).resolves.toBeUndefined();

  mockGetTeamList.mockRejectedValue(new TypeError('fetch failed'));
  await expect(getServerTeamsPage({}, undefined)).resolves.toBeUndefined();
});
