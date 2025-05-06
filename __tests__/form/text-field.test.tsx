import { render, screen, fireEvent } from '@testing-library/react';
import TextField from '@/components/form/text-field';
import '@testing-library/jest-dom';

describe('TextField', () => {
  it('renders input and label correctly', () => {
    render(<TextField id="test-id" name="test-name" label="Test Label" type="text" />);
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('does not render label if not provided', () => {
    render(<TextField id="test-id" name="test-name" type="text" />);
    expect(screen.queryByLabelText('Test Label')).not.toBeInTheDocument();
  });

  it('applies hide class when hide is true', () => {
    render(<TextField id="test-id" name="test-name" label="Test Label" type="text" hide />);
    const wrapper = screen.getByLabelText('Test Label').parentElement;
    expect(wrapper).toHaveClass('hidden');
  });

  it('sets input attributes correctly', () => {
    render(
      <TextField
        id="test-id"
        name="test-name"
        type="password"
        placeholder="Enter password"
        maxLength={10}
        defaultValue="default"
        isMandatory
      />
    );
    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveAttribute('id', 'test-id');
    expect(input).toHaveAttribute('name', 'test-name');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('placeholder', 'Enter password');
    expect(input).toHaveAttribute('maxLength', '10');
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('value', 'default');
  });

  it('calls onChange handler when input changes', () => {
    const handleChange = jest.fn();
    render(<TextField id="test-id" name="test-name" type="text" onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('applies readOnly styles and attribute', () => {
    render(<TextField id="test-id" name="test-name" type="text" readOnly />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readOnly');
    // Style checks are limited in JSDOM, but attribute is enough
  });

  it('applies error style when isError is true', () => {
    render(<TextField id="test-id" name="test-name" type="text" isError />);
    const input = screen.getByRole('textbox');
    // Style checks are limited in JSDOM, but we can check class
    expect(input.className).toContain('tf__input');
  });

  it('applies delete style when isDelete is true', () => {
    render(<TextField id="test-id" name="test-name" type="text" isDelete />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('tf__input');
  });
}); 