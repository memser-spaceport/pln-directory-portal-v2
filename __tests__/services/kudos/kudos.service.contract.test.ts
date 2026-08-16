import {
  getKudosFeed,
  getCommunityPool,
  getRecipients,
  submitCommunityKudos,
  updateCommunityKudos,
  KudosApiError,
} from '@/services/kudos.service';
import type {
  ICommunityKudos,
  IKudosFeedPage,
  ICommunityPool,
  ICommunityKudosInput,
  IUserSummary,
} from '@/components/page/aligement-assets/kudos-board/data/kudos-board.types';

jest.mock('@/utils/third-party.helper', () => ({
  getCookiesFromClient: jest.fn(() => ({ authToken: 'privy-token-123' })),
}));

import { getCookiesFromClient } from '@/utils/third-party.helper';

const giver = {
  memberId: 'uid-giver-1',
  name: 'Ada Lovelace',
  avatarUrl: 'https://cdn.example/ada.png',
} satisfies IUserSummary;

const recipient = {
  memberId: 'uid-recipient-1',
  name: 'Grace Hopper',
} satisfies IUserSummary;

const kudosFixture = {
  id: 'kudos-1',
  giver,
  recipient,
  roundId: 'round-18',
  points: 20,
  message: 'Thanks for unblocking the roster sync — heartbeat is green again.',
  createdAt: '2026-07-19T11:04:22.141Z',
} satisfies ICommunityKudos;

const feedPageFixture = {
  items: [kudosFixture],
  nextCursor: 'eyJjcmVhdGVkQXQiOiIyMDI2LTA3LTE5In0=',
} satisfies IKudosFeedPage;

const lastFeedPageFixture = {
  items: [kudosFixture],
  nextCursor: null,
} satisfies IKudosFeedPage;

const poolFixture = {
  roundId: 'round-18',
  totalBudget: 100,
  pointsUsed: 40,
  pointsRemaining: 60,
  eligible: true,
} satisfies ICommunityPool;

const recipientsFixture = {
  items: [recipient, giver] as IUserSummary[],
};

const submitInput = {
  recipientId: 'uid-recipient-1',
  points: 20,
  message: 'Thanks for unblocking the roster sync — heartbeat is green again.',
} satisfies ICommunityKudosInput;

function mockFetchOnce(body: unknown, init?: { status?: number; ok?: boolean }) {
  const ok = init?.ok ?? true;
  const status = init?.status ?? 200;
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    statusText: 'mock',
  });
}

beforeEach(() => {
  global.fetch = jest.fn();
  (getCookiesFromClient as jest.Mock).mockReturnValue({ authToken: 'privy-token-123' });
});

describe('kudos service — request contract', () => {
  it('feed: GET /api/plaa/kudos with limit+cursor only — roundId is never sent', async () => {
    mockFetchOnce(feedPageFixture);
    await getKudosFeed({ roundId: 'round-18', limit: 10, cursor: 'abc' });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/plaa/kudos?limit=10&cursor=abc');
    expect(url).not.toContain('round');
    expect(init.method).toBeUndefined();
  });

  it('feed: omits the query string entirely when no params given', async () => {
    mockFetchOnce(lastFeedPageFixture);
    await getKudosFeed({ roundId: 'round-18' });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/api/plaa/kudos');
  });

  it('pool: GET /api/plaa/kudos/community-pool — roundId is a cache key, not a filter', async () => {
    mockFetchOnce(poolFixture);
    await getCommunityPool('round-18');
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/api/plaa/kudos/community-pool');
  });

  it('recipients: GET /api/plaa/kudos/recipients', async () => {
    mockFetchOnce(recipientsFixture);
    await getRecipients();
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/api/plaa/kudos/recipients');
  });

  it('submit: POST /api/plaa/kudos/community with exactly {recipientId, points, message}', async () => {
    mockFetchOnce(kudosFixture);
    await submitCommunityKudos(submitInput);

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/plaa/kudos/community');
    expect(init.method).toBe('POST');

    const body = JSON.parse(init.body);
    expect(Object.keys(body).sort()).toEqual(['message', 'points', 'recipientId']);
  });

  it('update: PATCH /api/plaa/kudos/community/:id with exactly {recipientId, points, message}', async () => {
    mockFetchOnce(kudosFixture);
    await updateCommunityKudos('kudos-1', submitInput);

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/plaa/kudos/community/kudos-1');
    expect(init.method).toBe('PATCH');

    const body = JSON.parse(init.body);
    expect(Object.keys(body).sort()).toEqual(['message', 'points', 'recipientId']);
  });

  it('attaches the Privy token from the authToken cookie as a Bearer header', async () => {
    mockFetchOnce(recipientsFixture);
    await getRecipients();
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers['Authorization']).toBe('Bearer privy-token-123');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('sends no Authorization header when the cookie is absent', async () => {
    (getCookiesFromClient as jest.Mock).mockReturnValue({});
    mockFetchOnce(recipientsFixture);
    await getRecipients();
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers['Authorization']).toBeUndefined();
  });
});

describe('kudos service — response contract', () => {
  it('feed page round-trips: items are full ICommunityKudos with enriched user summaries', async () => {
    mockFetchOnce(feedPageFixture);
    const page = await getKudosFeed({ roundId: 'round-18', limit: 10 });

    expect(page).toEqual(feedPageFixture);
    const item = page.items[0];
    expect(typeof item.giver).toBe('object');
    expect(item.giver.memberId).toBe('uid-giver-1');
    expect(item.recipient.name).toBe('Grace Hopper');
    expect(item.roundId).toBe('round-18');
  });

  it('feed last page: nextCursor is null, not undefined', async () => {
    mockFetchOnce(lastFeedPageFixture);
    const page = await getKudosFeed({ roundId: 'round-18' });
    expect(page.nextCursor).toBeNull();
  });

  it('pool: budget invariant holds (used + remaining == total)', async () => {
    mockFetchOnce(poolFixture);
    const pool = await getCommunityPool('round-18');
    expect(pool.pointsUsed + pool.pointsRemaining).toBe(pool.totalBudget);
    expect(pool.roundId).toBe('round-18');
  });

  it('recipients: summaries carry no private fields', async () => {
    mockFetchOnce(recipientsFixture);
    const { items } = await getRecipients();
    for (const summary of items) {
      const keys = Object.keys(summary);
      expect(keys).toEqual(expect.arrayContaining(['memberId', 'name']));
      expect(keys.filter((k) => !['memberId', 'name', 'avatarUrl'].includes(k))).toEqual([]);
    }
  });

  it('update: round-trips the updated ICommunityKudos', async () => {
    const updated = { ...kudosFixture, points: 20, message: submitInput.message };
    mockFetchOnce(updated);
    const result = await updateCommunityKudos('kudos-1', submitInput);
    expect(result).toEqual(updated);
  });

  it('update: a 403 from another member editing surfaces as KudosApiError(403)', async () => {
    mockFetchOnce({ message: 'Only the original giver can edit this kudos' }, { ok: false, status: 403 });
    await expect(updateCommunityKudos('kudos-1', submitInput)).rejects.toMatchObject({
      name: 'KudosApiError',
      status: 403,
    });
  });

  it('non-OK responses throw KudosApiError carrying status and body', async () => {
    mockFetchOnce({ message: 'Insufficient budget' }, { ok: false, status: 400 });
    await expect(submitCommunityKudos(submitInput)).rejects.toMatchObject({
      name: 'KudosApiError',
      status: 400,
    });
  });

  it('error message is the human-readable field, not the raw JSON body', async () => {
    mockFetchOnce({ message: 'Insufficient budget', statusCode: 400 }, { ok: false, status: 400 });
    await expect(submitCommunityKudos(submitInput)).rejects.toMatchObject({
      message: 'Insufficient budget',
    });
  });

  it('error message falls back to a joined array of validation messages', async () => {
    mockFetchOnce(
      { message: ['message must contain at least 25 characters'], statusCode: 400 },
      { ok: false, status: 400 },
    );
    await expect(submitCommunityKudos(submitInput)).rejects.toMatchObject({
      message: 'message must contain at least 25 characters',
    });
  });

  it('error message falls back to the raw body when it is not JSON', async () => {
    mockFetchOnce('upstream exploded', { ok: false, status: 502 });
    await expect(submitCommunityKudos(submitInput)).rejects.toMatchObject({
      message: 'upstream exploded',
    });
  });

  it('401 unauthenticated surfaces as KudosApiError(401)', async () => {
    mockFetchOnce('', { ok: false, status: 401 });
    await expect(getRecipients()).rejects.toBeInstanceOf(KudosApiError);
    await expect(
      (async () => {
        mockFetchOnce('', { ok: false, status: 401 });
        return getRecipients();
      })(),
    ).rejects.toMatchObject({ status: 401 });
  });
});
