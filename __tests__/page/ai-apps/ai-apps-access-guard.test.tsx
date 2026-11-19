import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { AiAppsAccessGuard } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsAccessGuard';
import { PERMISSIONS } from '@/services/rbac/constants';

/**
 * This guard is deliberately sticky: once it has shown the page it keeps it
 * mounted through later loading flickers, because unmounting discarded
 * in-progress AI App secrets. The tests below pin both halves — the gate itself
 * and the stickiness that must not become a hole in it.
 */

const mockReplace = jest.fn();
const mockAccessDenied = jest.fn();
const mockPermissions = jest.fn(() => ({ permissions: [] as string[], isLoading: false, isError: false }));

let mockPathname = '/pl-infra/ai-apps';
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), prefetch: jest.fn(), refresh: jest.fn() }),
  usePathname: () => mockPathname,
}));

let mockPublished: { apps: Array<{ uid: string; path?: string | null }>; isLoading: boolean } = {
  apps: [],
  isLoading: false,
};
jest.mock('@/services/ai-apps/hooks/usePublishedAiApps', () => ({
  usePublishedAiApps: () => mockPublished,
}));

jest.mock('@/services/rbac/hooks/usePermissions', () => ({
  usePermissions: () => {
    const { permissions, isLoading, isError } = mockPermissions();
    return { permissions, permsSet: new Set(permissions), isLoading, isError };
  },
}));

jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => ({ onAccessDenied: (...a: unknown[]) => mockAccessDenied(...a) }),
}));

const GRANTED = { permissions: [PERMISSIONS.AI_APPS.PERM_VIEW], isLoading: false, isError: false };
const DENIED = { permissions: [], isLoading: false, isError: false };
const LOADING = { permissions: [], isLoading: true, isError: false };
const FAILED = { permissions: [], isLoading: false, isError: true };

const children: ReactNode = <div>AI Apps page</div>;

function renderGuard() {
  return render(<AiAppsAccessGuard>{children}</AiAppsAccessGuard>);
}

const page = () => screen.queryByText('AI Apps page');

beforeEach(() => {
  jest.clearAllMocks();
  mockPermissions.mockReturnValue(GRANTED);
  mockPathname = '/pl-infra/ai-apps';
  mockPublished = { apps: [], isLoading: false };
});

describe('AiAppsAccessGuard — the gate', () => {
  it('renders the page for a member holding ai_apps.read', () => {
    renderGuard();

    expect(page()).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('renders nothing and waits while permissions are loading', () => {
    mockPermissions.mockReturnValue(LOADING);
    renderGuard();

    expect(page()).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockAccessDenied).not.toHaveBeenCalled();
  });

  it('sends an unpermitted member home without flashing the page', () => {
    mockPermissions.mockReturnValue(DENIED);
    renderGuard();

    expect(page()).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('treats a failed permissions request as no access', () => {
    mockPermissions.mockReturnValue(FAILED);
    renderGuard();

    expect(page()).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it("is not opened by some other area's permission", () => {
    mockPermissions.mockReturnValue({ ...DENIED, permissions: ['roadmap.view', 'investor_db.view'] });
    renderGuard();

    expect(page()).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});

describe('AiAppsAccessGuard — reporting the refusal', () => {
  it('reports the denial once, naming the route that was refused', () => {
    mockPermissions.mockReturnValue(DENIED);
    renderGuard();

    expect(mockAccessDenied).toHaveBeenCalledTimes(1);
    expect(mockAccessDenied).toHaveBeenCalledWith('/pl-infra/ai-apps');
  });

  it('does not report it again on a re-render', () => {
    mockPermissions.mockReturnValue(DENIED);
    const { rerender } = renderGuard();

    rerender(<AiAppsAccessGuard>{children}</AiAppsAccessGuard>);

    expect(mockAccessDenied).toHaveBeenCalledTimes(1);
  });

  it('reports nothing for a permitted member', () => {
    renderGuard();

    expect(mockAccessDenied).not.toHaveBeenCalled();
  });
});

describe('AiAppsAccessGuard — staying mounted through a refetch', () => {
  it('keeps the page up when permissions briefly go back to loading', () => {
    const { rerender } = renderGuard();
    expect(page()).toBeInTheDocument();

    mockPermissions.mockReturnValue(LOADING);
    rerender(<AiAppsAccessGuard>{children}</AiAppsAccessGuard>);

    expect(page()).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('keeps the page up when a background refetch errors', () => {
    const { rerender } = renderGuard();

    mockPermissions.mockReturnValue(FAILED);
    rerender(<AiAppsAccessGuard>{children}</AiAppsAccessGuard>);

    expect(page()).toBeInTheDocument();
  });

  it('still redirects once access is genuinely revoked, sticky or not', () => {
    const { rerender } = renderGuard();

    mockPermissions.mockReturnValue(DENIED);
    rerender(<AiAppsAccessGuard>{children}</AiAppsAccessGuard>);

    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('does not carry the grant into a fresh mount', () => {
    renderGuard().unmount();

    mockPermissions.mockReturnValue(DENIED);
    renderGuard();

    expect(page()).not.toBeInTheDocument();
  });
});

// LAB-3336: a catalog link shared with a member the app is published to.
describe('AiAppsAccessGuard — a catalog link to an app published to the member', () => {
  const renderAppPage = (segment = 'cmhello1') =>
    render(<AiAppsAccessGuard publishedAppSegment={segment}>{children}</AiAppsAccessGuard>);

  beforeEach(() => mockPermissions.mockReturnValue(DENIED));

  it('opens the app at its published path instead of sending the member Home', () => {
    mockPathname = '/pl-infra/ai-apps/cmhello1';
    mockPublished = { apps: [{ uid: 'cmhello1', path: 'hello' }], isLoading: false };

    renderAppPage();

    expect(mockReplace).toHaveBeenCalledWith('/apps/hello');
    expect(mockAccessDenied).not.toHaveBeenCalled();
    expect(page()).toBeNull();
  });

  it('keeps the subpage, and uses the uid when the app has no path', () => {
    mockPathname = '/pl-infra/ai-apps/cmhello1/reports/q3';
    mockPublished = { apps: [{ uid: 'cmhello1', path: null }], isLoading: false };

    renderAppPage();

    expect(mockReplace).toHaveBeenCalledWith('/apps/cmhello1/reports/q3');
  });

  it('waits for the published list before deciding', () => {
    mockPathname = '/pl-infra/ai-apps/cmhello1';
    mockPublished = { apps: [], isLoading: true };

    renderAppPage();

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('still sends a member Home when the app is not published to them', () => {
    mockPathname = '/pl-infra/ai-apps/cmother';
    mockPublished = { apps: [{ uid: 'cmhello1', path: 'hello' }], isLoading: false };

    renderAppPage('cmother');

    expect(mockReplace).toHaveBeenCalledWith('/');
    expect(mockAccessDenied).toHaveBeenCalledTimes(1);
  });

  it('shows the catalog page to a PL Infra member as before', () => {
    mockPermissions.mockReturnValue(GRANTED);
    mockPublished = { apps: [{ uid: 'cmhello1', path: 'hello' }], isLoading: false };

    renderAppPage();

    expect(page()).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
