import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as commonUtils from '@/utils/common.utils';
import { EVENTS } from '@/utils/constants';
import { ITeamFilterSelectedItems, ITeamsSearchParams } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';

// Keep track of filter props for testing
const filterProps: any[] = [];

// Mock styled-jsx
jest.mock('styled-jsx/style', () => jest.fn());

// Mock components and hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
}));

// Mock triggerLoader utility
jest.mock('@/utils/common.utils', () => ({
  triggerLoader: jest.fn(),
}));

// Mock the Filter component
jest.mock('@/components/page/teams/filter', () => {
  const FilterMock = (props: any) => {
    // Store the props for assertions
    filterProps.push(props);
    return <div data-testid="filter-component">Filter Component</div>;
  };
  return FilterMock;
});

// Import the components after mocking
import FilterWrapper from '@/components/page/teams/filter-wrapper';

describe('FilterWrapper Component', () => {
  const mockFilterValues: ITeamFilterSelectedItems = {
    tags: [{ selected: true, value: 'AI', disabled: false }],
    membershipSources: [{ selected: true, value: 'Internal', disabled: false }],
    fundingStage: [{ selected: true, value: 'Seed', disabled: false }],
    technology: [{ selected: true, value: 'React', disabled: false }],
    focusAreas: [],
    asks: [{ selected: true, value: 'Hiring', disabled: false }]
  };

  const mockUserInfo: IUserInfo = {
    name: 'Test User',
    email: 'test@example.com',
    uid: 'user123',
    roles: ['user'],
    leadingTeams: [],
    profileImageUrl: '',
    isFirstTimeLogin: false
  };

  const mockSearchParams: ITeamsSearchParams = {
    tags: 'AI',
    membershipSources: 'Internal',
    fundingStage: 'Seed',
    technology: 'React',
    includeFriends: 'true',
    officeHoursOnly: 'false',
    focusAreas: '',
    isRecent: 'false',
    isHost: 'false',
    page: '1',
    viewType: 'grid',
    sort: 'name',
    searchBy: ''
  };

  const mockProps = {
    filterValues: mockFilterValues,
    userInfo: mockUserInfo,
    searchParams: mockSearchParams
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the props array
    filterProps.length = 0;
  });

  test('renders the web filter by default', () => {
    render(<FilterWrapper {...mockProps} />);
    
    // Check filter is rendered
    const filterComponents = screen.getAllByTestId('filter-component');
    expect(filterComponents).toHaveLength(1); // Only web version is visible by default
  });

  test('displays mobile filter when SHOW_FILTER event is triggered', () => {
    render(<FilterWrapper {...mockProps} />);
    
    // Initially there's only one filter component
    expect(screen.getAllByTestId('filter-component')).toHaveLength(1);
    
    // Simulate filter show event
    act(() => {
      const event = new CustomEvent(EVENTS.SHOW_FILTER, { detail: true });
      document.dispatchEvent(event);
    });
    
    // Now we should see both filters
    const filterComponents = screen.getAllByTestId('filter-component');
    expect(filterComponents).toHaveLength(2);
  });

  test('calls triggerLoader with false on initial render', () => {
    render(<FilterWrapper {...mockProps} />);
    
    expect(commonUtils.triggerLoader).toHaveBeenCalledWith(false);
  });

  test('passes props correctly to Filter components', () => {
    render(<FilterWrapper {...mockProps} />);
    
    // Check if we have at least one filter component rendered with props
    expect(filterProps.length).toBeGreaterThan(0);
    
    // Verify the first filter received the correct props
    expect(filterProps[0]).toEqual(
      expect.objectContaining({
        filterValues: mockFilterValues,
        searchParams: mockSearchParams,
        userInfo: mockUserInfo,
      })
    );
  });

  test('cleans up event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    const { unmount } = render(<FilterWrapper {...mockProps} />);
    
    // Unmount the component
    unmount();
    
    // Check that the event listener was removed
    expect(removeEventListenerSpy).toHaveBeenCalled();
    
    removeEventListenerSpy.mockRestore();
  });

  test('handles undefined filterValues gracefully', () => {
    const customProps = {
      filterValues: undefined,
      userInfo: mockUserInfo,
      searchParams: mockSearchParams
    };
    
    render(<FilterWrapper {...customProps} />);
    
    // Component should still render without errors
    expect(screen.getAllByTestId('filter-component')).toHaveLength(1);
    
    // Check the filter received undefined filterValues
    expect(filterProps[0].filterValues).toBeUndefined();
  });

  test('triggerLoader is called when searchParams change', () => {
    const { rerender } = render(<FilterWrapper {...mockProps} />);
    
    // Clear the initial call
    jest.clearAllMocks();
    filterProps.length = 0;
    
    // Rerender with new search params
    const updatedSearchParams = {
      ...mockSearchParams,
      page: '2'
    };
    
    rerender(
      <FilterWrapper
        filterValues={mockFilterValues}
        userInfo={mockUserInfo}
        searchParams={updatedSearchParams}
      />
    );
    
    // Should call triggerLoader again
    expect(commonUtils.triggerLoader).toHaveBeenCalledWith(false);
    
    // Check that the filter received the updated searchParams
    expect(filterProps[0].searchParams).toEqual(updatedSearchParams);
  });
});
