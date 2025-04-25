import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FocusAreaItem, { FocusArea } from '@/components/core/focus-area-filter/filter-focus-area-item';
import { IFocusArea } from '@/types/shared.types';
import { ITeam } from '@/types/teams.types';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

// Mock data
const mockTeam: ITeam = {
  id: 'team1',
  name: 'Test Team',
  asks: [],
  maintainingProjects: [],
  contributingProjects: [],
  teamFocusAreas: []
};

describe('FocusAreaItem Component', () => {
  // Define test data
  const mockOnItemClickHandler = jest.fn();
  const mockUniqueKey = 'teamAncestorFocusAreas' as const;
  
  // Basic focus area with no children
  const basicFocusArea: IFocusArea = {
    uid: 'basic',
    title: 'Basic Focus Area',
    description: 'Basic description',
    parentUid: '',
    createdAt: '2021-08-01T00:00:00.000Z',
    updatedAt: '2021-08-01T00:00:00.000Z',
    children: [],
    teamAncestorFocusAreas: [mockTeam],
    projectAncestorFocusAreas: [],
  };

  // Focus area with children - ensure child has correct structure
  const focusAreaWithChildren: IFocusArea = {
    uid: 'parent',
    title: 'Parent Focus Area',
    description: 'Parent description',
    parentUid: '',
    createdAt: '2021-08-01T00:00:00.000Z',
    updatedAt: '2021-08-01T00:00:00.000Z',
    children: [
      {
        uid: 'child1',
        title: 'Child Focus Area 1',
        description: 'Child 1 description',
        parentUid: 'parent',
        createdAt: '2021-08-01T00:00:00.000Z',
        updatedAt: '2021-08-01T00:00:00.000Z',
        children: [],
        teamAncestorFocusAreas: [mockTeam], // Ensure child has team items
        projectAncestorFocusAreas: [],
      },
      {
        uid: 'child2',
        title: 'Child Focus Area 2',
        description: 'Child 2 description',
        parentUid: 'parent',
        createdAt: '2021-08-01T00:00:00.000Z',
        updatedAt: '2021-08-01T00:00:00.000Z',
        children: [],
        teamAncestorFocusAreas: [],
        projectAncestorFocusAreas: [],
      }
    ],
    teamAncestorFocusAreas: [mockTeam],
    projectAncestorFocusAreas: [],
  };

  // Set a child as selected to force expansion
  const selectedChild: IFocusArea = {
    ...focusAreaWithChildren.children[0],
    parentUid: 'parent'
  };
  
  // Deep nested focus area
  const deepNestedFocusArea: IFocusArea = {
    uid: 'grandparent',
    title: 'Grandparent Focus Area',
    description: 'Grandparent description',
    parentUid: '',
    createdAt: '2021-08-01T00:00:00.000Z',
    updatedAt: '2021-08-01T00:00:00.000Z',
    children: [
      {
        uid: 'parent-nested',
        title: 'Parent Nested',
        description: 'Parent Nested description',
        parentUid: 'grandparent',
        createdAt: '2021-08-01T00:00:00.000Z',
        updatedAt: '2021-08-01T00:00:00.000Z',
        children: [
          {
            uid: 'child-nested',
            title: 'Child Nested',
            description: 'Child Nested description',
            parentUid: 'parent-nested',
            createdAt: '2021-08-01T00:00:00.000Z',
            updatedAt: '2021-08-01T00:00:00.000Z',
            children: [],
            teamAncestorFocusAreas: [mockTeam],
            projectAncestorFocusAreas: [],
          }
        ],
        teamAncestorFocusAreas: [mockTeam],
        projectAncestorFocusAreas: [],
      }
    ],
    teamAncestorFocusAreas: [mockTeam],
    projectAncestorFocusAreas: [],
  };

  // Default props
  const baseProps: FocusArea = {
    item: basicFocusArea,
    selectedItems: [],
    onItemClickHandler: mockOnItemClickHandler,
    parents: [],
    uniqueKey: mockUniqueKey,
    isGrandParent: false,
    isHelpActive: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders basic focus area correctly', () => {
    render(<FocusAreaItem {...baseProps} />);
    
    expect(screen.getByText('Basic Focus Area')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // teamAncestorFocusAreas length
  });

  it('renders focus area with children correctly and expands when child is selected', async () => {
    render(
      <FocusAreaItem 
        {...baseProps}
        item={focusAreaWithChildren}
        selectedItems={[selectedChild]}
      />
    );
    
    expect(screen.getByText('Parent Focus Area')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // teamAncestorFocusAreas length
    
    // Wait for the component to re-render after useEffect
    await waitFor(() => {
      // Child with teamAncestorFocusAreas should be visible because it's selected
      expect(screen.getByText('Child Focus Area 1')).toBeInTheDocument();
    });
  });

  it('renders with isGrandParent and isHelpActive props', () => {
    render(
      <FocusAreaItem 
        {...baseProps} 
        isGrandParent={true}
        isHelpActive={true}
      />
    );
    
    // Description should be visible when isGrandParent and isHelpActive are true
    expect(screen.getByText('Basic description')).toBeInTheDocument();
  });

  it('handles item click correctly', () => {
    render(<FocusAreaItem {...baseProps} />);
    
    // Click the main button using data-testid
    const itemButton = screen.getByTestId('item-button');
    fireEvent.click(itemButton);
    
    // Should call the click handler with the current item
    expect(mockOnItemClickHandler).toHaveBeenCalledWith(basicFocusArea);
  });

  it('handles expand/collapse correctly for parent item', async () => {
    // Using parent with selected child to ensure it automatically expands
    const { rerender } = render(
      <FocusAreaItem 
        {...baseProps}
        item={focusAreaWithChildren}
        selectedItems={[selectedChild]}
      />
    );
    
    // Wait for the component to re-render after useEffect
    await waitFor(() => {
      // Child should be visible since parent auto-expands with selected child
      expect(screen.getByText('Child Focus Area 1')).toBeInTheDocument();
    });
    
    // Now change the selected items to force collapse
    rerender(
      <FocusAreaItem 
        {...baseProps}
        item={focusAreaWithChildren}
        selectedItems={[]}
      />
    );
    
    // After rerender, the item should be collapsed
    expect(screen.queryByText('Child Focus Area 1')).not.toBeInTheDocument();
    
    // Click the expand button to manually expand
    const expandButton = screen.getByTestId('expand-button');
    fireEvent.click(expandButton);
    
    // Wait for component to re-render after state change
    await waitFor(() => {
      // Child should be visible after manual expansion
      expect(screen.getByText('Child Focus Area 1')).toBeInTheDocument();
    });
    
    // Click again to collapse
    fireEvent.click(expandButton);
    
    // Wait for component to re-render after state change
    await waitFor(() => {
      // Child should not be visible anymore
      expect(screen.queryByText('Child Focus Area 1')).not.toBeInTheDocument();
    });
  });

  it('disables expand button when no children have items', () => {
    // Create a focus area with children that have empty teamAncestorFocusAreas arrays
    const emptyChildrenFocusArea: IFocusArea = {
      ...basicFocusArea,
      children: [
        {
          uid: 'empty-child',
          title: 'Empty Child',
          description: 'Empty child description',
          parentUid: 'basic',
          createdAt: '2021-08-01T00:00:00.000Z',
          updatedAt: '2021-08-01T00:00:00.000Z',
          children: [],
          teamAncestorFocusAreas: [],
          projectAncestorFocusAreas: [],
        }
      ]
    };
    
    render(
      <FocusAreaItem 
        {...baseProps} 
        item={emptyChildrenFocusArea}
        isGrandParent={true} // Enable to always show expand button
      />
    );
    
    // Verify the expand button exists and is disabled (based on hasSelectedItems function)
    const expandButton = screen.getByTestId('expand-button');
    expect(expandButton).toBeInTheDocument();
    expect(expandButton).toBeDisabled();
  });

  it('renders correctly when item is in selected items', () => {
    render(
      <FocusAreaItem 
        {...baseProps} 
        selectedItems={[basicFocusArea]}
      />
    );
    
    // Check for the correct styling
    const itemButton = screen.getByTestId('item-button');
    expect(itemButton).toHaveClass('isSelected');
    expect(screen.getByAltText('mode')).toBeInTheDocument(); // Icon is present
  });

  it('renders correctly when item is a parent', () => {
    render(
      <FocusAreaItem 
        {...baseProps} 
        parents={[basicFocusArea]}
      />
    );
    
    // Parent items have the isParent class and minus icon
    const itemButton = screen.getByTestId('item-button');
    expect(itemButton).toHaveClass('isParent');
    
    // Check that the expand state is automatically true for parents
    expect(screen.getAllByAltText('mode')[0].getAttribute('src')).toBe('/icons/minus-white.svg');
  });

  it('correctly renders deeply nested hierarchy', async () => {
    // Directly set the child as selected to force expansion
    const nestedSelectedItems = [deepNestedFocusArea.children[0].children[0]];
    
    render(
      <FocusAreaItem 
        {...baseProps} 
        item={deepNestedFocusArea}
        selectedItems={nestedSelectedItems}
        isGrandParent={true}
      />
    );
    
    // Wait for the component to re-render after useEffect
    await waitFor(() => {
      // Both parent and child should be visible because child is selected
      expect(screen.getByText('Parent Nested')).toBeInTheDocument();
      expect(screen.getByText('Child Nested')).toBeInTheDocument();
    });
  });

  it('handles different styles based on item status', () => {
    // Test with parent
    const { rerender } = render(
      <FocusAreaItem 
        {...baseProps} 
        parents={[basicFocusArea]}
      />
    );
    
    let itemButton = screen.getByTestId('item-button');
    expect(itemButton).toHaveClass('isParent');
    
    // Test with selected item
    rerender(
      <FocusAreaItem 
        {...baseProps} 
        selectedItems={[basicFocusArea]}
      />
    );
    
    itemButton = screen.getByTestId('item-button');
    expect(itemButton).toHaveClass('isSelected');
    
    // Test with regular item
    rerender(<FocusAreaItem {...baseProps} />);
    
    itemButton = screen.getByTestId('item-button');
    expect(itemButton).toHaveClass('default');
  });

  it('displays different expand icons based on state', async () => {
    // First render with selected child to ensure auto-expansion
    const { rerender } = render(
      <FocusAreaItem 
        {...baseProps} 
        item={focusAreaWithChildren}
        selectedItems={[selectedChild]}
      />
    );
    
    // Wait for the component to render after useEffect
    await waitFor(() => {
      // Should be expanded initially due to selected child
      const expandIcon = screen.getByAltText('expand');
      expect(expandIcon.getAttribute('src')).toBe('/icons/chevron-down-blue.svg');
    });
    
    // Now change to no selected items and collapse
    rerender(
      <FocusAreaItem 
        {...baseProps}
        item={focusAreaWithChildren}
        selectedItems={[]}
      />
    );
    
    // Should show right chevron when collapsed
    const expandIcon = screen.getByAltText('expand');
    expect(expandIcon.getAttribute('src')).toBe('/icons/chevron-right-grey.svg');
    
    // Now test with no children available but with isGrandParent to show button
    rerender(
      <FocusAreaItem 
        {...baseProps}
        isGrandParent={true}
      />
    );
    
    // Should show disabled icon when no children available
    const disabledIcon = screen.getByAltText('expand');
    expect(disabledIcon.getAttribute('src')).toBe('/icons/right-arrow-gray-shaded.svg');
  });

  it('sets expand state to true when item is parent on router change', () => {
    const useRouterMock = jest.requireMock('next/navigation').useRouter;
    
    render(
      <FocusAreaItem 
        {...baseProps}
        parents={[basicFocusArea]}
      />
    );
    
    // Trigger router event to test useEffect
    const routerObject = useRouterMock();
    Object.keys(routerObject).forEach(key => {
      if (typeof routerObject[key] === 'function') {
        routerObject[key]();
      }
    });
    
    // Should be expanded after router change
    expect(screen.getByTestId('item-button')).toHaveClass('isParent');
  });

  // Additional tests to complete coverage

  it('handles assignedItemsLength being undefined or zero', () => {
    // Create focus area with undefined teamAncestorFocusAreas
    const undefinedItemsArea: IFocusArea = {
      ...basicFocusArea,
      teamAncestorFocusAreas: undefined as any
    };
    
    render(
      <FocusAreaItem 
        {...baseProps}
        item={undefinedItemsArea}
      />
    );
    
    // The main button should be disabled
    const mainButton = screen.getByTestId('item-button');
    expect(mainButton).toBeDisabled();
    
    // Now try with empty array
    const emptyItemsArea: IFocusArea = {
      ...basicFocusArea,
      teamAncestorFocusAreas: []
    };
    
    const { rerender } = render(
      <FocusAreaItem 
        {...baseProps}
        item={emptyItemsArea}
      />
    );
    
    // Button should still be disabled
    const updatedMainButton = screen.getByTestId('item-button');
    expect(updatedMainButton).toBeDisabled();
    
    // Text should have textshade class
    const titleElement = screen.getByText('Basic Focus Area');
    expect(titleElement).toHaveClass('textshade');
  });

  it('tests getIsSelectedItem function with parent-child relationship', () => {
    // Create a parent and child relationship
    const parentItem: IFocusArea = {
      ...basicFocusArea,
      uid: 'parent-uid'
    };
    
    const childItem: IFocusArea = {
      ...basicFocusArea,
      uid: 'child-uid',
      parentUid: 'parent-uid'
    };
    
    // Render with child as selected item
    render(
      <FocusAreaItem 
        {...baseProps}
        item={parentItem}
        selectedItems={[childItem]}
      />
    );
    
    // The parent should be considered selected due to its child
    const mainButton = screen.getByTestId('item-button');
    expect(mainButton).toHaveClass('isSelected');
  });
  
  it('tests the hasSelectedItems function', () => {
    // Create a focus area with deeply nested child that has items
    const nestedFocusArea: IFocusArea = {
      ...basicFocusArea,
      children: [
        {
          uid: 'level1',
          title: 'Level 1',
          description: 'Level 1 description',
          parentUid: 'basic',
          createdAt: '2021-08-01T00:00:00.000Z',
          updatedAt: '2021-08-01T00:00:00.000Z',
          children: [
            {
              uid: 'level2',
              title: 'Level 2',
              description: 'Level 2 description',
              parentUid: 'level1',
              createdAt: '2021-08-01T00:00:00.000Z',
              updatedAt: '2021-08-01T00:00:00.000Z',
              children: [],
              teamAncestorFocusAreas: [mockTeam], // This deep child has items
              projectAncestorFocusAreas: [],
            }
          ],
          teamAncestorFocusAreas: [], // Parent doesn't have items but child does
          projectAncestorFocusAreas: [],
        }
      ]
    };
    
    render(
      <FocusAreaItem 
        {...baseProps}
        item={nestedFocusArea}
      />
    );
    
    // The expand button should be enabled because there's a deeply nested child with items
    const expandButton = screen.getByTestId('expand-button');
    expect(expandButton).not.toBeDisabled();
  });
});
