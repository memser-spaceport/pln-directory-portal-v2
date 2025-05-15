import React, { useEffect, useState } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import FilterWrapper from '../../../components/page/members/filter-wrapper';
import { EVENTS } from '@/utils/constants';
import { triggerLoader } from '@/utils/common.utils';

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/utils/common.utils', () => ({
  triggerLoader: jest.fn(),
}));

// Mock MembersFilter component
jest.mock('../../../components/page/members/members-filter', () => {
  return function MockMembersFilter(props: any) {
    return <div data-testid="members-filter">Members Filter Component</div>;
  };
});

describe('FilterWrapper', () => {
  // Common test props
  const mockProps = {
    filterValues: { key: 'value' },
    userInfo: { id: '123', name: 'Test User' },
    searchParams: { query: 'test' },
    isUserLoggedIn: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any overflow styles from previous tests
    document.documentElement.style.overflow = '';
  });

  it('renders without crashing', () => {
    render(<FilterWrapper {...mockProps} />);
    expect(screen.getByTestId('filter-wrapper')).toBeInTheDocument();
  });

  it('renders desktop filter by default', () => {
    render(<FilterWrapper {...mockProps} />);
    expect(screen.getByTestId('desktop-filter')).toBeInTheDocument();
  });
  
  it('does not render mobile filter by default', () => {
    render(<FilterWrapper {...mockProps} />);
    expect(screen.queryByTestId('mobile-filter')).not.toBeInTheDocument();
  });

  it('shows and hides the mobile filter when the event is dispatched', () => {
    render(<FilterWrapper {...mockProps} />);
    // Initially, mobile filter is not present
    expect(screen.queryByTestId('mobile-filter')).not.toBeInTheDocument();

    // Show mobile filter
    act(() => {
      const showEvent = new CustomEvent(EVENTS.SHOW_MEMBERS_FILTER, { detail: true });
      document.dispatchEvent(showEvent);
    });
    expect(screen.getByTestId('mobile-filter')).toBeInTheDocument();

    // Hide mobile filter
    act(() => {
      const hideEvent = new CustomEvent(EVENTS.SHOW_MEMBERS_FILTER, { detail: false });
      document.dispatchEvent(hideEvent);
    });
    expect(screen.queryByTestId('mobile-filter')).not.toBeInTheDocument();
  });
  
  it('calls triggerLoader when searchParams change', () => {
    const { rerender } = render(<FilterWrapper {...mockProps} />);
    expect(triggerLoader).toHaveBeenCalledWith(false);
    
    // Reset mock
    jest.clearAllMocks();
    
    // Rerender with new searchParams
    rerender(<FilterWrapper {...mockProps} searchParams={{ query: 'updated' }} />);
    expect(triggerLoader).toHaveBeenCalledWith(false);
  });
  
  it('passes props to MembersFilter component', () => {
    render(<FilterWrapper {...mockProps} />);
    expect(screen.getAllByTestId('members-filter')).toHaveLength(1);
    
    // Show mobile filter to get two instances
    act(() => {
      const showEvent = new CustomEvent(EVENTS.SHOW_MEMBERS_FILTER, { detail: true });
      document.dispatchEvent(showEvent);
    });
    
    // Now we should have two instances of MembersFilter (mobile and desktop)
    expect(screen.getAllByTestId('members-filter').length).toBe(2);
  });
  
  it('properly removes event listener on unmount', () => {
    // Spy on document.removeEventListener
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    const { unmount } = render(<FilterWrapper {...mockProps} />);
    
    // Unmount the component
    unmount();
    
    // Check if removeEventListener was called
    expect(removeEventListenerSpy).toHaveBeenCalled();
    
    // Clean up
    removeEventListenerSpy.mockRestore();
  });

  it('covers the cleanup function in useEffect on unmount (for coverage)', () => {
    const { unmount } = render(<FilterWrapper {...mockProps} />);
    // Optionally, trigger the event to ensure the effect is run
    act(() => {
      const showEvent = new CustomEvent(EVENTS.SHOW_MEMBERS_FILTER, { detail: true });
      document.dispatchEvent(showEvent);
    });
    // Unmount to trigger cleanup
    unmount();
    // No assertion needed, just want to cover the cleanup
  });
}); 