import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';

import { AiAppCard } from '@/components/page/ai-apps/AiAppsPage/components/AiAppsGrid/components/AiAppCard';
import { AiApp, AiAppDeploymentInfo } from '@/services/ai-apps/ai-apps.service';

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

const WARNING: AiAppDeploymentInfo = { serving: 'previous', failureStream: 'runtime' };
const DANGER: AiAppDeploymentInfo = { serving: 'none', failureStream: 'build' };

const manageHandlers = {
  onEdit: jest.fn(),
  onDeployment: jest.fn(),
  onDelete: jest.fn(),
};

function cardRoot(): HTMLElement {
  return screen.getByRole('article');
}

describe('AiAppCard failure strip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('replaces the inline badge with one strip — never two "Deploy failed" indicators', () => {
    render(<AiAppCard app={buildApp()} canManage {...manageHandlers} />);
    expect(screen.getAllByText('Deploy failed')).toHaveLength(1);
  });

  it('shows "See logs" wired with the failure-strip source', () => {
    const onLogs = jest.fn();
    render(<AiAppCard app={buildApp()} canManage {...manageHandlers} onLogs={onLogs} />);

    fireEvent.click(screen.getByRole('button', { name: /see logs/i }));
    expect(onLogs).toHaveBeenCalledWith('failure-strip');
  });

  it('the strip link is never nested inside the card link or select button', () => {
    render(<AiAppCard app={buildApp()} canManage {...manageHandlers} onLogs={jest.fn()} onSelect={jest.fn()} />);

    const seeLogs = screen.getByRole('button', { name: /see logs/i });
    expect(seeLogs.closest('a')).toBeNull();
    // Its only button ancestor is itself — not the card's select button.
    expect(seeLogs.parentElement?.closest('button')).toBeNull();
  });

  it('shows no strip for healthy apps, even to managers', () => {
    render(<AiAppCard app={buildApp({ status: 'READY' })} canManage {...manageHandlers} />);
    expect(screen.queryByText('Deploy failed')).not.toBeInTheDocument();
  });

  describe('visitor gating — every failure state renders as a normal card', () => {
    it.each([
      ['legacy (no deployment info)', undefined],
      ['warning (previous still serving)', WARNING],
      ['danger (nothing serving)', DANGER],
    ])('%s: no strip, no See logs, no dimming, date line unchanged', (_label, deployment) => {
      render(<AiAppCard app={buildApp({ deployment })} onLogs={jest.fn()} />);

      expect(screen.queryByText('Deploy failed')).not.toBeInTheDocument();
      expect(screen.queryByText(/didn't ship/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /see logs/i })).not.toBeInTheDocument();
      expect(cardRoot()).not.toHaveClass('rootFailed');
      expect(screen.getByText(/^Deployed/)).toBeInTheDocument();
      expect(screen.queryByText(/Never deployed/)).not.toBeInTheDocument();
    });
  });

  describe('manager view per failure state', () => {
    it('warning: amber strip with rollback copy, body not dimmed, date reads Deployed', () => {
      render(<AiAppCard app={buildApp({ deployment: WARNING })} canManage {...manageHandlers} onLogs={jest.fn()} />);

      expect(screen.getByText("Latest deploy didn't ship")).toBeInTheDocument();
      expect(screen.queryByText('Deploy failed')).not.toBeInTheDocument();
      expect(screen.getByText("Latest deploy didn't ship").closest('div')).toHaveClass('failStripWarning');
      expect(cardRoot()).not.toHaveClass('rootFailed');
      expect(screen.getByText(/^Deployed/)).toBeInTheDocument();
    });

    it('danger: red strip, dimmed card, date reads Never deployed', () => {
      render(<AiAppCard app={buildApp({ deployment: DANGER })} canManage {...manageHandlers} onLogs={jest.fn()} />);

      expect(screen.getByText('Deploy failed')).toBeInTheDocument();
      expect(screen.getByText('Deploy failed').closest('div')).not.toHaveClass('failStripWarning');
      expect(cardRoot()).toHaveClass('rootFailed');
      expect(screen.getByText(/Never deployed/)).toBeInTheDocument();
    });

    it('legacy (ERROR without deployment info): red strip, no dimming, date unchanged', () => {
      render(<AiAppCard app={buildApp()} canManage {...manageHandlers} onLogs={jest.fn()} />);

      expect(screen.getByText('Deploy failed')).toBeInTheDocument();
      expect(cardRoot()).not.toHaveClass('rootFailed');
      expect(screen.getByText(/^Deployed/)).toBeInTheDocument();
    });

    it('unknown serving values fall through to the legacy treatment (blanket rule)', () => {
      const future = { serving: 'blue-green' } as unknown as AiAppDeploymentInfo;
      render(<AiAppCard app={buildApp({ deployment: future })} canManage {...manageHandlers} onLogs={jest.fn()} />);

      expect(screen.getByText('Deploy failed')).toBeInTheDocument();
      expect(cardRoot()).not.toHaveClass('rootFailed');
    });
  });
});
