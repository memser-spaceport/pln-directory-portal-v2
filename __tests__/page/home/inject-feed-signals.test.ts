import {
  injectFeedSignals,
  hiringGroupDate,
  MAX_HIRING_ENTRIES,
  MAX_DEAL_ENTRIES,
  SUPPORTING_CADENCE,
} from '@/components/page/home/TeamNews/utils/injectFeedSignals';
import type { RankedFeedEntry } from '@/components/page/home/TeamNews/utils/mergeFeedEntries';
import type { IDeal } from '@/types/deals.types';
import type { IJobTeamGroup } from '@/types/jobs.types';
import type { TeamCluster } from '@/types/team-news.types';

const newsEntry = (teamUid: string): RankedFeedEntry => ({
  kind: 'news',
  cluster: { teamUid, teamName: `Team ${teamUid}`, teamLogoUrl: null, items: [] } as unknown as TeamCluster,
});

const stream = (n: number): RankedFeedEntry[] => Array.from({ length: n }, (_, i) => newsEntry(`t${i}`));

const group = (
  uid: string,
  lastUpdated = '2026-08-01T00:00:00.000Z',
  postedDate: string | null = null,
): IJobTeamGroup =>
  ({
    team: {
      uid,
      name: `Team ${uid}`,
      logoUrl: null,
      focusAreas: [],
      subFocusAreas: [],
      jobReferEmail: null,
    },
    totalRoles: 3,
    roles: [
      {
        uid: `${uid}-r1`,
        roleTitle: 'Engineer',
        roleCategory: null,
        seniority: null,
        location: ['Remote'],
        workMode: null,
        applyUrl: 'https://example.com/apply',
        lastUpdated,
        postedDate,
        detectionDate: null,
      },
    ],
  }) as IJobTeamGroup;

const deal = (uid: string, createdAt = '2026-08-01T00:00:00.000Z'): IDeal =>
  ({
    uid,
    vendorName: `Vendor ${uid}`,
    vendorTeamUid: null,
    logoUid: null,
    category: 'Infrastructure',
    audience: 'ALL_FOUNDERS',
    shortDescription: 'A deal.',
    status: 'ACTIVE',
    createdAt,
    updatedAt: createdAt,
    isRedeemed: false,
    isUsing: false,
    teamsRedemptionCount: 0,
    teamsUsingCount: 0,
    logoUrl: null,
  }) as IDeal;

const kinds = (entries: ReturnType<typeof injectFeedSignals>) => entries.map((e) => e.kind);

describe('injectFeedSignals', () => {
  it('returns the entries untouched when neither stream loaded', () => {
    const entries = stream(6);
    expect(injectFeedSignals({ entries, hiring: undefined, deals: undefined })).toBe(entries);
  });

  it('returns the entries untouched when both streams are empty', () => {
    const entries = stream(6);
    expect(injectFeedSignals({ entries, hiring: [], deals: [] })).toBe(entries);
  });

  // The feed's own empty state is the honest answer — not a page of only jobs.
  it('drops the signals entirely when there are no ranked entries', () => {
    const result = injectFeedSignals({ entries: [], hiring: [group('a')], deals: [deal('d1')] });
    expect(result).toEqual([]);
  });

  it('never places a signal before the cadence is met', () => {
    const result = injectFeedSignals({ entries: stream(12), hiring: [group('a')], deals: [deal('d1')] });

    const firstSignal = result.findIndex((e) => e.kind === 'hiring' || e.kind === 'deal');
    expect(firstSignal).toBe(SUPPORTING_CADENCE);
    expect(result.slice(0, SUPPORTING_CADENCE).every((e) => e.kind === 'news')).toBe(true);
  });

  it('alternates hiring and deals so neither kind clusters', () => {
    const result = injectFeedSignals({
      entries: stream(20),
      hiring: [group('a'), group('b')],
      deals: [deal('d1'), deal('d2')],
    });

    expect(kinds(result).filter((k) => k !== 'news')).toEqual(['hiring', 'deal', 'hiring', 'deal']);
  });

  it('caps each kind independently', () => {
    const result = injectFeedSignals({
      entries: stream(40),
      hiring: [group('a'), group('b'), group('c'), group('d')],
      deals: [deal('d1'), deal('d2'), deal('d3')],
    });

    expect(kinds(result).filter((k) => k === 'hiring')).toHaveLength(MAX_HIRING_ENTRIES);
    expect(kinds(result).filter((k) => k === 'deal')).toHaveLength(MAX_DEAL_ENTRIES);
  });

  it('keeps the ranked entries in their original order', () => {
    const entries = stream(12);
    const result = injectFeedSignals({ entries, hiring: [group('a')], deals: [deal('d1')] });

    expect(result.filter((e) => e.kind === 'news')).toEqual(entries);
  });

  it('takes the most recent of each kind when over the cap', () => {
    const result = injectFeedSignals({
      entries: stream(20),
      hiring: [
        group('old', '2026-07-01T00:00:00.000Z'),
        group('new', '2026-08-05T00:00:00.000Z'),
        group('mid', '2026-07-20T00:00:00.000Z'),
      ],
      deals: [deal('d-old', '2026-07-02T00:00:00.000Z'), deal('d-new', '2026-08-04T00:00:00.000Z')],
    });

    const hiringUids = result.flatMap((e) => (e.kind === 'hiring' ? [e.group.team.uid] : []));
    const dealUids = result.flatMap((e) => (e.kind === 'deal' ? [e.deal.uid] : []));

    expect(hiringUids).toEqual(['new', 'mid']);
    expect(dealUids).toEqual(['d-new', 'd-old']);
  });

  // Fetched but unplaceable beats silently dropped: the reader can still act on them.
  it('appends leftover signals when the feed is shorter than the cadence allows', () => {
    const result = injectFeedSignals({
      entries: stream(SUPPORTING_CADENCE),
      hiring: [group('a'), group('b')],
      deals: [deal('d1'), deal('d2')],
    });

    expect(kinds(result).filter((k) => k !== 'news')).toHaveLength(4);
    expect(result).toHaveLength(SUPPORTING_CADENCE + 4);
    expect(result.slice(0, SUPPORTING_CADENCE).every((e) => e.kind === 'news')).toBe(true);
  });

  it('handles one stream loading without the other', () => {
    const hiringOnly = injectFeedSignals({ entries: stream(12), hiring: [group('a')], deals: undefined });
    expect(kinds(hiringOnly).filter((k) => k !== 'news')).toEqual(['hiring']);

    const dealsOnly = injectFeedSignals({ entries: stream(12), hiring: undefined, deals: [deal('d1')] });
    expect(kinds(dealsOnly).filter((k) => k !== 'news')).toEqual(['deal']);
  });

  it('does not mutate its inputs', () => {
    const entries = stream(12);
    const hiring = [group('a'), group('b')];
    const deals = [deal('d1')];
    const hiringOrder = hiring.map((g) => g.team.uid);

    injectFeedSignals({ entries, hiring, deals });

    expect(entries).toHaveLength(12);
    expect(hiring.map((g) => g.team.uid)).toEqual(hiringOrder);
  });
});

describe('hiringGroupDate', () => {
  it('prefers postedDate over lastUpdated', () => {
    expect(hiringGroupDate(group('a', '2026-07-01T00:00:00.000Z', '2026-08-09T00:00:00.000Z'))).toBe(
      '2026-08-09T00:00:00.000Z',
    );
  });

  it('falls back to lastUpdated when the board has no postedDate', () => {
    expect(hiringGroupDate(group('a', '2026-07-01T00:00:00.000Z', null))).toBe('2026-07-01T00:00:00.000Z');
  });

  it('takes the most recent role in the group', () => {
    const g = group('a');
    g.roles = [
      { ...g.roles[0], uid: 'r1', lastUpdated: '2026-07-01T00:00:00.000Z' },
      { ...g.roles[0], uid: 'r2', lastUpdated: '2026-08-08T00:00:00.000Z' },
    ];
    expect(hiringGroupDate(g)).toBe('2026-08-08T00:00:00.000Z');
  });
});
