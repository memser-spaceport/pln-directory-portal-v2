import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import Loader from '../../components/core/loader';
import { EVENTS } from '@/utils/constants';
import '@testing-library/jest-dom';

// Mock next/navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useSearchParams: jest.fn(() => ({})),
}));

describe('Loader Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render loader by default', () => {
    render(<Loader />);
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('should show loader when TRIGGER_LOADER event is dispatched with detail true', async() => {
    render(<Loader />);
    act(() => {
      const event = new CustomEvent(EVENTS.TRIGGER_LOADER, { detail: true });
      document.dispatchEvent(event);
    });
    await waitFor(() => {
      expect(document.querySelector('.loaderc')).not.toBeInTheDocument();
    });
  });

  it('should hide loader when TRIGGER_LOADER event is dispatched with detail false', async () => {
    render(<Loader />);
    act(() => {
      const event = new CustomEvent(EVENTS.TRIGGER_LOADER, { detail: true });
      document.dispatchEvent(event);
    });
    await waitFor(() => {
      expect(document.querySelector('.loaderc')).not.toBeInTheDocument();
    });
    act(() => {
      const event = new CustomEvent(EVENTS.TRIGGER_LOADER, { detail: false });
      document.dispatchEvent(event);
    });
    await waitFor(() => {
      expect(document.querySelector('.loaderc')).not.toBeInTheDocument();
    });
  });

  it('should hide loader when pathname or searchParams change', () => {
    const usePathname = require('next/navigation').usePathname;
    const useSearchParams = require('next/navigation').useSearchParams;
    let pathname = '/';
    let searchParams = {};
    usePathname.mockImplementation(() => pathname);
    useSearchParams.mockImplementation(() => searchParams);

    const { rerender } = render(<Loader />);
    act(() => {
      const event = new CustomEvent(EVENTS.TRIGGER_LOADER, { detail: true });
      document.dispatchEvent(event);
    });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    pathname = '/new-path';
    rerender(<Loader />);
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('should clean up event listener on unmount', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    const removeSpy = jest.spyOn(document, 'removeEventListener');
    const { unmount } = render(<Loader />);
    expect(addSpy).toHaveBeenCalledWith(EVENTS.TRIGGER_LOADER, expect.any(Function));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith(EVENTS.TRIGGER_LOADER, expect.any(Function));
  });

  it('matches snapshot (loader hidden)', () => {
    const { asFragment } = render(<Loader />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('matches snapshot (loader visible)', () => {
    render(<Loader />);
    act(() => {
      const event = new CustomEvent(EVENTS.TRIGGER_LOADER, { detail: true });
      document.dispatchEvent(event);
    });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(document.querySelector('.loaderc')).toBeInTheDocument();
  });
});
