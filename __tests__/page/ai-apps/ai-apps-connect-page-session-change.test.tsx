import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { AiAppsConnectPage } from '@/components/page/ai-apps/AiAppsConnectPage';
import { ConnectSession } from '@/services/ai-apps/ai-apps.service';

let mockSearch = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => mockSearch,
}));

const mockAnalytics = {
  onConnectPageViewed: jest.fn(),
  onConnectSignInClicked: jest.fn(),
  onConnectApproved: jest.fn(),
  onConnectDenied: jest.fn(),
  onConnectExpired: jest.fn(),
  onConnectError: jest.fn(),
};

jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => mockAnalytics,
}));

const mockUserState = { currentUser: { uid: 'member-1' }, isHydrated: true };

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => mockUserState,
}));

const mockFetchConnectSession = jest.fn();
const mockApproveConnectSession = jest.fn();

jest.mock('@/services/ai-apps/ai-apps.service', () => ({
  fetchConnectSession: (...args: unknown[]) => mockFetchConnectSession(...args),
  approveConnectSession: (...args: unknown[]) => mockApproveConnectSession(...args),
}));

function buildSession(overrides: Partial<ConnectSession> = {}): ConnectSession {
  return {
    sessionId: 'session-old',
    userCode: 'OLD-CODE',
    clientName: 'Claude Code',
    status: 'pending',
    expiresAt: '2026-10-06T17:00:00.000Z',
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

async function renderWithSession(sessionId: string, result: ConnectSession) {
  mockSearch = new URLSearchParams({ session: sessionId });
  mockFetchConnectSession.mockResolvedValueOnce(result);
  const utils = render(<AiAppsConnectPage />);
  await act(async () => {});
  return utils;
}

describe('AiAppsConnectPage when only ?session= changes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchConnectSession.mockReset();
    mockApproveConnectSession.mockReset();
  });

  it('shows "Loading…" and then the new session, never the old one', async () => {
    const { rerender } = await renderWithSession('session-old', buildSession({ status: 'approved' }));
    expect(screen.getByText(/Connected\./)).toBeInTheDocument();

    const next = deferred<ConnectSession | null>();
    mockFetchConnectSession.mockReturnValueOnce(next.promise);
    mockSearch = new URLSearchParams({ session: 'session-new' });
    rerender(<AiAppsConnectPage />);

    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText(/Connected\./)).not.toBeInTheDocument();

    await act(async () => {
      next.resolve(buildSession({ sessionId: 'session-new', userCode: 'NEW-CODE', status: 'pending' }));
    });

    expect(screen.getByText('NEW-CODE')).toBeInTheDocument();
    expect(mockFetchConnectSession).toHaveBeenLastCalledWith('session-new');
  });

  it('fires no onConnectApproved for the new session when the old one was approved', async () => {
    const { rerender } = await renderWithSession('session-old', buildSession({ status: 'approved' }));
    expect(mockAnalytics.onConnectApproved).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'session-old' }));

    const next = deferred<ConnectSession | null>();
    mockFetchConnectSession.mockReturnValueOnce(next.promise);
    mockSearch = new URLSearchParams({ session: 'session-new' });
    rerender(<AiAppsConnectPage />);
    await act(async () => {
      next.resolve(buildSession({ sessionId: 'session-new', userCode: 'NEW-CODE', status: 'pending' }));
    });

    expect(mockAnalytics.onConnectApproved).not.toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 'session-new' }),
    );
    expect(mockAnalytics.onConnectPageViewed).not.toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 'session-new', view: 'approved' }),
    );
  });

  it('never shows the old userCode for the new session when the old one was pending', async () => {
    const { rerender } = await renderWithSession('session-old', buildSession({ status: 'pending' }));
    expect(screen.getByText('OLD-CODE')).toBeInTheDocument();

    const next = deferred<ConnectSession | null>();
    mockFetchConnectSession.mockReturnValueOnce(next.promise);
    mockSearch = new URLSearchParams({ session: 'session-new' });
    rerender(<AiAppsConnectPage />);

    expect(screen.queryByText('OLD-CODE')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();

    await act(async () => {
      next.resolve(buildSession({ sessionId: 'session-new', userCode: 'NEW-CODE', status: 'pending' }));
    });

    expect(screen.queryByText('OLD-CODE')).not.toBeInTheDocument();
    expect(screen.getByText('NEW-CODE')).toBeInTheDocument();
  });

  it('ignores an approval of the old session that finishes after the URL changed', async () => {
    const { rerender } = await renderWithSession('session-old', buildSession({ status: 'pending' }));

    const approval = deferred<{ status: 'approved' } | null>();
    mockApproveConnectSession.mockReturnValueOnce(approval.promise);
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(screen.getByRole('button', { name: 'Approving…' })).toBeInTheDocument();

    mockFetchConnectSession.mockResolvedValueOnce(
      buildSession({ sessionId: 'session-new', userCode: 'NEW-CODE', status: 'pending' }),
    );
    mockSearch = new URLSearchParams({ session: 'session-new' });
    rerender(<AiAppsConnectPage />);
    await act(async () => {});

    expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled();

    await act(async () => {
      approval.resolve({ status: 'approved' });
    });

    expect(screen.getByText('NEW-CODE')).toBeInTheDocument();
    expect(screen.queryByText(/Connected\./)).not.toBeInTheDocument();
    expect(mockAnalytics.onConnectApproved).not.toHaveBeenCalled();
  });

  it('keeps first-load behavior: "Loading…", then the session', async () => {
    mockSearch = new URLSearchParams({ session: 'session-old' });
    const first = deferred<ConnectSession | null>();
    mockFetchConnectSession.mockReturnValueOnce(first.promise);
    render(<AiAppsConnectPage />);

    expect(screen.getByText('Loading…')).toBeInTheDocument();

    await act(async () => {
      first.resolve(buildSession({ status: 'pending' }));
    });

    expect(screen.getByText('OLD-CODE')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(mockFetchConnectSession).toHaveBeenCalledTimes(1);
    expect(mockAnalytics.onConnectPageViewed).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 'session-old', view: 'pending' }),
    );
  });
});
