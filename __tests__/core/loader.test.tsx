import '@testing-library/jest-dom';
import React from 'react';
import { act, render, screen } from '@testing-library/react';

import Loader from '@/components/core/Loader/Loader';
import { MIN_VISIBLE_MS, SAFETY_TIMEOUT_MS, SHOW_DELAY_MS } from '@/components/core/Loader/useLoaderSignal';
import { EVENTS } from '@/utils/constants';

// The global mock in jest.setup.js is `useSearchParams: () => new URLSearchParams()`, which
// returns a NEW object every call. That makes the route-change effect's dep identity change on
// every render, so it re-runs and clears the bar immediately — every "it shows" assertion below
// would fail for a reason that looks nothing like the cause. Hold one stable instance instead.
jest.mock('next/navigation', () => {
  const searchParams = new URLSearchParams();
  return {
    __esModule: true,
    usePathname: () => (globalThis as any).__testPathname ?? '/members',
    useSearchParams: () => searchParams,
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  };
});

const trigger = (detail: boolean) => {
  act(() => {
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_LOADER, { detail }));
  });
};

const advance = (ms: number) => {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
};

const bar = () => screen.queryByRole('status');

describe('Loader', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (globalThis as any).__testPathname = '/members';
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders nothing until something is in flight', () => {
    render(<Loader />);

    expect(bar()).not.toBeInTheDocument();
  });

  it('does not paint until the show delay has elapsed', () => {
    render(<Loader />);
    trigger(true);

    advance(SHOW_DELAY_MS - 1);
    expect(bar()).not.toBeInTheDocument();

    advance(1);
    expect(bar()).toBeInTheDocument();
  });

  it('never paints when the work resolves faster than the show delay', () => {
    render(<Loader />);

    trigger(true);
    advance(SHOW_DELAY_MS - 20);
    trigger(false);
    advance(SHOW_DELAY_MS + MIN_VISIBLE_MS);

    expect(bar()).not.toBeInTheDocument();
  });

  it('holds the bar for the minimum visible duration once painted', () => {
    render(<Loader />);
    trigger(true);
    advance(SHOW_DELAY_MS);
    expect(bar()).toBeInTheDocument();

    trigger(false);
    advance(MIN_VISIBLE_MS - 1);
    expect(bar()).toBeInTheDocument();

    advance(1);
    expect(bar()).not.toBeInTheDocument();
  });

  it('keeps the bar up when a new operation starts during the minimum hold', () => {
    render(<Loader />);
    trigger(true);
    advance(SHOW_DELAY_MS);

    trigger(false);
    advance(MIN_VISIBLE_MS - 50);
    trigger(true);

    advance(MIN_VISIBLE_MS);
    expect(bar()).toBeInTheDocument();
  });

  it('clears a stranded bar after the safety timeout', () => {
    render(<Loader />);
    trigger(true);
    advance(SHOW_DELAY_MS);
    expect(bar()).toBeInTheDocument();

    // No matching triggerLoader(false) ever arrives — e.g. a mutation that threw.
    advance(SAFETY_TIMEOUT_MS);
    advance(MIN_VISIBLE_MS);

    expect(bar()).not.toBeInTheDocument();
  });

  it('re-arms the safety timeout on each new signal instead of stranding the bar', () => {
    render(<Loader />);
    trigger(true);
    advance(SHOW_DELAY_MS);

    // A repeat signal lands just before the backstop would fire. It cancels the pending
    // hide, so it must also push the backstop out — otherwise the bar never clears again.
    advance(SAFETY_TIMEOUT_MS - 100);
    trigger(true);

    advance(200); // past where the original backstop would have hidden it
    expect(bar()).toBeInTheDocument();

    advance(SAFETY_TIMEOUT_MS + MIN_VISIBLE_MS);
    expect(bar()).not.toBeInTheDocument();
  });

  it('clears the bar when navigation completes', () => {
    const { rerender } = render(<Loader />);
    trigger(true);
    advance(SHOW_DELAY_MS);
    expect(bar()).toBeInTheDocument();

    (globalThis as any).__testPathname = '/teams';
    act(() => {
      rerender(<Loader />);
    });
    advance(MIN_VISIBLE_MS);

    expect(bar()).not.toBeInTheDocument();
  });

  it('treats a falsy detail as a stop signal', () => {
    render(<Loader />);
    trigger(true);
    advance(SHOW_DELAY_MS);

    trigger(false);
    advance(MIN_VISIBLE_MS);

    expect(bar()).not.toBeInTheDocument();
  });
});
