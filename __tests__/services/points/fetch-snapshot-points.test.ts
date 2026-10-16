import { fetchSnapshotPoints } from '@/services/points/hooks/usePoints';

jest.mock('@/utils/third-party.helper', () => ({
  getCookiesFromClient: () => ({ authToken: 'token' }),
}));

describe('fetchSnapshotPoints', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
  });

  it('sends the snapshot period as one encoded query value', async () => {
    await fetchSnapshotPoints('October 2026&x=1#frag');

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
      '/api/plaa/points?snapshotPeriod=October%202026%26x%3D1%23frag',
    );
  });
});
