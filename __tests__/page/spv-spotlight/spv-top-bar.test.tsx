import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SpvTopBar } from '@/components/page/spv-spotlight/SpvTopBar/SpvTopBar';

describe('SpvTopBar', () => {
  it('stays a plain bar without sections: no nav, and the mark is not a button', () => {
    render(<SpvTopBar label="SPV Spotlight" supportEmail="spv@example.com" />);
    expect(screen.getByText('SPV Spotlight')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back to top' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact us' })).toHaveAttribute('href', 'mailto:spv@example.com');
  });
});
