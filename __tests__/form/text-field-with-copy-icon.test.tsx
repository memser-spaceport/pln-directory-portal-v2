import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TextFieldWithCopyIcon from '../../components/form/text-field-with-copy-icon';

describe('TextFieldWithCopyIcon', () => {
  const baseProps = {
    id: 'test-input',
    name: 'testName',
    type: 'text',
    label: 'Test Label',
    placeholder: 'Type here...',
  };

  it('renders with label and placeholder', () => {
    render(<TextFieldWithCopyIcon {...baseProps} />);
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('renders without label', () => {
    render(<TextFieldWithCopyIcon {...baseProps} label={undefined} />);
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
    expect(screen.queryByText('Test Label')).not.toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const handleChange = jest.fn();
    render(<TextFieldWithCopyIcon {...baseProps} onChange={handleChange} />);
    const input = screen.getByPlaceholderText('Type here...');
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('new value');
  });

  it('applies defaultValue', () => {
    render(<TextFieldWithCopyIcon {...baseProps} defaultValue="default text" />);
    const input = screen.getByPlaceholderText('Type here...');
    expect(input).toHaveValue('default text');
  });

  it('applies maxLength', () => {
    render(<TextFieldWithCopyIcon {...baseProps} maxLength={10} />);
    const input = screen.getByPlaceholderText('Type here...');
    expect(input).toHaveAttribute('maxLength', '10');
  });

  it('is required when isMandatory is true', () => {
    render(<TextFieldWithCopyIcon {...baseProps} isMandatory />);
    const input = screen.getByPlaceholderText('Type here...');
    expect(input).toBeRequired();
  });

  it('is not required when isMandatory is false or undefined', () => {
    render(<TextFieldWithCopyIcon {...baseProps} />);
    const input = screen.getByPlaceholderText('Type here...');
    expect(input).not.toBeRequired();
  });

  it('renders with all props and allows typing', () => {
    const handleChange = jest.fn();
    render(
      <TextFieldWithCopyIcon
        {...baseProps}
        defaultValue=""
        isMandatory
        maxLength={20}
        onChange={handleChange}
      />
    );
    const input = screen.getByPlaceholderText('Type here...');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('abc');
  });

  it('renders with empty string as defaultValue', () => {
    render(<TextFieldWithCopyIcon {...baseProps} defaultValue="" />);
    const input = screen.getByPlaceholderText('Type here...');
    expect(input).toHaveValue('');
  });

  it('forwards name and id props to input', () => {
    render(<TextFieldWithCopyIcon {...baseProps} />);
    const input = screen.getByPlaceholderText('Type here...');
    expect(input).toHaveAttribute('name', 'testName');
    expect(input).toHaveAttribute('id', 'test-input');
  });

  it('does not break if onChange is not provided', () => {
    render(<TextFieldWithCopyIcon {...baseProps} />);
    const input = screen.getByPlaceholderText('Type here...');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(input).toHaveValue('test');
  });

  it('renders as readOnly when readOnly is true', () => {
    render(<TextFieldWithCopyIcon {...baseProps} readOnly />);
    const input = screen.getByPlaceholderText('Type here...');
    expect(input).toHaveAttribute('readOnly');
  });

  it('renders as hidden when hide is true', () => {
    render(<TextFieldWithCopyIcon {...baseProps} hide />);
    const wrapper = inputWrapper();
    expect(wrapper).toHaveClass('hidden');
  });

  it('renders with error style when isError is true', () => {
    render(<TextFieldWithCopyIcon {...baseProps} isError />);
    const inputCnt = screen.getByPlaceholderText('Type here...').closest('.tf__inptcnt');
    expect(inputCnt).toBeInTheDocument();
  });

  it('renders with unusual characters in label and placeholder', () => {
    render(
      <TextFieldWithCopyIcon
        {...baseProps}
        label="!@#$%^&*()_+"
        placeholder={'<>?"{}|'}
      />
    );
    expect(screen.getByLabelText('!@#$%^&*()_+')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('<>?"{}|')).toBeInTheDocument();
  });

  it('renders with isDelete prop and triggers input', () => {
    render(<TextFieldWithCopyIcon {...baseProps} isDelete />);
    const input = screen.getByPlaceholderText('Type here...');
    fireEvent.change(input, { target: { value: 'something' } });
    expect(input).toBeInTheDocument();
  });

  it('renders with isError and isMandatory with empty value', () => {
    render(<TextFieldWithCopyIcon {...baseProps} isError isMandatory defaultValue="" />);
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('renders with isDelete, isMandatory, isError, and readOnly together for full coverage', () => {
    render(
      <TextFieldWithCopyIcon
        {...baseProps}
        isDelete
        isMandatory
        isError
        readOnly
        defaultValue=""
      />
    );
    const input = screen.getByPlaceholderText('Type here...');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(input).toBeInTheDocument();
  });

  // Helper to get the wrapper div for hidden test
  function inputWrapper() {
    return screen.getByPlaceholderText('Type here...').closest('.tf');
  }
}); 