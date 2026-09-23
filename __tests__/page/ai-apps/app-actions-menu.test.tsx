import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';

import { AppActionsMenu } from '@/components/page/ai-apps/AiAppsPage/components/AppActionsMenu';
import { AiApp } from '@/services/ai-apps/ai-apps.service';

jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => ({ onManageMenuOpened: jest.fn() }),
}));

let mockDetail: Partial<AiApp> | null = null;
jest.mock('@/services/ai-apps/hooks/useAiApp', () => ({
  useAiApp: () => ({ app: mockDetail, errorKind: null, isLoading: false, isError: false }),
}));

function buildApp(overrides: Partial<AiApp> = {}): AiApp {
  return {
    uid: 'app-1',
    memberUid: 'owner-1',
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
    member: { uid: 'owner-1', name: 'Ada', image: null },
    ...overrides,
  };
}

function openMenu() {
  render(
    <AppActionsMenu
      app={buildApp()}
      onEdit={jest.fn()}
      onAccess={jest.fn()}
      onDeployment={jest.fn()}
      onLogs={jest.fn()}
      onDelete={jest.fn()}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: /more actions for news summarizer/i }));
}

describe('AppActionsMenu — Manage access', () => {
  it('shows Manage access to the app owner', async () => {
    mockDetail = { ...buildApp(), canManage: true, isOwner: true };
    openMenu();
    expect(await screen.findByRole('menuitem', { name: /manage access/i })).toBeInTheDocument();
  });

  it('hides Manage access from a directory admin who can manage but does not own the app', async () => {
    mockDetail = { ...buildApp(), canManage: true, isOwner: false };
    openMenu();
    expect(await screen.findByRole('menuitem', { name: /edit details/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /manage access/i })).not.toBeInTheDocument();
  });

  it('hides Manage access until ownership is confirmed (and on older APIs without isOwner)', async () => {
    mockDetail = { ...buildApp(), canManage: true };
    openMenu();
    expect(await screen.findByRole('menuitem', { name: /edit details/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /manage access/i })).not.toBeInTheDocument();
  });
});
