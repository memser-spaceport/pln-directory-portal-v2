import React from 'react';
import { render, screen } from '@testing-library/react';
import HiddenField from '../../components/form/hidden-field';
import '@testing-library/jest-dom';

describe('HiddenField Component', () => {
  // Test rendering with default props
  it('renders with default props', () => {
    render(<HiddenField defaultValue="default" name="hiddenField" />);
    const input = screen.getByTestId('hidden-field');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('name', 'hiddenField');
    expect(input).toHaveAttribute('value', 'default');
  });
  // Test readOnly attribute
  it('is readOnly', () => {
    render(<HiddenField defaultValue="default" name="hiddenField" />);
    const input = screen.getByTestId('hidden-field');
    expect(input).toHaveAttribute('readOnly'); // Should be readOnly
  });

  // Test edge case with empty defaultValue
  it('handles empty defaultValue', () => {
    render(<HiddenField defaultValue="" name="hiddenField" />);
    const input = screen.getByTestId('hidden-field');
    expect(input).toHaveAttribute('value', ""); // Should handle empty defaultValue
  });
});

