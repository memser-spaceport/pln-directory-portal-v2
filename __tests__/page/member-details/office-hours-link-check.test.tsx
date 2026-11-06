/**
 * LAB-3006: the office hours link check (`POST /v1/members/:uid/office-hours/check`) answers 403 for a viewer who is
 * not the profile owner and not an admin (LAB-2983). The page then fell back to the stored `ohStatus`, so a stored
 * BROKEN made Schedule Meeting show the invalid-link dialog for every other member. Only the owner or an admin runs the
 * check now; other viewers can always open the link.
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OfficeHoursDetails } from '@/components/page/member-details/OfficeHoursDetails';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';

const mockValidateQuery = jest.fn();
jest.mock('@/services/members/hooks/useValidateOfficeHoursQuery', () => ({
  useValidateOfficeHoursQuery: (...args: unknown[]) => mockValidateQuery(...args),
}));
jest.mock('@/services/access-control/hooks/useOfficeHoursAccess', () => ({
  useOfficeHoursAccess: () => ({ canViewSupply: true, canSupply: true, canViewDemand: true }),
}));
jest.mock('@/components/page/member-details/hooks', () => ({
  useFixBrokenOfficeHoursLinkEventCapture: () => undefined,
  useBrokenOfficeHoursLinkBookAttemptEventCapture: () => ({ forceEditMode: false }),
}));
jest.mock('@/hooks/useMobileNavVisibility', () => ({ useMobileNavVisibility: () => undefined }));
jest.mock('@/components/page/member-details/OfficeHoursDetails/components/EditOfficeHoursForm', () => ({
  EditOfficeHoursForm: () => null,
}));
jest.mock('@/components/page/member-details/OfficeHoursDetails/components/OfficeHoursView', () => ({
  OfficeHoursView: ({ isOfficeHoursValid }: { isOfficeHoursValid: boolean }) => (
    <div data-testid="view">{isOfficeHoursValid ? 'link valid' : 'link broken'}</div>
  ),
}));
jest.mock('@/components/common/profile/DetailsSection', () => ({
  DetailsSection: ({ children, missingDataAlert }: { children: React.ReactNode; missingDataAlert: boolean }) => (
    <div data-testid="section" data-alert={String(!!missingDataAlert)}>
      {children}
    </div>
  ),
}));

const member = {
  id: 'owner-uid',
  name: 'Theresa',
  officeHours: 'https://calendly.com/theresa',
  ohStatus: 'BROKEN',
  ohInterest: ['a'],
  ohHelpWith: ['b'],
} as unknown as IMember;

const viewer = { uid: 'viewer-uid' } as IUserInfo;
const owner = { uid: 'owner-uid' } as IUserInfo;
const admin = {
  uid: 'admin-uid',
  rbac: { effectivePermissions: [{ code: 'directory.admin.full' }] },
} as unknown as IUserInfo;

// The query hook gets `enabled` as its second argument; a 403 leaves `data` undefined.
function mockCheck(result: { ohStatus: IMember['ohStatus'] } | undefined) {
  mockValidateQuery.mockImplementation(() => ({ data: result }));
}

describe('OfficeHoursDetails link check (LAB-3006)', () => {
  beforeEach(() => mockValidateQuery.mockReset());

  it('does not check the link for a member who is not the owner or an admin, and treats the link as valid', () => {
    mockCheck(undefined);
    render(<OfficeHoursDetails member={member} isLoggedIn userInfo={viewer} />);

    expect(mockValidateQuery).toHaveBeenCalled();
    for (const call of mockValidateQuery.mock.calls) {
      expect(call[1]).toBe(false);
    }
    expect(screen.getByTestId('view')).toHaveTextContent('link valid');
  });

  it('shows the owner the broken alert from the check result', () => {
    mockCheck({ ohStatus: 'BROKEN' });
    render(<OfficeHoursDetails member={{ ...member, ohStatus: 'OK' }} isLoggedIn userInfo={owner} />);

    expect(mockValidateQuery.mock.calls[0][1]).toBe(true);
    expect(screen.getByTestId('view')).toHaveTextContent('link broken');
    expect(screen.getByTestId('section')).toHaveAttribute('data-alert', 'true');
  });

  it('shows the owner no alert when the check result is OK', () => {
    mockCheck({ ohStatus: 'OK' });
    render(<OfficeHoursDetails member={member} isLoggedIn userInfo={owner} />);

    expect(screen.getByTestId('view')).toHaveTextContent('link valid');
    expect(screen.getByTestId('section')).toHaveAttribute('data-alert', 'false');
  });

  it('keeps the admin behavior: the admin gets the check result, and a broken result stays broken', () => {
    mockCheck({ ohStatus: 'BROKEN' });
    render(<OfficeHoursDetails member={{ ...member, ohStatus: 'OK' }} isLoggedIn userInfo={admin} />);

    expect(mockValidateQuery.mock.calls[0][1]).toBe(true);
    expect(screen.getByTestId('view')).toHaveTextContent('link broken');
  });
});
