import { render, screen, fireEvent } from '@testing-library/react';
import OfficeHoursMultiSelect from '@/components/core/office-hours-rating/office-hours-multi-select';
import '@testing-library/jest-dom';

describe('OfficeHoursMultiSelect Component', () => {
  const mockItems = [
    { id: '1', name: 'option1', displayName: 'Option 1' },
    { id: '2', name: 'option2', displayName: 'Option 2' },
    { id: '3', name: 'option3', displayName: 'Option 3' }
  ];

  const defaultProps = {
    items: mockItems,
    selectedItems: [],
    onItemSelect: jest.fn(),
    displayKey: 'displayName',
    onMultiSelectedClick: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with no selected items', () => {
    render(<OfficeHoursMultiSelect {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Select reason');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('renders correctly with one selected item', () => {
    const selectedItems = ['option1'];
    render(<OfficeHoursMultiSelect {...defaultProps} selectedItems={selectedItems} />);
    
    const input = screen.getByPlaceholderText('Select reason');
    expect(input).toHaveValue('option1');
  });

  it('renders correctly with multiple selected items', () => {
    const selectedItems = ['option1', 'option2'];
    render(<OfficeHoursMultiSelect {...defaultProps} selectedItems={selectedItems} />);
    
    const input = screen.getByPlaceholderText('Select reason');
    expect(input).toHaveValue('Selected (2)');
  });

  it('toggles dropdown on click', () => {
    render(<OfficeHoursMultiSelect {...defaultProps} />);
    
    // Dropdown should be hidden initially
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    
    // Click to open dropdown
    const container = screen.getByPlaceholderText('Select reason').parentElement!;
    fireEvent.click(container);
    
    // Dropdown should be visible
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
    
    // Click again to close dropdown
    fireEvent.click(container);
    
    // Dropdown should be hidden again
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('calls onMultiSelectedClick when container is clicked', () => {
    render(<OfficeHoursMultiSelect {...defaultProps} />);
    
    const container = screen.getByPlaceholderText('Select reason').parentElement!;
    fireEvent.click(container);
    
    expect(defaultProps.onMultiSelectedClick).toHaveBeenCalledTimes(1);
  });

  it('calls onMultiSelectedClick conditionally when defined', () => {
    // Test with onMultiSelectedClick not defined
    const propsWithoutClick = { ...defaultProps, onMultiSelectedClick: undefined };
    const { rerender } = render(<OfficeHoursMultiSelect {...propsWithoutClick} />);
    
    let container = screen.getByPlaceholderText('Select reason').parentElement!;
    fireEvent.click(container);
    
    // Should not cause any errors when handler is undefined
    
    // Test with onMultiSelectedClick defined
    rerender(<OfficeHoursMultiSelect {...defaultProps} />);
    container = screen.getByPlaceholderText('Select reason').parentElement!;
    fireEvent.click(container);
    
    expect(defaultProps.onMultiSelectedClick).toHaveBeenCalledTimes(1);
  });

  it('selects an item when clicked', () => {
    render(<OfficeHoursMultiSelect {...defaultProps} />);
    
    // Open dropdown
    const container = screen.getByPlaceholderText('Select reason').parentElement!;
    fireEvent.click(container);
    
    // Click on an option
    fireEvent.click(screen.getByText('Option 1'));
    
    // Should call onItemSelect with the correct item
    expect(defaultProps.onItemSelect).toHaveBeenCalledWith(mockItems[0]);
    
    // Dropdown should close after selection
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('renders selected items with checkboxes', () => {
    const selectedItems = ['option1', 'option2'];
    render(<OfficeHoursMultiSelect {...defaultProps} selectedItems={selectedItems} />);
    
    // Open dropdown
    const container = screen.getByPlaceholderText('Select reason').parentElement!;
    fireEvent.click(container);
    
    // Check that the correct items are marked as selected
    const selectedCheckboxes = screen.getAllByRole('img', { name: '' });
    
    // We should have two selected items (excluding the dropdown arrow image)
    expect(selectedCheckboxes.length).toBe(2);
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside-element">Outside Element</div>
        <OfficeHoursMultiSelect {...defaultProps} />
      </div>
    );
    
    // Open dropdown
    const container = screen.getByPlaceholderText('Select reason').parentElement!;
    fireEvent.click(container);
    
    // Dropdown should be visible
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    
    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside-element'));
    
    // Dropdown should be hidden
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('renders with custom display key', () => {
    const customProps = {
      ...defaultProps,
      displayKey: 'id'
    };
    
    render(<OfficeHoursMultiSelect {...customProps} />);
    
    // Open dropdown
    const container = screen.getByPlaceholderText('Select reason').parentElement!;
    fireEvent.click(container);
    
    // Should display using id instead of displayName
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('handles side parameter if provided', () => {
    const propsWithSide = {
      ...defaultProps,
      side: 'right'
    };
    
    render(<OfficeHoursMultiSelect {...propsWithSide} />);
    
    // This test is just to cover line 75-77
    // The side parameter doesn't visibly change anything in the current implementation
    // but we want to ensure it doesn't cause errors
    
    const container = screen.getByPlaceholderText('Select reason').parentElement!;
    expect(container).toBeInTheDocument();
  });
});
