import React, { useRef } from 'react';
import { act, fireEvent, render } from '@testing-library/react';

import {
  useTeamNewsScrollDepth,
  type TeamNewsScrollDepthCounts,
  type TeamNewsScrollDepthStep,
} from '@/components/page/home/TeamNews/hooks/useTeamNewsScrollDepth';

// jsdom has no layout. Each card is CARD_HEIGHT tall and stacked from the top of
// the page; `scrollY` moves them up, as a real scroll would.
const CARD_HEIGHT = 100;
const VIEWPORT_HEIGHT = 250;
let scrollY = 0;

beforeAll(() => {
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: VIEWPORT_HEIGHT });
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const index = Number(this.dataset.index ?? -1);
    if (index < 0) return { top: 0, bottom: 0, height: 0, left: 0, right: 0, width: 0, x: 0, y: 0 } as DOMRect;
    const top = index * CARD_HEIGHT - scrollY;
    return {
      top,
      bottom: top + CARD_HEIGHT,
      height: CARD_HEIGHT,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: top,
    } as DOMRect;
  });
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
});

afterAll(() => {
  jest.restoreAllMocks();
});

beforeEach(() => {
  scrollY = 0;
});

const Feed = ({
  count,
  keyPrefix = 'all',
  onStep,
}: {
  count: number;
  keyPrefix?: string;
  onStep: (step: TeamNewsScrollDepthStep, counts: TeamNewsScrollDepthCounts) => void;
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  useTeamNewsScrollDepth({ listRef, cardsLoaded: count, onStep });
  return (
    <div ref={listRef} data-news-feed-list>
      {Array.from({ length: count }, (_, i) => (
        <article key={`${keyPrefix}-${i}`} data-index={i} />
      ))}
    </div>
  );
};

const scrollTo = (y: number) => {
  scrollY = y;
  act(() => {
    fireEvent.scroll(document);
  });
};

const steps = (onStep: jest.Mock) => onStep.mock.calls.map(([step]) => step);

describe('useTeamNewsScrollDepth', () => {
  it('fires nothing while fewer than half of the cards are seen', () => {
    const onStep = jest.fn();
    render(<Feed count={10} onStep={onStep} />);
    // Cards 0 and 1 have their bottom edge in the 250px viewport: 2 of 10 seen.
    scrollTo(150); // bottoms 250 / 350 ... -> 4 seen
    expect(onStep).not.toHaveBeenCalled();
  });

  it('fires each of the 50%, 70% and 90% steps when that share of cards is seen', () => {
    const onStep = jest.fn();
    render(<Feed count={10} onStep={onStep} />);

    scrollTo(250); // 5 of 10 seen
    expect(onStep).toHaveBeenLastCalledWith(50, { cardsSeen: 5, cardsLoaded: 10 });

    scrollTo(450); // 7 of 10
    expect(onStep).toHaveBeenLastCalledWith(70, { cardsSeen: 7, cardsLoaded: 10 });

    scrollTo(650); // 9 of 10
    expect(onStep).toHaveBeenLastCalledWith(90, { cardsSeen: 9, cardsLoaded: 10 });

    expect(steps(onStep)).toEqual([50, 70, 90]);
  });

  it('fires every step that one jump passes, once each', () => {
    const onStep = jest.fn();
    render(<Feed count={10} onStep={onStep} />);
    scrollTo(1000);
    expect(steps(onStep)).toEqual([50, 70, 90]);
  });

  it('does not fire a step again after a scroll up and down', () => {
    const onStep = jest.fn();
    render(<Feed count={10} onStep={onStep} />);
    scrollTo(250);
    scrollTo(0);
    scrollTo(250);
    expect(steps(onStep)).toEqual([50]);
  });

  it('keeps cards seen after a scroll back up', () => {
    const onStep = jest.fn();
    render(<Feed count={10} onStep={onStep} />);
    scrollTo(350); // 6 seen -> 50
    scrollTo(0); // only 2 in view now, but 6 stay seen
    scrollTo(450); // 7 seen -> 70
    expect(onStep).toHaveBeenLastCalledWith(70, { cardsSeen: 7, cardsLoaded: 10 });
  });

  it('measures against the larger card count after the feed grows', () => {
    const onStep = jest.fn();
    const { rerender } = render(<Feed count={6} onStep={onStep} />);
    scrollTo(150); // 4 of 6 seen = 67% -> 50
    expect(steps(onStep)).toEqual([50]);

    rerender(<Feed count={12} onStep={onStep} />); // "Show All": 4 of 12 = 33%
    expect(steps(onStep)).toEqual([50]);

    scrollTo(650); // 9 of 12 = 75% -> 70
    expect(onStep).toHaveBeenLastCalledWith(70, { cardsSeen: 9, cardsLoaded: 12 });
    scrollTo(950); // 12 of 12 -> 90
    expect(onStep).toHaveBeenLastCalledWith(90, { cardsSeen: 12, cardsLoaded: 12 });
    expect(steps(onStep)).toEqual([50, 70, 90]);
  });

  it('does not fire higher steps when "Show Less" cuts the feed back', () => {
    const onStep = jest.fn();
    const { rerender } = render(<Feed count={12} onStep={onStep} />);
    scrollTo(450); // 7 of 12 = 58% -> 50

    rerender(<Feed count={6} onStep={onStep} />); // "Show Less": the 6 cards left are all seen
    scrollTo(0);
    scrollTo(450);
    // Depth stays against the 12 cards this list had: 6 of 12 = 50%, already fired.
    expect(steps(onStep)).toEqual([50]);
  });

  it('does not fire a step again after a tab change', () => {
    const onStep = jest.fn();
    const { rerender } = render(<Feed count={6} onStep={onStep} />);
    scrollTo(150); // 4 of 6 = 67% -> 50

    // A tab change remounts every card (new keys); the new list has its own count.
    scrollTo(0);
    rerender(<Feed count={6} keyPrefix="focus-area" onStep={onStep} />);
    scrollTo(0);
    scrollTo(1000); // all 6 new cards scrolled past
    expect(steps(onStep)).toEqual([50, 70, 90]);
  });

  it('does not count cards that were above the viewport when they mounted', () => {
    const onStep = jest.fn();
    const { rerender } = render(<Feed count={10} onStep={onStep} />);
    scrollTo(250); // 5 of 10 -> 50

    // The page is now scrolled further down, then a tab change remounts every
    // card. Cards 0-5 of the new list sit above the viewport and were never seen.
    scrollY = 650;
    rerender(<Feed count={10} keyPrefix="focus-area" onStep={onStep} />);
    scrollTo(660); // only cards 6, 7 and 8 have their bottom edge in view: 30%
    expect(steps(onStep)).toEqual([50]);
  });

  it('counts nothing on mount, before the first scroll', () => {
    const onStep = jest.fn();
    render(<Feed count={2} onStep={onStep} />); // both cards fit in the viewport
    expect(onStep).not.toHaveBeenCalled();
    scrollTo(0);
    expect(steps(onStep)).toEqual([50, 70, 90]);
  });

  it('ignores scrolls inside other elements', () => {
    const onStep = jest.fn();
    render(
      <>
        <div data-testid="rail" />
        <Feed count={10} onStep={onStep} />
      </>,
    );
    scrollY = 1000;
    act(() => {
      fireEvent.scroll(document.querySelector('[data-testid="rail"]') as Element);
    });
    expect(onStep).not.toHaveBeenCalled();
  });

  it('never counts cards that have no layout', () => {
    const onStep = jest.fn();
    const Hidden = () => {
      const listRef = useRef<HTMLDivElement>(null);
      useTeamNewsScrollDepth({ listRef, cardsLoaded: 3, onStep });
      return (
        <div ref={listRef}>
          <article />
          <article />
          <article />
        </div>
      );
    };
    render(<Hidden />);
    scrollTo(1000);
    expect(onStep).not.toHaveBeenCalled();
  });

  it('listens to scroll passively', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    render(<Feed count={3} onStep={jest.fn()} />);
    expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true, capture: true });
    addSpy.mockRestore();
  });
});
