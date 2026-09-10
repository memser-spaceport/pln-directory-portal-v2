import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

/* The markdown/syntax stack is what keeps the real AnswerView out of
   `app-search-dialog.test.tsx`. Only it needs replacing — `ChatInput` forwards
   a ref to a genuine <textarea>, which is the whole subject here. */
jest.mock('@/components/common/Markdown', () => ({
  Markdown: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () => ({
    trackFeedbackClick: jest.fn(),
    trackQuestionEdit: jest.fn(),
    trackAnswerCopy: jest.fn(),
  }),
}));

import { AnswerView } from '@/components/core/application-search/components/AnswerView';

const turns = [
  { chatId: 'c1', question: 'first', answer: 'first answer', sources: [], followUpQuestions: [], actions: [] },
  { chatId: 'c2', question: 'second', answer: 'second answer', sources: [], followUpQuestions: [], actions: [] },
];

const baseProps = {
  turns,
  status: 'done' as const,
  isBusy: false,
  threadId: 't1',
  limitLevel: null as never,
  limitRemaining: 10,
  isLoggedIn: true,
  backLabel: 'Back to search',
  onAsk: jest.fn(),
  onRegenerate: jest.fn(),
  onStop: jest.fn(),
  onClose: jest.fn(),
};

const composer = () => screen.getByRole('textbox');

let scrollIntoView: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  scrollIntoView = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
});

/**
 * A reopened conversation has to land somewhere useful. The existing scroll
 * effect only fires while `isBusy`, so a finished thread would otherwise open
 * scrolled to its first question — and focus would still be in the search
 * field, whose first keystroke starts a new search.
 */
describe('AnswerView on a restored thread', () => {
  it('puts the caret in the follow-up composer', async () => {
    render(<AnswerView {...baseProps} autoFocusComposer />);

    await waitFor(() => expect(composer()).toHaveFocus());
  });

  it('opens at the newest turn rather than the top', async () => {
    render(<AnswerView {...baseProps} autoFocusComposer />);

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    // 'auto', not 'smooth': this is where the view starts, not a movement.
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'end' });
  });

  it('leaves focus and scroll alone for an answer reached by asking', async () => {
    render(<AnswerView {...baseProps} />);

    await waitFor(() => expect(screen.getByText('second answer')).toBeInTheDocument());
    expect(composer()).not.toHaveFocus();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  // Re-running on `turns` would yank focus back to the composer every time a
  // streamed token landed.
  it('does not re-claim focus when the conversation grows', async () => {
    const { rerender } = render(<AnswerView {...baseProps} autoFocusComposer />);
    await waitFor(() => expect(composer()).toHaveFocus());

    composer().blur();
    rerender(
      <AnswerView
        {...baseProps}
        autoFocusComposer
        turns={[
          ...turns,
          { chatId: 'c3', question: 'third', answer: 'third answer', sources: [], followUpQuestions: [], actions: [] },
        ]}
      />,
    );

    expect(composer()).not.toHaveFocus();
  });
});
