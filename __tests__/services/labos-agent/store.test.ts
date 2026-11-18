import { act } from '@testing-library/react';

import { useLabosAgentStore } from '@/services/labos-agent/store';

const story = (newsUid: string) => ({ page: 'news-story' as const, newsUid, label: 'Title' });

describe('LAB-3298: openAgent', () => {
  beforeEach(() => useLabosAgentStore.setState({ isOpen: false, context: null, session: 0 }));

  it('opens the panel on the context', () => {
    act(() => useLabosAgentStore.getState().actions.openAgent({ context: story('n-1') }));
    const s = useLabosAgentStore.getState();
    expect(s.isOpen).toBe(true);
    expect(s.context).toEqual(story('n-1'));
    expect(s.session).toBe(1);
  });

  it('keeps the chat for the same context and starts a new chat for another', () => {
    const { openAgent, closeAgent } = useLabosAgentStore.getState().actions;
    act(() => openAgent({ context: story('n-1') }));
    act(() => closeAgent());
    act(() => openAgent({ context: story('n-1') }));
    expect(useLabosAgentStore.getState().session).toBe(1);

    act(() => openAgent({ context: story('n-2') }));
    expect(useLabosAgentStore.getState().session).toBe(2);
    expect(useLabosAgentStore.getState().isOpen).toBe(true);
  });

  it('opens with no context', () => {
    act(() => useLabosAgentStore.getState().actions.openAgent());
    expect(useLabosAgentStore.getState().context).toBeNull();
  });
});
