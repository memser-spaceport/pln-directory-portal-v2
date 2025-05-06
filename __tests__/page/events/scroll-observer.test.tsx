import { render, act } from '@testing-library/react';
import ScrollObserver from '@/components/page/events/scroll-observer';
import React from 'react';

// Helper to create a section with id and optionally data-exclude-from-url
function createSection(id: string, exclude = false) {
  const section = document.createElement('div');
  section.id = id;
  if (exclude) section.setAttribute('data-exclude-from-url', '');
  document.body.appendChild(section);
  return section;
}

describe('ScrollObserver', () => {
  let originalScrollTo: any;
  let originalReplaceState: any;
  let observerDisconnect: jest.Mock;

  beforeEach(() => {
    // Mock scrollTo and history.replaceState
    originalScrollTo = window.scrollTo;
    window.scrollTo = jest.fn();
    originalReplaceState = window.history.replaceState;
    window.history.replaceState = jest.fn();
    // Remove all sections
    document.body.innerHTML = '';
    // Remove hash
    window.location.hash = '';
    // Mock IntersectionObserver
    observerDisconnect = jest.fn();
    (window as any).IntersectionObserver = jest.fn(function (cb, opts) {
      this.observe = jest.fn();
      this.disconnect = observerDisconnect;
    });
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
    window.history.replaceState = originalReplaceState;
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('renders and does not crash', () => {
    expect(() => render(<ScrollObserver />)).not.toThrow();
  });

  it('observes all sections with id on mount', () => {
    createSection('section1');
    createSection('section2');
    render(<ScrollObserver />);
    // IntersectionObserver should be constructed and observe called for each section
    expect((window as any).IntersectionObserver).toHaveBeenCalled();
  });

  it('disconnects observer and removes listeners on unmount', () => {
    const { unmount } = render(<ScrollObserver />);
    unmount();
    expect(observerDisconnect).toHaveBeenCalled();
  });

  it('handles hashchange and scrolls to element', () => {
    createSection('target');
    render(<ScrollObserver />);
    window.location.hash = '#target';
    // Simulate hashchange event
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    // Wait for scrollTo to be called (async)
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('handles load event and scrolls to element if hash exists', () => {
    jest.useFakeTimers();
    createSection('target');
    window.location.hash = '#target';
    render(<ScrollObserver />);
    window.dispatchEvent(new Event('load'));
    jest.advanceTimersByTime(500);
    expect(window.scrollTo).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('does not scroll if element with hash id does not exist', () => {
    render(<ScrollObserver />);
    window.location.hash = '#notfound';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('updates URL hash when section is intersecting and not excluded', () => {
    const section = createSection('section1');
    render(<ScrollObserver />);
    // Simulate intersection callback
    const cb = (window as any).IntersectionObserver.mock.calls[0][0];
    cb([{ isIntersecting: true, target: section }]);
    expect(window.history.replaceState).toHaveBeenCalledWith(null, '', '#section1');
  });

  it('does not update URL hash if section has data-exclude-from-url', () => {
    const section = createSection('section2', true);
    render(<ScrollObserver />);
    const cb = (window as any).IntersectionObserver.mock.calls[0][0];
    cb([{ isIntersecting: true, target: section }]);
    expect(window.history.replaceState).not.toHaveBeenCalled();
  });

  it('does not update URL hash if not intersecting', () => {
    const section = createSection('section3');
    render(<ScrollObserver />);
    const cb = (window as any).IntersectionObserver.mock.calls[0][0];
    cb([{ isIntersecting: false, target: section }]);
    expect(window.history.replaceState).not.toHaveBeenCalled();
  });

  it('removes event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = render(<ScrollObserver />);
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('hashchange', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });

}); 