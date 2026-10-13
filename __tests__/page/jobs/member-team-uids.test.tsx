import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockUseMember = jest.fn();
jest.mock('@/services/members/hooks/useMember', () => ({
  useMember: (...args: unknown[]) => mockUseMember(...args),
}));

import { useMemberTeamUids } from '@/components/page/jobs/hooks/useMemberTeamUids';

const withTeams = (teams: Array<{ uid?: string } | null>) => ({
  memberInfo: { teamMemberRoles: teams.map((team) => ({ team })) },
});

beforeEach(() => {
  mockUseMember.mockReset();
  mockUseMember.mockReturnValue({ data: undefined });
});

describe('useMemberTeamUids', () => {
  it('collects the uid of every team the member belongs to', () => {
    mockUseMember.mockReturnValue({ data: withTeams([{ uid: 'team-1' }, { uid: 'team-2' }]) });

    const { result } = renderHook(() => useMemberTeamUids('m1'));

    expect([...result.current]).toEqual(['team-1', 'team-2']);
  });

  /* Membership, not leadership: a lead is a member with `teamLead` set, so the
     same list answers both and the card suppresses the bookmark either way. */
  it('does not care whether the membership is a lead role', () => {
    mockUseMember.mockReturnValue({
      data: { memberInfo: { teamMemberRoles: [{ team: { uid: 'team-1' }, teamLead: true }] } },
    });

    const { result } = renderHook(() => useMemberTeamUids('m1'));

    expect(result.current.has('team-1')).toBe(true);
  });

  it('is empty while the record has not arrived', () => {
    const { result } = renderHook(() => useMemberTeamUids('m1'));

    expect(result.current.size).toBe(0);
  });

  it('is empty for a signed-out viewer, so nothing is suppressed', () => {
    mockUseMember.mockReturnValue({ data: { isError: true } });

    const { result } = renderHook(() => useMemberTeamUids(undefined));

    expect(result.current.size).toBe(0);
  });

  it('skips a membership whose team did not come back', () => {
    mockUseMember.mockReturnValue({ data: withTeams([{ uid: 'team-1' }, null, {}]) });

    const { result } = renderHook(() => useMemberTeamUids('m1'));

    expect([...result.current]).toEqual(['team-1']);
  });

  /* The Set is a dependency of the memoized props every `TeamGroupCard` reads;
     a new one per render would reconcile every scrolled-in card. */
  it('keeps the same Set across renders while the record is unchanged', () => {
    const data = withTeams([{ uid: 'team-1' }]);
    mockUseMember.mockReturnValue({ data });

    const { result, rerender } = renderHook(() => useMemberTeamUids('m1'));
    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
  });
});
