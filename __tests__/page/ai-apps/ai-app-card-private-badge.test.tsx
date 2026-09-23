import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { AiAppCard } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsGrid/components/AiAppCard';
import { AiApp } from '@/services/ai-apps/ai-apps.service';

jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => ({ onCardClicked: jest.fn(), onAuthorClicked: jest.fn() }),
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

describe('AiAppCard private badge', () => {
  it('badges a private app', () => {
    render(<AiAppCard app={buildApp({ access: 'PRIVATE' })} />);
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('shows no badge for an open app or an older API without `access`', () => {
    const { rerender } = render(<AiAppCard app={buildApp({ access: 'OPEN' })} />);
    expect(screen.queryByText('Private')).not.toBeInTheDocument();

    rerender(<AiAppCard app={buildApp()} />);
    expect(screen.queryByText('Private')).not.toBeInTheDocument();
  });
});
