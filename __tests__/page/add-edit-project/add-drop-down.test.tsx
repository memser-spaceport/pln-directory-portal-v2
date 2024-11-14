import { render, screen, fireEvent } from '@testing-library/react';
import { AddDropdown } from '@/components/page/add-edit-project/add-drop-down';
import '@testing-library/jest-dom';
describe('AddDropdown Component', () => {
  const mockOnOpenPopup = jest.fn();

  beforeEach(() => {
    render(<AddDropdown maintainerTeam={false} onOpenPopup={mockOnOpenPopup} />);
  });

  it('renders the Add button', () => {
    const button = screen.getByTestId('add-dropdown-button');
    expect(button).toBeInTheDocument()
  });

  test('toggles dropdown on button click', () => {
    const button = screen.getByTestId('add-dropdown-button');
    fireEvent.click(button);
    expect(screen.getByTestId('dropdown-options')).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(screen.queryByTestId('dropdown-options')).not.toBeInTheDocument();
  });

  it('calls onOpenPopup with correct option when option is clicked', () => {
    const button = screen.getByTestId('add-dropdown-button');
    fireEvent.click(button);
    
    const optionButton = screen.getByTestId('option-maintainer-team');
    fireEvent.click(optionButton);
    expect(mockOnOpenPopup).toHaveBeenCalledWith('MaintainingTeam');
  });

  it('does render Maintainer Team option when maintainerTeam is false', () => {
    const button = screen.getByTestId('add-dropdown-button');
    fireEvent.click(button);
    expect(screen.queryByTestId('option-maintainer-team')).toBeInTheDocument();
  });

  /* 

  

  

  test('closes dropdown when clicking outside', () => {
    const button = screen.getByTestId('add-dropdown-button');
    fireEvent.click(button);
    expect(screen.getByTestId('dropdown-options')).toBeInTheDocument();
    
    // Simulate clicking outside
    fireEvent.mouseDown(document);
    expect(screen.queryByTestId('dropdown-options')).not.toBeInTheDocument();
  }); */
});

