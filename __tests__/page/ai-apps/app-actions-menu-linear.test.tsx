import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { AppActionsMenu } from '@/components/page/ai-apps/AiAppsPage/components/AppActionsMenu';
import type { AiApp } from '@/services/ai-apps/ai-apps.service';

jest.mock('@/analytics/ai-apps.analytics', () => ({
  useAiAppsAnalytics: () => ({ onManageMenuOpened: jest.fn() }),
}));

let mockCanManage = true;
jest.mock('@/services/ai-apps/hooks/useAiApp', () => ({
  useAiApp: () => ({ app: { uid: 'app-1', canManage: mockCanManage }, errorKind: null }),
}));

let mockLinear = { unavailable: false, forbidden: false };
const mockUseLinearTarget = jest.fn();
jest.mock('@/services/ai-apps/hooks/useAiAppLinearTarget', () => ({
  useAiAppLinearTarget: (...args: unknown[]) => {
    mockUseLinearTarget(...args);
    return { target: null, error: null, isLoading: false, ...mockLinear };
  },
}));

const app = { uid: 'app-1', name: 'News Summarizer', status: 'READY' } as AiApp;

function renderMenu(onLinear?: () => void) {
  const handlers = {
    onEdit: jest.fn(),
    onAccess: jest.fn(),
    onDeployment: jest.fn(),
    onLogs: jest.fn(),
    onDelete: jest.fn(),
  };
  render(<AppActionsMenu app={app} {...handlers} onLinear={onLinear} />);
  fireEvent.click(screen.getByRole('button', { name: 'More actions for News Summarizer' }));
}

describe('AppActionsMenu: Send feedback to Linear', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanManage = true;
    mockLinear = { unavailable: false, forbidden: false };
  });

  it('offers the item to a manager and opens the modal handler', async () => {
    const onLinear = jest.fn();
    renderMenu(onLinear);
    const item = await screen.findByRole('menuitem', { name: 'Send feedback to Linear' });
    expect(item).not.toHaveAttribute('aria-disabled', 'true');
    // Asked while the menu is open (choosing the item closes it again).
    expect(mockUseLinearTarget).toHaveBeenCalledWith('app-1', { enabled: true });
    fireEvent.click(item);
    expect(onLinear).toHaveBeenCalled();
  });

  it('hides the item from someone who cannot manage the app (403)', async () => {
    mockLinear = { unavailable: false, forbidden: true };
    renderMenu(jest.fn());
    await screen.findByRole('menuitem', { name: 'Edit details' });
    expect(screen.queryByRole('menuitem', { name: 'Send feedback to Linear' })).not.toBeInTheDocument();
  });

  it('disables the item with a note when Linear is not set up (503)', async () => {
    mockLinear = { unavailable: true, forbidden: false };
    renderMenu(jest.fn());
    const item = await screen.findByRole('menuitem', { name: 'Send feedback to Linear' });
    expect(item).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText("Linear isn't set up for this environment")).toBeInTheDocument();
  });

  it('keeps the item disabled until manage access is confirmed', async () => {
    mockCanManage = false;
    renderMenu(jest.fn());
    const item = await screen.findByRole('menuitem', { name: 'Send feedback to Linear' });
    expect(item).toHaveAttribute('aria-disabled', 'true');
  });

  it('leaves the item out when no handler is given, and never asks for the target', async () => {
    renderMenu();
    await screen.findByRole('menuitem', { name: 'Edit details' });
    expect(screen.queryByRole('menuitem', { name: 'Send feedback to Linear' })).not.toBeInTheDocument();
    expect(mockUseLinearTarget).toHaveBeenLastCalledWith('app-1', { enabled: false });
  });
});
