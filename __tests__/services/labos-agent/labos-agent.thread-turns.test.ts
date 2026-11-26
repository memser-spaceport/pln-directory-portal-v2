import { SAVED_CHANGE_FAILED_MESSAGE, sentDrafts, toChatTurns } from '@/services/labos-agent/labos-agent.thread-turns';
import type { LabosAgentThread } from '@/types/labos-agent.types';

const proposal = {
  tool: 'update_my_profile' as const,
  title: 'Update your bio',
  targetType: 'member' as const,
  changes: [{ field: 'bio', label: 'Bio', oldValue: 'Old', newValue: 'New' }],
  expiresAt: '2099-01-01T00:00:00.000Z',
};
const draft = {
  kind: 'intro' as const,
  target: { type: 'member' as const, uid: 'm-2', name: 'Ada' },
  text: 'Hi Ada, an intro about storage please.',
  minLength: 20,
  maxLength: 3500,
  source: 'agent' as const,
};

const thread: LabosAgentThread = {
  threadId: 't-1',
  title: 'Storage',
  source: 'ai-search',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-26T10:00:00.000Z',
  turns: [
    {
      kind: 'ai-search',
      chatId: 'c-old',
      question: 'Which teams work on storage?',
      content: 'Many.',
      sources: ['https://example.com'],
      sourceRefs: [],
      followUpQuestions: ['Who leads them?'],
      actions: [{ type: 'team' }],
      createdAt: null,
    },
    {
      kind: 'agent',
      chatId: 'c-agent',
      question: 'Do things',
      content: 'Done.',
      sources: [],
      sourceRefs: [],
      followUpQuestions: [],
      actions: [],
      createdAt: '2026-11-26T10:00:00.000Z',
      steps: ['Reading the profile'],
      proposals: [
        { ...proposal, proposalId: 'p-open', status: 'open' },
        { ...proposal, proposalId: 'p-done', status: 'done', summary: 'Your bio is updated.' },
        { ...proposal, proposalId: 'p-cancelled', status: 'cancelled' },
        { ...proposal, proposalId: 'p-failed', status: 'failed' },
        { ...proposal, proposalId: 'p-expired', status: 'expired' },
      ],
      drafts: [
        { ...draft, draftId: 'd-open', status: 'open' },
        { ...draft, draftId: 'd-sent', status: 'sent', text: 'The text that went out.', introRequestUid: 'ir-1' },
        { ...draft, draftId: 'd-cancelled', status: 'cancelled' },
      ],
    },
  ],
};

describe('LAB-3457: a saved thread as chat turns', () => {
  const [old, agent] = toChatTurns(thread);

  it('an old AI search turn is a finished answer with no steps and no cards, saved in the thread', () => {
    expect(old).toMatchObject({
      id: 'c-old',
      message: 'Which teams work on storage?',
      status: 'done',
      steps: [],
      content: 'Many.',
      sources: ['https://example.com'],
      followUpQuestions: ['Who leads them?'],
      proposals: [],
      drafts: [],
      savedIn: 't-1',
      restored: true,
    });
    expect(old.endedAt).toBeUndefined();
  });

  it('open cards keep their buttons; finished cards show their result', () => {
    expect(agent.steps).toEqual(['Reading the profile']);
    expect(agent.cards).toEqual({
      'p-done': { status: 'done', summary: 'Your bio is updated.' },
      'p-cancelled': { status: 'cancelled' },
      'p-failed': { status: 'error', message: SAVED_CHANGE_FAILED_MESSAGE, canRetry: false },
    });
    // No card state: pending, so Confirm shows until `expiresAt`. An expired one is past it.
    expect(agent.proposals.find((p) => p.proposalId === 'p-open')?.expiresAt).toBe('2099-01-01T00:00:00.000Z');
    expect(Date.parse(agent.proposals.find((p) => p.proposalId === 'p-expired')!.expiresAt!)).toBeLessThan(Date.now());
    expect(agent.proposals.every((p) => !('status' in p))).toBe(true);

    expect(agent.draftCards).toEqual({
      'd-sent': { status: 'sent', text: 'The text that went out.' },
      'd-cancelled': { status: 'cancelled', text: draft.text },
    });
    expect(agent.drafts.every((d) => !('status' in d) && !('introRequestUid' in d))).toBe(true);
  });

  it('lists the drafts that went out', () => {
    expect(sentDrafts(thread).map((d) => d.draftId)).toEqual(['d-sent']);
  });
});
