import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';

import { SuggestedCandidatesUnsubscribe } from '@/components/page/email-preferences/components/SuggestedCandidatesUnsubscribe';

let mockSearch = '';
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

// customFetch must not be involved: it reloads the page when there is no session.
const mockCustomFetch = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({
  customFetch: (...args: unknown[]) => mockCustomFetch(...args),
}));

const fetchMock = jest.fn();
const realFetch = global.fetch;

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function emailPreferencesLink() {
  return screen.getByRole('link', { name: 'Email Preferences' });
}

describe('SuggestedCandidatesUnsubscribe', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    mockCustomFetch.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    mockSearch = '?token=tok-123';
  });

  afterAll(() => {
    global.fetch = realFetch;
  });

  it('posts the token once (even under StrictMode), without auth, then shows success', async () => {
    const res = deferred<Response>();
    fetchMock.mockReturnValue(res.promise);

    render(
      <StrictMode>
        <SuggestedCandidatesUnsubscribe />
      </StrictMode>,
    );

    expect(screen.getByText('Processing your request…')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/v1\/job-match\/unsubscribe$/);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body)).toEqual({ token: 'tok-123' });
    expect(init.headers).not.toHaveProperty('Authorization');
    expect(mockCustomFetch).not.toHaveBeenCalled();

    await act(async () => {
      res.resolve(jsonResponse(200, { memberUid: 'lead-1', suggestedCandidatesEmailEnabled: false }));
    });

    expect(await screen.findByText("You won't get suggested candidates emails anymore.")).toBeInTheDocument();
    expect(emailPreferencesLink()).toHaveAttribute('href', '/settings/email');
    expect(screen.queryByText('Processing your request…')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shows a friendly error, not the server text, for an invalid or expired token', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { message: 'Invalid token signature' }));

    render(<SuggestedCandidatesUnsubscribe />);

    expect(await screen.findByText(/This unsubscribe link is invalid or has expired/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "Couldn't unsubscribe." })).toBeInTheDocument();
    expect(screen.queryByText(/Invalid token signature/)).not.toBeInTheDocument();
    expect(emailPreferencesLink()).toHaveAttribute('href', '/settings/email');
  });

  it('shows a try-again error for a server failure', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, { message: 'Internal server error' }));

    render(<SuggestedCandidatesUnsubscribe />);

    expect(await screen.findByText(/Something went wrong on our side/)).toBeInTheDocument();
    expect(screen.queryByText(/Internal server error/)).not.toBeInTheDocument();
    expect(emailPreferencesLink()).toHaveAttribute('href', '/settings/email');
  });

  it('shows the try-again error when the request never reaches the server', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    render(<SuggestedCandidatesUnsubscribe />);

    expect(await screen.findByText(/Something went wrong on our side/)).toBeInTheDocument();
    expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument();
  });

  it('shows the invalid-link error without calling the API when the token is missing', async () => {
    mockSearch = '';

    render(<SuggestedCandidatesUnsubscribe />);

    expect(screen.getByText(/This unsubscribe link is invalid or has expired/)).toBeInTheDocument();
    expect(emailPreferencesLink()).toHaveAttribute('href', '/settings/email');
    await act(async () => {});
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
