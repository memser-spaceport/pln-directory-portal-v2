import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// react-markdown@9 is ESM-only and next/jest does not transform it. Stubbing it
// keeps these tests focused on what this component owns: which messages render,
// which side they land on, and when sending is allowed.
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));

import { AgentSessionChat } from '@/components/page/agent-sessions/AgentSessionChat';
import {
  useAgentSessionMessages,
  useSendAgentSessionMessage,
} from '@/services/agent-sessions/hooks/useAgentSessionMessages';
import type { AgentSession, AgentSessionMessage } from '@/services/agent-sessions/agent-sessions.service';

jest.mock('@/services/agent-sessions/hooks/useAgentSessionMessages', () => ({
  useAgentSessionMessages: jest.fn(),
  useSendAgentSessionMessage: jest.fn(),
}));

const mockUseMessages = useAgentSessionMessages as jest.MockedFunction<typeof useAgentSessionMessages>;
const mockUseSend = useSendAgentSessionMessage as jest.MockedFunction<typeof useSendAgentSessionMessage>;

const mockMutateAsync = jest.fn();

const message = (overrides: Partial<AgentSessionMessage> = {}): AgentSessionMessage => ({
  id: '1',
  task_id: 'task-1',
  execution_id: null,
  sender: 'agent',
  message_type: 'reply',
  body: 'body text',
  created_at: '2026-08-11T08:00:00.000Z',
  ...overrides,
});

const session = (overrides: Partial<AgentSession> = {}): AgentSession =>
  ({
    id: 'task-1',
    status: 'running',
    working_branch: 'agent/fix-task-1',
    error_message: null,
    ...overrides,
  }) as AgentSession;

function setMessages(items: AgentSessionMessage[]) {
  mockUseMessages.mockReturnValue({
    data: items,
    isLoading: false,
    isError: false,
    error: null,
  } as unknown as ReturnType<typeof useAgentSessionMessages>);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockMutateAsync.mockResolvedValue({});
  mockUseSend.mockReturnValue({
    mutateAsync: mockMutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useSendAgentSessionMessage>);
  setMessages([]);
});

describe('AgentSessionChat thread', () => {
  it('hides status narration but keeps the conversation', () => {
    setMessages([
      message({ id: '1', sender: 'admin', message_type: 'instruction', body: 'add a page' }),
      message({ id: '2', message_type: 'status', body: 'Cloning repository' }),
      message({ id: '3', message_type: 'reply', body: 'I added the page' }),
    ]);

    render(<AgentSessionChat sessionId="task-1" session={session()} />);

    expect(screen.getByText('add a page')).toBeInTheDocument();
    expect(screen.getByText('I added the page')).toBeInTheDocument();
    expect(screen.queryByText('Cloning repository')).not.toBeInTheDocument();
  });

  // Guards the denylist against ever being rewritten as an allowlist: a message
  // type nobody has seen yet must show up, not disappear.
  it('renders an unknown message type rather than dropping it', () => {
    setMessages([message({ id: '9', message_type: 'clarification', body: 'a brand new type' })]);

    render(<AgentSessionChat sessionId="task-1" session={session()} />);

    expect(screen.getByText('a brand new type')).toBeInTheDocument();
  });

  // An admin's follow-up arrives as `instruction` — the same type as the original
  // prompt — so anything deriving alignment from message_type puts the admin's own
  // words on the agent's side of the thread.
  it('attributes an admin instruction to "You", not the agent', () => {
    setMessages([message({ id: '1', sender: 'admin', message_type: 'instruction', body: 'do the thing' })]);

    render(<AgentSessionChat sessionId="task-1" session={session()} />);

    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.queryByText('Agent')).not.toBeInTheDocument();
  });

  it('flags a question from the agent', () => {
    setMessages([message({ id: '4', message_type: 'question', body: 'which page did you mean?' })]);

    render(<AgentSessionChat sessionId="task-1" session={session()} />);

    expect(screen.getByText('question')).toBeInTheDocument();
  });

  it('shows an empty thread as a normal state', () => {
    render(<AgentSessionChat sessionId="task-1" session={session()} />);

    expect(screen.getByText('No messages yet.')).toBeInTheDocument();
  });

  // A run can end with no closing agent message, so without the outcome footer the
  // thread would simply trail off after "AI agent started".
  it('shows the session outcome so a thread that stops still explains itself', () => {
    setMessages([message({ id: '2', message_type: 'status', body: 'AI agent started' })]);

    render(
      <AgentSessionChat
        sessionId="task-1"
        session={session({ status: 'failed', error_message: 'Code-change Job failed with exit code 1' })}
      />,
    );

    expect(screen.getByText('failed')).toBeInTheDocument();
    expect(screen.getByText('Code-change Job failed with exit code 1')).toBeInTheDocument();
  });
});

describe('AgentSessionChat composer', () => {
  it('blocks sending whitespace, which the orchestrator would reject anyway', () => {
    render(<AgentSessionChat sessionId="task-1" session={session()} />);

    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Message the agent'), { target: { value: '   ' } });
    expect(send).toBeDisabled();
  });

  it('sends a trimmed message and clears the draft', async () => {
    render(<AgentSessionChat sessionId="task-1" session={session()} />);

    const textarea = screen.getByLabelText('Message the agent');
    fireEvent.change(textarea, { target: { value: '  rename the heading  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledWith('rename the heading'));
    await waitFor(() => expect(textarea).toHaveValue(''));
  });

  // Scrolling the thread is presentation. If it can throw into the send's catch
  // block, a delivered message reports itself as failed — so this drops
  // scrollIntoView (absent in older jsdom and in some embedded browsers) and
  // asserts the send still reads as successful.
  it('still reports success when scrollIntoView is unavailable', async () => {
    const original = Element.prototype.scrollIntoView;
    // @ts-expect-error — simulating an environment that lacks the API
    delete Element.prototype.scrollIntoView;

    try {
      render(<AgentSessionChat sessionId="task-1" session={session()} />);

      const textarea = screen.getByLabelText('Message the agent');
      fireEvent.change(textarea, { target: { value: 'ship it' } });
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));

      await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledWith('ship it'));
      await waitFor(() => expect(textarea).toHaveValue(''));
      expect(screen.queryByText(/failed to send/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/is not a function/i)).not.toBeInTheDocument();
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  it('keeps the draft when the send fails', async () => {
    mockMutateAsync.mockRejectedValue(new Error('Forbidden resource'));

    render(<AgentSessionChat sessionId="task-1" session={session()} />);

    const textarea = screen.getByLabelText('Message the agent');
    fireEvent.change(textarea, { target: { value: 'try again' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Forbidden resource')).toBeInTheDocument();
    expect(textarea).toHaveValue('try again');
  });

  // A message continues the agent from its existing branch, which is how you
  // iterate on a finished session's PR — so a terminal status must not lock the
  // composer.
  it('stays usable on a terminal session', () => {
    render(<AgentSessionChat sessionId="task-1" session={session({ status: 'ready' })} />);

    fireEvent.change(screen.getByLabelText('Message the agent'), { target: { value: 'one more change' } });
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });

  it('warns that sending starts a run on the working branch', () => {
    render(<AgentSessionChat sessionId="task-1" session={session()} />);

    expect(screen.getByText('Sending starts a new agent run on agent/fix-task-1.')).toBeInTheDocument();
  });

  it('calls out a session that is waiting on the admin', () => {
    render(<AgentSessionChat sessionId="task-1" session={session({ status: 'waiting_for_input' })} />);

    expect(screen.getByText('The agent is waiting for your answer.')).toBeInTheDocument();
  });
});
