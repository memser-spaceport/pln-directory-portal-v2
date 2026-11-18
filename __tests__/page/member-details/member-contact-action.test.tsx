/**
 * LAB-3209: a member page shows one contact button in the header. Schedule Meeting when the viewer can
 * book the member's office hours, otherwise Request an intro. Never both.
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

import { MemberContactAction } from '@/components/page/member-details/MemberDetailHeader/components/MemberContactAction';

const mockAccess = jest.fn();
jest.mock('@/services/access-control/hooks/useOfficeHoursAccess', () => ({
  useOfficeHoursAccess: () => mockAccess(),
}));
jest.mock('@/components/page/intro-request/RequestIntroEntry', () => ({
  RequestIntroEntry: () => <button>Request an intro</button>,
}));
jest.mock('@/components/page/member-details/MemberDetailHeader/components/ScheduleMeetingButton', () => ({
  ScheduleMeetingButton: () => <button>Schedule Meeting</button>,
}));

const viewer = { uid: 'viewer-uid' } as IUserInfo;
const withOfficeHours = { id: 'm1', name: 'Theresa', officeHours: 'https://calendly.com/t' } as IMember;
const withoutOfficeHours = { ...withOfficeHours, officeHours: null } as unknown as IMember;

function renderAction(member: IMember, offerBooking = true) {
  render(<MemberContactAction member={member} userInfo={viewer} offerBooking={offerBooking} />);
}

describe('MemberContactAction', () => {
  beforeEach(() => mockAccess.mockReturnValue({ canViewDemand: true, isLoading: false }));

  it('shows only Schedule Meeting when the member has office hours', () => {
    renderAction(withOfficeHours);

    expect(screen.getByText('Schedule Meeting')).toBeInTheDocument();
    expect(screen.queryByText('Request an intro')).not.toBeInTheDocument();
  });

  it('shows only Request an intro when the member has no office hours', () => {
    renderAction(withoutOfficeHours);

    expect(screen.getByText('Request an intro')).toBeInTheDocument();
    expect(screen.queryByText('Schedule Meeting')).not.toBeInTheDocument();
  });

  it('shows Request an intro when the viewer cannot book office hours', () => {
    mockAccess.mockReturnValue({ canViewDemand: false, isLoading: false });
    renderAction(withOfficeHours);

    expect(screen.getByText('Request an intro')).toBeInTheDocument();
    expect(screen.queryByText('Schedule Meeting')).not.toBeInTheDocument();
  });

  it('shows Request an intro where booking is not offered', () => {
    renderAction(withOfficeHours, false);

    expect(screen.getByText('Request an intro')).toBeInTheDocument();
    expect(screen.queryByText('Schedule Meeting')).not.toBeInTheDocument();
  });

  it('shows nothing while access is loading for a member with office hours', () => {
    mockAccess.mockReturnValue({ canViewDemand: false, isLoading: true });
    renderAction(withOfficeHours);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
