import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';

import { ScrollToTopButton } from '@/components/page/forum/ScrollToTopButton';

const mockDirection = jest.fn<'up' | 'down', []>(() => 'up');
jest.mock('@/components/core/MobileBottomNav', () => ({ useScrollDirection: () => mockDirection() }));

/** jsdom has no Element.scrollTo; this one moves the box and records the call. */
const scrollTo = jest.fn(function (this: HTMLElement, options: ScrollToOptions) {
  this.scrollTop = options.top ?? this.scrollTop;
});
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scrollTo });
});

/** The body is the page's scroller; a scroll event is what the button listens to. */
function scrollBodyTo(top: number) {
  document.body.scrollTop = top;
  fireEvent.scroll(document.body);
}

/** By label, not role: an aria-hidden button has no accessible name to match while it is faded out. */
const button = () => document.querySelector<HTMLButtonElement>('button[aria-label="Back to top"]')!;
const isShown = () => /visible/.test(button().className) && !button().hasAttribute('aria-hidden');

beforeEach(() => {
  jest.clearAllMocks();
  mockDirection.mockReturnValue('up');
  document.body.scrollTop = 0;
  window.innerHeight = 800;
});

describe('ScrollToTopButton, the forum (scrolling-down)', () => {
  it('shows while the reader scrolls down and hides as they scroll up, taking turns with the mobile bar', () => {
    const { rerender } = render(<ScrollToTopButton />);
    expect(isShown()).toBe(false);

    mockDirection.mockReturnValue('down');
    rerender(<ScrollToTopButton />);
    expect(isShown()).toBe(true);
  });
});

describe('ScrollToTopButton, the news page (scrolled), LAB-3164', () => {
  it('stays hidden, and out of the tab order, within the first screen', () => {
    render(<ScrollToTopButton showWhen="scrolled" />);
    scrollBodyTo(600);

    expect(isShown()).toBe(false);
    expect(button()).toHaveAttribute('tabindex', '-1');
  });

  it('shows once the reader is a screen down, and stays while they scroll back up', () => {
    render(<ScrollToTopButton showWhen="scrolled" />);

    scrollBodyTo(5000);
    expect(isShown()).toBe(true);

    // Scrolling up is exactly when it is wanted: the direction hook says "up" and it must not care.
    mockDirection.mockReturnValue('up');
    scrollBodyTo(3000);
    expect(isShown()).toBe(true);

    scrollBodyTo(200);
    expect(isShown()).toBe(false);
  });

  it('takes the reader to the top of the body, and reports the click', () => {
    const onClick = jest.fn();
    render(<ScrollToTopButton showWhen="scrolled" onClick={onClick} />);
    scrollBodyTo(5000);

    fireEvent.click(button());

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(document.body.scrollTop).toBe(0);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
