/**
 * @jest-environment node
 */
import { customFetch } from '@/utils/fetch-wrapper';
import { liveLabosAgentClient, normalizeProposals } from '@/services/labos-agent/labos-agent.service';
import { cardErrorState } from '@/services/labos-agent/hooks/useLabosAgentChat';
import { LabosAgentError } from '@/services/labos-agent/labos-agent.errors';

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

const mockedFetch = customFetch as jest.MockedFunction<typeof customFetch>;

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const proposal = {
  proposalId: 'ap_1',
  tool: 'update_my_profile',
  title: 'Update your bio',
  targetType: 'member',
  targetUid: 'm-1',
  changes: [{ field: 'bio', label: 'Bio', oldValue: 'Old', newValue: 'New' }],
  expiresAt: '2026-11-17T17:15:00.000Z',
};

describe('LAB-3299: action proposals in the C1 stream', () => {
  it('keeps a complete proposal', () => {
    expect(normalizeProposals([proposal])).toEqual([proposal]);
  });

  it('drops proposals with an unknown tool, no id or no changes', () => {
    expect(
      normalizeProposals([
        { ...proposal, tool: 'delete_member' },
        { ...proposal, proposalId: undefined },
        { ...proposal, changes: [] },
        { proposalId: 'ap_2', tool: 'update_team', title: 'Half' },
        'x',
      ]),
    ).toEqual([]);
  });

  it('keeps arrays, numbers, booleans and null as values, and uses the field as a missing label', () => {
    const [p] = normalizeProposals([
      {
        ...proposal,
        changes: [
          { field: 'skills', oldValue: ['A'], newValue: ['A', 'B'] },
          { field: 'x', label: 'X', oldValue: { bad: 1 }, newValue: true },
        ],
      },
    ]);
    expect(p.changes).toEqual([
      { field: 'skills', label: 'skills', oldValue: ['A'], newValue: ['A', 'B'] },
      { field: 'x', label: 'X', oldValue: null, newValue: true },
    ]);
  });
});

describe('LAB-3299: C2 confirm client', () => {
  beforeEach(() => mockedFetch.mockReset());

  it('sends only the proposal id and the decision', async () => {
    mockedFetch.mockResolvedValue(
      jsonResponse(
        { proposalId: 'ap_1', status: 'done', tool: 'update_my_profile', summary: 'Your bio is updated.', result: {} },
        200,
      ),
    );
    await expect(liveLabosAgentClient.confirmAction({ proposalId: 'ap_1', decision: 'confirm' })).resolves.toEqual({
      proposalId: 'ap_1',
      status: 'done',
      tool: 'update_my_profile',
      summary: 'Your bio is updated.',
      result: {},
    });
    const [url, init, auth] = mockedFetch.mock.calls[0];
    expect(String(url)).toMatch(/\/v1\/labos-agent\/actions\/confirm$/);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({ proposalId: 'ap_1', decision: 'confirm' });
    expect(auth).toBe(true);
  });

  it.each([
    [403, 'ACTION_NOT_ALLOWED'],
    [404, 'PROPOSAL_NOT_FOUND'],
    [409, 'PROPOSAL_CLOSED'],
    [410, 'PROPOSAL_EXPIRED'],
    [422, 'ACTION_FAILED'],
  ])('maps a %s answer to %s', async (status, code) => {
    mockedFetch.mockResolvedValue(jsonResponse({ code, message: 'm' }, status));
    await expect(liveLabosAgentClient.confirmAction({ proposalId: 'ap_1', decision: 'confirm' })).rejects.toMatchObject(
      { status, code },
    );
  });

  it('reports no answer as status 0', async () => {
    mockedFetch.mockRejectedValue(new TypeError('network'));
    await expect(liveLabosAgentClient.confirmAction({ proposalId: 'ap_1', decision: 'confirm' })).rejects.toMatchObject(
      { status: 0 },
    );
  });
});

describe('LAB-3299: card error states', () => {
  it('shows a 403 as forbidden, with nothing saved and no retry', () => {
    expect(cardErrorState(new LabosAgentError(403, 'ACTION_NOT_ALLOWED', 'x'))).toEqual({
      status: 'forbidden',
      message: 'You cannot make this change. Nothing was saved.',
    });
  });

  it('offers Retry only when Retry can help', () => {
    expect(cardErrorState(new LabosAgentError(0, 'STREAM_FAILED', 'x')).canRetry).toBe(true);
    expect(cardErrorState(new LabosAgentError(500, 'UNKNOWN', 'x')).canRetry).toBe(true);
    expect(cardErrorState(new LabosAgentError(410, 'PROPOSAL_EXPIRED', 'x')).canRetry).toBeFalsy();
    expect(cardErrorState(new LabosAgentError(409, 'PROPOSAL_CLOSED', 'x')).canRetry).toBeFalsy();
    expect(cardErrorState(new LabosAgentError(422, 'ACTION_FAILED', 'Bio is too long')).message).toContain(
      'Bio is too long',
    );
  });
});
