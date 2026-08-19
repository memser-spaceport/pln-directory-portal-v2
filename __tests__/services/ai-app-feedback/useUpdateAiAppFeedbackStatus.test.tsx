import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';

jest.unmock('@tanstack/react-query');

import { useUpdateAiAppFeedbackStatus } from '@/services/ai-app-feedback/hooks/useUpdateAiAppFeedbackStatus';
import { AiAppFeedbackQueryKeys } from '@/services/ai-app-feedback/constants';
import { updateAiAppFeedbackStatus } from '@/services/ai-app-feedback/ai-app-feedback.service';
import type { AiAppFeedback } from '@/services/ai-app-feedback/ai-app-feedback.service';
import { toast } from '@/components/core/ToastContainer';

jest.mock('@/services/ai-app-feedback/ai-app-feedback.service', () => ({
  updateAiAppFeedbackStatus: jest.fn(),
}));

jest.mock('@/components/core/ToastContainer', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const mockUpdate = updateAiAppFeedbackStatus as jest.MockedFunction<typeof updateAiAppFeedbackStatus>;
const mockToastError = toast.error as jest.Mock;

const ROW: AiAppFeedback = {
  uid: 'fb-1',
  appUid: 'app-1',
  text: 'Loved it',
  status: 'NEW',
  createdAt: '2026-07-01T00:00:00.000Z',
  member: { uid: 'm-1', name: 'Ada' },
};

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useUpdateAiAppFeedbackStatus', () => {
  let client: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    client.setQueryData([AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_LIST, 'app-1'], [ROW]);
  });

  it('optimistically updates the matching row’s status in the per-app cache', async () => {
    let resolveUpdate: (value: AiAppFeedback) => void;
    mockUpdate.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );

    const { result } = renderHook(() => useUpdateAiAppFeedbackStatus(), { wrapper: wrapper(client) });

    act(() => {
      result.current.mutate({ appUid: 'app-1', feedbackUid: 'fb-1', status: 'IMPLEMENTED' });
    });

    await waitFor(() => {
      const cached = client.getQueryData<AiAppFeedback[]>([AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_LIST, 'app-1']);
      expect(cached?.[0].status).toBe('IMPLEMENTED');
    });

    expect(mockUpdate).toHaveBeenCalledWith('app-1', 'fb-1', 'IMPLEMENTED');

    act(() => {
      resolveUpdate!({ ...ROW, status: 'IMPLEMENTED' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('rolls the cache back and toasts when the PATCH fails', async () => {
    mockUpdate.mockRejectedValue(new Error('fail'));
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useUpdateAiAppFeedbackStatus(), { wrapper: wrapper(client) });

    act(() => {
      result.current.mutate({ appUid: 'app-1', feedbackUid: 'fb-1', status: 'VIEWED' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(
      client.getQueryData<AiAppFeedback[]>([AiAppFeedbackQueryKeys.AI_APP_FEEDBACK_LIST, 'app-1'])?.[0].status,
    ).toBe('NEW');
    expect(mockToastError).toHaveBeenCalledWith('Something went wrong. Please try again.');
    consoleError.mockRestore();
  });
});
