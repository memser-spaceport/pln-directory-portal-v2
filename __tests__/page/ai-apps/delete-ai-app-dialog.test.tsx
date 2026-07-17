import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { DeleteAiAppDialog } from '@/components/page/ai-apps/AiAppsPage/components/DeleteAiAppDialog';
import { AiApp } from '@/services/ai-apps/ai-apps.service';

const mockAnalytics = {
  onDeleteAppOpened: jest.fn(),
  onDeleteAppCancelled: jest.fn(),
  onDeleteAppConfirmed: jest.fn(),
  onDeleteAppFailed: jest.fn(),
};
jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => mockAnalytics,
}));

const mockMutateAsync = jest.fn();
jest.mock('@/services/ai-apps/hooks/useDeleteAiApp', () => ({
  useDeleteAiApp: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

function buildApp(overrides: Partial<AiApp> = {}): AiApp {
  return {
    uid: 'app-1',
    memberUid: 'member-1',
    appId: 'news-summarizer',
    name: 'News Summarizer',
    description: 'Summarize recent news.',
    status: 'READY',
    notes: null,
    url: null,
    httpUrl: null,
    host: null,
    port: null,
    deploymentId: 'deploy-1',
    requiredEnvVars: [],
    providedEnvVars: [],
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    member: { uid: 'member-1', name: 'Ada', image: null },
    ...overrides,
  };
}

describe('DeleteAiAppDialog — onDeleteSucceeded', () => {
  const onClose = jest.fn();
  const onDeleteSucceeded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fires onDeleteSucceeded (after onClose) only when the delete actually succeeds', async () => {
    mockMutateAsync.mockResolvedValue({ ok: true });
    render(<DeleteAiAppDialog app={buildApp()} onClose={onClose} onDeleteSucceeded={onDeleteSucceeded} />);

    fireEvent.click(screen.getByRole('button', { name: /delete app/i }));

    await waitFor(() => expect(onDeleteSucceeded).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it('does not fire onDeleteSucceeded on cancel', () => {
    render(<DeleteAiAppDialog app={buildApp()} onClose={onClose} onDeleteSucceeded={onDeleteSucceeded} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalled();
    expect(onDeleteSucceeded).not.toHaveBeenCalled();
  });

  it('does not fire onDeleteSucceeded when the delete fails', async () => {
    mockMutateAsync.mockResolvedValue({ ok: false, error: 'Deleting failed. Please try again.' });
    render(<DeleteAiAppDialog app={buildApp()} onClose={onClose} onDeleteSucceeded={onDeleteSucceeded} />);

    fireEvent.click(screen.getByRole('button', { name: /delete app/i }));

    await waitFor(() => expect(screen.getByText('Deleting failed. Please try again.')).toBeInTheDocument());
    expect(onDeleteSucceeded).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('omitting onDeleteSucceeded (the grid usage) does not throw', async () => {
    mockMutateAsync.mockResolvedValue({ ok: true });
    render(<DeleteAiAppDialog app={buildApp()} onClose={onClose} />);

    expect(() => fireEvent.click(screen.getByRole('button', { name: /delete app/i }))).not.toThrow();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
