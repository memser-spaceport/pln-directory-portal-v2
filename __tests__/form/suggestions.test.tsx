import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchWithSuggestions from '../../components/form/suggestions';
import * as signUpService from '../../services/sign-up.service';
import '@testing-library/jest-dom';

jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <img {...props} /> }));
jest.mock('../../components/form/suggestion-dropdown', () => ({ __esModule: true, default: (props: any) => (
  <div data-testid="suggestion-dropdown">
    {props.suggestions.map((s: any) => (
      <div key={s.uid} data-testid="dropdown-suggestion" onClick={() => props.onSelect(s)}>{s.name}</div>
    ))}
    {props.addNew?.enable && <button onClick={props.enableAddMode}>Add New</button>}
  </div>
)}));

const mockSuggestions = [
  { uid: '1', name: 'Alpha', logoURL: '', group: 'A' },
  { uid: '2', name: 'Beta', logoURL: '', group: 'B' },
];

describe('SearchWithSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(signUpService, 'getSuggestions').mockResolvedValue(mockSuggestions);
    jest.spyOn(signUpService, 'formatSuggestions').mockImplementation(s => s);
  });

  it('renders without crashing', () => {
    render(<SearchWithSuggestions id="test-id" name="test-name" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders the label if title is provided', () => {
    render(<SearchWithSuggestions id="test-id" name="test-name" title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders the search input with correct placeholder', () => {
    render(<SearchWithSuggestions id="test-id" name="test-name" placeHolder="Search here" />);
    expect(screen.getByPlaceholderText('Search here')).toBeInTheDocument();
  });

  it('shows suggestions in dropdown when typing more than 2 characters', async () => {
    render(<SearchWithSuggestions id="test-id" name="test-name" />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Alp' } });
    await waitFor(() => expect(screen.getByTestId('suggestion-dropdown')).toBeInTheDocument());
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows "No suggestions found" if no suggestions', async () => {
    jest.spyOn(signUpService, 'getSuggestions').mockResolvedValue([]);
    render(<SearchWithSuggestions id="test-id" name="test-name" />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Zzz' } });
    await waitFor(() => expect(screen.getByTestId('suggestion-dropdown')).toBeInTheDocument());
    expect(screen.queryByTestId('dropdown-suggestion')).not.toBeInTheDocument();
  });

  it('selects a suggestion and closes dropdown', async () => {
    render(<SearchWithSuggestions id="test-id" name="test-name" />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Alp' } });
    await waitFor(() => expect(screen.getByTestId('suggestion-dropdown')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Alpha'));
    expect(screen.queryByTestId('suggestion-dropdown')).not.toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument(); // selected suggestion
  });

  it('enables add mode when add new is clicked', async () => {
    render(<SearchWithSuggestions id="test-id" name="test-name" addNew={{ enable: true }} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Alp' } });
    await waitFor(() => expect(screen.getByTestId('suggestion-dropdown')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Add New'));
    expect(screen.getByPlaceholderText('Enter or paste URL here')).toBeInTheDocument();
  });

  it('shows custom input and icon in add mode', () => {
    render(<SearchWithSuggestions id="test-id" name="test-name" addNew={{ enable: true }} />);
    fireEvent.click(screen.getByText('Add New'));
    expect(screen.getByPlaceholderText('Enter or paste URL here')).toBeInTheDocument();
    expect(screen.getByAltText('add')).toBeInTheDocument();
  });

  it('typing in custom input updates its value', () => {
    render(<SearchWithSuggestions id="test-id" name="test-name" addNew={{ enable: true }} />);
    fireEvent.click(screen.getByText('Add New'));
    const input = screen.getByPlaceholderText('Enter or paste URL here');
    fireEvent.change(input, { target: { value: 'custom value' } });
    expect(input).toHaveValue('custom value');
  });

  it('clicking close in add mode resets input and disables add mode', () => {
    render(<SearchWithSuggestions id="test-id" name="test-name" addNew={{ enable: true }} />);
    fireEvent.click(screen.getByText('Add New'));
    fireEvent.click(screen.getAllByAltText('add')[1]); // close button
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows selected suggestion and allows clearing it', async () => {
    render(<SearchWithSuggestions id="test-id" name="test-name" />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Alp' } });
    await waitFor(() => expect(screen.getByTestId('suggestion-dropdown')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Alpha'));
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    fireEvent.click(screen.getAllByAltText('add')[1]); // close button
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders hidden input with correct value', async () => {
    render(<SearchWithSuggestions id="test-id" name="test-name" />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Alp' } });
    await waitFor(() => expect(screen.getByTestId('suggestion-dropdown')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Alpha'));
    const hidden = screen.getByDisplayValue(JSON.stringify(mockSuggestions[0]));
    expect(hidden).toHaveAttribute('type', 'hidden');
  });
});