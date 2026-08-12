import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BuildWithAgentsButton } from '@/components/page/gantry/shared/BuildWithAgentsButton';

const mockPush = jest.fn();
const mockMutateAsync = jest.fn();
const mockTrackBuildButtonClick = jest.fn();
const mockOnBuildButtonClicked = jest.fn();

let permissionsResult = { permsSet: new Set<string>(), isLoading: false, isError: false };
let mutationPending = false;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/services/rbac/hooks/usePermissions', () => ({
  usePermissions: () => permissionsResult,
}));

jest.mock('@/services/agent-sessions/hooks/useCreateAgentSession', () => ({
  useCreateAgentSession: () => ({ mutateAsync: mockMutateAsync, isPending: mutationPending }),
}));

jest.mock('@/services/agent-sessions/hooks/useAgentSessionRepositories', () => ({
  useAgentSessionRepositories: () => ({
    data: [
      { key: 'directory', displayName: 'Directory', defaultBranch: 'develop', enabled: true },
      { key: 'legacy', displayName: 'Legacy', defaultBranch: 'main', enabled: false },
    ],
    isLoading: false,
    isError: false,
  }),
}));

jest.mock('@/services/gantry/gantry.service', () => ({
  trackBuildButtonClick: (...args: unknown[]) => {
    mockTrackBuildButtonClick(...args);
    return Promise.resolve();
  },
}));

jest.mock('@/analytics/gantry.analytics', () => ({
  useGantryAnalytics: () => ({ onBuildButtonClicked: mockOnBuildButtonClicked }),
}));

const ADMIN = new Set(['code_agent_sessions.admin']);

function renderButton(props: Partial<{ uid: string; title: string; description: string }> = {}) {
  return render(
    <BuildWithAgentsButton
      uid={props.uid ?? 'item-1'}
      title={props.title ?? 'Add dark mode'}
      description={props.description ?? '<p>Users keep asking for it.</p>'}
    />,
  );
}

describe('BuildWithAgentsButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    permissionsResult = { permsSet: ADMIN, isLoading: false, isError: false };
    mutationPending = false;
    mockMutateAsync.mockResolvedValue({ id: 'session-42' });
  });

  describe('permission gating', () => {
    it('renders the button for an agent-sessions admin', () => {
      renderButton();
      expect(screen.getByRole('button', { name: /build with ai/i })).toBeInTheDocument();
    });

    it('renders nothing without the admin permission', () => {
      permissionsResult = { permsSet: new Set(['roadmap.view']), isLoading: false, isError: false };
      const { container } = renderButton();
      expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing while permissions are loading', () => {
      permissionsResult = { permsSet: new Set(), isLoading: true, isError: false };
      const { container } = renderButton();
      expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when the permissions request errored', () => {
      permissionsResult = { permsSet: new Set(), isLoading: false, isError: true };
      const { container } = renderButton();
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('creation flow', () => {
    it('lists only enabled repositories', async () => {
      const user = userEvent.setup();
      renderButton();
      await user.click(screen.getByRole('button', { name: /build with ai/i }));

      expect(screen.getByRole('option', { name: 'Directory (directory)' })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: /Legacy/ })).not.toBeInTheDocument();
    });

    it('creates a session with a prompt built from title and description, then navigates', async () => {
      const user = userEvent.setup();
      renderButton();
      await user.click(screen.getByRole('button', { name: /build with ai/i }));
      await user.click(screen.getByRole('button', { name: /create session/i }));

      await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
      expect(mockMutateAsync).toHaveBeenCalledWith({
        repository: 'directory',
        prompt: 'Add dark mode\n\nUsers keep asking for it.',
      });
      expect(mockPush).toHaveBeenCalledWith('/pl-infra/agent-sessions/session-42');
    });

    it('fires both analytics channels only after the session exists', async () => {
      const user = userEvent.setup();
      renderButton();
      await user.click(screen.getByRole('button', { name: /build with ai/i }));

      expect(mockTrackBuildButtonClick).not.toHaveBeenCalled();
      expect(mockOnBuildButtonClicked).not.toHaveBeenCalled();

      await user.click(screen.getByRole('button', { name: /create session/i }));

      await waitFor(() => expect(mockTrackBuildButtonClick).toHaveBeenCalledWith('item-1'));
      expect(mockOnBuildButtonClicked).toHaveBeenCalledWith('item-1');
    });

    it('blocks creation when the item is too thin to describe', async () => {
      const user = userEvent.setup();
      renderButton({ title: 'ab', description: '<p><br></p>' });
      await user.click(screen.getByRole('button', { name: /build with ai/i }));
      await user.click(screen.getByRole('button', { name: /create session/i }));

      expect(mockMutateAsync).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent(/longer title or description/i);
    });

    it('issues exactly one request when the create button is double-clicked', async () => {
      const user = userEvent.setup();
      let resolveCreate: (value: { id: string }) => void = () => undefined;
      mockMutateAsync.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCreate = resolve;
          }),
      );

      renderButton();
      await user.click(screen.getByRole('button', { name: /build with ai/i }));
      const createBtn = screen.getByRole('button', { name: /create session/i });

      await user.click(createBtn);
      await user.click(createBtn);

      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      resolveCreate({ id: 'session-42' });
    });
  });

  describe('errors', () => {
    it('shows an inline error and keeps the picker open for retry', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockRejectedValueOnce(new Error('Repository is not allowed'));

      renderButton();
      await user.click(screen.getByRole('button', { name: /build with ai/i }));
      await user.click(screen.getByRole('button', { name: /create session/i }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Repository is not allowed');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();

      mockMutateAsync.mockResolvedValueOnce({ id: 'session-7' });
      await user.click(screen.getByRole('button', { name: /create session/i }));
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/pl-infra/agent-sessions/session-7'));
    });
  });

  describe('duplicate guard', () => {
    it('offers the existing session instead of creating another', async () => {
      const user = userEvent.setup();
      window.localStorage.setItem('gantry-agent-sessions', JSON.stringify({ 'item-1': 'session-99' }));

      renderButton();
      const viewBtn = screen.getByRole('button', { name: /view session/i });
      expect(screen.queryByRole('button', { name: /build with ai/i })).not.toBeInTheDocument();

      await user.click(viewBtn);
      expect(mockPush).toHaveBeenCalledWith('/pl-infra/agent-sessions/session-99');
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('remembers the session it just created', async () => {
      const user = userEvent.setup();
      renderButton();
      await user.click(screen.getByRole('button', { name: /build with ai/i }));
      await user.click(screen.getByRole('button', { name: /create session/i }));

      await waitFor(() => {
        expect(JSON.parse(window.localStorage.getItem('gantry-agent-sessions') ?? '{}')).toEqual({
          'item-1': 'session-42',
        });
      });
    });
  });

  describe('accessibility', () => {
    it('exposes the picker as a labelled dialog', async () => {
      const user = userEvent.setup();
      renderButton();
      await user.click(screen.getByRole('button', { name: /build with ai/i }));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAccessibleName('Build with AI');
      expect(screen.getByLabelText('Repository')).toHaveFocus();
    });

    it('closes only the picker on Escape, without bubbling to a host drawer', async () => {
      const user = userEvent.setup();
      const drawerEscape = jest.fn();
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') drawerEscape();
      });

      renderButton();
      await user.click(screen.getByRole('button', { name: /build with ai/i }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(drawerEscape).not.toHaveBeenCalled();
    });
  });
});
