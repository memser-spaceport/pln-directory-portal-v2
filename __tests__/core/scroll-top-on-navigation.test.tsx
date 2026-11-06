import { act, render } from '@testing-library/react';

import { ScrollTopOnNavigation } from '@/components/core/ScrollTopOnNavigation';

/**
 * LAB-3169: `<body>` is the page's scroller (globals.scss gives html and body a fixed 100dvh), and Next's
 * scroll-to-top resets `<html>`, so a link from a scrolled page opened the next page mid-way. This component
 * does Next's reset on the element that actually scrolls.
 */

let mockPathname = '/home';
let mockSearch = '';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

function navigate(rerender: (ui: React.ReactElement) => void, pathname: string, search = '') {
  mockPathname = pathname;
  mockSearch = search;
  rerender(<ScrollTopOnNavigation />);
}

/** jsdom has no Element.scrollTo; this one moves the box, and records how it was asked to. */
const scrollTo = jest.fn(function (this: HTMLElement, options: ScrollToOptions) {
  this.scrollTop = options.top ?? this.scrollTop;
});

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scrollTo });
});

describe('ScrollTopOnNavigation', () => {
  beforeEach(() => {
    scrollTo.mockClear();
    mockPathname = '/home';
    mockSearch = '';
    window.history.replaceState(null, '', '/home');
    document.body.scrollTop = 1200;
  });

  it('leaves the first page where the browser put it', () => {
    render(<ScrollTopOnNavigation />);

    expect(document.body.scrollTop).toBe(1200);
  });

  it('opens a new page at the top, as a focus-area card link should', () => {
    const { rerender } = render(<ScrollTopOnNavigation />);

    navigate(rerender, '/teams', 'focusAreas=Digital+Human+Rights');

    expect(document.body.scrollTop).toBe(0);
  });

  // `<body id="body">` matches globals.scss's `[id] { scroll-behavior: smooth }`. A smooth reset is still running when
  // Next scrolls the incoming skeleton into view, and that scroll wins (the page opened 110px down on the env).
  it('scrolls instantly, past the smooth scrolling body inherits from the [id] rule', () => {
    const { rerender } = render(<ScrollTopOnNavigation />);

    navigate(rerender, '/teams');

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
  });

  it('keeps the place when only the query changes on the same page (filters, ?news= modals)', () => {
    const { rerender } = render(<ScrollTopOnNavigation />);

    navigate(rerender, '/home', 'news=abc');
    navigate(rerender, '/home', 'news=abc&feed=for-you');

    expect(document.body.scrollTop).toBe(1200);
  });

  it('treats ?view= as a different page on the same path (See all news and back)', () => {
    const { rerender } = render(<ScrollTopOnNavigation />);

    navigate(rerender, '/home', 'view=news');
    expect(document.body.scrollTop).toBe(0);

    document.body.scrollTop = 900;
    navigate(rerender, '/home');
    expect(document.body.scrollTop).toBe(0);
  });

  it('leaves Back and Forward alone', () => {
    const { rerender } = render(<ScrollTopOnNavigation />);

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    navigate(rerender, '/teams');
    expect(document.body.scrollTop).toBe(1200);

    // Only that one navigation: the next link click resets again.
    navigate(rerender, '/projects');
    expect(document.body.scrollTop).toBe(0);
  });

  it('leaves a #hash navigation to Next, which scrolls to the target itself', () => {
    const { rerender } = render(<ScrollTopOnNavigation />);

    window.history.replaceState(null, '', '/teams#about');
    navigate(rerender, '/teams');

    expect(document.body.scrollTop).toBe(1200);
  });
});
