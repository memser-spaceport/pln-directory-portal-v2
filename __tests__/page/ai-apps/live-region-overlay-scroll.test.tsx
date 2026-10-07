import { act, render, screen } from '@testing-library/react';
import { createRef } from 'react';

import { LiveRegionOverlay } from '@/components/page/ai-apps/components/screenshot-feedback/LiveRegionOverlay';

/**
 * Pick a part's layer sits over the app's (cross-origin) frame, so a wheel never
 * reaches the app on its own (LAB-2793): the layer hands it to the bridge. jsdom
 * can't scroll a frame; what's checked here is what the layer sends.
 */

const FRAME = { left: 100, top: 50, width: 800, height: 600 };

let frames: FrameRequestCallback[] = [];
const runFrame = () =>
  act(() => {
    const due = frames;
    frames = [];
    due.forEach((cb) => cb(0));
  });

function setup(scrollApp?: jest.Mock) {
  const frame = document.createElement('iframe');
  frame.getBoundingClientRect = () =>
    ({ ...FRAME, x: FRAME.left, y: FRAME.top, right: 0, bottom: 0, toJSON: () => ({}) }) as DOMRect;
  document.body.appendChild(frame);
  const frameRef = createRef<HTMLIFrameElement>() as { current: HTMLIFrameElement | null };
  frameRef.current = frame;
  const utils = render(
    <LiveRegionOverlay frameRef={frameRef} onSelect={jest.fn()} onCancel={jest.fn()} scrollApp={scrollApp} />,
  );
  return { ...utils, layer: screen.getByTestId('live-region-overlay'), frame };
}

const wheel = (el: Element, init: WheelEventInit) => {
  const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(event);
  return event;
};

beforeEach(() => {
  frames = [];
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => frames.push(cb));
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('LiveRegionOverlay: the wheel scrolls the app underneath', () => {
  it('sends one scroll a frame, with the deltas summed, at the pointer in the frame’s own coordinates', () => {
    const scrollApp = jest.fn();
    const { layer } = setup(scrollApp);

    const first = wheel(layer, { clientX: 300, clientY: 200, deltaY: 40 });
    wheel(layer, { clientX: 310, clientY: 210, deltaY: 60, deltaX: 5 });
    expect(scrollApp).not.toHaveBeenCalled();
    /* LabOS itself must not scroll or zoom. */
    expect(first.defaultPrevented).toBe(true);

    runFrame();
    expect(scrollApp).toHaveBeenCalledTimes(1);
    expect(scrollApp).toHaveBeenCalledWith(210, 160, 5, 100);

    runFrame();
    expect(scrollApp).toHaveBeenCalledTimes(1);
  });

  it('converts a wheel in lines to px, and keeps a wheel over the dimmed LabOS around the frame at its edge', () => {
    const scrollApp = jest.fn();
    const { layer } = setup(scrollApp);

    wheel(layer, { clientX: 20, clientY: 900, deltaY: 3, deltaMode: WheelEvent.DOM_DELTA_LINE });
    runFrame();

    expect(scrollApp).toHaveBeenCalledWith(0, FRAME.height, 0, 48);
  });

  it('swallows a pinch (Ctrl+wheel) without scrolling the app', () => {
    const scrollApp = jest.fn();
    const { layer } = setup(scrollApp);

    const pinch = wheel(layer, { clientX: 300, clientY: 200, deltaY: 10, ctrlKey: true });
    runFrame();

    expect(pinch.defaultPrevented).toBe(true);
    expect(scrollApp).not.toHaveBeenCalled();
  });

  it('does nothing with the wheel when the app’s bridge can’t scroll', () => {
    const { layer } = setup(undefined);

    const event = wheel(layer, { clientX: 300, clientY: 200, deltaY: 10 });

    expect(event.defaultPrevented).toBe(true);
    expect(frames).toHaveLength(0);
  });

  it('drops a scroll still waiting for its frame when the layer closes', () => {
    const scrollApp = jest.fn();
    const { layer, unmount } = setup(scrollApp);

    wheel(layer, { clientX: 300, clientY: 200, deltaY: 10 });
    unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
});
