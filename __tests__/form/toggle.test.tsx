import { render, screen, fireEvent } from '@testing-library/react';
import FormToggle from '@/components/form/toggle';
import '@testing-library/jest-dom';

describe('FormToggle', () => {
  const baseProps = {
    id: 'toggle-id',
    name: 'toggle-name',
  };

  const label = 'Test Label';

  it('renders without crashing', () => {
    render(<FormToggle {...baseProps} label={label} />);
    expect(screen.getByLabelText(label)).toBeInTheDocument();
  });

  it('renders the label if provided', () => {
    render(<FormToggle {...baseProps} label={label} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('does not render the label if not provided', () => {
    render(<FormToggle {...baseProps} />);
    expect(screen.queryByText(label)).not.toBeInTheDocument();
  });

  it('renders the hidden input with correct attributes', () => {
    render(<FormToggle {...baseProps} checked={true} disabled={true} label={label} />);
    const input = screen.getByLabelText(label).closest('input');
    expect(input).toHaveAttribute('id', 'toggle-id');
    expect(input).toHaveAttribute('name', 'toggle-name');
    expect(input).toBeChecked();
    expect(input).toBeDisabled();
  });

  it('adds checked class to toggle-switch when checked', () => {
    render(<FormToggle {...baseProps} checked={true} />);
    expect(document.querySelector('.toggle-switch')).toHaveClass('checked');
  });

  it('does not add checked class when not checked', () => {
    render(<FormToggle {...baseProps} checked={false} />);
    expect(document.querySelector('.toggle-switch')).not.toHaveClass('checked');
  });

  it('adds disabled class to toggle-switch when disabled', () => {
    render(<FormToggle {...baseProps} disabled={true} />);
    expect(document.querySelector('.toggle-switch')).toHaveClass('toggle-switch--disabled');
  });

  it('does not add disabled class when not disabled', () => {
    render(<FormToggle {...baseProps} disabled={false} />);
    expect(document.querySelector('.toggle-switch')).not.toHaveClass('toggle-switch--disabled');
  });
  it('calls onChange with toggled value when clicked', () => {
    const onChange = jest.fn();
    render(<FormToggle {...baseProps} checked={false} onChange={onChange} />);
    const toggleSwitch = document.querySelector('.toggle-switch');
    fireEvent.click(toggleSwitch as Element);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with toggled value when clicked (from true to false)', () => {
    const onChange = jest.fn();
    render(<FormToggle {...baseProps} checked={true} onChange={onChange} />);
    const toggleSwitch = document.querySelector('.toggle-switch');
    fireEvent.click(toggleSwitch as Element);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('defaults to unchecked if checked prop is not provided', () => {
    render(<FormToggle {...baseProps} label={label} />);
    expect(document.querySelector('.toggle-switch')).not.toHaveClass('checked');
    expect(screen.getByLabelText(label)).not.toBeChecked();
  });
});
