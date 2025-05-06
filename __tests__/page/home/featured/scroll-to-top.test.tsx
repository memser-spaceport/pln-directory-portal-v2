import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScrollToTop from '@/components/page/home/featured/scroll-to-top';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import { getAnalyticsUserInfo } from '@/utils/common.utils';

// Mock dependencies
jest.mock('@/analytics/common.analytics');
jest.mock('@/utils/common.utils');

describe('ScrollToTop', () => {
  const mockUserInfo = { id: 'user1', name: 'Test User' };
  const mockPageName = 'HomePage';
  const mockAnalytics = {
    goToTopBtnClicked: jest.fn(),
  };

  beforeEach(() => {
    (useCommonAnalytics as jest.Mock).mockReturnValue(mockAnalytics);
    (getAnalyticsUserInfo as jest.Mock).mockReturnValue(mockUserInfo);
    jest.clearAllMocks();
  });

  function setupIntersectionObserver(isIntersecting: boolean) {
    // @ts-ignore
    global.IntersectionObserver = class {
      callback: any;
      constructor(callback: any) {
        this.callback = callback;
      }
      observe = jest.fn(() => {
        this.callback([{ isIntersecting }]);
      });
      disconnect = jest.fn();
    };
  }

  function addFeaturedToDOM() {
    // Add a .featured element to the DOM for IntersectionObserver
    const div = document.createElement('div');
    div.className = 'featured';
    document.body.appendChild(div);
    return div;
  }

  afterEach(() => {
    // Clean up .featured element
    const el = document.querySelector('.featured');
    if (el) el.remove();
    // @ts-ignore
    delete global.IntersectionObserver;
  });

  it('does not render the button if .featured is not present', () => {
    setupIntersectionObserver(true);
    render(<ScrollToTop pageName={mockPageName} userInfo={mockUserInfo} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows the button when .featured is intersecting', () => {
    addFeaturedToDOM();
    setupIntersectionObserver(true);
    render(<ScrollToTop pageName={mockPageName} userInfo={mockUserInfo} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('hides the button when .featured is not intersecting', () => {
    addFeaturedToDOM();
    setupIntersectionObserver(false);
    render(<ScrollToTop pageName={mockPageName} userInfo={mockUserInfo} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('calls analytics and scrolls to top when button is clicked', () => {
    addFeaturedToDOM();
    setupIntersectionObserver(true);
    render(<ScrollToTop pageName={mockPageName} userInfo={mockUserInfo} />);
    const button = screen.getByRole('button');

    // Mock scrollTo on body
    const scrollToMock = jest.fn();
    Object.defineProperty(document.body, 'scrollTo', {
      value: scrollToMock,
      writable: true,
    });

    fireEvent.click(button);
    expect(mockAnalytics.goToTopBtnClicked).toHaveBeenCalledWith(mockUserInfo, mockPageName);
    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('does not throw if scrollTo is not available', () => {
    addFeaturedToDOM();
    setupIntersectionObserver(true);
    render(<ScrollToTop pageName={mockPageName} userInfo={mockUserInfo} />);
    const button = screen.getByRole('button');
    // Set scrollTo to a no-op function
    Object.defineProperty(document.body, 'scrollTo', {
      value: () => {},
      writable: true,
    });
    expect(() => fireEvent.click(button)).not.toThrow();
    expect(mockAnalytics.goToTopBtnClicked).toHaveBeenCalled();
  });

  it('button has correct image', () => {
    addFeaturedToDOM();
    setupIntersectionObserver(true);
    render(<ScrollToTop pageName={mockPageName} userInfo={mockUserInfo} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    const img = screen.getByAltText('arrow');
    expect(img).toHaveAttribute('src', '/icons/up-arrow-black.svg');
  });
}); 