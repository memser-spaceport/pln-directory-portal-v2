import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TextArea from '../../components/form/text-area';

/**
 * Test suite for the TextArea component.
 */
describe('TextArea', () => {
  const baseProps = {
    id: 'test-textarea',
    name: 'testName',
  };

  it('renders with label and placeholder', () => {
    render(
      <TextArea {...baseProps} label="Test Label" placeholder="Type here..." />
    );
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('renders without label', () => {
    render(<TextArea {...baseProps} placeholder="No label" />);
    expect(screen.getByPlaceholderText('No label')).toBeInTheDocument();
    // Should not render a label element
    expect(screen.queryByText('No label')).not.toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const handleChange = jest.fn();
    render(
      <TextArea {...baseProps} onChange={handleChange} label="Change Label" />
    );
    const textarea = screen.getByLabelText('Change Label');
    fireEvent.change(textarea, { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('applies defaultValue', () => {
    render(
      <TextArea {...baseProps} defaultValue="default text" label="Default Label" />
    );
    const textarea = screen.getByLabelText('Default Label');
    expect(textarea).toHaveValue('default text');
  });

  it('applies maxLength', () => {
    render(
      <TextArea {...baseProps} maxLength={10} label="Max Length" />
    );
    const textarea = screen.getByLabelText('Max Length');
    expect(textarea).toHaveAttribute('maxLength', '10');
  });

  it('is required when isMandatory is true', () => {
    render(
      <TextArea {...baseProps} isMandatory label="Required Label" />
    );
    const textarea = screen.getByLabelText('Required Label');
    expect(textarea).toBeRequired();
  });

  it('is not required when isMandatory is false or undefined', () => {
    render(
      <TextArea {...baseProps} label="Optional Label" />
    );
    const textarea = screen.getByLabelText('Optional Label');
    expect(textarea).not.toBeRequired();
  });

  it('renders with all props and allows typing', () => {
    const handleChange = jest.fn();
    render(
      <TextArea
        {...baseProps}
        label="Full Props"
        placeholder="Full Placeholder"
        defaultValue=""
        isMandatory
        maxLength={20}
        onChange={handleChange}
      />
    );
    const textarea = screen.getByLabelText('Full Props');
    fireEvent.change(textarea, { target: { value: 'abc' } });
    expect(handleChange).toHaveBeenCalled();
    expect(textarea).toHaveValue('abc');
  });

  it('renders with empty string as defaultValue', () => {
    render(
      <TextArea {...baseProps} defaultValue="" label="Empty Default" />
    );
    const textarea = screen.getByLabelText('Empty Default');
    expect(textarea).toHaveValue('');
  });

  it('forwards name and id props to textarea', () => {
    render(
      <TextArea {...baseProps} label="Name and ID" />
    );
    const textarea = screen.getByLabelText('Name and ID');
    expect(textarea).toHaveAttribute('name', 'testName');
    expect(textarea).toHaveAttribute('id', 'test-textarea');
  });

  it('does not break if onChange is not provided', () => {
    render(
      <TextArea {...baseProps} label="No onChange" />
    );
    const textarea = screen.getByLabelText('No onChange');
    fireEvent.change(textarea, { target: { value: 'test' } });
    expect(textarea).toHaveValue('test');
  });

  // Edge case: isMandatory and maxLength together
  it('is required and enforces maxLength', () => {
    render(
      <TextArea {...baseProps} isMandatory maxLength={5} label="Required and MaxLength" />
    );
    const textarea = screen.getByLabelText('Required and MaxLength');
    expect(textarea).toBeRequired();
    expect(textarea).toHaveAttribute('maxLength', '5');
  });

}); 