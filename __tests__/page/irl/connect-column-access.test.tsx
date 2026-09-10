import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import AttendeeTableHeader from '@/components/page/irl/attendee-list/attendee-table-header';
import GuestTableRow from '@/components/page/irl/attendee-list/guest-table-row';
import { useCurrentUserStore } from '@/services/auth/store';
import { IUserInfo } from '@/types/shared.types';

/* useIrlGoingAccess is mocked wholesale. The global useQuery mock in
   jest.setup.js ignores `select` and always supplies `data`, so the hook's
   `canWrite` comes back undefined — every "full cell" case would silently fall
   through to the inert-pill branch and pass for the wrong reason. */
const mockCanWrite = jest.fn();

jest.mock('@/services/access-control/hooks/useIrlGoingAccess', () => ({
  useIrlGoingAccess: () => ({ canRead: mockCanWrite(), canWrite: mockCanWrite(), isLoading: false, isError: false }),
}));
jest.mock('@/analytics/irl.analytics', () => ({
  useIrlAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));

const eventDetails = { eventsForFilter: [], topics: [], isExclusionEvent: false };

const guest = {
  memberUid: 'guest-1',
  memberName: 'Ada Lovelace',
  memberLogo: '/avatar.png',
  teamUid: 'team-1',
  teamName: 'Analytical Engines',
  teamLogo: '/team.png',
  teams: [],
  reason: '',
  topics: [],
  events: [],
  eventNames: [],
  telegramId: 'ada',
  officeHours: 'https://cal.example.com/ada',
  additionalInfo: {},
};

const userInfo = { uid: 'viewer-1', roles: [] };

/* The gate reads the login cookie's `signUpSource`, not a permission query —
   which is the point: it is synchronous and cannot resolve to a false denial. */
function seedViewer(opts: { jobAspirant: boolean }) {
  useCurrentUserStore.setState({
    currentUser: {
      uid: 'viewer-1',
      ...(opts.jobAspirant ? { signUpSource: 'job-board' } : {}),
      rbac: { status: 'APPROVED', effectivePermissions: [], policies: [] },
    } as unknown as IUserInfo,
  });
}

function renderHeader(isLoggedIn: boolean) {
  return render(<AttendeeTableHeader isLoggedIn={isLoggedIn} eventDetails={eventDetails} eventType="upcoming" />);
}

function renderRow(isLoggedIn: boolean) {
  return render(
    <GuestTableRow
      guest={guest}
      userInfo={userInfo}
      showTelegram
      selectedGuests={[]}
      onchangeSelectionStatus={jest.fn()}
      isLoggedIn={isLoggedIn}
      onLogin={jest.fn()}
      isAdminInAllEvents={false}
      newSearchParams={{ type: 'upcoming' }}
    />,
  );
}

/* The three cell branches all live under `.gtr__connect*`. Querying the class
   rather than the contents catches every branch at once — including the inert
   pill, which renders no text to match on.
   `*=` and not `^=`: styled-jsx prepends its own `jsx-<hash>` class, so the
   attribute never starts with the name we wrote. */
const connectCell = (container: HTMLElement) => container.querySelector('[class*="gtr__connect"]');

describe('IRL Connect column access', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('a Job Aspirant', () => {
    beforeEach(() => {
      seedViewer({ jobAspirant: true });
      mockCanWrite.mockReturnValue(false);
    });

    it('is not shown the Connect header', () => {
      renderHeader(true);
      expect(screen.queryByText('Connect')).not.toBeInTheDocument();
    });

    it('is not shown a Connect cell, telegram handle included', () => {
      const { container } = renderRow(true);
      expect(connectCell(container)).toBeNull();
      expect(screen.queryByText('@ada')).not.toBeInTheDocument();
    });
  });

  describe('an ordinary network member', () => {
    beforeEach(() => {
      seedViewer({ jobAspirant: false });
      mockCanWrite.mockReturnValue(true);
    });

    it('keeps the Connect header', () => {
      renderHeader(true);
      expect(screen.getByText('Connect')).toBeInTheDocument();
    });

    it('keeps the Connect cell and the telegram link', () => {
      const { container } = renderRow(true);
      expect(connectCell(container)).not.toBeNull();
      expect(screen.getByText('@ada')).toBeInTheDocument();
    });
  });

  /* Directory admins, investors and demo-day admins lack irlg.going.write.
     Gating the column on that write — the permission the cell already used —
     would have silently taken the column away from them. */
  it('keeps the column for a non-aspirant who lacks going-write', () => {
    seedViewer({ jobAspirant: false });
    mockCanWrite.mockReturnValue(false);

    renderHeader(true);
    const { container } = renderRow(true);

    expect(screen.getByText('Connect')).toBeInTheDocument();
    expect(connectCell(container)).not.toBeNull();
    // Still the inert pill, exactly as before — this change did not promote them.
    expect(screen.queryByText('@ada')).not.toBeInTheDocument();
  });

  /* Logged out wins over the aspirant check — the cell is the login prompt, and
     removing it would cost a conversion path this ticket never asked about. */
  it('leaves the logged-out column and its login prompt alone', () => {
    seedViewer({ jobAspirant: true });
    mockCanWrite.mockReturnValue(false);

    renderHeader(false);
    const { container } = renderRow(false);

    expect(screen.getByText('Connect')).toBeInTheDocument();
    expect(connectCell(container)).not.toBeNull();
  });

  /* isJobAspirant reads two markers. The login cookie omits `rbac.policies`, so
     `signUpSource` carries the common case — but a member read back from the API
     is identified by the policy code instead, and both must hide the column. */
  it('recognises a Job Aspirant by policy code, not just signUpSource', () => {
    useCurrentUserStore.setState({
      currentUser: {
        uid: 'viewer-1',
        rbac: { status: 'PENDING', effectivePermissions: [], policies: [{ code: 'job_aspirant' }] },
      } as unknown as IUserInfo,
    });
    mockCanWrite.mockReturnValue(false);

    renderHeader(true);
    const { container } = renderRow(true);

    expect(screen.queryByText('Connect')).not.toBeInTheDocument();
    expect(connectCell(container)).toBeNull();
  });
});
