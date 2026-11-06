import { fetchAllFollowedTeams } from '@/services/follow/hooks/useFollowedTeams';
import { getFollowedTeams } from '@/services/follow/follow.service';

jest.mock('@/services/follow/follow.service', () => ({ getFollowedTeams: jest.fn() }));
const mockGet = getFollowedTeams as jest.Mock;

const team = (uid: string) => ({ uid, name: uid, logoUrl: null, followedAt: '2026-10-01', followerCount: 1 });

describe('fetchAllFollowedTeams (LAB-2941)', () => {
  beforeEach(() => mockGet.mockReset());

  it('walks every page', async () => {
    mockGet
      .mockResolvedValueOnce({ page: 1, limit: 2, total: 3, items: [team('a'), team('b')] })
      .mockResolvedValueOnce({ page: 2, limit: 2, total: 3, items: [team('c')] });

    expect((await fetchAllFollowedTeams()).map((t) => t.uid)).toEqual(['a', 'b', 'c']);
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('stops at a failed page with what it has', async () => {
    mockGet.mockResolvedValueOnce({ page: 1, limit: 1, total: 2, items: [team('a')] }).mockResolvedValueOnce(null);

    expect((await fetchAllFollowedTeams()).map((t) => t.uid)).toEqual(['a']);
  });
});
