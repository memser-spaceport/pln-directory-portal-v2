import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import FeedbackForm from '@/components/page/aligement-assets/feedback/feedback-form';
import RoadmapBoard from '@/components/page/aligement-assets/feedback/roadmap-board';
import { item } from './__fixtures__/feedback.fixtures';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

describe('tabs are associated with their panels', () => {
  function mockViewport(narrow: boolean) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: narrow,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
  }

  it('points each Roadmap tab at the panel it controls', () => {
    mockViewport(true);
    render(
      <RoadmapBoard
        roadmap={{ under_review: [item()], todo: [], in_progress: [], completed: [] }}
        isAdmin={false}
        onVote={jest.fn()}
        onMove={jest.fn()}
      />,
    );

    const tab = screen.getByRole('tab', { selected: true });
    const panelId = tab.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();

    const panel = document.getElementById(panelId as string);
    expect(panel).toHaveAttribute('role', 'tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', tab.id);
  });

  it('does not claim tabpanel semantics when all four columns are visible', () => {
    mockViewport(false);
    render(
      <RoadmapBoard
        roadmap={{ under_review: [item()], todo: [], in_progress: [], completed: [] }}
        isAdmin={false}
        onVote={jest.fn()}
        onMove={jest.fn()}
      />,
    );
    expect(screen.queryAllByRole('tabpanel')).toHaveLength(0);
  });
});

describe('modal is a modal', () => {
  it('locks page scroll while open and restores it on close', () => {
    const { unmount } = render(<FeedbackForm onClose={jest.fn()} onSubmit={jest.fn()} isSubmitting={false} />);
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('returns focus to whatever opened it', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    const { unmount } = render(<FeedbackForm onClose={jest.fn()} onSubmit={jest.fn()} isSubmitting={false} />);
    expect(opener).not.toHaveFocus();

    unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it('wraps Tab from the last control to the first, and Shift+Tab back again', () => {
    render(<FeedbackForm onClose={jest.fn()} onSubmit={jest.fn()} isSubmitting={false} />);
    fireEvent.change(screen.getByLabelText(/^Title$/), { target: { value: 'A good clear title' } });
    fireEvent.change(screen.getByLabelText(/Describe the new feature/), {
      target: { value: 'This description is comfortably longer than twenty characters.' },
    });
    const close = screen.getByRole('button', { name: 'Close' });
    const submit = screen.getByRole('button', { name: /^Submit$/ });

    submit.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(submit).toHaveFocus();
  });
});
