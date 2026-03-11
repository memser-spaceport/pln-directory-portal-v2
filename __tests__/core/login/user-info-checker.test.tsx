import { render, waitFor } from '@testing-library/react';
import { useCookie } from 'react-use';
import { useRouter } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';

import { UserInfoChecker } from '@/components/core/login/components/UserInfoChecker/UserInfoChecker';
import { useMember } from '@/services/members/hooks/useMember';

jest.mock('react-use', () => ({
  useCookie: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('posthog-js/react', () => ({
  usePostHog: jest.fn(),
}));

jest.mock('@/services/members/hooks/useMember', () => ({
  useMember: jest.fn(),
}));

describe('UserInfoChecker', () => {
  const mockSetUserInfoCookie = jest.fn();
  const mockRefresh = jest.fn();

  const userInfo = {
    uid: 'member-1',
    accessLevel: 'L1' as const,
    roles: ['MEMBER'],
    name: 'Jane Doe',
    profileImageUrl: 'https://image.test/avatar.png',
    leadingTeams: ['team-1'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCookie as jest.Mock).mockReturnValue([JSON.stringify(userInfo), mockSetUserInfoCookie]);
    (useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh });
    (usePostHog as jest.Mock).mockReturnValue({ reset: jest.fn() });
  });

  it('adds missing team lead ids to leadingTeams and refreshes', async () => {
    (useMember as jest.Mock).mockReturnValue({
      data: {
        memberInfo: {
          uid: 'member-1',
          accessLevel: 'L1',
          memberRoles: [{ name: 'MEMBER' }],
          name: 'Jane Doe',
          imageUrl: 'https://image.test/avatar.png',
          teamMemberRoles: [
            { teamLead: true, team: { uid: 'team-1' } },
            { teamLead: true, team: { uid: 'team-2' } },
            { teamLead: false, team: { uid: 'team-3' } },
          ],
        },
      },
    });

    render(<UserInfoChecker userInfo={userInfo} />);

    await waitFor(() => expect(mockSetUserInfoCookie).toHaveBeenCalledTimes(1));

    const [cookieValue, options] = mockSetUserInfoCookie.mock.calls[0];

    expect(JSON.parse(cookieValue)).toEqual({
      ...userInfo,
      leadingTeams: ['team-1', 'team-2'],
    });
    expect(options).toEqual({ domain: process.env.COOKIE_DOMAIN || '' });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('does not update cookie when all lead teams are already present', async () => {
    (useMember as jest.Mock).mockReturnValue({
      data: {
        memberInfo: {
          uid: 'member-1',
          accessLevel: 'L1',
          memberRoles: [{ name: 'MEMBER' }],
          name: 'Jane Doe',
          imageUrl: 'https://image.test/avatar.png',
          teamMemberRoles: [
            { teamLead: true, team: { uid: 'team-1' } },
            { teamLead: true, teamUid: 'team-1' },
          ],
        },
      },
    });

    render(<UserInfoChecker userInfo={userInfo} />);

    await waitFor(() => {
      expect(mockSetUserInfoCookie).not.toHaveBeenCalled();
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });
});