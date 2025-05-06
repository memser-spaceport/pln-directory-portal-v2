import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HuskyLink from '@/components/core/navbar/husky-link';
import { useRouter, usePathname } from 'next/navigation';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';

// Mock dependencies
jest.mock('next/navigation', () => ({ useRouter: jest.fn(), usePathname: jest.fn() }));
jest.mock('@/analytics/husky.analytics', () => ({ useHuskyAnalytics: jest.fn() }));
jest.mock('@/utils/common.utils', () => ({ triggerLoader: jest.fn() }));

const mockPush = jest.fn();
const mockTrackPageClicked = jest.fn();
const mockTriggerLoader = require('@/utils/common.utils').triggerLoader;

describe('HuskyLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue('/');
    (useHuskyAnalytics as jest.Mock).mockReturnValue({ trackPageClicked: mockTrackPageClicked });
  });

  it('renders the husky button and image', () => {
    render(<HuskyLink />);
    expect(screen.getByRole('button', { name: /chat with husky assistant/i })).toBeInTheDocument();
    expect(screen.getByAltText('husky')).toBeInTheDocument();
  });

  it('navigates to husky page and tracks analytics if not already there', () => {
    (usePathname as jest.Mock).mockReturnValue('/not-husky');
    render(<HuskyLink />);
    const btn = screen.getByRole('button', { name: /chat with husky assistant/i });
    fireEvent.click(btn);
    expect(mockTriggerLoader).toHaveBeenCalledWith(true);
    expect(mockPush).toHaveBeenCalledWith('/husky/chat');
    expect(mockTrackPageClicked).toHaveBeenCalled();
  });

  it('navigates to husky page and tracks analytics if already there (no loader)', () => {
    (usePathname as jest.Mock).mockReturnValue('/husky/chat');
    render(<HuskyLink />);
    const btn = screen.getByRole('button', { name: /chat with husky assistant/i });
    fireEvent.click(btn);
    expect(mockTriggerLoader).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/husky/chat');
    expect(mockTrackPageClicked).toHaveBeenCalled();
  });

  it('prevents default and stops propagation on click', () => {
    render(<HuskyLink />);
    const btn = screen.getByRole('button', { name: /chat with husky assistant/i });

    const preventDefaultSpy = jest.spyOn(window.Event.prototype, 'preventDefault');
    const stopPropagationSpy = jest.spyOn(window.Event.prototype, 'stopPropagation');

    fireEvent.click(btn);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();

    preventDefaultSpy.mockRestore();
    stopPropagationSpy.mockRestore();
  });
}); 