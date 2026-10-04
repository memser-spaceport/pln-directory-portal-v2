import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedbackTable } from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackTable';
import type { AiAppFeedbackRow } from '@/services/ai-app-feedback/ai-app-feedback.service';

jest.mock('@/services/ai-apps/constants', () => ({
  ...jest.requireActual('@/services/ai-apps/constants'),
  SHOW_AI_APPS_FEEDBACK_OVERLAY: true,
  SHOW_AI_APPS_COMMENTS: true,
}));

const row = (uid: string, pinCount?: number): AiAppFeedbackRow => ({
  uid,
  appUid: 'app 1',
  appName: 'Grant Tracker',
  text: `Feedback ${uid}`,
  status: 'NEW',
  createdAt: '2026-10-01T00:00:00.000Z',
  member: { uid: 'm1', name: 'Ada' },
  ...(pinCount === undefined ? {} : { pinCount }),
});

describe('FeedbackTable: Show on page', () => {
  it('links feedback that pinned elements to the app with that feedback open, and only that feedback', () => {
    render(
      <FeedbackTable
        rows={[row('fb-1', 2), row('fb-2', 0), row('fb-3')]}
        onStatusSelect={jest.fn()}
        onImageClick={jest.fn()}
      />,
    );
    const links = screen.getAllByRole('link', { name: 'Show on page' });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/pl-infra/ai-apps/app%201?feedback=fb-1');
  });
});

describe('FeedbackTable: kind', () => {
  it('says which door each item came through: a comment on the live app, or the form', () => {
    render(
      <FeedbackTable
        rows={[{ ...row('fb-1'), kind: 'COMMENT' }, { ...row('fb-2'), kind: 'FEEDBACK' }, row('fb-3')]}
        onStatusSelect={jest.fn()}
        onImageClick={jest.fn()}
      />,
    );
    const kinds = screen
      .getAllByRole('row')
      .slice(1)
      .map((tr) => tr.querySelector('td:nth-child(2) > span')?.textContent);
    /* An older response has no kind: it was written as private feedback. */
    expect(kinds).toEqual(['Comment', 'Feedback', 'Feedback']);
  });
});

describe('FeedbackTable: Kind and Priority', () => {
  it.each([
    ['the review list', { onStatusSelect: jest.fn() }],
    ['the sender’s own list', {}],
  ])('shows them in the form’s words on %s, blank where never set', (_, props) => {
    render(
      <FeedbackTable
        rows={[
          { ...row('fb-1'), reportKind: 'request', priority: 'P0' },
          { ...row('fb-2'), reportKind: null, priority: null },
          row('fb-3'),
        ]}
        onImageClick={jest.fn()}
        {...props}
      />,
    );
    const cells = screen
      .getAllByRole('row')
      .slice(1)
      .map((tr) => [
        tr.querySelector('td:nth-child(3)')?.textContent,
        tr.querySelector('td:nth-child(4)')?.textContent,
      ]);
    expect(cells).toEqual([
      ['request', 'P0 — Blocking — nobody can work around this'],
      ['', ''],
      ['', ''],
    ]);
  });
});
