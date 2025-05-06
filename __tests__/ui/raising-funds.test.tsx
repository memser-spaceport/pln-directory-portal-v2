import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { RaisingFunds } from '@/components/ui/raising-funds';

/**
 * Test suite for the RaisingFunds component.
 * Covers all rendering scenarios and edge cases for 100% coverage.
 */
describe('RaisingFunds', () => {
  // Test: Renders mobile icon and desktop label (both in DOM, but only one visible per media query)
  it('renders both mobile and desktop containers in the DOM', () => {
    render(<RaisingFunds />);
    // Mobile container
    const mob = screen.getByRole('img', { name: /raising funds/i });
    expect(mob).toBeInTheDocument();
    // Desktop container
    expect(screen.getByText('Raising Funds')).toBeInTheDocument();
  });

  // Test: Mobile icon has correct src, alt, and dimensions
  it('renders the correct mobile icon with alt and dimensions', () => {
    render(<RaisingFunds />);
    const img = screen.getByRole('img', { name: /raising funds/i });
    expect(img).toHaveAttribute('src', '/icons/raising-funds-mobile.svg');
    expect(img).toHaveAttribute('alt', 'raising funds');
    expect(img).toHaveAttribute('height', '21');
    expect(img).toHaveAttribute('width', '21');
  });

  // Test: Desktop label and icon structure
  it('renders the desktop label and icon structure', () => {
    render(<RaisingFunds />);
    // Desktop label
    expect(screen.getByText('Raising Funds')).toHaveClass('raising-funds_web__content');
    // Icon section
    const iconSection = document.querySelector('.raising-funds_web__icon-section');
    expect(iconSection).toBeInTheDocument();
    // Icon div
    const icon = document.querySelector('.raising-funds_web__icon__section__icon');
    expect(icon).toBeInTheDocument();
  });

  // Edge case: Component renders without crashing (smoke test)
  it('renders without crashing', () => {
    const { container } = render(<RaisingFunds />);
    expect(container).toBeDefined();
  });

  // Accessibility: Desktop label is accessible
  it('desktop label is accessible by text', () => {
    render(<RaisingFunds />);
    expect(screen.getByText('Raising Funds')).toBeInTheDocument();
  });

  // Edge case: No props passed (should not throw)
  it('does not throw if called with no props', () => {
    expect(() => render(<RaisingFunds />)).not.toThrow();
  });
}); 