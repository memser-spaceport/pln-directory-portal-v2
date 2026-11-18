import { act } from '@testing-library/react';

import { chatKey, useLabosAgentStore } from '@/services/labos-agent/store';
import type { LabosAgentTurn } from '@/types/labos-agent.types';

const story = (newsUid: string) => ({ page: 'news-story' as const, newsUid, label: 'Title' });

const turn = (id: string): LabosAgentTurn => ({
  id,
  message: 'Hi',
  status: 'done',
  steps: [],
  content: 'Answer',
  sources: [],
  sourceRefs: [],
  followUpQuestions: [],
  proposals: [],
  cards: {},
  drafts: [],
  draftCards: {},
  startedAt: 0,
});

describe('LAB-3298: agent store', () => {
  beforeEach(() => useLabosAgentStore.setState({ isOpen: false, context: null, chats: {} }));

  it('opens the panel on the context and closes it', () => {
    act(() => useLabosAgentStore.getState().actions.openAgent({ context: story('n-1') }));
    expect(useLabosAgentStore.getState()).toMatchObject({ isOpen: true, context: story('n-1') });
    act(() => useLabosAgentStore.getState().actions.closeAgent());
    expect(useLabosAgentStore.getState().isOpen).toBe(false);
  });

  it('opens with no context', () => {
    act(() => useLabosAgentStore.getState().actions.openAgent());
    expect(useLabosAgentStore.getState().context).toBeNull();
  });

  it('gives one chat key per context', () => {
    expect(chatKey(story('n-1'))).toBe('news-story:n-1');
    expect(chatKey(story('n-2'))).not.toBe(chatKey(story('n-1')));
    expect(chatKey({ page: 'home' })).toBe('home');
    expect(chatKey(null)).toBe('none');
  });

  it('keeps the turns of a chat when the panel closes, and New chat gives a new thread', () => {
    const { openAgent, closeAgent, updateTurns, resetChat } = useLabosAgentStore.getState().actions;
    const key = chatKey(story('n-1'));
    act(() => openAgent({ context: story('n-1') }));
    act(() => updateTurns(key, (t) => [...t, turn('c-1')]));
    const threadId = useLabosAgentStore.getState().chats[key].threadId;
    expect(threadId).toBeTruthy();

    act(() => closeAgent());
    act(() => openAgent({ context: story('n-1') }));
    expect(useLabosAgentStore.getState().chats[key]).toEqual({ threadId, turns: [turn('c-1')] });
    expect(useLabosAgentStore.getState().chats[chatKey(story('n-2'))]).toBeUndefined();

    act(() => resetChat(key));
    const chat = useLabosAgentStore.getState().chats[key];
    expect(chat.turns).toEqual([]);
    expect(chat.threadId).not.toBe(threadId);
  });
});
