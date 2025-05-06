import { render, screen, fireEvent } from '@testing-library/react';
import React, { createRef } from 'react';
import '@testing-library/jest-dom';
import { Autocomplete, OptionsProps } from '@/components/ui/autocomplete';

describe('Autocomplete', () => {
  const baseOption: OptionsProps = { label: 'Option 1', value: '1', logo: '/logo1.png' };
  const secondOption: OptionsProps = { label: 'Option 2', value: '2', logo: '/logo2.png' };
  const searchResult = [baseOption, secondOption];
  const paneRef = createRef<HTMLDivElement>();
  const inputRef = createRef<HTMLInputElement>();
  const callback = jest.fn();
  const setIsPaneActive = jest.fn();
  const onTextChange = jest.fn();
  const onClear = jest.fn();
  const onInputBlur = jest.fn();

  const defaultProps = {
    selectedOption: baseOption,
    callback,
    isPaneActive: false,
    paneRef,
    inputRef,
    searchResult,
    onTextChange,
    searchText: '',
    setIsPaneActive,
    required: false,
    placeholder: 'Search...',
    iconUrl: '/icon.png',
    onInputBlur,
    isProcessing: false,
    onClear,
    isClear: false,
  };

  // Test: Renders input and placeholder
  it('renders input with placeholder', () => {
    render(<Autocomplete {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  // Test: Calls onTextChange when input changes
  it('calls onTextChange when input value changes', () => {
    render(<Autocomplete {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(onTextChange).toHaveBeenCalledWith('abc');
  });

  // Test: Calls onInputBlur when input loses focus
  it('calls onInputBlur when input is blurred', () => {
    render(<Autocomplete {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.blur(input);
    expect(onInputBlur).toHaveBeenCalled();
  });

  // Test: Shows clear button and calls onClear
  it('shows clear button and calls onClear when clicked', () => {
    render(<Autocomplete {...defaultProps} isClear={true} />);
    const clearBtn = screen.getByRole('button', { name: '' }); // The clear button has no accessible name
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalled();
  });

  // Test: Pane toggles on box click
  it('calls setIsPaneActive when box is clicked', () => {
    render(<Autocomplete {...defaultProps} />);
    const box = screen.getByRole('textbox').parentElement?.parentElement;
    if (box) {
      fireEvent.click(box);
      expect(setIsPaneActive).toHaveBeenCalledWith(true);
    }
  });

  // Test: Shows options when isPaneActive is true
  it('shows options list when isPaneActive is true', () => {
    render(<Autocomplete {...defaultProps} isPaneActive={true} />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  // Test: Calls callback when option is clicked
  it('calls callback when an option is clicked', () => {
    render(<Autocomplete {...defaultProps} isPaneActive={true} />);
    const optionBtn = screen.getByText('Option 2').closest('button');
    if (optionBtn) {
      fireEvent.click(optionBtn);
      expect(callback).toHaveBeenCalledWith(secondOption);
    }
  });

  // Test: Shows "No options available" when searchResult is empty
  it('shows "No options available" when searchResult is empty', () => {
    render(<Autocomplete {...defaultProps} isPaneActive={true} searchResult={[]} />);
    expect(screen.getByText('No options available')).toBeInTheDocument();
  });

  // Test: Shows "Searching" when isProcessing is true and no results
  it('shows "Searching" when isProcessing is true and no results', () => {
    render(<Autocomplete {...defaultProps} isPaneActive={true} searchResult={[]} isProcessing={true} />);
    expect(screen.getByText('Searching')).toBeInTheDocument();
  });

  // Test: Renders required style
  it('renders with required style when required is true', () => {
    render(<Autocomplete {...defaultProps} required={true} />);
    const container = screen.getByPlaceholderText('Search...').closest('.autocomplete');
    expect(container).toHaveClass('autocomplete--required');
  });

  // Test: Renders with custom iconUrl
  it('renders with custom iconUrl', () => {
    render(<Autocomplete {...defaultProps} iconUrl="/custom-icon.png" />);
    const img = screen.getAllByAltText('logo')[0];
    expect(img).toHaveAttribute('src', '/logo1.png');
  });

  // Test: Renders with selectedOption logo fallback to iconUrl
  it('renders with iconUrl if selectedOption.logo is missing', () => {
    const optionNoLogo = { label: 'NoLogo', value: '3' };
    render(<Autocomplete {...defaultProps} selectedOption={optionNoLogo} iconUrl="/icon-fallback.png" />);
    const img = screen.getAllByAltText('logo')[0];
    expect(img).toHaveAttribute('src', '/icon-fallback.png');
  });

  // Test: Does not throw if onInputBlur is not provided
  it('does not throw if onInputBlur is not provided', () => {
    const { onInputBlur, ...rest } = defaultProps;
    render(<Autocomplete {...rest} />);
    const input = screen.getByPlaceholderText('Search...');
    expect(() => fireEvent.blur(input)).not.toThrow();
  });

  // Test: Renders with no logo or iconUrl (img src is undefined)
  it('renders with no logo or iconUrl (img src is undefined)', () => {
    const optionNoLogo = { label: 'NoLogo', value: '3' };
    const { iconUrl, ...rest } = defaultProps;
    render(<Autocomplete {...rest} selectedOption={optionNoLogo} iconUrl={undefined} />);
    const img = screen.getAllByAltText('logo')[0];
    expect(img).not.toHaveAttribute('src'); // src will be undefined
  });

  // Test: Renders with empty string logo and iconUrl (img src is empty string)
  it('renders with empty string logo and iconUrl (img src is empty string)', () => {
    const optionNoLogo = { label: 'NoLogo', value: '3', logo: '' };
    render(<Autocomplete {...defaultProps} selectedOption={optionNoLogo} iconUrl="" />);
    const img = screen.getAllByAltText('logo')[0];
    expect(img).toHaveAttribute('src', '');
  });

  // Test: Does not render clear button when isClear is false or undefined
  it('does not render clear button when isClear is false or undefined', () => {
    // isClear: false
    render(<Autocomplete {...defaultProps} isClear={false} />);
    expect(screen.queryByRole('button', { name: '' })).not.toBeInTheDocument();

    // isClear: undefined (omit the prop)
    const { isClear, ...rest } = defaultProps;
    render(<Autocomplete {...rest} />);
    expect(screen.queryByRole('button', { name: '' })).not.toBeInTheDocument();
  });

  // Test: Option logo fallback to iconUrl in dropdown
  it('dropdown option uses iconUrl if option.logo is missing', () => {
    const optionNoLogo = { label: 'NoLogo', value: '3' };
    render(
      <Autocomplete
        {...defaultProps}
        isPaneActive={true}
        searchResult={[optionNoLogo]}
        iconUrl="/icon-fallback.png"
      />
    );
    // The dropdown option image should use iconUrl
    const img = screen.getAllByAltText('logo')[1]; // [0] is input, [1] is dropdown
    expect(img).toHaveAttribute('src', '/icon-fallback.png');
  });

  // Test: Option logo is used in dropdown if present
  it('dropdown option uses its own logo if present', () => {
    const optionWithLogo = { label: 'WithLogo', value: '4', logo: '/option-logo.png' };
    render(
      <Autocomplete
        {...defaultProps}
        isPaneActive={true}
        searchResult={[optionWithLogo]}
        iconUrl="/icon-fallback.png"
      />
    );
    // The dropdown option image should use its own logo
    const img = screen.getAllByAltText('logo')[1]; // [0] is input, [1] is dropdown
    expect(img).toHaveAttribute('src', '/option-logo.png');
  });

  // Test: Option logo and iconUrl both missing in dropdown
  it('dropdown option image src is undefined if both logo and iconUrl are missing', () => {
    const optionNoLogo = { label: 'NoLogo', value: '3' };
    render(
      <Autocomplete
        {...defaultProps}
        isPaneActive={true}
        searchResult={[optionNoLogo]}
        iconUrl={undefined}
      />
    );
    const img = screen.getAllByAltText('logo')[1]; // [0] is input, [1] is dropdown
    expect(img).not.toHaveAttribute('src');
  });
}); 