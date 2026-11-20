import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import type { LabosAgentSourceRef, LabosAgentTurn as Turn } from '@/types/labos-agent.types';

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Markdown pulls in an ESM-only highlighter that Jest cannot parse.
jest.mock('@/components/common/Markdown', () => ({
  Markdown: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

import { LabosAgentTurn } from '@/components/core/labos-agent/LabosAgentTurn/LabosAgentTurn';
import { homeToRoot, ownOriginPath, sourceRefLink } from '@/services/labos-agent/labos-agent.sources';

/**
 * LAB-3298 (D1, Oleg's QA): a LabOS source opens with the client router. A full page load lost the chat. A web
 * source still opens in a new tab.
 */
const turn = (sourceRefs: LabosAgentSourceRef[]): Turn => ({
  id: 't-1',
  message: 'What is new?',
  status: 'done',
  steps: [],
  content: 'An answer.',
  sources: [],
  sourceRefs,
  followUpQuestions: [],
  proposals: [],
  cards: {},
  drafts: [],
  draftCards: {},
  startedAt: 0,
  endedAt: 1000,
});

const onSourceClick = jest.fn();
const renderTurn = (sourceRefs: LabosAgentSourceRef[]) =>
  render(
    <LabosAgentTurn
      turn={turn(sourceRefs)}
      busy={false}
      onFollowUp={jest.fn()}
      onRetry={jest.fn()}
      onDecide={jest.fn()}
      onSourceClick={onSourceClick}
    />,
  );

/** Clicks the link and returns true when the browser default (a page load) was stopped. */
const click = (title: string, init: MouseEventInit = {}) => {
  const link = screen.getByText(title).closest('a') as HTMLAnchorElement;
  return !fireEvent.click(link, { button: 0, ...init });
};

describe('LAB-3298 D1: LabOS source links keep the chat', () => {
  beforeEach(() => {
    push.mockReset();
    onSourceClick.mockReset();
  });

  it('a news ref with a relative directoryLink opens with router.push, with no page load', () => {
    renderTurn([{ type: 'news', title: 'A story', directoryLink: '/?news=n-1' }]);
    const link = screen.getByText('A story').closest('a');
    expect(link).toHaveAttribute('href', '/?news=n-1');
    expect(link).not.toHaveAttribute('target');

    expect(click('A story')).toBe(true);
    expect(push).toHaveBeenCalledWith('/?news=n-1');
    expect(onSourceClick).toHaveBeenCalledWith('labos', 1);
    expect(screen.getByText('An answer.')).toBeInTheDocument();
  });

  it('a full URL on the app origin becomes a path and opens with router.push', () => {
    renderTurn([{ type: 'team', title: 'Textile', externalUrl: `${window.location.origin}/teams/t-1?tab=about` }]);
    const link = screen.getByText('Textile').closest('a');
    expect(link).toHaveAttribute('href', '/teams/t-1?tab=about');
    expect(link).not.toHaveAttribute('target');

    expect(click('Textile')).toBe(true);
    expect(push).toHaveBeenCalledWith('/teams/t-1?tab=about');
  });

  it('a web ref keeps the browser default: a new tab, no router.push', () => {
    renderTurn([{ type: 'web', title: 'Acme', externalUrl: 'https://example.com/acme' }]);
    // D8 can change the title of a web ref, so the test finds the link by its href.
    const link = document.querySelector<HTMLAnchorElement>('a[href="https://example.com/acme"]') as HTMLAnchorElement;
    expect(link).toHaveAttribute('target', '_blank');

    expect(fireEvent.click(link, { button: 0 })).toBe(true);
    expect(push).not.toHaveBeenCalled();
  });

  it('a /home?news= link becomes /?news=, so it skips the 308 redirect', () => {
    renderTurn([
      { type: 'news', title: 'A story', directoryLink: '/home?news=n-1' },
      { type: 'news', title: 'Another story', externalUrl: `${window.location.origin}/home?news=n-2#top` },
    ]);
    expect(screen.getByText('A story').closest('a')).toHaveAttribute('href', '/?news=n-1');
    expect(screen.getByText('Another story').closest('a')).toHaveAttribute('href', '/?news=n-2#top');
    expect(click('A story')).toBe(true);
    expect(push).toHaveBeenCalledWith('/?news=n-1');

    expect(homeToRoot('/home')).toBe('/');
    expect(homeToRoot('/home/')).toBe('/');
    expect(homeToRoot('/home#x')).toBe('/#x');
    expect(homeToRoot('/homepage?x=1')).toBe('/homepage?x=1');
    expect(homeToRoot('/home/news')).toBe('/home/news');
    expect(homeToRoot('/teams/home?x=1')).toBe('/teams/home?x=1');
  });

  it('Ctrl, Cmd or Shift click on a LabOS ref keeps the browser default', () => {
    renderTurn([{ type: 'news', title: 'A story', directoryLink: '/?news=n-1' }]);
    expect(click('A story', { ctrlKey: true })).toBe(false);
    expect(click('A story', { metaKey: true })).toBe(false);
    expect(click('A story', { shiftKey: true })).toBe(false);
    expect(push).not.toHaveBeenCalled();
    expect(onSourceClick).toHaveBeenCalledTimes(3);
  });

  it('ownOriginPath and sourceRefLink: only the app origin becomes a path', () => {
    const origin = window.location.origin;
    expect(ownOriginPath(`${origin}/?news=n-1#top`)).toBe('/?news=n-1#top');
    expect(ownOriginPath('https://other.example/?news=n-1')).toBeNull();
    expect(ownOriginPath('/?news=n-1')).toBeNull();
    expect(sourceRefLink({ type: 'news', title: 'S', directoryLink: `${origin}/?news=n-2` })).toEqual({
      href: '/?news=n-2',
      external: false,
    });
  });
});
