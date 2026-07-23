import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';

import { AiAppCard } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsGrid/components/AiAppCard';
import { AiApp } from '@/services/ai-apps/ai-apps.service';

const mockFlags = { logs: true };
jest.mock('@/utils/feature-flags', () => ({
  ...jest.requireActual('@/utils/feature-flags'),
  get AI_APPS_LOGS_ENABLED() {
    return mockFlags.logs;
  },
}));

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
    status: 'ERROR',
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

const manageHandlers = {
  onEdit: jest.fn(),
  onDeployment: jest.fn(),
  onDelete: jest.fn(),
};

describe('AiAppCard failure strip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFlags.logs = true;
  });

  it('replaces the inline badge with one strip — never two "Deploy failed" indicators', () => {
    render(<AiAppCard app={buildApp()} />);
    expect(screen.getAllByText('Deploy failed')).toHaveLength(1);
  });

  it('shows "See logs" only to managers, wired with the failure-strip source', () => {
    const onLogs = jest.fn();
    const { unmount } = render(<AiAppCard app={buildApp()} canManage {...manageHandlers} onLogs={onLogs} />);

    fireEvent.click(screen.getByRole('button', { name: /see logs/i }));
    expect(onLogs).toHaveBeenCalledWith('failure-strip');
    unmount();

    render(<AiAppCard app={buildApp()} onLogs={onLogs} />);
    expect(screen.queryByRole('button', { name: /see logs/i })).not.toBeInTheDocument();
  });

  it('the strip link is never nested inside the card link or select button', () => {
    render(<AiAppCard app={buildApp()} canManage {...manageHandlers} onLogs={jest.fn()} onSelect={jest.fn()} />);

    const seeLogs = screen.getByRole('button', { name: /see logs/i });
    expect(seeLogs.closest('a')).toBeNull();
    // Its only button ancestor is itself — not the card's select button.
    expect(seeLogs.parentElement?.closest('button')).toBeNull();
  });

  it('keeps the plain error badge and no strip while the flag is off', () => {
    mockFlags.logs = false;
    render(<AiAppCard app={buildApp()} canManage {...manageHandlers} onLogs={jest.fn()} />);

    expect(screen.getAllByText('Deploy failed')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /see logs/i })).not.toBeInTheDocument();
  });

  it('shows no strip for healthy apps', () => {
    render(<AiAppCard app={buildApp({ status: 'READY' })} />);
    expect(screen.queryByText('Deploy failed')).not.toBeInTheDocument();
  });
});
