import '@testing-library/jest-dom';
import { type ReactNode } from 'react';
import { render, renderHook, screen } from '@testing-library/react';
import {
  confirmToastContent,
  confirmToastMessage,
  useActivityConfirmToast,
} from '@/components/page/aligement-assets/activities/confirm-toast';
import type { SnapshotActivityItem } from '@/services/plaa/hooks/useCurrentSnapshotStatus';

const mockToastSuccess = jest.fn();
jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: (...args: unknown[]) => mockToastSuccess(...args) },
}));

const mockUseCurrentSnapshotStatus = jest.fn();
jest.mock('@/services/plaa/hooks/useCurrentSnapshotStatus', () => ({
  useCurrentSnapshotStatus: () => mockUseCurrentSnapshotStatus(),
}));

const mockUsePlaaAccess = jest.fn();
jest.mock('@/services/rbac/hooks/usePlaaAccess', () => ({
  usePlaaAccess: () => mockUsePlaaAccess(),
}));

const mockUseCurrentUserStore = jest.fn();
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => mockUseCurrentUserStore(),
}));

const hostOfficeHours = { id: 'host-office-hours', activity: 'Host Office Hours' };

const row = (siteActivityId: string | null, points = 100): SnapshotActivityItem => ({
  category: 'Knowledge Sharing',
  title: 'Host Office Hours',
  points,
  siteActivityId,
});

const ready = (activities: SnapshotActivityItem[]) => ({
  activities,
  activitiesStatus: 'ready' as const,
  periodLabel: 'November 2026',
});

describe('confirmToastMessage', () => {
  it("counts only the member's rows linked to this card in the open snapshot", () => {
    const message = confirmToastMessage(
      hostOfficeHours,
      ready([row('host-office-hours'), row('host-office-hours'), row('book-office-hours'), row(null, 500)]),
      'member',
    );

    expect(message).toContain('Host Office Hours credited 2 times (200 points) for November');
  });

  it('uses the singular for one credit and formats large point totals', () => {
    const message = confirmToastMessage(
      { id: 'build-ai-app-for-the-network', activity: 'Build an AI App for the Network' },
      ready([row('build-ai-app-for-the-network', 1000)]),
      'member',
    );

    expect(message).toContain('credited 1 time (1,000 points) for November.');
  });

  it('says nothing is credited yet when the card has no rows this snapshot', () => {
    expect(confirmToastMessage(hostOfficeHours, ready([row('book-office-hours'), row(null)]), 'member')).toContain(
      'Host Office Hours not credited yet for November',
    );
  });

  it('describes kudos rows as kudos received', () => {
    const kudos = { id: 'give-network-kudos', activity: 'Give a Network Kudos' };

    expect(
      confirmToastMessage(kudos, ready([row('give-network-kudos', 20), row('give-network-kudos', 30)]), 'member'),
    ).toContain('Confirmed! 2 kudos received (50 points) for November.');
    expect(confirmToastMessage(kudos, ready([]), 'member')).toContain('Confirmed! No kudos received yet for November.');
  });

  it('falls back while records load or when they are unavailable', () => {
    const base = ready([row('host-office-hours')]);

    expect(confirmToastMessage(hostOfficeHours, { ...base, activitiesStatus: 'loading' }, 'member')).toBeNull();
    expect(confirmToastMessage(hostOfficeHours, { ...base, activitiesStatus: 'unavailable' }, 'member')).toBeNull();
  });

  it('tells a LabOS member without PLAA access that points are for PLAA members', () => {
    expect(confirmToastMessage(hostOfficeHours, ready([]), 'not-member')).toMatch(/collected by PLAA members/);
  });

  it('falls back while PLAA access is unknown', () => {
    expect(confirmToastMessage(hostOfficeHours, ready([row('host-office-hours')]), 'unknown')).toBeNull();
  });
});

describe('confirmToastContent', () => {
  it('links Profile in the fallback', () => {
    render(<>{confirmToastContent(null)}</>);

    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/alignment-asset/profile');
  });

  it('passes a counted message through as plain text', () => {
    expect(confirmToastContent('Confirmed! Host Office Hours credited 1 time')).toBe(
      'Confirmed! Host Office Hours credited 1 time',
    );
  });
});

describe('useActivityConfirmToast', () => {
  const shownToast = () => {
    expect(mockToastSuccess).toHaveBeenCalledTimes(1);
    const [content] = mockToastSuccess.mock.calls[0] as [ReactNode];
    return render(<>{content}</>);
  };
  const shownText = () => shownToast().container.textContent;
  const expectFallback = () => {
    const shown = shownToast();
    expect(shown.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/alignment-asset/profile');
    expect(shown.container.textContent).not.toMatch(/collected by PLAA members/);
  };

  beforeEach(() => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'member-1' }, isHydrated: true });
    mockUseCurrentSnapshotStatus.mockReturnValue(ready([row('host-office-hours')]));
  });

  afterEach(() => jest.clearAllMocks());

  it('shows the counted message to a PLAA member', () => {
    mockUsePlaaAccess.mockReturnValue({ canView: true, isLoading: false, isError: false });

    renderHook(() => useActivityConfirmToast()).result.current(hostOfficeHours);

    expect(shownText()).toContain('Host Office Hours credited 1 time');
  });

  it('shows the non-member message when the access record lacks plaa.access', () => {
    mockUsePlaaAccess.mockReturnValue({ canView: false, isLoading: false, isError: false });

    renderHook(() => useActivityConfirmToast()).result.current(hostOfficeHours);

    expect(shownText()).toMatch(/collected by PLAA members/);
  });

  it('shows the fallback, not the non-member message, when the access lookup failed', () => {
    mockUsePlaaAccess.mockReturnValue({ canView: false, isLoading: false, isError: true });

    renderHook(() => useActivityConfirmToast()).result.current(hostOfficeHours);

    expectFallback();
  });

  it('shows the fallback to a signed-out visitor', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: true });
    mockUsePlaaAccess.mockReturnValue({ canView: false, isLoading: false, isError: false });

    renderHook(() => useActivityConfirmToast()).result.current(hostOfficeHours);

    expectFallback();
  });

  it('uses the default toast width', () => {
    mockUsePlaaAccess.mockReturnValue({ canView: true, isLoading: false, isError: false });

    renderHook(() => useActivityConfirmToast()).result.current(hostOfficeHours);

    const options = mockToastSuccess.mock.calls[0][1] as
      | { className?: string; style?: { width?: unknown } }
      | undefined;
    expect(options?.className).toBeUndefined();
    expect(options?.style?.width).toBeUndefined();
  });
});
