import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';

jest.unmock('@tanstack/react-query');

import { useSignupV2 } from '@/services/signup/hooks/useSignup';
import { toast } from '@/components/core/ToastContainer';

jest.mock('@/components/core/ToastContainer', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const mockToastError = toast.error as jest.Mock;
const mockToastSuccess = toast.success as jest.Mock;

const PARAMS = {
  uniqueIdentifier: 'ada@example.com',
  role: 'Engineer',
  isTeamNew: false,
  team: {},
  project: {},
  newData: { name: 'Ada', email: 'ada@example.com' },
};

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useSignupV2', () => {
  let client: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  });

  it('returns a failure result and toasts when the fetch rejects', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const { result } = renderHook(() => useSignupV2(), { wrapper: wrapper(client) });

    let outcome: { success: boolean; message?: string } | undefined;
    await act(async () => {
      outcome = await result.current.mutateAsync(PARAMS);
    });

    expect(outcome?.success).toBe(false);
    expect(outcome?.message).toBe('Network error. Please check your connection and try again.');
    expect(mockToastError).toHaveBeenCalledWith('Network error. Please check your connection and try again.');
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it('returns a success result when the request succeeds', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ uid: 'member-1' }),
    });

    const { result } = renderHook(() => useSignupV2(), { wrapper: wrapper(client) });

    let outcome: { success: boolean; data?: { uid: string } } | undefined;
    await act(async () => {
      outcome = await result.current.mutateAsync(PARAMS);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(outcome?.success).toBe(true);
    expect(outcome?.data?.uid).toBe('member-1');
    expect(mockToastSuccess).toHaveBeenCalledWith('Sign up request submitted successfully');
  });
});
