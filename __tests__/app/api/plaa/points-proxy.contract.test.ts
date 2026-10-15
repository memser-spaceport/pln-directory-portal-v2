/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

import { GET as getPoints } from '@/app/api/plaa/points/route';

const PLAA_API_URL = 'https://plaa.internal.example';

function makeRequest(url: string): NextRequest {
  return new NextRequest(url, { headers: { authorization: 'Bearer privy-1' } });
}

beforeEach(() => {
  process.env.PLAA_API_URL = PLAA_API_URL;
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
});

describe('points proxy route', () => {
  it('proxies to /api/v1/points/me when no snapshot period is given', async () => {
    await getPoints(makeRequest('http://localhost/api/plaa/points'));

    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(`${PLAA_API_URL}/api/v1/points/me`);
  });

  it('forwards the snapshot period as one query value', async () => {
    await getPoints(makeRequest('http://localhost/api/plaa/points?snapshotPeriod=October%202026'));

    const url = new URL((global.fetch as jest.Mock).mock.calls[0][0]);
    expect(url.pathname).toBe('/api/v1/points/me');
    expect([...url.searchParams.entries()]).toEqual([['snapshotPeriod', 'October 2026']]);
  });

  it('does not let the snapshot period add parameters or a fragment upstream', async () => {
    await getPoints(makeRequest('http://localhost/api/plaa/points?snapshotPeriod=x%26memberUid%3Dother%23frag'));

    const url = new URL((global.fetch as jest.Mock).mock.calls[0][0]);
    expect([...url.searchParams.entries()]).toEqual([['snapshotPeriod', 'x&memberUid=other#frag']]);
    expect(url.hash).toBe('');
  });
});
