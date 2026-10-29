import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';

import { McpSection } from '@/components/page/connected-accounts/McpSection';

const mockAnalytics = {
  onSettingsSectionViewed: jest.fn(),
  onSetupSnippetCopied: jest.fn(),
  onAuthorizationRevoked: jest.fn(),
  onAuthorizationRevokeFailed: jest.fn(),
};

const mockRevoke = jest.fn();
const mockClients = [{ uid: 'auth-1', clientName: 'Claude', connectedAt: '2026-10-01T00:00:00Z', lastUsedAt: null }];

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: mockClients, isLoading: false }),
  useQueryClient: () => ({ invalidateQueries: jest.fn(() => Promise.resolve()) }),
}));

jest.mock('@/services/mcp/mcp.service', () => ({
  fetchMcpAuthorizations: jest.fn(),
  revokeMcpAuthorization: (...args: unknown[]) => mockRevoke(...args),
}));

jest.mock('@/analytics/mcp.analytics', () => ({
  useMcpAnalytics: () => mockAnalytics,
}));

const SERVER_URL = 'https://api.example.test/mcp';

describe('McpSection', () => {
  const writeText = jest.fn(() => Promise.resolve());

  beforeAll(() => {
    process.env.DIRECTORY_API_URL = 'https://api.example.test';
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRevoke.mockResolvedValue(true);
  });

  it('names the Claude app first in the intro', () => {
    render(<McpSection />);
    const intro = screen.getByText(/Connect LabOS/);
    expect(intro.textContent).toMatch(/^Connect LabOS to the Claude app/);
  });

  it('shows the Claude app block with three steps above the developer block', () => {
    render(<McpSection />);
    const appBlock = screen.getByRole('region', { name: 'Claude app (web, desktop, mobile)' });
    const devBlock = screen.getByRole('region', { name: 'For developers' });

    expect(appBlock.compareDocumentPosition(devBlock) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const steps = within(appBlock).getAllByRole('listitem');
    expect(steps).toHaveLength(3);
    expect(steps[0]).toHaveTextContent('In Claude, open Settings → Connectors → Add custom connector.');
    expect(steps[1]).toHaveTextContent('Name it "LabOS" and paste the LabOS MCP server URL. Select Add, then Connect.');
    expect(steps[1]).toHaveTextContent(SERVER_URL);
    expect(steps[2]).toHaveTextContent('Sign in to LabOS and approve the access.');
  });

  it('shows the follow-up text and the access text without a click', () => {
    render(<McpSection />);
    const appBlock = screen.getByRole('region', { name: 'Claude app (web, desktop, mobile)' });
    expect(
      within(appBlock).getByText(
        'After this, LabOS works in Claude on web, desktop and mobile. If you do not see Add custom connector, ask your Claude workspace admin to add LabOS.',
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Your agent acts as you, with your LabOS access. You choose read-only or make-changes when you approve. You can revoke an agent here at any time.',
      ),
    ).toBeVisible();
  });

  it('copies the server URL from the Claude app block with the claude-app snippet type', async () => {
    render(<McpSection />);
    const appBlock = screen.getByRole('region', { name: 'Claude app (web, desktop, mobile)' });
    await act(async () => {
      fireEvent.click(within(appBlock).getByRole('button', { name: 'Copy' }));
    });
    expect(writeText).toHaveBeenCalledWith(SERVER_URL);
    expect(mockAnalytics.onSetupSnippetCopied).toHaveBeenCalledWith({ snippetType: 'claude-app' });
  });

  it('keeps the developer rows and their snippet types', async () => {
    render(<McpSection />);
    const devBlock = screen.getByRole('region', { name: 'For developers' });
    expect(within(devBlock).getByText('MCP server URL')).toBeInTheDocument();
    expect(within(devBlock).getByText(`claude mcp add --transport http labos ${SERVER_URL}`)).toBeInTheDocument();
    expect(within(devBlock).getByText('Codex')).toBeInTheDocument();

    const buttons = within(devBlock).getAllByRole('button', { name: 'Copy' });
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      await act(async () => {
        fireEvent.click(button);
      });
    }
    expect(mockAnalytics.onSetupSnippetCopied.mock.calls.map(([p]) => p.snippetType)).toEqual([
      'server',
      'claude',
      'codex',
    ]);
  });

  it('keeps the connected client list and Revoke', async () => {
    render(<McpSection />);
    expect(screen.getByText('Claude', { selector: 'div' })).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    });
    expect(mockRevoke).toHaveBeenCalledWith('auth-1');
    expect(mockAnalytics.onAuthorizationRevoked).toHaveBeenCalledWith({
      authorizationUid: 'auth-1',
      clientName: 'Claude',
    });
  });
});
