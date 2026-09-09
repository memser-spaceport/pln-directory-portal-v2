import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

/**
 * Only what a DOM test can see, and nothing `Modal` already guarantees.
 *
 * The Escape ladder is the reason this file exists: `Modal` closes on
 * keydown/capture with `stopImmediatePropagation` while the old shared input
 * cleared on keyup, so composing them fired both — a bug no amount of reading
 * catches, because the two handlers never appear in the same file.
 */

/* Lottie touches a canvas jsdom does not provide, and the loader is not what
   any of these assertions are about. */
jest.mock('@/components/core/application-search/components/ContentLoader', () => ({
  ContentLoader: () => null,
}));

/* The answer state is a dynamic chunk and drags in a markdown/syntax stack
   jest cannot transform; none of these assertions are about it. */
jest.mock('@/components/core/application-search/components/AnswerView', () => ({
  AnswerView: () => null,
}));

let isBelowTabletLandscape = false;
jest.mock('@/hooks/useIsBelowTabletLandscape', () => ({
  useIsBelowTabletLandscape: () => isBelowTabletLandscape,
}));

jest.mock('@/services/husky/hooks/useHuskyChat', () => ({
  useHuskyChat: () => ({
    turns: [],
    status: 'idle',
    isBusy: false,
    threadId: null,
    limitLevel: null,
    limitRemaining: 10,
    refreshLimit: jest.fn(),
    startThread: jest.fn(),
    ask: jest.fn(),
    regenerate: jest.fn(),
    hydrate: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
    getInterruptedThreadId: () => null,
  }),
}));

jest.mock('@/services/search/hooks/useChatHistory', () => ({
  useChatHistory: () => ({ data: [], isLoading: false, isError: false, refetch: jest.fn() }),
}));

jest.mock('@/services/search/hooks/useFullApplicationSearch', () => ({
  useFullApplicationSearch: () => ({ data: undefined, isLoading: false, isError: false }),
}));

jest.mock('@/services/search/hooks/useRecentSearch', () => ({
  useRecentSearch: () => ({ data: [] }),
  saveRecentSearch: jest.fn(),
}));

jest.mock('@/services/search/hooks/useRemoveRecentSearch', () => ({
  useRemoveRecentSearch: () => ({ mutate: jest.fn() }),
}));

import { ApplicationSearch } from '@/components/core/application-search/ApplicationSearch';

const userInfo = { uid: 'u1', name: 'A', email: 'a@b.c' } as never;

function renderSearch() {
  return render(<ApplicationSearch isLoggedIn userInfo={userInfo} authToken="token" />);
}

const field = () => screen.getByPlaceholderText('Search or ask AI Search a question');

beforeEach(() => {
  isBelowTabletLandscape = false;
});

describe('AppSearchDialog', () => {
  it('opens on Cmd+K with the caret already in the field', async () => {
    renderSearch();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await waitFor(() => expect(field()).toHaveFocus());
  });

  it('renders exactly one dialog at either breakpoint', async () => {
    // Two surfaces mounted at once would portal two dialogs to <body>: two
    // aria-modal containers and two live regions announcing the same answer.
    const { unmount } = renderSearch();
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    await waitFor(() => expect(screen.getAllByRole('dialog')).toHaveLength(1));
    unmount();

    isBelowTabletLandscape = true;
    renderSearch();
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    await waitFor(() => expect(screen.getAllByRole('dialog')).toHaveLength(1));
  });

  it('walks the Escape ladder rather than closing from any state', async () => {
    const user = userEvent.setup();
    renderSearch();
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    await user.type(field(), 'filecoin');
    expect(field()).toHaveValue('filecoin');

    // First Escape clears the term and returns to idle...
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(field()).toHaveValue('');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // ...only the second closes.
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('returns focus to the trigger on close', async () => {
    renderSearch();
    /* Both triggers are in the DOM — CSS decides which is visible, and jsdom
       has no CSS. The desktop one comes first. */
    const trigger = screen.getAllByRole('button', { name: /search/i })[0];
    trigger.focus();
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    await waitFor(() => expect(field()).toHaveFocus());

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('offers the AI row only once there is something to ask about', async () => {
    const user = userEvent.setup();
    renderSearch();
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    await user.type(field(), 'f');
    expect(screen.queryByText(/Chat with AI Search about/)).not.toBeInTheDocument();

    await user.type(field(), 'i');
    expect(screen.getByText(/Chat with AI Search about/)).toBeInTheDocument();
  });

  it('does not resurrect a cleared term when the debounce settles', async () => {
    // The shared input used to hold its own copy of the value and publish it
    // 700ms later, so a clear could be undone by a timer already in flight.
    jest.useFakeTimers();
    try {
      renderSearch();
      fireEvent.keyDown(window, { key: 'k', metaKey: true });
      fireEvent.change(field(), { target: { value: 'fil' } });
      expect(screen.getByText(/Chat with AI Search about/)).toBeInTheDocument();

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(field()).toHaveValue('');

      jest.advanceTimersByTime(1000);

      expect(field()).toHaveValue('');
      expect(screen.queryByText(/Chat with AI Search about/)).not.toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });
});
