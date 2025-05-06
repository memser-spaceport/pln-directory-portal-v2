import { render, screen, fireEvent } from '@testing-library/react';
import SuggestionDropdown from '../../components/form/suggestion-dropdown';
import '@testing-library/jest-dom';

jest.mock('../../components/form/suggestion-item', () => ({ __esModule: true, default: (props: any) => (
  <div data-testid="suggestion-item" onClick={() => props.onSelect(props.suggestion)}>
    {props.suggestion.name}
  </div>
)}));
jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <img {...props} /> }));

describe('SuggestionDropdown', () => {
  const suggestions = [
    { name: 'Alpha', logoURL: '', group: 'A', uid: '1' },
    { name: 'Beta', logoURL: '', group: 'B', uid: '2' },
  ];
  const baseProps = {
    suggestions,
    onSelect: jest.fn(),
    enableAddMode: jest.fn(),
    setDropdownStatus: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all suggestions', () => {
    render(<SuggestionDropdown {...baseProps} />);
    expect(screen.getAllByTestId('suggestion-item')).toHaveLength(suggestions.length);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders \"No suggestions found\" when suggestions is empty', () => {
    render(<SuggestionDropdown {...baseProps} suggestions={[]} />);
    expect(screen.getByText('No suggestions found')).toBeInTheDocument();
  });

  it('calls onSelect when a suggestion is clicked', () => {
    render(<SuggestionDropdown {...baseProps} />);
    fireEvent.click(screen.getByText('Alpha'));
    expect(baseProps.onSelect).toHaveBeenCalledWith(suggestions[0]);
  });

  it('renders add new section if addNew.enable is true', () => {
    render(<SuggestionDropdown {...baseProps} addNew={{ enable: true }} />);
    expect(screen.getByText('Not able to find yours ?')).toBeInTheDocument();
    expect(screen.getByText('Add yours')).toBeInTheDocument();
  });

  it('renders custom add new title and action string', () => {
    render(<SuggestionDropdown {...baseProps} addNew={{ enable: true, title: 'Custom Title', actionString: 'Custom Action' }} />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Action')).toBeInTheDocument();
  });

  it('renders custom icon if iconURL is provided', () => {
    render(<SuggestionDropdown {...baseProps} addNew={{ enable: true, iconURL: '/custom.svg' }} />);
    expect(screen.getByAltText('add')).toHaveAttribute('src', '/custom.svg');
  });

  it('renders default icon if iconURL is not provided', () => {
    render(<SuggestionDropdown {...baseProps} addNew={{ enable: true }} />);
    expect(screen.getByAltText('add')).toHaveAttribute('src', '/icons/sign-up/share.svg');
  });

  it('calls enableAddMode when add new button is clicked', () => {
    render(<SuggestionDropdown {...baseProps} addNew={{ enable: true }} />);
    fireEvent.click(screen.getByRole('button'));
    expect(baseProps.enableAddMode).toHaveBeenCalled();
  });

  it('calls setDropdownStatus(false) when clicking outside', () => {
    render(<SuggestionDropdown {...baseProps} />);
    fireEvent.mouseDown(document.body);
    expect(baseProps.setDropdownStatus).toHaveBeenCalledWith(false);
  });

  it('handles missing addNew gracefully', () => {
    render(<SuggestionDropdown {...baseProps} addNew={undefined} />);
    expect(screen.queryByText('Not able to find yours ?')).not.toBeInTheDocument();
  });

  it('handles missing callbacks gracefully', () => {
    render(<SuggestionDropdown suggestions={suggestions} onSelect={undefined as any} enableAddMode={undefined as any} setDropdownStatus={undefined as any} />);
  });
});