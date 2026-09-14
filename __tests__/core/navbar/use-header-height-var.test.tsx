import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import { useRef } from 'react';

import { useHeaderHeightVar } from '@/components/core/navbar/components/SiteHeader/useHeaderHeightVar';

/**
 * The search overlay and ~40 other rules position themselves below the site
 * chrome by reading `--app-header-height`. That token was static (56/80px)
 * while `SiteHeader` is a *stack* — conditional bars above the navbar — so with
 * any bar showing every one of them was short by its height, and the overlay
 * slid up under the header.
 */
const VAR = '--app-header-height';
const readVar = () => document.documentElement.style.getPropertyValue(VAR);

let observed: Element | null;
let fireResize: () => void;
let disconnected: boolean;

beforeEach(() => {
  observed = null;
  disconnected = false;
  fireResize = () => {};
  document.documentElement.style.removeProperty(VAR);

  class FakeResizeObserver {
    constructor(cb: () => void) {
      fireResize = cb;
    }
    observe(el: Element) {
      observed = el;
    }
    disconnect() {
      disconnected = true;
    }
    unobserve() {}
  }
  (global as { ResizeObserver?: unknown }).ResizeObserver = FakeResizeObserver;
});

/** A stand-in header of a given height, since jsdom lays nothing out. */
function headerOf(height: number) {
  const el = document.createElement('header');
  el.getBoundingClientRect = () => ({ height }) as DOMRect;
  document.body.appendChild(el);
  return el;
}

const renderWith = (el: HTMLElement | null) =>
  renderHook(() => {
    const ref = useRef<HTMLElement | null>(el);
    useHeaderHeightVar(ref);
  });

describe('useHeaderHeightVar', () => {
  it('publishes the header height on mount', () => {
    renderWith(headerOf(96));

    expect(readVar()).toBe('96px');
  });

  it('watches the element it published, so a bar appearing updates it', () => {
    const el = headerOf(56);
    renderWith(el);
    expect(readVar()).toBe('56px');

    el.getBoundingClientRect = () => ({ height: 96 }) as DOMRect;
    fireResize();

    expect(observed).toBe(el);
    expect(readVar()).toBe('96px');
  });

  it('shrinks again when the bar goes away', () => {
    const el = headerOf(96);
    renderWith(el);

    el.getBoundingClientRect = () => ({ height: 56 }) as DOMRect;
    fireResize();

    // The ratchet this guards: while `.layout__header` read this same token for
    // its own min-height, the measured value could only ever grow.
    expect(readVar()).toBe('56px');
  });

  // A fractional underestimate tucks an overlay under the header; an
  // overestimate is an invisible sub-pixel gap.
  it('rounds a fractional height up, never down', () => {
    renderWith(headerOf(80.25));

    expect(readVar()).toBe('81px');
  });

  /* Bare routes render no header. Removing the inline value lets the
     stylesheet's static default apply again, which is what those routes had
     before any of this; a stale measurement would offset a page with no chrome. */
  it('hands the value back to the stylesheet on unmount', () => {
    const { unmount } = renderWith(headerOf(96));
    expect(readVar()).toBe('96px');

    unmount();

    expect(readVar()).toBe('');
    expect(disconnected).toBe(true);
  });

  it('does nothing without an element to measure', () => {
    renderWith(null);

    expect(readVar()).toBe('');
    expect(observed).toBeNull();
  });

  it('leaves the default alone where ResizeObserver is unavailable', () => {
    (global as { ResizeObserver?: unknown }).ResizeObserver = undefined;

    renderWith(headerOf(96));

    // Publishing a value that could never be updated would be worse than the
    // static default it replaced.
    expect(readVar()).toBe('');
  });
});
