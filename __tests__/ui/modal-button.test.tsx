import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import ModalButton, { IButton } from '@/components/ui/modal-button';

/**
 * Test suite for the ModalButton component.
 * Covers all props, branches, and edge cases for 100% coverage.
 */
describe('ModalButton', () => {
  const baseProps: IButton = {
    variant: 'primary',
    value: 'Click Me',
    type: 'button',
  };

  // Test: Renders with correct text and class
  it('renders the button with correct text and class', () => {
    render(<ModalButton {...baseProps} />);
    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('primary');
    expect(button).toHaveTextContent('Click Me');
  });

  // Test: Renders with secondary variant
  it('renders with secondary variant', () => {
    render(<ModalButton {...baseProps} variant="secondary" value="Secondary" />);
    const button = screen.getByRole('button', { name: 'Secondary' });
    expect(button).toHaveClass('secondary');
  });

  // Test: Renders with type submit
  it('renders with type submit', () => {
    render(<ModalButton {...baseProps} type="submit" />);
    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toHaveAttribute('type', 'submit');
  });

  // Test: Renders with type reset
  it('renders with type reset', () => {
    render(<ModalButton {...baseProps} type="reset" />);
    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toHaveAttribute('type', 'reset');
  });

  // Test: Disabled state
  it('renders as disabled when isDisabled is true', () => {
    render(<ModalButton {...baseProps} isDisabled />);
    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toBeDisabled();
  });

  // Test: Not disabled by default
  it('is not disabled by default', () => {
    render(<ModalButton {...baseProps} />);
    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).not.toBeDisabled();
  });

  // Test: Calls callback on click (callBack present, not disabled)
  it('calls callBack when clicked', () => {
    const handleClick = jest.fn();
    render(<ModalButton {...baseProps} callBack={handleClick} />);
    const button = screen.getByRole('button', { name: 'Click Me' });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Test: Does not call callback when disabled (callBack present, isDisabled true)
  it('does not call callBack when disabled and clicked', () => {
    const handleClick = jest.fn();
    render(<ModalButton {...baseProps} callBack={handleClick} isDisabled />);
    const button = screen.getByRole('button', { name: 'Click Me' });
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  // Test: Does not throw or call anything if no callBack is provided (not disabled)
  it('does nothing when clicked if no callBack is provided', () => {
    render(<ModalButton {...baseProps} />);
    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(() => fireEvent.click(button)).not.toThrow();
  });

  // Test: Does not throw or call anything if no callBack and isDisabled is true
  it('does nothing when clicked if no callBack and isDisabled is true', () => {
    render(<ModalButton {...baseProps} isDisabled />);
    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(() => fireEvent.click(button)).not.toThrow();
  });

  // Edge case: Renders with empty value
  it('renders with empty value', () => {
    render(<ModalButton {...baseProps} value="" />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('');
  });
}); 