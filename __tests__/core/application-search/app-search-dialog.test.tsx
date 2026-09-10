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

/* The answer state is a dynamic chunk and drags in a markdown/syntax stack jest
   cannot transform. A stand-in rather than `null`, because the restore cases
   below are about what this dialog *hands* it — the Back label it computes and
   whether it delegates focus. The real component's own focus and scroll effects
   are covered by `answer-view-restore.test.tsx`. */
jest.mock('@/components/core/application-search/components/AnswerView', () => ({
  AnswerView: ({ turns, onBack, backLabel, autoFocusComposer }: any) => (
    <div data-testid="answer-view" data-autofocus-composer={String(!!autoFocusComposer)}>
      <span data-testid="last-answer">{turns[turns.length - 1]?.answer}</span>
      {/* Mirrors the real component: no Back at all when there is no origin. */}
      {onBack ? (
        <button type="button" onClick={onBack}>
          {backLabel}
        </button>
      ) : null}
    </div>
  ),
}));

let isBelowTabletLandscape = false;
jest.mock('@/hooks/useIsBelowTabletLandscape', () => ({
  useIsBelowTabletLandscape: () => isBelowTabletLandscape,
}));

/* Set per test, before `renderSearch()`. The container reads `turns.length` in
   its `open` callback, which is rebuilt on render, so this must be in place
   before the first one. */
let huskyTurns: Array<{ chatId: string; question: string; answer: string }> = [];

jest.mock('@/services/husky/hooks/useHuskyChat', () => ({
  useHuskyChat: () => ({
    turns: huskyTurns,
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
  huskyTurns = [];
});

const A_CONVERSATION = [{ chatId: 'c1', question: 'what is filecoin', answer: 'A storage network.' }];
const openWithShortcut = () => fireEvent.keyDown(window, { key: 'k', metaKey: true });
const escape = () => fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

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
    const trigger = screen.getByRole('button', { name: 'Search' });
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

  /**
   * Reopening used to land on idle search while the conversation sat in memory
   * with nothing pointing at it: `close()` keeps the thread on purpose but
   * resets `view`, and the dialog derives `idle` from that.
   *
   * The three cases here move together. Restoring the view without a Back
   * button trades "cannot reach my chat" for "cannot reach search", and Escape
   * has to agree with that button — from an answer with no origin the ladder
   * used to close the dialog outright.
   */
  describe('reopening with a conversation in memory', () => {
    it('lands back in the conversation rather than on idle search', async () => {
      huskyTurns = A_CONVERSATION;
      renderSearch();

      openWithShortcut();

      expect(await screen.findByTestId('answer-view')).toBeInTheDocument();
      expect(screen.getByTestId('last-answer')).toHaveTextContent('A storage network.');
    });

    // The negative case, or "restore" would just mean "always show an empty
    // answer view".
    it('opens on search when there is no conversation to return to', async () => {
      renderSearch();

      openWithShortcut();

      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      expect(screen.queryByTestId('answer-view')).not.toBeInTheDocument();
      expect(field()).toHaveValue('');
    });

    it('offers a way out labelled for where it actually goes', async () => {
      huskyTurns = A_CONVERSATION;
      renderSearch();
      openWithShortcut();
      await screen.findByTestId('answer-view');

      const back = screen.getByRole('button', { name: 'Back to search' });
      fireEvent.click(back);

      await waitFor(() => expect(screen.queryByTestId('answer-view')).not.toBeInTheDocument());
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(field()).toHaveValue('');
    });

    // The regression the `'restored'` sentinel exists to prevent: Back and
    // Escape read the same `origin`, so they cannot disagree about this screen.
    it('walks Escape back to search instead of closing outright', async () => {
      huskyTurns = A_CONVERSATION;
      renderSearch();
      openWithShortcut();
      await screen.findByTestId('answer-view');

      escape();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.queryByTestId('answer-view')).not.toBeInTheDocument();

      escape();
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('hands focus to the conversation, not to the search field', async () => {
      huskyTurns = A_CONVERSATION;
      renderSearch();

      openWithShortcut();
      await screen.findByTestId('answer-view');

      expect(screen.getByTestId('answer-view')).toHaveAttribute('data-autofocus-composer', 'true');
      // Typing in the search field starts a *new* search, so parking the caret
      // there would navigate away from the thread just restored.
      await waitFor(() => expect(field()).not.toHaveFocus());
    });

    it('does not claim focus when the answer was reached by asking', async () => {
      renderSearch();
      openWithShortcut();
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      await userEvent.type(field(), 'filecoin');
      huskyTurns = A_CONVERSATION;
      fireEvent.click(await screen.findByRole('button', { name: /filecoin/i }));

      expect(await screen.findByTestId('answer-view')).toHaveAttribute('data-autofocus-composer', 'false');
    });

    it('still restores after going back to search and closing', async () => {
      huskyTurns = A_CONVERSATION;
      renderSearch();

      openWithShortcut();
      await screen.findByTestId('answer-view');
      fireEvent.click(screen.getByRole('button', { name: 'Back to search' }));
      await waitFor(() => expect(screen.queryByTestId('answer-view')).not.toBeInTheDocument());
      escape();
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

      openWithShortcut();

      expect(await screen.findByTestId('answer-view')).toBeInTheDocument();
    });
  });
});
