import { render, screen, fireEvent } from '@testing-library/react';
import SingleSelect from '../../components/form/single-select';
import '@testing-library/jest-dom';

const options = [
  { id: 1, name: 'Option 1' },
  { id: 2, name: 'Option 2' },
];

describe('SingleSelect', () => {
  const baseProps = {
    options,
    selectedOption: null,
    onItemSelect: jest.fn(),
    uniqueKey: 'id',
    displayKey: 'name',
    id: 'select-id',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<SingleSelect {...baseProps} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders the label if provided', () => {
    render(<SingleSelect {...baseProps} label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('does not render the label if not provided', () => {
    render(<SingleSelect {...baseProps} />);
    expect(screen.queryByText('Test Label')).not.toBeInTheDocument();
  });

  it('renders the input with correct id and placeholder', () => {
    render(<SingleSelect {...baseProps} placeholder="Pick one" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'select-id');
    expect(input).toHaveAttribute('placeholder', 'Pick one');
  });

  it('renders the arrow image if arrowImgUrl is provided', () => {
    render(<SingleSelect {...baseProps} arrowImgUrl="/arrow.svg" />);
    expect(screen.getByAltText('arrow down')).toBeInTheDocument();
  });

  it('shows error class if isMandatory and no option selected', () => {
    render(<SingleSelect {...baseProps} isMandatory />);
    expect(screen.getByRole('textbox')).toHaveClass('select__search--error');
  });

  it('does not show error class if not mandatory', () => {
    render(<SingleSelect {...baseProps} />);
    expect(screen.getByRole('textbox')).not.toHaveClass('select__search--error');
  });

  it('shows options when input is clicked', () => {
    render(<SingleSelect {...baseProps} />);
    fireEvent.click(screen.getByRole('textbox'));
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('shows options when arrow image is clicked', () => {
    render(<SingleSelect {...baseProps} arrowImgUrl="/arrow.svg" />);
    fireEvent.click(screen.getByAltText('arrow down'));
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('calls onItemSelect and closes dropdown when option is clicked', () => {
    render(<SingleSelect {...baseProps} />);
    fireEvent.click(screen.getByRole('textbox'));
    fireEvent.click(screen.getByText('Option 2'));
    expect(baseProps.onItemSelect).toHaveBeenCalledWith(options[1]);
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('shows \"No results found\" if options is empty', () => {
    render(<SingleSelect {...baseProps} options={[]} />);
    fireEvent.click(screen.getByRole('textbox'));
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('highlights the selected option', () => {
    render(<SingleSelect {...baseProps} selectedOption={options[1]} />);
    fireEvent.click(screen.getByRole('textbox'));
    const selected = screen.getByText('Option 2');
    expect(selected.className).toContain('select__options__item--selected');
  });

  it('calls onSingleSelectClicked when container is clicked', () => {
    const onSingleSelectClicked = jest.fn();
    render(<SingleSelect {...baseProps} onSingleSelectClicked={onSingleSelectClicked} />);
    fireEvent.click(screen.getByRole('textbox').parentElement!);
    expect(onSingleSelectClicked).toHaveBeenCalled();
  });

  it('updates input value when selectedOption changes', () => {
    const { rerender } = render(<SingleSelect {...baseProps} selectedOption={null} />);
    expect(screen.getByRole('textbox')).toHaveValue('');
    rerender(<SingleSelect {...baseProps} selectedOption={options[0]} />);
    expect(screen.getByRole('textbox')).toHaveValue('Option 1');
  });

  it('input is readOnly', () => {
    render(<SingleSelect {...baseProps} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('readOnly');
  });

  it('handles missing onSingleSelectClicked gracefully', () => {
    render(<SingleSelect {...baseProps} />);
    fireEvent.click(screen.getByRole('textbox').parentElement!);
  });

//   it('handles missing onItemSelect gracefully', () => {
//     render(<SingleSelect {...baseProps} onItemSelect={undefined as any} />);
//     fireEvent.click(screen.getByRole('textbox'));
//     fireEvent.click(screen.getByText('Option 1'));
//     expect(baseProps.onItemSelect).not.toHaveBeenCalled();
//   });
});