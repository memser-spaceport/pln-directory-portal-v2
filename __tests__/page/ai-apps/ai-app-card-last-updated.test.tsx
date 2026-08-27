import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { AiAppCard } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsGrid/components/AiAppCard';
import { AiApp, AiAppDeploymentInfo } from '@/services/ai-apps/ai-apps.service';
import { formatAiAppDate } from '@/utils/ai-apps.utils';

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

const DANGER: AiAppDeploymentInfo = { serving: 'none', failureStream: 'build' };

const manageHandlers = {
  onEdit: jest.fn(),
  onDeployment: jest.fn(),
  onDelete: jest.fn(),
};

describe('AiAppCard last updated', () => {
  it('renders Last updated from updatedAt on a ready app', () => {
    const updatedAt = '2026-08-15T12:00:00.000Z';
    render(<AiAppCard app={buildApp({ updatedAt })} />);

    expect(screen.getByText(`Last updated ${formatAiAppDate(updatedAt)}`)).toBeInTheDocument();
  });

  it('uses updatedAt, not createdAt, when they differ on a draft', () => {
    const createdAt = '2026-07-01T00:00:00.000Z';
    const updatedAt = '2026-08-20T00:00:00.000Z';
    render(<AiAppCard app={buildApp({ status: 'DRAFT', createdAt, updatedAt })} />);

    expect(screen.getByText(`Last updated ${formatAiAppDate(updatedAt)}`)).toBeInTheDocument();
    expect(screen.queryByText(`Last updated ${formatAiAppDate(createdAt)}`)).not.toBeInTheDocument();
  });

  it('shows Last updated to non-managers of a danger app, with no failure strip', () => {
    const updatedAt = '2026-08-10T00:00:00.000Z';
    render(<AiAppCard app={buildApp({ status: 'ERROR', deployment: DANGER, updatedAt })} />);

    expect(screen.getByText(`Last updated ${formatAiAppDate(updatedAt)}`)).toBeInTheDocument();
    expect(screen.queryByText('Deploy failed')).not.toBeInTheDocument();
    expect(screen.queryByText(/Never deployed/)).not.toBeInTheDocument();
  });

  it('keeps the manager failure strip and shows Last updated, not Never deployed', () => {
    const updatedAt = '2026-08-10T00:00:00.000Z';
    render(
      <AiAppCard
        app={buildApp({ status: 'ERROR', deployment: DANGER, updatedAt })}
        canManage
        {...manageHandlers}
        onLogs={jest.fn()}
      />,
    );

    expect(screen.getByText('Deploy failed')).toBeInTheDocument();
    expect(screen.getByText(`Last updated ${formatAiAppDate(updatedAt)}`)).toBeInTheDocument();
    expect(screen.queryByText(/Never deployed/)).not.toBeInTheDocument();
  });
});
