import { render, screen, fireEvent } from '@testing-library/react';
import SearchableMultiSelect from '../../components/form/searchable-multi-select';
import '@testing-library/jest-dom';

const options = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' },
  { id: 3, name: 'Gamma' },
];

describe('SearchableMultiSelect', () => {
  const baseProps = {
    options,
    selectedOptions: [],
    onChange: jest.fn(),
    onClear: jest.fn(),
    uniqueKey: 'id',
    displayKey: 'name',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<SearchableMultiSelect {...baseProps} />);
    expect(screen.getByText('Select options...')).toBeInTheDocument();
  });

  it('renders the placeholder if no options are selected', () => {
    render(<SearchableMultiSelect {...baseProps} />);
    expect(screen.getByText((content, element) => 
      !!element?.className.includes('select__placeholder') && content === 'Select options...'
    )).toBeInTheDocument();
  });

  it('renders all selected options as tags', () => {
    render(<SearchableMultiSelect {...baseProps} selectedOptions={[options[0], options[1]]} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders the arrow image if arrowImgUrl is provided', () => {
    render(<SearchableMultiSelect {...baseProps} arrowImgUrl='/arrow.svg' />);
    expect(screen.getByAltText('arrow down')).toBeInTheDocument();
  });

  it('shows all options in the dropdown when open', () => {
    render(<SearchableMultiSelect {...baseProps} />);
    fireEvent.click(screen.getByText('Select options...'));
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('calls onChange with added option when an unselected option is clicked', () => {
    render(<SearchableMultiSelect {...baseProps} selectedOptions={[]} />);
    fireEvent.click(screen.getByText('Select options...'));
    fireEvent.click(screen.getByText('Alpha'));
    expect(baseProps.onChange).toHaveBeenCalledWith([options[0]]);
  });

  it('calls onChange with removed option when × is clicked on a tag', () => {
    render(<SearchableMultiSelect {...baseProps} selectedOptions={[options[0]]} />);
    fireEvent.click(screen.getByText('×'));
    expect(baseProps.onChange).toHaveBeenCalledWith([]);
  });

  it('closes dropdown when clicking outside', () => {
    render(<SearchableMultiSelect {...baseProps} />);
    fireEvent.click(screen.getByText('Select options...'));
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });

  it('handles empty options array gracefully', () => {
    render(<SearchableMultiSelect {...baseProps} options={[]} />);
    fireEvent.click(screen.getByText('Select options...'));
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('handles missing onChange gracefully', () => {
    render(<SearchableMultiSelect {...baseProps} onChange={undefined as any} />);
  });

  it('handles missing onClear gracefully', () => {
    render(<SearchableMultiSelect {...baseProps} onClear={undefined as any} />);
  });
});