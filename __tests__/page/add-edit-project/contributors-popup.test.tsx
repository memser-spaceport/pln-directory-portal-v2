import { render, fireEvent, screen } from '@testing-library/react';
import ContributorsPopup from '@/components/page/add-edit-project/contributors-popup';
import '@testing-library/jest-dom';

describe('ContributorsPopup', () => {
  const defaultProps = {
    selectedContributors: [],
    setSelectedContributors: jest.fn(),
    contributors: [
      { uid: '1', name: 'John Doe', logo: '', teamMemberRoles: [{ role: 'Developer' }] },
      { uid: '2', name: 'Jane Smith', logo: '', teamMemberRoles: [{ role: 'Designer' }] },
    ],
    onClose: jest.fn(),
    from: '',
    setStep: jest.fn(),
    onSkipAndSaveClicked: jest.fn(),
    onSaveClickHandler: jest.fn(),
    getAllContributors: jest.fn(),
    allTeams: [{ teamUid: '1', name: 'Team Alpha' }],
  };
  const mockGetAllContributors = jest.fn();

  it('renders correctly', () => {
    render(<ContributorsPopup {...defaultProps} />);
    
    // Check if the header and buttons are present
    expect(screen.getByText('Select Contributors')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('filters contributors based on search input', () => {
    render(<ContributorsPopup {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    // Check if only filtered contributors are shown
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('checks and unchecks contributors', () => {
    render(<ContributorsPopup {...defaultProps} />);

    const johnCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(johnCheckbox);

    // Expect the checkbox to be checked after click
    expect(johnCheckbox).toBeChecked();

    fireEvent.click(johnCheckbox);

    // Expect the checkbox to be unchecked after second click
    expect(johnCheckbox).not.toBeChecked();
  });

  it('calls onSaveClickHandler when save is clicked', () => {
    render(<ContributorsPopup {...defaultProps} />);

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    // Expect onSaveClickHandler to have been called
    expect(defaultProps.onSaveClickHandler).toHaveBeenCalled();
  });

  it('calls onBackClickHandler when back button is clicked', () => {
    const mockBackClicked = jest.fn();
    render(<ContributorsPopup {...defaultProps} onBackClicked={mockBackClicked} />);

    const backButton = screen.getByRole('button', { name: '' });
    fireEvent.click(backButton);

    // Expect onBackClicked to have been called
    expect(mockBackClicked).toHaveBeenCalled();
  });

  it('shows "Skip & Save" button and triggers onSkipAndSaveClickHandler when clicked', () => {
    render(<ContributorsPopup {...defaultProps} from="" />);

    const skipAndSaveButton = screen.getByText('Skip & Save');
    fireEvent.click(skipAndSaveButton);

    // Expect onSkipAndSaveClicked to be called
    expect(defaultProps.onSkipAndSaveClicked).toHaveBeenCalled();
  });

//   it('filters contributors based on team selection', () => {
//     render(<ContributorsPopup {...defaultProps} />);

//     const teamDropdown = screen.getByPlaceholderText('All Team');
//     fireEvent.change(teamDropdown, { target: { value: 'Team Alpha' } });

//     expect(defaultProps.getAllContributors).toHaveBeenCalledWith('1');
//   });

});
