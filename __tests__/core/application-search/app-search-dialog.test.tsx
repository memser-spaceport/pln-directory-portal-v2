import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  AnswerView: ({ turns, onBack, backLabel, autoFocusComposer, onClose }: any) => (
    <div data-testid="answer-view" data-autofocus-composer={String(!!autoFocusComposer)}>
      <span data-testid="last-answer">{turns[turns.length - 1]?.answer}</span>
      {/* Mirrors the real component: no Back at all when there is no origin. */}
      {onBack ? (
        <button type="button" onClick={onBack}>
          {backLabel}
        </button>
      ) : null}
      {/* The real AnswerView takes `onClose` too; tests need it to close the
          dialog *from* the conversation, which is what arms the restore. */}
      <button type="button" onClick={onClose}>
        Close answer
      </button>
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

const saveRecentSearch = jest.fn();
jest.mock('@/services/search/hooks/useRecentSearch', () => ({
  useRecentSearch: () => ({ data: [] }),
  saveRecentSearch: (...args: unknown[]) => saveRecentSearch(...args),
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
  saveRecentSearch.mockClear();
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
   * These drive the real path — ask, then close from the answer — because that
   * is the only way turns can exist. Rendering with turns already present and
   * opening cold is a state the app cannot reach, and testing it hid the bug
   * these cases now pin: restoring on `turns.length` alone.
   */
  /**
   * A search used to reach Recent only if a result was clicked, so searching,
   * reading the list and moving on left no trace. There is no submit gesture to
   * read intent from — results appear as you type and `Enter` asks the AI — so
   * the debounced term is what stands in for "the search I made".
   */
  describe('recording a search in Recent', () => {
    const settle = () => act(() => jest.advanceTimersByTime(1000));

    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('records the term without a result ever being clicked', () => {
      renderSearch();
      openWithShortcut();

      fireEvent.change(field(), { target: { value: 'filecoin' } });
      settle();

      expect(saveRecentSearch).toHaveBeenCalledWith('filecoin');
    });

    // The reported flow, end to end.
    it('still has it after the field is cleared', () => {
      renderSearch();
      openWithShortcut();
      fireEvent.change(field(), { target: { value: 'filecoin' } });
      settle();

      fireEvent.change(field(), { target: { value: '' } });
      settle();

      expect(saveRecentSearch).toHaveBeenCalledTimes(1);
      expect(saveRecentSearch).toHaveBeenCalledWith('filecoin');
    });

    /* Nothing settled, so nothing was searched. This is what keeps a typo the
       person backed out of from being remembered. */
    it('records nothing for a term abandoned inside the debounce window', () => {
      renderSearch();
      openWithShortcut();

      fireEvent.change(field(), { target: { value: 'fil' } });
      fireEvent.change(field(), { target: { value: '' } });
      settle();

      expect(saveRecentSearch).not.toHaveBeenCalled();
    });

    // Same floor the dialog uses to decide it has a query at all.
    it('records nothing for a single character', () => {
      renderSearch();
      openWithShortcut();

      fireEvent.change(field(), { target: { value: 'f' } });
      settle();

      expect(saveRecentSearch).not.toHaveBeenCalled();
    });
  });

  describe('reopening with a conversation in memory', () => {
    const haveAConversation = async () => {
      openWithShortcut();
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      await userEvent.type(field(), 'filecoin');
      huskyTurns = A_CONVERSATION;
      fireEvent.click(await screen.findByRole('button', { name: /filecoin/i }));
      await screen.findByTestId('answer-view');
    };

    const closeFromAnswer = async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Close answer' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    };

    it('lands back in the conversation rather than on idle search', async () => {
      renderSearch();
      await haveAConversation();
      await closeFromAnswer();

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
      renderSearch();
      await haveAConversation();
      await closeFromAnswer();
      openWithShortcut();
      await screen.findByTestId('answer-view');

      fireEvent.click(screen.getByRole('button', { name: 'Back to search' }));

      await waitFor(() => expect(screen.queryByTestId('answer-view')).not.toBeInTheDocument());
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(field()).toHaveValue('');
    });

    // The regression the `'restored'` sentinel exists to prevent: Back and
    // Escape read the same `origin`, so they cannot disagree about this screen.
    it('walks Escape back to search instead of closing outright', async () => {
      renderSearch();
      await haveAConversation();
      await closeFromAnswer();
      openWithShortcut();
      await screen.findByTestId('answer-view');

      escape();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.queryByTestId('answer-view')).not.toBeInTheDocument();

      escape();
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('hands focus to the conversation, not to the search field', async () => {
      renderSearch();
      await haveAConversation();
      await closeFromAnswer();

      openWithShortcut();
      await screen.findByTestId('answer-view');

      expect(screen.getByTestId('answer-view')).toHaveAttribute('data-autofocus-composer', 'true');
      // Typing in the search field starts a *new* search, so parking the caret
      // there would navigate away from the thread just restored.
      await waitFor(() => expect(field()).not.toHaveFocus());
    });

    it('does not claim focus when the answer was reached by asking', async () => {
      renderSearch();

      await haveAConversation();

      expect(screen.getByTestId('answer-view')).toHaveAttribute('data-autofocus-composer', 'false');
    });

    /* Restoring on `turns.length` alone made the thread impossible to get rid
       of: back out to search, close, reopen, and it dragged the conversation
       back every time. Backing out is the person saying they are done with it,
       so what is restored is where they *left off* — not wherever the last
       conversation happens to be. */
    it('stays on search when that is where they left off', async () => {
      renderSearch();
      await haveAConversation();
      await closeFromAnswer();
      openWithShortcut();
      await screen.findByTestId('answer-view');

      fireEvent.click(screen.getByRole('button', { name: 'Back to search' }));
      await waitFor(() => expect(screen.queryByTestId('answer-view')).not.toBeInTheDocument());
      escape();
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

      openWithShortcut();

      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      expect(screen.queryByTestId('answer-view')).not.toBeInTheDocument();
    });

    /* The back gesture closes the full-bleed takeover without going through
       `close()` — that would call `history.back()` a second time — so it has to
       record the same intent itself or mobile silently loses the restore. */
    describe('when the back gesture closes the takeover', () => {
      const backGesture = async () => {
        window.dispatchEvent(new PopStateEvent('popstate'));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      };

      beforeEach(() => {
        isBelowTabletLandscape = true;
      });

      /* The answer view itself would come back regardless: this path never
         resets `view`, so it is still 'answer'. What it does *not* do on its
         own is mark the reopen as a restore — leaving `origin` at whatever the
         conversation was reached from, which is what decides the Back label
         and whether the composer takes focus. Assert those, not just the view,
         or the whole handler can be deleted with the suite still green. */
      it('still comes back to the conversation, as a restore', async () => {
        renderSearch();
        await haveAConversation();

        await backGesture();
        openWithShortcut();

        const answer = await screen.findByTestId('answer-view');
        expect(answer).toBeInTheDocument();
        expect(answer).toHaveAttribute('data-autofocus-composer', 'true');
        expect(screen.getByRole('button', { name: 'Back to search' })).toBeInTheDocument();
      });

      it('still honours having backed out to search first', async () => {
        renderSearch();
        await haveAConversation();
        fireEvent.click(screen.getByRole('button', { name: 'Back to results' }));
        await waitFor(() => expect(screen.queryByTestId('answer-view')).not.toBeInTheDocument());

        await backGesture();
        openWithShortcut();

        await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
        expect(screen.queryByTestId('answer-view')).not.toBeInTheDocument();
      });
    });

    // The intent is re-read on every close, not latched once.
    it('restores again when they close from the conversation a second time', async () => {
      renderSearch();
      await haveAConversation();
      await closeFromAnswer();
      openWithShortcut();
      await screen.findByTestId('answer-view');

      await closeFromAnswer();
      openWithShortcut();

      expect(await screen.findByTestId('answer-view')).toBeInTheDocument();
    });
  });
});
