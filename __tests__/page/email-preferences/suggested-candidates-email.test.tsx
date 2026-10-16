import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SuggestedCandidatesEmail } from '@/components/page/email-preferences/components/SuggestedCandidatesEmail';
import type { IUserInfo } from '@/types/shared.types';

// The real React Query: the global mock in jest.setup.js would hide the
// optimistic update and the rollback, which are what these tests are about.
jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));

const mockCustomFetch = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({
  customFetch: (...args: unknown[]) => mockCustomFetch(...args),
}));

const mockToastError = jest.fn();
jest.mock('@/components/core/ToastContainer', () => ({
  toast: { error: (...a: unknown[]) => mockToastError(...a) },
}));

const mockToggleClicked = jest.fn();
jest.mock('@/analytics/settings.analytics', () => ({
  useSettingsAnalytics: () => ({
    onSuggestedCandidatesEmailToggleClicked: (...a: unknown[]) => mockToggleClicked(...a),
  }),
}));

const userInfo: IUserInfo = { uid: 'lead-1', leadingTeams: ['team-1'] };
const SETTING_URL = /\/v1\/notification\/settings\/lead-1\/suggested-candidates-email$/;

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function renderSwitch() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <SuggestedCandidatesEmail userInfo={userInfo} />
    </QueryClientProvider>,
  );
  return screen.getByRole('switch');
}

/** A tiny stand-in server: GET reads the stored value, PUT writes it. */
function respondToGet(initial: boolean) {
  let stored = initial;
  mockCustomFetch.mockImplementation(async (_url: string, init: RequestInit) => {
    if (init.method === 'PUT') {
      stored = JSON.parse(String(init.body)).suggestedCandidatesEmailEnabled;
    }
    return jsonResponse(200, { memberUid: 'lead-1', suggestedCandidatesEmailEnabled: stored });
  });
}

describe('SuggestedCandidatesEmail', () => {
  beforeEach(() => {
    mockCustomFetch.mockReset();
    mockToastError.mockReset();
    mockToggleClicked.mockReset();
  });

  it('renders the copy', async () => {
    respondToGet(true);
    renderSwitch();
    expect(screen.getByText('Suggested Candidates')).toBeInTheDocument();
    expect(screen.getByText('Receive suggested candidates email')).toBeInTheDocument();
    expect(screen.getByText('Get a weekly email with suggested candidates for your open roles.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true'));
  });

  it('is disabled while the setting loads, and enabled with the loaded state once it lands', async () => {
    const get = deferred<Response>();
    mockCustomFetch.mockReturnValueOnce(get.promise);

    const toggle = renderSwitch();
    expect(toggle).toHaveAttribute('data-disabled');

    // A click while loading changes nothing and saves nothing.
    fireEvent.click(toggle);
    expect(mockCustomFetch).toHaveBeenCalledTimes(1);
    expect(mockToggleClicked).not.toHaveBeenCalled();

    await act(async () => {
      get.resolve(jsonResponse(200, { memberUid: 'lead-1', suggestedCandidatesEmailEnabled: true }));
    });

    await waitFor(() => expect(screen.getByRole('switch')).not.toHaveAttribute('data-disabled'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect(mockCustomFetch.mock.calls[0][0]).toMatch(SETTING_URL);
    expect(mockCustomFetch.mock.calls[0][2]).toBe(true);
  });

  it('shows off for a lead who opted out (e.g. through the email link)', async () => {
    respondToGet(false);
    renderSwitch();
    await waitFor(() => expect(screen.getByRole('switch')).not.toHaveAttribute('data-disabled'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('stays disabled when the read fails', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(403, { message: 'Forbidden' }));
    renderSwitch();
    await waitFor(() => expect(mockCustomFetch).toHaveBeenCalled());
    await act(async () => {});
    expect(screen.getByRole('switch')).toHaveAttribute('data-disabled');
  });

  it('turning it off saves the opt-out as JSON and tracks the click', async () => {
    let enabled = true;
    const put = deferred<Response>();
    mockCustomFetch.mockImplementation((_url: string, init: RequestInit) =>
      init.method === 'GET'
        ? Promise.resolve(jsonResponse(200, { memberUid: 'lead-1', suggestedCandidatesEmailEnabled: enabled }))
        : put.promise,
    );
    renderSwitch();
    await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true'));

    fireEvent.click(screen.getByRole('switch'));
    expect(mockToggleClicked).toHaveBeenCalledWith({ suggestedCandidatesEmailEnabled: false });

    // Optimistic: off while the PUT is still unanswered.
    await waitFor(() => expect(mockCustomFetch.mock.calls.some(([, init]) => init.method === 'PUT')).toBe(true));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');

    enabled = false;
    await act(async () => {
      put.resolve(jsonResponse(200, { memberUid: 'lead-1', suggestedCandidatesEmailEnabled: false }));
    });
    const [url, init, withToken] = mockCustomFetch.mock.calls.find(([, i]) => i.method === 'PUT')!;
    expect(url).toMatch(SETTING_URL);
    expect(withToken).toBe(true);
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body)).toEqual({ suggestedCandidatesEmailEnabled: false });

    // Settled, re-read from the server: still off, no error.
    await waitFor(() => expect(mockCustomFetch.mock.calls.filter(([, i]) => i.method === 'GET')).toHaveLength(2));
    await act(async () => {});
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('turning it on saves enabled: true', async () => {
    respondToGet(false);
    renderSwitch();
    await waitFor(() => expect(screen.getByRole('switch')).not.toHaveAttribute('data-disabled'));

    fireEvent.click(screen.getByRole('switch'));

    await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true'));
    await waitFor(() => expect(mockCustomFetch.mock.calls.some(([, init]) => init.method === 'PUT')).toBe(true));
    const [, init] = mockCustomFetch.mock.calls.find(([, i]) => i.method === 'PUT')!;
    expect(JSON.parse(init.body)).toEqual({ suggestedCandidatesEmailEnabled: true });
    expect(mockToggleClicked).toHaveBeenCalledWith({ suggestedCandidatesEmailEnabled: true });

    await waitFor(() => expect(mockCustomFetch.mock.calls.filter(([, i]) => i.method === 'GET')).toHaveLength(2));
    await act(async () => {});
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('rolls back and shows an error toast when the save fails', async () => {
    const put = deferred<Response>();
    // The re-read after the failed save never answers, so the switch can only be
    // back on because the hook restored the cached value — not because a refetch did.
    const refetch = deferred<Response>();
    mockCustomFetch
      .mockResolvedValueOnce(jsonResponse(200, { memberUid: 'lead-1', suggestedCandidatesEmailEnabled: true }))
      .mockImplementation((_url: string, init: RequestInit) => (init.method === 'GET' ? refetch.promise : put.promise));
    renderSwitch();
    await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true'));

    fireEvent.click(screen.getByRole('switch'));
    await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false'));

    await act(async () => {
      put.resolve(jsonResponse(500, { message: 'boom' }));
    });

    await waitFor(() => expect(mockToastError).toHaveBeenCalledTimes(1));
    expect(mockToastError).toHaveBeenCalledWith(
      "Couldn't update your suggested candidates email setting. Please try again.",
    );
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });
});
