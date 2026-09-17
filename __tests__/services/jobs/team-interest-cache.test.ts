import { applyTeamInterestToBoardCache } from '@/services/jobs/hooks/useTeamInterest';
import type { TeamInterestStatus } from '@/services/jobs/job-interests.service';
import type { IJobTeam, IJobTeamGroup, IJobsListResponse } from '@/types/jobs.types';

/**
 * The board cache patch behind the open-role signal.
 *
 * Tested as a pure transform rather than through `useMarkTeamInterest`, because
 * the global jest setup stubs `useMutation` and `useQueryClient` — a hook test
 * would be asserting against those stubs, not against this logic. What matters
 * is the transform: find the team wherever it sits, change only its two fields,
 * leave every other object alone.
 */

const team = (uid: string, over: Partial<IJobTeam> = {}): IJobTeam => ({
  uid,
  name: uid,
  logoUrl: null,
  focusAreas: [],
  subFocusAreas: [],
  ...over,
});

const group = (uid: string, over: Partial<IJobTeam> = {}): IJobTeamGroup => ({
  team: team(uid, over),
  totalRoles: 0,
  roles: [],
});

const page = (groups: IJobTeamGroup[], pageNum = 1): IJobsListResponse => ({
  groups,
  page: pageNum,
  limit: 10,
  total: groups.length,
  totalGroups: groups.length,
  totalRoles: 0,
});

const marked = (teamUid: string): TeamInterestStatus => ({
  teamUid,
  interestedCount: 7,
  viewerIsInterested: true,
});

const findTeam = (data: { pages: IJobsListResponse[] } | undefined, uid: string) =>
  data?.pages.flatMap((p) => p.groups).find((g) => g.team.uid === uid)?.team;

describe('applyTeamInterestToBoardCache', () => {
  it('flips the team it was told about', () => {
    const cached = { pages: [page([group('pl'), group('other')])], pageParams: [1] };

    const next = applyTeamInterestToBoardCache(cached, marked('pl'));

    expect(findTeam(next, 'pl')).toMatchObject({ viewerIsInterestedInTeam: true, interestedInTeamCount: 7 });
  });

  it('leaves every other team untouched', () => {
    const cached = { pages: [page([group('pl'), group('other')])], pageParams: [1] };

    const next = applyTeamInterestToBoardCache(cached, marked('pl'));

    expect(findTeam(next, 'other')?.viewerIsInterestedInTeam).toBeUndefined();
    expect(findTeam(next, 'other')).toBe(cached.pages[0].groups[1].team);
  });

  /* The board is an infinite query, and the team pressed may not be on page 1 —
     a member who scrolled before pressing is the ordinary case, not the edge. */
  it('reaches a team on a later page', () => {
    const cached = {
      pages: [page([group('a')], 1), page([group('b'), group('pl')], 2)],
      pageParams: [1, 2],
    };

    const next = applyTeamInterestToBoardCache(cached, marked('pl'));

    expect(findTeam(next, 'pl')?.viewerIsInterestedInTeam).toBe(true);
    expect(findTeam(next, 'a')?.viewerIsInterestedInTeam).toBeUndefined();
  });

  /* Writes the SERVER's answer, not the press. Both are idempotent, so a state
     that says "not interested" after a write has to be rendered as such rather
     than optimistically overwritten with what the user clicked. */
  it('honours a response that says not interested', () => {
    const cached = { pages: [page([group('pl', { viewerIsInterestedInTeam: true })])], pageParams: [1] };

    const next = applyTeamInterestToBoardCache(cached, {
      teamUid: 'pl',
      interestedCount: 0,
      viewerIsInterested: false,
    });

    expect(findTeam(next, 'pl')?.viewerIsInterestedInTeam).toBe(false);
  });

  it('does nothing to an empty cache', () => {
    expect(applyTeamInterestToBoardCache(undefined, marked('pl'))).toBeUndefined();
  });

  it('does not mutate the cache it was given', () => {
    const cached = { pages: [page([group('pl')])], pageParams: [1] };

    applyTeamInterestToBoardCache(cached, marked('pl'));

    expect(cached.pages[0].groups[0].team.viewerIsInterestedInTeam).toBeUndefined();
  });
});
