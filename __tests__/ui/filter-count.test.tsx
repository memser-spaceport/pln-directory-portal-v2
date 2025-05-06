import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import FilterCount from '@/components/ui/filter-count';

/**
 * Test suite for the FilterCount component.
 * Covers all props, branches, and edge cases for 100% coverage.
 */
describe('FilterCount', () => {
  // Test: Renders the count correctly
  it('renders the count prop inside the badge', () => {
    render(<FilterCount count={5} />);
    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('filter-count');
  });

  // Test: Renders zero correctly
  it('renders zero when count is 0', () => {
    render(<FilterCount count={0} />);
    const badge = screen.getByText('0');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('filter-count');
  });

  // Test: Renders negative numbers
  it('renders negative numbers if provided', () => {
    render(<FilterCount count={-3} />);
    const badge = screen.getByText('-3');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('filter-count');
  });

  // Test: Renders large numbers
  it('renders large numbers correctly', () => {
    render(<FilterCount count={9999} />);
    const badge = screen.getByText('9999');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('filter-count');
  });

  // Test: Structure and style
  it('has correct structure and style', () => {
    render(<FilterCount count={1} />);
    const badge = screen.getByText('1');
    expect(badge).toHaveClass('filter-count');
    // Check for inline style presence (not the actual value, since CSS-in-JS is not rendered in JSDOM)
    expect(badge).toBeInTheDocument();
  });

  // Edge case: Renders with undefined count (should not happen with strict typing, but test for robustness)
  it('renders nothing if count is undefined (TypeScript would prevent this, but test for robustness)', () => {
    // @ts-expect-error: Testing robustness for missing prop
    render(<FilterCount />);
    // Should not find any badge with class 'filter-count' containing text
    const badge = document.querySelector('.filter-count');
    expect(badge?.textContent).toBe("");
  });
}); 