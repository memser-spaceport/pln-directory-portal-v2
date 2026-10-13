import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import { EditAiAppModal } from '@/components/page/ai-apps/AiAppsPage/components/EditAiAppModal/EditAiAppModal';
import { AiApp } from '@/services/ai-apps/ai-apps.service';

const mockAnalytics = {
  onEditDetailsOpened: jest.fn(),
  onEditDetailsSaved: jest.fn(),
  onEditDetailsFailed: jest.fn(),
  onFeedbackSettingChanged: jest.fn(),
};
jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => mockAnalytics,
}));

const mockSavePatch = jest.fn();
jest.mock('@/services/ai-apps/hooks/useUpdateAiApp', () => ({
  useUpdateAiApp: () => ({ mutateAsync: mockSavePatch, isPending: false }),
}));
jest.mock('@/services/ai-apps/hooks/useUpdateAiAppFile', () => ({
  useUpdateAiAppFile: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));
jest.mock('@/services/ai-apps/hooks/useAiAppPrdSize', () => ({
  useAiAppPrdSize: () => ({ size: null, isLoading: false }),
}));
jest.mock('@/components/page/ai-apps/AiAppsPage/components/EditAiAppModal/components/AiAppTagsSelect', () => ({
  AiAppTagsSelect: () => null,
}));
jest.mock('@/components/ui/FileUploader/FileUploader', () => ({
  FileUploader: () => null,
}));
jest.mock('@/components/common/Modal/Modal', () => ({
  Modal: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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
    feedbackEnabled: true,
    ...overrides,
  };
}

describe('EditAiAppModal feedback setting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSavePatch.mockResolvedValue({});
  });

  it('records the switch only when the saved value changed', async () => {
    const { rerender } = render(<EditAiAppModal app={buildApp()} onClose={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(mockAnalytics.onEditDetailsSaved).toHaveBeenCalledWith('app-1', true));
    expect(mockAnalytics.onFeedbackSettingChanged).not.toHaveBeenCalled();

    rerender(<EditAiAppModal app={buildApp()} onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole('switch', { name: 'LabOS feedback' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(mockAnalytics.onFeedbackSettingChanged).toHaveBeenCalledWith({
        appUid: 'app-1',
        from: true,
        to: false,
      }),
    );
  });
});
