import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TextAreaEditor from '../../components/form/text-area-editor';

/**
 * Test suite for the TextAreaEditor component.
 */
describe('TextAreaEditor', () => {
  const baseProps = {
    name: 'test-editor',
    label: 'Test Label',
    value: 'Initial value',
  };

  it('renders with label and initial value', () => {
    render(<TextAreaEditor {...baseProps} />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    const editor = screen.getByRole('textarea');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveTextContent('Initial value');
    const input = screen.getByDisplayValue('Initial value');
    expect(input).toHaveAttribute('type', 'hidden');
    expect(input).toHaveAttribute('name', 'test-editor');
  });

  it('renders with placeholder when content is empty', () => {
    render(
      <TextAreaEditor {...baseProps} value="" placeholder="Type here..." />
    );
    const editor = screen.getByRole('textarea');
    expect(editor).toHaveClass('placeholder');
    // Placeholder is rendered via CSS ::before, so we check the attribute
    expect(editor).toHaveAttribute('data-placeholder', 'Type here...');
  });

  it('removes placeholder when content is not empty', () => {
    render(
      <TextAreaEditor {...baseProps} value="Some text" placeholder="Type here..." />
    );
    const editor = screen.getByRole('textarea');
    expect(editor).not.toHaveClass('placeholder');
  });

  it('updates hidden input value when user types', () => {
    render(<TextAreaEditor {...baseProps} value="" />);
    const editor = screen.getByRole('textarea');
    // Simulate user typing by setting innerHTML
    editor.innerHTML = 'User input';
    fireEvent.input(editor);
    // Select the hidden input by value
    const input = screen.getByDisplayValue('User input');
    expect(input).toHaveAttribute('type', 'hidden');
    expect(input).toHaveAttribute('name', 'test-editor');
  });

  it('syncs editor content with value prop changes', () => {
    const { rerender } = render(<TextAreaEditor {...baseProps} value="First" />);
    const editor = screen.getByRole('textarea');
    expect(editor).toHaveTextContent('First');
    rerender(<TextAreaEditor {...baseProps} value="Second" />);
    expect(editor).toHaveTextContent('Second');
  });

  it('handles form reset event and resets content', () => {
    // Render inside a form to test reset
    const Wrapper = (props: any) => (
      <form>
        <TextAreaEditor {...props} />
        <button type="reset">Reset</button>
      </form>
    );
    render(<Wrapper {...baseProps} value="Reset me" />);
    const editor = screen.getByRole('textarea');
    // Simulate user typing
    editor.innerHTML = 'Changed';
    fireEvent.input(editor);
    // The hidden input should now have the changed value
    let input = screen.getByDisplayValue('Changed');
    expect(input).toHaveValue('Changed');
    expect(editor).toHaveTextContent('Changed');
    // Reset the form
    fireEvent.click(screen.getByText('Reset'));
    // After reset, the input and editor should have the reset value
    input = screen.getByDisplayValue('Reset me');
    expect(input).toHaveValue('Reset me');
    expect(editor).toHaveTextContent('Reset me');
  });

  it('forwards name prop to hidden input', () => {
    render(<TextAreaEditor {...baseProps} />);
    const input = screen.getByDisplayValue('Initial value');
    expect(input).toHaveAttribute('name', 'test-editor');
  });

  // Edge case: value is undefined (should default to empty string)
  it('handles undefined value prop gracefully', () => {
    // @ts-expect-error: Testing robustness for missing value
    render(<TextAreaEditor name="test" label="Label" />);
    const editor = screen.getByRole('textarea');
    expect(editor).toHaveTextContent('');
  });
}); 