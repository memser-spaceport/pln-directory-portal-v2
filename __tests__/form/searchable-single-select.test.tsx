import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchableSingleSelect from '../../components/form/searchable-single-select';

jest.mock('react-virtuoso', () => ({
  Virtuoso: ({ data, itemContent, style }: any) => (
    <ul style={style} data-testid="virtuoso-list">
      {data.map((item: any, idx: number) => itemContent(idx, item))}
    </ul>
  ),
}));

const OPTIONS = [
  { id: 1, name: 'Alpha', icon: 'icon1.png', value: 'A' },
  { id: 2, name: 'Beta', icon: 'icon2.png', value: 'B' },
  { id: 3, name: 'Gamma', icon: '', value: 'C' },
];

const defaultProps = {
  options: OPTIONS,
  selectedOption: null,
  onChange: jest.fn(),
  onClear: jest.fn(),
  uniqueKey: 'id',
  displayKey: 'name',
  formKey: 'value',
  id: 'searchable-select',
  name: 'searchable-select',
  arrowImgUrl: 'arrow.png',
  closeImgUrl: 'close.png',
  defaultImage: 'default.png',
};

/**
 * Helper to render the component with default and custom props.
 */
const renderComponent = (props = {}) =>
  render(<SearchableSingleSelect {...defaultProps} {...props} />);

/**
 * Test suite for SearchableSingleSelect component.
 */
describe('SearchableSingleSelect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders label and input', () => {
    renderComponent({ label: 'Test Label' });
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search....')).toBeInTheDocument();
  });

  it('renders with icon and selected option', () => {
    renderComponent({
      iconKey: 'icon',
      selectedOption: OPTIONS[0],
    });
    expect(screen.getByAltText('Alpha')).toBeInTheDocument();
  });

  it('shows options dropdown on input click', () => {
    renderComponent();
    fireEvent.click(screen.getByPlaceholderText('Search....'));
    expect(screen.getByTestId('virtuoso-list')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('shows options dropdown on input focus', () => {
    renderComponent();
    fireEvent.focus(screen.getByPlaceholderText('Search....'));
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('filters options based on search', () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Search....');
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'bet' } });
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument();
  });

  it('shows "No results found" if no options match', () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Search....');
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('calls onChange and closes dropdown when option is clicked', () => {
    const onChange = jest.fn();
    renderComponent({ onChange });
    fireEvent.click(screen.getByPlaceholderText('Search....'));
    fireEvent.mouseDown(screen.getAllByTestId('option-item')[1]);
    expect(onChange).toHaveBeenCalledWith(OPTIONS[1]);
    expect(screen.queryByTestId('virtuoso-list')).not.toBeInTheDocument();
  });

  it('calls onClear when searching with a selected option', () => {
    const onClear = jest.fn();
    renderComponent({
      selectedOption: OPTIONS[0],
      onClear,
    });
    const input = screen.getByPlaceholderText('Search....');
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'a' } });
    expect(onClear).toHaveBeenCalled();
  });

  it('calls onClick when input is clicked', () => {
    const onClick = jest.fn();
    renderComponent({ onClick });
    fireEvent.click(screen.getByPlaceholderText('Search....'));
    expect(onClick).toHaveBeenCalled();
  });

  it('shows error border if isError is true', () => {
    renderComponent({ isError: true });
    const input = screen.getByPlaceholderText('Search....');
    expect(input).toHaveStyle('border: 1px solid red');
  });

  it('shows clear button and calls onClear when clicked', () => {
    const onClear = jest.fn();
    renderComponent({
      showClear: true,
      selectedOption: OPTIONS[0],
      onClear,
    });
    const clearBtn = screen.getByAltText('close');
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalled();
  });

  it('shows arrow image if no selected option and showClear is true', () => {
    renderComponent({ showClear: true, selectedOption: null });
    expect(screen.getByAltText('arrow down')).toBeInTheDocument();
  });

  it('shows arrow image if showClear is false', () => {
    renderComponent({ showClear: false });
    expect(screen.getByAltText('arrow down')).toBeInTheDocument();
  });

  it('toggles dropdown when arrow is clicked', () => {
    renderComponent();
    const arrow = screen.getByAltText('arrow down');
    fireEvent.click(arrow);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    fireEvent.click(arrow);
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', () => {
    renderComponent();
    fireEvent.click(screen.getByPlaceholderText('Search....'));
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    act(() => {
      fireEvent.mouseDown(document.body);
    });
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });

  it('prevents form submission on Enter key', () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Search....');
    fireEvent.keyDown(input, { key: 'Enter' });
    // No form submission to check, but you can check that dropdown remains open or other side effects
    // Or, you can spy on the handler if you refactor the component to expose it for testing
  });

  it('syncs input value with selectedOption', () => {
    renderComponent({ selectedOption: OPTIONS[1] });
    expect(screen.getByPlaceholderText('Search....')).toHaveValue('Beta');
  });

  it('renders hidden input with correct value', () => {
    renderComponent({ selectedOption: OPTIONS[2] });
    const hiddenInput = screen.getByDisplayValue('C');
    expect(hiddenInput).toHaveAttribute('type', 'text');
    expect(hiddenInput).toHaveAttribute('hidden');
  });

  it('shows error style if isMandatory and no selection', () => {
    renderComponent({ isMandatory: true, selectedOption: null });
    const input = screen.getByPlaceholderText('Search....');
    expect(input.className).toMatch(/select__search--error/);
  });

  it('restores selected value on blur', () => {
    renderComponent({ selectedOption: OPTIONS[0] });
    const input = screen.getByPlaceholderText('Search....');
    fireEvent.change(input, { target: { value: 'Bet' } });
    fireEvent.blur(input);
    expect(input).toHaveValue('Alpha');
  });

  it('renders with custom placeholder', () => {
    renderComponent({ placeholder: 'Custom Placeholder' });
    expect(screen.getByPlaceholderText('Custom Placeholder')).toBeInTheDocument();
  });

  it('renders with empty options', () => {
    renderComponent({ options: [] });
    fireEvent.click(screen.getByPlaceholderText('Search....'));
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('calls onChange and handles isAllowed === false branch', () => {
    const onChange = jest.fn(() => false);
    renderComponent({ onChange });
    fireEvent.click(screen.getByPlaceholderText('Search....'));
    fireEvent.mouseDown(screen.getAllByTestId('option-item')[1]);
    expect(onChange).toHaveBeenCalledWith(OPTIONS[1]);
    // Dropdown should close and options should reset
    expect(screen.queryByTestId('virtuoso-list')).not.toBeInTheDocument();
  });

  it('resets filteredOptions when searchTerm is empty', () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Search....');
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'bet' } });
    expect(screen.getByText('Beta')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '' } });
    // All options should be visible again
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('filters options when showOptions is true and selectedOption is null', () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Search....');
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: 'alp' } });
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument();
  });

  it('does not render label if label is empty (explicit coverage)', () => {
    renderComponent({ label: '' });
    // The label element should not be present
    expect(document.querySelector('.select__label')).not.toBeInTheDocument();
  });

  it('does not render selected icon if iconKey or selectedOption is missing (explicit coverage)', () => {
    renderComponent({ iconKey: undefined, selectedOption: null });
    // The selected__icon image should not be present
    expect(document.querySelector('.selected__icon')).not.toBeInTheDocument();
  });

  it('does not render clear or arrow image if showClear and arrowImgUrl are both missing (explicit coverage)', () => {
    renderComponent({ showClear: false, arrowImgUrl: undefined });
    // Should not find arrow or close images
    expect(screen.queryByAltText('arrow down')).not.toBeInTheDocument();
    expect(screen.queryByAltText('close')).not.toBeInTheDocument();
  });

  it('does not render options list if showOptions is false (explicit coverage)', () => {
    renderComponent();
    // By default, showOptions is false, so options list should not be in the document
    expect(document.querySelector('.select__options')).not.toBeInTheDocument();
  });

  it('renders only "No results found" if filteredOptions is empty and showOptions is true', () => {
    renderComponent({ options: [] });
    const input = screen.getByPlaceholderText('Search....');
    fireEvent.click(input);
    expect(screen.getByText('No results found')).toBeInTheDocument();
    // Should not render any option-item
    expect(screen.queryByTestId('option-item')).not.toBeInTheDocument();
  });
});
