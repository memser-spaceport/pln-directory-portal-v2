import { renderHook } from '@testing-library/react';

/**
 * LAB-2853: the lead as the Contact template introduces them — their name and
 * their role on THIS team, from the same member read the pane uses.
 */
const useCandidateMember = jest.fn();
jest.mock('@/components/page/team-details/TeamApplicants/components/useCandidateMember', () => ({
  useCandidateMember: (...args: unknown[]) => useCandidateMember(...args),
}));

let currentUser: { name?: string } | null = null;
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({ currentUser }),
}));

import { useContactSender } from '@/components/page/team-details/TeamApplicants/components/useContactSender';

const run = (enabled = true) =>
  renderHook(() => useContactSender({ viewerUid: 'u1', teamId: 'team-1', isLoggedIn: true, enabled })).result.current;

beforeEach(() => {
  currentUser = null;
  useCandidateMember.mockReset();
});

describe('useContactSender', () => {
  it('reads the lead’s name and their role on this team, not another', () => {
    useCandidateMember.mockReturnValue({
      data: {
        name: 'Maya Chen',
        teams: [
          { id: 'other', role: 'Advisor' },
          { id: 'team-1', role: ' Head of Engineering ' },
        ],
      },
    });

    expect(run()).toEqual({ name: 'Maya Chen', role: 'Head of Engineering' });
    expect(useCandidateMember).toHaveBeenCalledWith('u1', true);
  });

  it('does not read the member while disabled', () => {
    useCandidateMember.mockReturnValue({ data: undefined });

    run(false);

    expect(useCandidateMember).toHaveBeenCalledWith('', true);
  });

  it('falls back to the user store’s name, and no role, until the read lands', () => {
    currentUser = { name: 'Maya Chen' };
    useCandidateMember.mockReturnValue({ data: undefined });

    expect(run()).toEqual({ name: 'Maya Chen', role: null });
  });

  it('answers nulls rather than printing a shape it did not ask for', () => {
    useCandidateMember.mockReturnValue({ data: { memberInfo: {}, teams: 'nope' } });

    expect(run()).toEqual({ name: null, role: null });

    useCandidateMember.mockReturnValue({ data: { name: '  ', teams: [{ id: 'team-1', role: '' }, null] } });
    expect(run()).toEqual({ name: null, role: null });
  });
});
