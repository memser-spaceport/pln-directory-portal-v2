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

describe('AiAppCard metrics', () => {
  it('shows views and weekly active users when both are positive', () => {
    render(<AiAppCard app={buildApp({ viewCount: 1240, weeklyActiveUsers: 4 })} />);

    expect(screen.getByText(/1\.2k\s+views/)).toBeInTheDocument();
    expect(screen.getByText(/4\s+weekly active users/)).toBeInTheDocument();
  });

  it('hides a metric when it is 0 and keeps the other', () => {
    render(<AiAppCard app={buildApp({ viewCount: 12, weeklyActiveUsers: 0 })} />);

    expect(screen.getByText(/12\s+views/)).toBeInTheDocument();
    expect(screen.queryByText(/weekly active users/)).not.toBeInTheDocument();
  });

  it('hides the metrics row when both counts are 0 or absent', () => {
    const { rerender } = render(<AiAppCard app={buildApp({ viewCount: 0, weeklyActiveUsers: 0 })} />);
    expect(screen.queryByText('views')).not.toBeInTheDocument();
    expect(screen.queryByText('weekly active users')).not.toBeInTheDocument();

    rerender(<AiAppCard app={buildApp()} />);
    expect(screen.queryByText('views')).not.toBeInTheDocument();
    expect(screen.queryByText('weekly active users')).not.toBeInTheDocument();
  });
});
