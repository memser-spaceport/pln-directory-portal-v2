import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/components/common/Markdown', () => ({
  Markdown: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () => ({
    trackFeedbackClick: jest.fn(),
    trackQuestionEdit: jest.fn(),
    trackAnswerCopy: jest.fn(),
    trackHuskySourceLinkClicked: jest.fn(),
  }),
}));
const onAiWebSourcesShown = jest.fn();
jest.mock('@/analytics/unified-search.analytics', () => ({
  useUnifiedSearchAnalytics: () => ({ onAiWebSourcesShown, onAiWebSourceClicked: jest.fn() }),
}));

import { AnswerView } from '@/components/core/application-search/components/AnswerView';

const webTurn = {
  chatId: 'c1',
  question: 'What does Saturn Grid build?',
  answer: 'From the web: storage software.',
  sources: [],
  sourceRefs: [
    { index: 1, title: 'Saturn Grid', type: 'team', directoryLink: '/teams/saturn' },
    { index: 2, title: 'About', type: 'web', externalUrl: 'https://saturn.example/about' },
  ],
  followUpQuestions: [],
  actions: [],
};
const directoryTurn = {
  ...webTurn,
  chatId: 'c2',
  sourceRefs: [{ index: 1, title: 'Saturn Grid', type: 'team', directoryLink: '/teams/saturn' }],
};

const baseProps = {
  status: 'done' as const,
  isBusy: false,
  threadId: 't1',
  isThreadPersisted: true,
  limitLevel: null as never,
  limitRemaining: 10,
  isLoggedIn: true,
  backLabel: 'Back to search',
  onBack: jest.fn(),
  onAsk: jest.fn(),
  onRegenerate: jest.fn(),
  onStop: jest.fn(),
  onClose: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

describe('Header search dialog: web sources shown', () => {
  it('records once, after the answer finishes, that it shows web sources', () => {
    const { rerender } = render(<AnswerView {...baseProps} turns={[webTurn]} status="submitting" isBusy />);
    expect(onAiWebSourcesShown).not.toHaveBeenCalled();

    rerender(<AnswerView {...baseProps} turns={[webTurn]} />);
    rerender(<AnswerView {...baseProps} turns={[{ ...webTurn }]} />);

    expect(onAiWebSourcesShown).toHaveBeenCalledTimes(1);
    expect(onAiWebSourcesShown).toHaveBeenCalledWith({ webSources: 1, directorySources: 1 }, 'header-dialog');
  });

  it('records nothing for the answers of a restored thread', () => {
    render(<AnswerView {...baseProps} turns={[webTurn]} />);

    expect(onAiWebSourcesShown).not.toHaveBeenCalled();
  });

  it('records nothing for an answer from directory data only', () => {
    const { rerender } = render(<AnswerView {...baseProps} turns={[directoryTurn]} status="submitting" isBusy />);
    rerender(<AnswerView {...baseProps} turns={[directoryTurn]} />);

    expect(onAiWebSourcesShown).not.toHaveBeenCalled();
  });
});
