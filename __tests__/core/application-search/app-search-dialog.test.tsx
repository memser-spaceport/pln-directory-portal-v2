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

/* Set per test, like `huskyTurns`. The compact history list renders nothing for
   an empty array, so a fixed `[]` here left the whole idle-view door untested —
   which is how it kept its missing Back button. */
let historyThreads: Array<{ threadId: string; title: string; createdAt: string; updatedAt: string }> = [];

jest.mock('@/services/search/hooks/useChatHistory', () => ({
  useChatHistory: () => ({ data: historyThreads, isLoading: false, isError: false, refetch: jest.fn() }),
}));

/* Opening a thread from that list goes through both of these before the answer
   view appears. Only `getUserCredentials` is imported from `auth.utils` anywhere
   in this tree, so a narrow module mock is safe. */
jest.mock('@/utils/auth.utils', () => ({
  getUserCredentials: async () => ({ authToken: 'token', userInfo: {} }),
}));

jest.mock('@/services/husky/getAiSearchThread', () => ({
  getAiSearchThread: async (threadId: string) => ({
    ok: true,
    threadId,
    title: 'A past conversation',
    turns: [{ chatId: 'c1', question: 'what is filecoin', answer: 'A storage network.' }],
  }),
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

/* `ApplicationSearch` imports both header searches so it can choose between
   them, and the legacy one reaches `react-syntax-highlighter`'s ESM build
   through `AiChatPanel` → `Messages`, which jest does not transform. Its module
   graph loads at import time — before any `describe` runs — so without this the
   file fails to load rather than skipping, and skipping is the whole point
   below. Nothing here renders the legacy search; it is the other branch of a
   ternary. */
jest.mock('@/components/core/application-search/LegacyApplicationSearch', () => ({
  LegacyApplicationSearch: () => null,
}));

import { ApplicationSearch } from '@/components/core/application-search/ApplicationSearch';
import { SHOW_AI_SEARCH_DIALOG } from '@/services/search/constants';

const userInfo = { uid: 'u1', name: 'A', email: 'a@b.c' } as never;

function renderSearch({ isLoggedIn = true } = {}) {
  return render(<ApplicationSearch isLoggedIn={isLoggedIn} userInfo={userInfo} authToken="token" />);
}

const field = () => screen.getByPlaceholderText('Search or ask AI Search a question');

beforeEach(() => {
  isBelowTabletLandscape = false;
  huskyTurns = [];
  historyThreads = [];
  saveRecentSearch.mockClear();
});

const A_CONVERSATION = [{ chatId: 'c1', question: 'what is filecoin', answer: 'A storage network.' }];
const openWithShortcut = () => fireEvent.keyDown(window, { key: 'k', metaKey: true });
const escape = () => fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

/*
 * Runs only where the dialog is the header search that mounts.
 *
 * With NEXT_PUBLIC_SHOW_AI_SEARCH_DIALOG off — the default, and what ships —
 * `ApplicationSearch` renders the legacy search instead, and every assertion
 * here would be checking a UI it was not written for. Gated rather than
 * hard-skipped so these come back on their own the day the flag flips.
 *
 * READ THIS BEFORE FLIPPING THE FLAG: that day is the first time this file will
 * have run in CI since it was gated. Run it, and treat a pass as unverified
 * until you have made one assertion fail on purpose.
 */
const describeDialog = SHOW_AI_SEARCH_DIALOG ? describe : describe.skip;

describeDialog('AppSearchDialog', () => {
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
   * The hint was designed as the last line of the idle stack and never made it
   * out of the prototype. It names what the field reaches, which is worth most
   * in the states the rest of the view leaves thin, so it is not conditional on
   * any of them.
   */
  describe('the scope hint', () => {
    const HINT = 'Search members, teams, projects, events and forum posts, or chat with AI Search.';

    it('names what the field reaches before anything is typed', async () => {
      renderSearch();
      openWithShortcut();

      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      expect(screen.getByText(HINT)).toBeInTheDocument();
    });

    it('still names it for someone with no history to show', async () => {
      renderSearch({ isLoggedIn: false });
      openWithShortcut();

      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      expect(screen.getByText('Sign in to keep your AI Search history.')).toBeInTheDocument();
      expect(screen.getByText(HINT)).toBeInTheDocument();
    });

    it('drops the hint once there are results to read', async () => {
      const user = userEvent.setup();
      renderSearch();
      openWithShortcut();
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      expect(screen.getByText(HINT)).toBeInTheDocument();

      await user.type(field(), 'fil');

      // Assert the results view actually replaced idle first: without this, a
      // render that never left idle would satisfy the absence below.
      expect(screen.getByText(/Chat with AI Search about/)).toBeInTheDocument();
      expect(screen.queryByText(HINT)).not.toBeInTheDocument();
    });
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
  /* Both doors on the idle view. The Back control is *rendered* on a condition,
     and that condition used to be "does the search field have anything in it" —
     so asking a suggested question, or reopening a conversation from the compact
     history list, left an answer with no way back and an Escape that closed the
     dialog outright. Every other Back test here types a term first, which is
     exactly why neither door was covered. */
  describe('reaching an answer from the idle view', () => {
    const A_THREAD = {
      threadId: 't1',
      title: 'A past conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const askFromPrompt = async () => {
      openWithShortcut();
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      huskyTurns = A_CONVERSATION;
      fireEvent.click(screen.getByRole('button', { name: /Find teams building on Filecoin/i }));
      await screen.findByTestId('answer-view');
    };

    const openFromCompactHistory = async () => {
      historyThreads = [A_THREAD];
      openWithShortcut();
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      huskyTurns = A_CONVERSATION;
      fireEvent.click(screen.getByRole('button', { name: /A past conversation/ }));
      await screen.findByTestId('answer-view');
    };

    it('offers a way back from a suggested question', async () => {
      renderSearch();
      await askFromPrompt();

      fireEvent.click(screen.getByRole('button', { name: 'Back to search' }));

      await waitFor(() => expect(screen.queryByTestId('answer-view')).not.toBeInTheDocument());
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(field()).toHaveValue('');
    });

    it('walks Escape back to the prompts rather than closing the dialog', async () => {
      renderSearch();
      await askFromPrompt();

      escape();

      await waitFor(() => expect(screen.queryByTestId('answer-view')).not.toBeInTheDocument());
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // ...and only the second Escape leaves, the same ladder every other view walks.
      escape();
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('offers a way back from a conversation reopened on idle', async () => {
      renderSearch();
      await openFromCompactHistory();

      expect(screen.getByRole('button', { name: 'Back to search' })).toBeInTheDocument();

      // The same rung: Escape steps back to the list rather than throwing the dialog away.
      escape();
      await waitFor(() => expect(screen.queryByTestId('answer-view')).not.toBeInTheDocument());
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    /* The branch that must not move: reached from the full history view, Back
       goes back to the history view, not to search. */
    it('still says history when that is where the conversation was opened from', async () => {
      historyThreads = Array.from({ length: 6 }, (_, i) => ({
        ...A_THREAD,
        threadId: `t${i}`,
        title: `Conversation ${i}`,
      }));
      renderSearch();
      openWithShortcut();
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: /Show all \(6\)/ }));
      huskyTurns = A_CONVERSATION;
      fireEvent.click(await screen.findByRole('button', { name: 'Conversation 3' }));
      await screen.findByTestId('answer-view');

      expect(screen.getByRole('button', { name: 'Back to history' })).toBeInTheDocument();
    });
  });
  /* The scrim used to start below the header, leaving a navbar that looked live
     while `Modal`'s containment had already made it `inert` — visible, undimmed
     and silently swallowing every click. The overlay covers the whole page now,
     so what you see matches what you can press. */
  it('keeps the header behind the dialog, and covered by it', async () => {
    const header = document.createElement('header');
    header.className = 'layout__header';
    document.body.appendChild(header);

    try {
      renderSearch();
      openWithShortcut();
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

      expect(header.inert).toBe(true);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    } finally {
      header.remove();
    }
  });
});
