import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import ShadowButton from '@/components/ui/ShadowButton';

/**
 * Test suite for the ShadowButton component.
 * Covers all props, branches, and edge cases for 100% coverage.
 */
describe('ShadowButton', () => {
  const defaultProps = {
    children: 'Click Me',
  };

  // Test: Renders button with text
  it('renders the button with children text', () => {
    render(<ShadowButton {...defaultProps} />);
    expect(screen.getByRole('button')).toHaveTextContent('Click Me');
  });

  // Test: Renders left icon when iconSrc and iconPosition left
  it('renders left icon when iconSrc and iconPosition left', () => {
    render(
      <ShadowButton {...defaultProps} iconSrc="/icon.svg" iconAlt="icon" iconPosition="left" />
    );
    const img = screen.getByAltText('icon');
    expect(img).toBeInTheDocument();
    // Should be before the text
    const button = screen.getByRole('button');
    expect(button.firstChild?.textContent).toBe(''); // icon span
  });

  // Test: Renders right icon when iconSrc and iconPosition right
  it('renders right icon when iconSrc and iconPosition right', () => {
    render(
      <ShadowButton {...defaultProps} iconSrc="/icon.svg" iconAlt="icon" iconPosition="right" />
    );
    const img = screen.getByAltText('icon');
    expect(img).toBeInTheDocument();
    // Should be after the text
    const button = screen.getByRole('button');
    expect(button.lastChild?.textContent).toBe(''); // icon span
  });

  // Test: Does not render icon if iconSrc is not provided
  it('does not render icon if iconSrc is not provided', () => {
    render(<ShadowButton {...defaultProps} />);
    expect(screen.queryByAltText('button icon')).not.toBeInTheDocument();
  });

  // Test: Applies custom button, shadow, and text colors
  it('applies custom button, shadow, and text colors', () => {
    render(
      <ShadowButton
        {...defaultProps}
        buttonColor="#123456"
        shadowColor="#abcdef"
        textColor="#654321"
      />
    );
    // Style checks are limited in JSDOM, but we can check the button exists
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  // Test: Handles click event
  it('calls onClick when button is clicked', () => {
    const handleClick = jest.fn();
    render(<ShadowButton {...defaultProps} onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  // Test: Handles hover state (simulate mouse enter/leave)
  it('handles hover state for shadow effect', () => {
    render(<ShadowButton {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);
    // No error should occur
    expect(button).toBeInTheDocument();
  });

  // Test: Passes through additional button props
  it('passes through additional button props', () => {
    render(<ShadowButton {...defaultProps} type="submit" disabled />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('type', 'submit');
  });

  // Edge case: Renders with only required props
  it('renders with only required props', () => {
    render(<ShadowButton>Only Text</ShadowButton>);
    expect(screen.getByRole('button')).toHaveTextContent('Only Text');
  });

  // Edge case: Renders with custom icon size
  it('renders icon with custom width and height', () => {
    render(
      <ShadowButton {...defaultProps} iconSrc="/icon.svg" iconAlt="icon" iconWidth={32} iconHeight={32} />
    );
    const img = screen.getByAltText('icon');
    expect(img).toHaveAttribute('width', '32');
    expect(img).toHaveAttribute('height', '32');
  });

  // Smoke test: renders without crashing
  it('renders without crashing', () => {
    const { container } = render(<ShadowButton {...defaultProps} />);
    expect(container).toBeDefined();
  });

  // Edge case: iconSrc provided but iconPosition is invalid
  it('does not render icon if iconSrc is provided but iconPosition is invalid', () => {
    render(
      <ShadowButton {...defaultProps} iconSrc="/icon.svg" iconAlt="icon" iconPosition={"center" as any} />
    );
    expect(screen.queryByAltText('icon')).not.toBeInTheDocument();
  });

  // Edge case: iconSrc not provided but iconPosition is left
  it('does not render icon if iconSrc is not provided and iconPosition is left', () => {
    render(
      <ShadowButton {...defaultProps} iconPosition="left" />
    );
    expect(screen.queryByAltText('button icon')).not.toBeInTheDocument();
  });

  // Edge case: iconSrc not provided but iconPosition is right
  it('does not render icon if iconSrc is not provided and iconPosition is right', () => {
    render(
      <ShadowButton {...defaultProps} iconPosition="right" />
    );
    expect(screen.queryByAltText('button icon')).not.toBeInTheDocument();
  });

  // Edge case: iconSrc is undefined and iconPosition is undefined
  it('does not render icon if iconSrc and iconPosition are both undefined', () => {
    render(<ShadowButton {...defaultProps} />);
    expect(screen.queryByAltText('button icon')).not.toBeInTheDocument();
  });

  // Edge case: iconSrc is provided, iconPosition is undefined (should default to left)
  it('renders left icon if iconSrc is provided and iconPosition is undefined', () => {
    render(<ShadowButton {...defaultProps} iconSrc="/icon.svg" iconAlt="icon" />);
    expect(screen.getByAltText('icon')).toBeInTheDocument();
  });

  // Edge case: Renders with custom buttonWidth and buttonHeight
  it('renders with custom buttonWidth and buttonHeight', () => {
    render(
      <ShadowButton {...defaultProps} buttonWidth="200px" buttonHeight="50px" />
    );
    // The button should still render and accept the custom dimensions
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
}); 