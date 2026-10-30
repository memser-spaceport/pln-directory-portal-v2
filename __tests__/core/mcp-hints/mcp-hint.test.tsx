import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';

import { McpHint } from '@/components/core/mcp-hints/McpHint';
import { countAiSearch, getAiSearchCount } from '@/components/core/mcp-hints/aiSearchSessionCount';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

let mockShowMcpPage = true;
jest.mock('@/utils/mcp', () => ({
  ...jest.requireActual('@/utils/mcp'),
  get SHOW_MCP_CONNECTIONS_PAGE() {
    return mockShowMcpPage;
  },
}));

let mockCanConnect = true;
jest.mock('@/services/rbac/hooks/useMcpAccess', () => ({
  useMcpAccess: () => ({ canConnect: mockCanConnect, isLoading: false, isError: false, isFetched: true }),
}));

let mockConnections: Array<{ uid: string; clientName: string; status: string }> | undefined = [];
const mockUseMcpConnections = jest.fn();
jest.mock('@/services/mcp/hooks/useMcpConnections', () => ({
  useMcpConnections: (enabled: boolean) => {
    mockUseMcpConnections(enabled);
    return { data: enabled ? mockConnections : undefined, isSuccess: enabled && mockConnections !== undefined };
  },
}));

// Each flag key answers on its own, so dismissing one context can be told apart from another.
const mockFlags: Record<string, boolean> = {};
const mockDismiss: Record<string, jest.Mock> = {};
const mockCalloutKeys: string[] = [];
jest.mock('@/hooks/useOneTimeCallout', () => ({
  useOneTimeCallout: (key: string) => {
    mockCalloutKeys.push(key);
    mockDismiss[key] ??= jest.fn();
    return { open: mockFlags[key] ?? false, dismiss: mockDismiss[key] };
  },
}));

const mockAnalytics = {
  onHintShown: jest.fn(),
  onHintDismissed: jest.fn(),
  onHintConnectClicked: jest.fn(),
  onHintPromptCopied: jest.fn(),
};
jest.mock('@/analytics/mcp.analytics', () => ({
  useMcpAnalytics: () => mockAnalytics,
}));

jest.mock('@/components/page/settings/mcp/ClientLogo', () => ({
  ...jest.requireActual('@/components/page/settings/mcp/ClientLogo'),
  ClientLogo: ({ client }: { client: string }) => <i data-testid="client-mark" data-client={client} />,
}));

const FLAGS = {
  search: 'mcp_hint_search',
  forum: 'mcp_hint_forum',
  comments: 'mcp_hint_comments',
  apps: 'mcp_hint_apps',
} as const;

const QUERY = 'Open roles at Prime Intellect';
const TITLE = 'Who is hiring Rust engineers for zk work?';

const marks = () => screen.getAllByTestId('client-mark').map((el) => el.getAttribute('data-client'));

const connect = (clientName = 'Claude Code') => {
  mockConnections = [{ uid: 'c1', clientName, status: 'active' }];
};

const writeText = jest.fn(() => Promise.resolve());

beforeEach(() => {
  jest.clearAllMocks();
  mockCalloutKeys.length = 0;
  mockShowMcpPage = true;
  mockCanConnect = true;
  mockConnections = [];
  Object.values(FLAGS).forEach((key) => (mockFlags[key] = true));
  sessionStorage.clear();
  // Search hints start from the second search in the session.
  countAiSearch();
  countAiSearch();
  Object.assign(navigator, { clipboard: { writeText } });
});

describe('McpHint (LAB-3033): who sees it', () => {
  it('shows nothing and asks for no connections to a member without mcp.connect', () => {
    mockCanConnect = false;
    const { container } = render(<McpHint context="forum" title={TITLE} />);
    expect(container).toBeEmptyDOMElement();
    expect(mockUseMcpConnections).toHaveBeenCalledWith(false);
    expect(mockUseMcpConnections).not.toHaveBeenCalledWith(true);
    expect(mockAnalytics.onHintShown).not.toHaveBeenCalled();
  });

  it('shows nothing while the MCP connections page is flagged off', () => {
    mockShowMcpPage = false;
    const { container } = render(<McpHint context="forum" title={TITLE} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows nothing before the connections have loaded', () => {
    mockConnections = undefined;
    const { container } = render(<McpHint context="forum" title={TITLE} />);
    expect(container).toBeEmptyDOMElement();
    expect(mockAnalytics.onHintShown).not.toHaveBeenCalled();
  });

  it.each([
    ['search', <McpHint key="s" context="search" query={QUERY} />],
    ['forum', <McpHint key="f" context="forum" title={TITLE} />],
    ['comments', <McpHint key="c" context="comments" newCount={3} />],
  ] as const)('reads its own one-time flag and stays hidden once %s was dismissed', (context, element) => {
    mockFlags[FLAGS[context]] = false;
    const { container } = render(element);
    expect(container).toBeEmptyDOMElement();
    expect(mockCalloutKeys).toEqual(expect.arrayContaining([FLAGS[context]]));
    Object.values(FLAGS)
      .filter((key) => key !== FLAGS[context])
      .forEach((key) => expect(mockCalloutKeys).not.toContain(key));
  });

  it('dismissing search does not hide forum', () => {
    mockFlags[FLAGS.search] = false;
    render(<McpHint context="forum" title={TITLE} />);
    expect(screen.getByText('Let your agent draft this post')).toBeInTheDocument();
  });
});

describe('McpHint (LAB-3033): when each host triggers it', () => {
  it('search: hidden on the first search of the session, shown from the second', () => {
    sessionStorage.clear();
    countAiSearch();
    const { container, rerender } = render(<McpHint context="search" query={QUERY} />);
    expect(container).toBeEmptyDOMElement();

    countAiSearch();
    rerender(<McpHint context="search" query={QUERY} />);
    expect(screen.getByText('Ask this from Claude or Codex next time')).toBeInTheDocument();
  });

  it('search: hidden with no query', () => {
    const { container } = render(<McpHint context="search" query="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each(['', '   '])('forum: hidden until a title is typed (%j)', (title) => {
    const { container } = render(<McpHint context="forum" title={title} />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([0, 1, 2])('comments: hidden with %i new comments', (count) => {
    const { container } = render(<McpHint context="comments" newCount={count} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('comments: shown with 3 new comments', () => {
    render(<McpHint context="comments" newCount={3} />);
    expect(screen.getByRole('note')).toBeInTheDocument();
  });
});

describe('McpHint (LAB-3033): no agent yet', () => {
  it('search: quotes the query, shows Claude and Codex, and Connect opens MCP connections', () => {
    render(<McpHint context="search" query={QUERY} />);
    const hint = screen.getByRole('note');
    expect(within(hint).getByText('Ask this from Claude or Codex next time')).toBeInTheDocument();
    expect(
      within(hint).getByText(`Connect LabOS to your agent and search “${QUERY}” where you already work.`),
    ).toBeInTheDocument();
    expect(marks()).toEqual(['claude-code', 'codex']);

    fireEvent.click(within(hint).getByRole('button', { name: 'Connect an agent' }));
    expect(mockPush).toHaveBeenCalledWith('/settings/mcp');
    expect(mockAnalytics.onHintConnectClicked).toHaveBeenCalledWith({ context: 'search' });
    expect(mockAnalytics.onHintShown).toHaveBeenCalledWith({ context: 'search', connected: false });
  });

  it('forum: the draft-this-post copy', () => {
    render(<McpHint context="forum" title={TITLE} />);
    expect(screen.getByText('Let your agent draft this post')).toBeInTheDocument();
    expect(
      screen.getByText('It reads similar threads and drafts the post for you to review here.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect an agent' })).toBeInTheDocument();
  });

  it('comments: names the number of new comments', () => {
    render(<McpHint context="comments" newCount={4} />);
    expect(screen.getByText('Triage these 4 new comments from your agent')).toBeInTheDocument();
    expect(screen.getByText('It reads new feedback on your apps and marks it done as you fix it.')).toBeInTheDocument();
  });
});

describe('McpHint (LAB-3033): agent connected', () => {
  it.each([
    ['search', <McpHint key="s" context="search" query={QUERY} />, 'Search LabOS for open roles at prime intellect'],
    ['forum', <McpHint key="f" context="forum" title={TITLE} />, `Draft a LabOS forum post titled “${TITLE}”`],
    [
      'comments',
      <McpHint key="c" context="comments" newCount={3} />,
      'Go through the new LabOS feedback on my apps and mark what I fix as done',
    ],
  ] as const)('%s: asks the connected client, with the prompt to copy', async (context, element, prompt) => {
    connect('Claude Code');
    render(element);
    expect(screen.getByText('Ask Claude Code instead')).toBeInTheDocument();
    expect(screen.getByText(prompt)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Connect an agent' })).not.toBeInTheDocument();
    expect(marks()).toEqual(['claude-code']);
    expect(mockAnalytics.onHintShown).toHaveBeenCalledWith({ context, connected: true });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Copy'));
    });
    expect(writeText).toHaveBeenCalledWith(prompt);
    expect(mockAnalytics.onHintPromptCopied).toHaveBeenCalledWith({ context, clientName: 'Claude Code' });
  });

  it.each([
    ['sent no name', ''],
    ['sent only spaces', '   '],
  ])('says "your agent" with the plug mark when the client %s (LAB-3049)', async (_label, clientName) => {
    connect(clientName);
    render(<McpHint context="search" query={QUERY} />);
    expect(screen.getByText('Ask your agent instead')).toBeInTheDocument();
    expect(screen.queryByText(/Ask Claude/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Connect an agent' })).not.toBeInTheDocument();
    expect(marks()).toEqual(['other']);
    expect(mockAnalytics.onHintShown).toHaveBeenCalledWith({ context: 'search', connected: true });
    await act(async () => {
      fireEvent.click(screen.getByTitle('Copy'));
    });
    expect(mockAnalytics.onHintPromptCopied).toHaveBeenCalledWith({ context: 'search', clientName: undefined });
  });

  it('names a client it has no mark for, with the plug mark (LAB-3049)', () => {
    connect('Cursor');
    render(<McpHint context="search" query={QUERY} />);
    expect(screen.getByText('Ask Cursor instead')).toBeInTheDocument();
    expect(marks()).toEqual(['other']);
  });

  it('shows only the connected client’s mark', () => {
    connect('Codex');
    render(<McpHint context="forum" title={TITLE} />);
    expect(screen.getByText('Ask Codex instead')).toBeInTheDocument();
    expect(marks()).toEqual(['codex']);
  });
});

describe('McpHint (LAB-3033): dismiss and reporting', () => {
  it('✕ dismisses only its own context and reports it', () => {
    render(<McpHint context="forum" title={TITLE} />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(mockDismiss[FLAGS.forum]).toHaveBeenCalledTimes(1);
    expect(mockDismiss[FLAGS.search]?.mock.calls.length ?? 0).toBe(0);
    expect(mockDismiss[FLAGS.comments]?.mock.calls.length ?? 0).toBe(0);
    expect(mockAnalytics.onHintDismissed).toHaveBeenCalledWith({ context: 'forum' });
  });

  it('reports shown once across rerenders', () => {
    const { rerender } = render(<McpHint context="forum" title={TITLE} />);
    rerender(<McpHint context="forum" title={`${TITLE}?`} />);
    rerender(<McpHint context="forum" title={`${TITLE}??`} />);
    expect(mockAnalytics.onHintShown).toHaveBeenCalledTimes(1);
    expect(mockAnalytics.onHintShown).toHaveBeenCalledWith({ context: 'forum', connected: false });
  });
});

describe('aiSearchSessionCount', () => {
  it('counts searches in sessionStorage and survives storage errors', () => {
    sessionStorage.clear();
    expect(getAiSearchCount()).toBe(0);
    countAiSearch();
    expect(getAiSearchCount()).toBe(1);

    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getAiSearchCount()).toBe(0);
    expect(() => countAiSearch()).not.toThrow();
    spy.mockRestore();
  });
});

describe('McpHint (LAB-3062): AI Apps page card', () => {
  it('shows without any trigger and offers Connect an agent with no agent', () => {
    render(<McpHint context="apps" />);
    expect(screen.getByText('Manage your apps from your agent')).toBeInTheDocument();
    expect(
      screen.getByText('Your agent can redeploy, rename and edit the description of your apps.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Connect an agent' }));
    expect(mockPush).toHaveBeenCalledWith('/settings/mcp');
    expect(mockAnalytics.onHintShown).toHaveBeenCalledWith({ context: 'apps', connected: false });
    expect(mockAnalytics.onHintConnectClicked).toHaveBeenCalledWith({ context: 'apps' });
  });

  it('gives a connected member the redeploy prompt to copy', async () => {
    connect('Codex');
    render(<McpHint context="apps" />);
    expect(screen.getByText('Ask Codex instead')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByTitle('Copy'));
    });
    expect(writeText).toHaveBeenCalledWith('Redeploy my latest LabOS AI App');
    expect(mockAnalytics.onHintPromptCopied).toHaveBeenCalledWith({ context: 'apps', clientName: 'Codex' });
  });

  it('stays gone once dismissed, on its own flag', () => {
    render(<McpHint context="apps" />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(mockDismiss['mcp_hint_apps']).toHaveBeenCalledTimes(1);
    expect(mockAnalytics.onHintDismissed).toHaveBeenCalledWith({ context: 'apps' });
  });

  it('is not shown outside the hint audience', () => {
    mockCanConnect = false;
    const { container } = render(<McpHint context="apps" />);
    expect(container).toBeEmptyDOMElement();
  });
});
