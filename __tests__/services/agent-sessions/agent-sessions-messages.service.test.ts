import { customFetch } from '@/utils/fetch-wrapper';
import {
  fetchAgentSessionMessages,
  sendAgentSessionMessage,
  isPermanentAgentSessionError,
  AgentSessionRequestError,
  AgentSessionMessage,
} from '@/services/agent-sessions/agent-sessions.service';

jest.mock('@/utils/fetch-wrapper', () => ({
  customFetch: jest.fn(),
}));

const mockCustomFetch = customFetch as jest.MockedFunction<typeof customFetch>;

const jsonResponse = (status: number, body: unknown = {}) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as Response;

const message = (overrides: Partial<AgentSessionMessage> = {}): AgentSessionMessage => ({
  id: '1',
  task_id: 'task-1',
  execution_id: null,
  sender: 'agent',
  message_type: 'reply',
  body: 'done',
  created_at: '2026-08-11T08:00:00.000Z',
  ...overrides,
});

describe('fetchAgentSessionMessages', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the thread as sent by the orchestrator', async () => {
    const items = [message({ id: '1' }), message({ id: '2' })];
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { items }));

    await expect(fetchAgentSessionMessages('task-1')).resolves.toEqual(items);
  });

  // A session that has never been messaged returns no `items` key at all — that is
  // the common case, not an edge case, so it must not throw.
  it('falls back to an empty thread when the payload has no items', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(200, {}));

    await expect(fetchAgentSessionMessages('task-1')).resolves.toEqual([]);
  });

  it('encodes the session id into the messages path', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { items: [] }));

    await fetchAgentSessionMessages('a/b');

    expect(mockCustomFetch).toHaveBeenCalledWith(expect.stringContaining('/a%2Fb/messages'), { method: 'GET' }, true);
  });

  it("surfaces the server's message when the request fails", async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(403, { message: 'Forbidden resource' }));

    await expect(fetchAgentSessionMessages('task-1')).rejects.toThrow('Forbidden resource');
  });
});

// A backend without the messages route answers 404 forever, so retrying only keeps
// "Loading messages…" on screen. The status has to survive the throw for the query
// to know that.
describe('permanent vs transient failures', () => {
  beforeEach(() => jest.clearAllMocks());

  it('carries the HTTP status on the thrown error', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(404, { message: 'Cannot GET /v1/agent-sessions/x/messages' }));

    await expect(fetchAgentSessionMessages('x')).rejects.toMatchObject({
      status: 404,
      message: 'Cannot GET /v1/agent-sessions/x/messages',
    });
  });

  it.each([400, 403, 404, 422])('treats %i as permanent', (status) => {
    expect(isPermanentAgentSessionError(new AgentSessionRequestError('nope', status))).toBe(true);
  });

  it.each([500, 502, 503])('treats %i as worth retrying', (status) => {
    expect(isPermanentAgentSessionError(new AgentSessionRequestError('boom', status))).toBe(false);
  });

  // A dropped connection arrives as a plain Error with no status — that is exactly
  // the case retrying exists for.
  it('treats a network error as worth retrying', () => {
    expect(isPermanentAgentSessionError(new Error('Network request failed'))).toBe(false);
  });
});

describe('sendAgentSessionMessage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('posts the message as JSON', async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(202, { message: message({ sender: 'admin' }) }));

    await sendAgentSessionMessage('task-1', 'rename the heading');

    expect(mockCustomFetch).toHaveBeenCalledWith(
      expect.stringContaining('/task-1/messages'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ message: 'rename the heading' }),
      }),
      true,
    );
  });

  // The 202 envelope carries the execution the message just started, which is how
  // a caller could tell the admin a new agent run is underway.
  it('returns the execution envelope', async () => {
    const envelope = {
      message: message({ id: '36', sender: 'admin', message_type: 'instruction' }),
      executionId: 'exec-1',
      executionNumber: 2,
      executionStatus: 'starting',
      kubernetesJobName: 'code-fix-e2',
    };
    mockCustomFetch.mockResolvedValue(jsonResponse(202, envelope));

    await expect(sendAgentSessionMessage('task-1', 'go')).resolves.toEqual(envelope);
  });

  it("surfaces the server's message when the send is rejected", async () => {
    mockCustomFetch.mockResolvedValue(jsonResponse(400, { message: ['message must contain at least 1 character(s)'] }));

    await expect(sendAgentSessionMessage('task-1', ' ')).rejects.toThrow(
      'message must contain at least 1 character(s)',
    );
  });
});
