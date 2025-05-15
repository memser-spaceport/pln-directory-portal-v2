import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RolesFilter } from '@/components/page/members/roles-filter';
import { findRoleByName } from '@/services/members.service';
import { useRolesFilter } from '@/hooks/use-roles-filter.hook';
import { useDebounce } from '@/hooks/useDebounce';

// Mocks
jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => ({
    onMemberListFiltersApplied: jest.fn(),
    onMemberRoleFilterSelectAllClicked: jest.fn(),
    onMemberRoleFilterSearchCalled: jest.fn(),
    onMemberRoleFilterSearchError: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-roles-filter.hook', () => ({
  useRolesFilter: jest.fn(),
}));

// Modified useDebounce mock to control when debounce happens
const mockUseDebounce = jest.fn((value) => value);
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: any, delay: number) => mockUseDebounce(value),
}));

jest.mock('@/services/members.service', () => ({
  findRoleByName: jest.fn(),
}));

jest.mock('@/utils/common.utils', () => ({
  getAnalyticsUserInfo: jest.fn(() => ({ id: 'user-id' })),
  getQuery: jest.fn(() => ({})),
  triggerLoader: jest.fn(),
}));

jest.mock('@/utils/member.utils', () => ({
  getMembersOptionsFromQuery: jest.fn(() => ({})),
}));

describe('RolesFilter', () => {
  // Common test props
  const mockRoles = [
    { role: 'Engineer', alias: 'Engineer', count: 5, selected: true, default: true },
    { role: 'Designer', alias: 'Designer', count: 3, selected: false, default: true },
    { role: 'Manager', alias: 'Manager', count: 2, selected: false, default: false },
  ];

  const mockUserInfo = { id: 'user1', name: 'Test User' };
  const mockSearchParams = { query: 'test' };

  const mockToggleRole = jest.fn();
  const mockSelectAllRole = jest.fn();
  const mockUnSelectAllRole = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (useRolesFilter as jest.Mock).mockReturnValue([
      mockRoles,
      mockToggleRole,
      mockSelectAllRole,
      mockUnSelectAllRole
    ]);

    (findRoleByName as jest.Mock).mockResolvedValue([
      { role: 'Project Manager', alias: 'Project Manager', count: 3, selected: false, default: false },
      { role: 'Technical Manager', alias: 'Technical Manager', count: 2, selected: false, default: false },
    ]);

    // Reset useDebounce mock
    mockUseDebounce.mockImplementation((value) => value);
  });

  it('renders without crashing', () => {
    render(<RolesFilter memberRoles={mockRoles} searchParams={mockSearchParams} userInfo={mockUserInfo} />);
    expect(screen.getByText('Roles')).toBeInTheDocument();
  });

  it('displays default roles correctly', () => {
    render(<RolesFilter memberRoles={mockRoles} searchParams={mockSearchParams} userInfo={mockUserInfo} />);
    
    // Default roles should be visible
    expect(screen.getByText('Engineer')).toBeInTheDocument();
    expect(screen.getByText('Designer')).toBeInTheDocument();
    
    // Check that we display the count
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('handles role toggle correctly', () => {
    render(<RolesFilter memberRoles={mockRoles} searchParams={mockSearchParams} userInfo={mockUserInfo} />);
    
    // Find the checkbox for Engineer and click it
    const engineerCheckbox = screen.getByText('Engineer').closest('label')!.querySelector('input');
    fireEvent.click(engineerCheckbox!);
    
    // The toggle function should be called
    expect(mockToggleRole).toHaveBeenCalledWith(mockRoles[0]);
  });

  it('handles search input correctly', async () => {
    render(<RolesFilter memberRoles={mockRoles} searchParams={mockSearchParams} userInfo={mockUserInfo} />);
    
    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search Role [eg. Engineer]') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Manager' } });
    
    // Wait for the search to be processed
    await waitFor(() => {
      expect(findRoleByName).toHaveBeenCalled();
    });
  });

  it('displays search results', async () => {
    render(<RolesFilter memberRoles={mockRoles} searchParams={mockSearchParams} userInfo={mockUserInfo} />);
    
    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search Role [eg. Engineer]') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Manager' } });
    // Manually set the value property to simulate browser behavior
    searchInput.value = 'Manager';
    
    // Ensure the search text is updated
    await waitFor(() => {
      expect(findRoleByName).toHaveBeenCalled();
    });
    
    // Mock the search results after they're loaded
    await waitFor(() => {
      expect(screen.getByText('Project Manager')).toBeInTheDocument();
      expect(screen.getByText('Technical Manager')).toBeInTheDocument();
    });
  });

  it('shows "No roles found" when search has no results', async () => {
    // Override the mock to return empty array
    (findRoleByName as jest.Mock).mockResolvedValue([]);
    
    render(<RolesFilter memberRoles={mockRoles} searchParams={mockSearchParams} userInfo={mockUserInfo} />);
    
    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search Role [eg. Engineer]') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'NonExistentRole' } });
    searchInput.value = 'NonExistentRole';
    
    // Wait for the search to be processed
    await waitFor(() => {
      expect(findRoleByName).toHaveBeenCalled();
    });
    
    // Should show "No roles found" message
    await waitFor(() => {
      expect(screen.getByText('No roles found')).toBeInTheDocument();
    });
  });

  it('clears search when close button is clicked', async () => {
    render(<RolesFilter memberRoles={mockRoles} searchParams={mockSearchParams} userInfo={mockUserInfo} />);
    
    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search Role [eg. Engineer]') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Manager' } });
    searchInput.value = 'Manager';
    
    // Wait for the close button to appear and click it
    await waitFor(() => {
      const closeButton = screen.getByAltText('close');
      fireEvent.click(closeButton);
    });
    
    // The search should be cleared
    expect(searchInput.value).toBe('');
  });

  it('displays "Select All" button when search results exist', async () => {
    render(<RolesFilter memberRoles={mockRoles} searchParams={mockSearchParams} userInfo={mockUserInfo} />);
    
    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search Role [eg. Engineer]') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Manager' } });
    searchInput.value = 'Manager';
    
    // Wait for the search to be processed
    await waitFor(() => {
      expect(findRoleByName).toHaveBeenCalled();
    });
    
    // Should display "Select All" button
    await waitFor(() => {
      expect(screen.getByText('Select All')).toBeInTheDocument();
    });
  });

  it('handles "Select All" button click', async () => {
    // Mock a custom selected role
    const customRoles = [
      ...mockRoles,
      { role: 'Custom Role', alias: 'Custom Role', count: 1, selected: true, default: false },
    ];
    
    (useRolesFilter as jest.Mock).mockReturnValue([
      customRoles,
      mockToggleRole,
      mockSelectAllRole,
      mockUnSelectAllRole
    ]);
    
    render(<RolesFilter memberRoles={customRoles} searchParams={mockSearchParams} userInfo={mockUserInfo} />);
    
    // The "Select All" button should be visible due to custom selected role
    const selectAllButton = screen.getByText('Select All').closest('label')!.querySelector('input');
    fireEvent.click(selectAllButton!);
    
    // The selectAllRole function should be called
    expect(mockSelectAllRole).toHaveBeenCalled();
  });

  it('handles "Select All" button unselect (when all are selected)', async () => {
    // Mock that all custom roles are selected
    const mockFilterRoles = [
      { role: 'Engineer', alias: 'Engineer', count: 5, selected: true, default: true },
      { role: 'Manager', alias: 'Manager', count: 2, selected: true, default: false },
    ];
    
    (useRolesFilter as jest.Mock).mockReturnValue([
      mockFilterRoles,
      mockToggleRole,
      mockSelectAllRole,
      mockUnSelectAllRole
    ]);
    
    (findRoleByName as jest.Mock).mockResolvedValue([]);
    
    render(<RolesFilter memberRoles={mockFilterRoles} searchParams={mockSearchParams} userInfo={mockUserInfo} />);
    
    // The "Select All" checkbox should be checked
    const selectAllButton = screen.getByText('Select All').closest('label')!.querySelector('input');
    expect(selectAllButton).toBeChecked();
    
    // Click to unselect all
    fireEvent.click(selectAllButton!);
    
    // The unSelectAllRole function should be called
    expect(mockUnSelectAllRole).toHaveBeenCalled();
  });

  it('handles error in role search', async () => {
    // Mock an error in findRoleByName
    (findRoleByName as jest.Mock).mockRejectedValue(new Error('Search failed'));
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<RolesFilter memberRoles={mockRoles} searchParams={mockSearchParams} userInfo={mockUserInfo} />);
    
    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search Role [eg. Engineer]') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Manager' } });
    searchInput.value = 'Manager';
    
    // Wait for the error to be handled
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('properly removes event listener on unmount', () => {
    // Spy on document.removeEventListener
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    const { unmount } = render(<RolesFilter memberRoles={mockRoles} searchParams={mockSearchParams} userInfo={mockUserInfo} />);
    
    // Unmount the component
    unmount();
    
    // Check if removeEventListener was called
    expect(removeEventListenerSpy).toHaveBeenCalled();
    
    // Clean up
    removeEventListenerSpy.mockRestore();
  });

  it('clears search text when clearSearchText event is dispatched', () => {
    render(<RolesFilter memberRoles={mockRoles} searchParams={mockSearchParams} userInfo={mockUserInfo} />);
    
    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search Role [eg. Engineer]') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Manager' } });
    searchInput.value = 'Manager';
    
    // Dispatch the clearSearchText event
    act(() => {
      document.dispatchEvent(new Event('clearSearchText'));
    });
    
    // The search should be cleared
    expect(searchInput.value).toBe('');
  });

  it('reacts to memberRoles prop changes', () => {
    // Test the useEffect that depends on filterRoles
    const { rerender } = render(<RolesFilter memberRoles={mockRoles} searchParams={mockSearchParams} userInfo={mockUserInfo} />);
    
    // Create updated roles
    const updatedRoles = [
      { role: 'Engineer', alias: 'Engineer', count: 10, selected: true, default: true }, // Changed count
      { role: 'Designer', alias: 'Designer', count: 3, selected: false, default: true },
      { role: 'Manager', alias: 'Manager', count: 2, selected: false, default: false },
      { role: 'Developer', alias: 'Developer', count: 5, selected: false, default: true }, // New role
    ];
    
    // Update the mock return value
    (useRolesFilter as jest.Mock).mockReturnValue([
      updatedRoles,
      mockToggleRole,
      mockSelectAllRole,
      mockUnSelectAllRole
    ]);
    
    // Re-render with the new props
    rerender(<RolesFilter memberRoles={updatedRoles} searchParams={mockSearchParams} userInfo={mockUserInfo} />);
    
    // Check that the new role is displayed
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // Updated count for Engineer
  });

  it('handles role toggle with alias', () => {
    // Create a role with different alias and role values
    const roleWithAlias = { role: 'sw_engineer', alias: 'Software Engineer', count: 8, selected: false, default: true };
    
    const rolesWithAlias = [...mockRoles, roleWithAlias];
    
    (useRolesFilter as jest.Mock).mockReturnValue([
      rolesWithAlias,
      mockToggleRole,
      mockSelectAllRole,
      mockUnSelectAllRole
    ]);
    
    render(<RolesFilter memberRoles={rolesWithAlias} searchParams={mockSearchParams} userInfo={mockUserInfo} />);
    
    // Find the checkbox for the role with alias
    const aliasCheckbox = screen.getByText('Software Engineer').closest('label')!.querySelector('input');
    fireEvent.click(aliasCheckbox!);
    
    // The toggle function should be called with the correct role
    expect(mockToggleRole).toHaveBeenCalledWith(roleWithAlias);
  });

  it('updates search results when roles change and search is active', async () => {
    // Configure the useDebounce mock to maintain search state
    mockUseDebounce.mockImplementation((value) => value ? 'Manager' : '');
    
    // Render with an initial search value
    const { rerender } = render(<RolesFilter memberRoles={mockRoles} searchParams={mockSearchParams} userInfo={mockUserInfo} />);
    
    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search Role [eg. Engineer]') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Manager' } });
    
    // Wait for the initial search results
    await waitFor(() => {
      expect(findRoleByName).toHaveBeenCalled();
    });
    
    // Clear the mock calls counter
    (findRoleByName as jest.Mock).mockClear();
    
    // Set up mock references to make search text appear to exist for testing
    Object.defineProperty(HTMLInputElement.prototype, 'value', {
      configurable: true,
      get() { return 'Manager'; }
    });
    
    // Update roles - this should trigger the second useEffect that depends on roles
    const updatedRoles = [
      ...mockRoles,
      { role: 'New Role', alias: 'New Role', count: 3, selected: false, default: false }
    ];
    
    (useRolesFilter as jest.Mock).mockReturnValue([
      updatedRoles,
      mockToggleRole,
      mockSelectAllRole,
      mockUnSelectAllRole
    ]);
    
    // Force a rerender with new roles
    act(() => {
      rerender(<RolesFilter memberRoles={updatedRoles} searchParams={mockSearchParams} userInfo={mockUserInfo} />);
    });
    
    // Verify that findRoleByName was called again
    await waitFor(() => {
      expect(findRoleByName).toHaveBeenCalledTimes(1);
    });
    
    // Clean up the prototype modification
    delete (HTMLInputElement.prototype as any).value;
  });
}); 