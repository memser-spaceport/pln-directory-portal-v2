import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { PublicEndpointsSection } from '@/components/page/ai-apps/AiAppsPage/components/DeploymentSettingsModal/PublicEndpointsSection';

let mockSettings = { publicPaths: ['/api/*'], publicPathsGateReady: true };
jest.mock('@/services/ai-apps/hooks/useAiAppPublicPaths', () => ({
  useAiAppPublicPaths: () => ({ settings: mockSettings, error: null, isLoading: false }),
}));

const mockMutateAsync = jest.fn();
jest.mock('@/services/ai-apps/hooks/useSaveAiAppPublicPaths', () => ({
  useSaveAiAppPublicPaths: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

const mockAnalytics = {
  onPublicEndpointsSaved: jest.fn(),
  onPublicEndpointsSaveFailed: jest.fn(),
  onPublicEndpointsRedeployClicked: jest.fn(),
};
jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => mockAnalytics,
}));

describe('PublicEndpointsSection analytics', () => {
  const onRedeploy = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSettings = { publicPaths: ['/api/*'], publicPathsGateReady: true };
  });

  it('records a saved list without the path text', async () => {
    mockMutateAsync.mockResolvedValue({ data: { publicPaths: ['/hooks/stripe'] }, error: null });
    render(<PublicEndpointsSection uid="app-1" lastDeployedAt="2026-07-01T00:00:00.000Z" onRedeploy={onRedeploy} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Public path pattern' }), {
      target: { value: '/hooks/stripe' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() =>
      expect(mockAnalytics.onPublicEndpointsSaved).toHaveBeenCalledWith({
        appUid: 'app-1',
        pathCount: 1,
        addedCount: 1,
        removedCount: 1,
        hasWildcard: false,
      }),
    );
  });

  it('records a failed save', async () => {
    mockMutateAsync.mockResolvedValue({ data: null, error: 'Saving failed. Please try again.' });
    render(<PublicEndpointsSection uid="app-1" onRedeploy={onRedeploy} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Public path pattern' }), {
      target: { value: '/hooks/stripe' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect(await screen.findByText('Saving failed. Please try again.')).toBeInTheDocument();
    expect(mockAnalytics.onPublicEndpointsSaveFailed).toHaveBeenCalledWith('app-1');
  });

  it('records redeploy from the old-sidecar notice', () => {
    mockSettings = { publicPaths: [], publicPathsGateReady: false };
    render(<PublicEndpointsSection uid="app-1" lastDeployedAt="2026-07-01T00:00:00.000Z" onRedeploy={onRedeploy} />);

    fireEvent.click(screen.getByRole('button', { name: /redeploy now/i }));
    expect(onRedeploy).toHaveBeenCalled();
    expect(mockAnalytics.onPublicEndpointsRedeployClicked).toHaveBeenCalledWith('app-1');
  });
});
