import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddContribution from '../../../../components/page/member-info/contributions/add-contribution';

describe('AddContribution', () => {
  const baseProps = {
    onAddContribution: jest.fn(),
    disableAdd: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the add button and info message when not disabled', () => {
    render(<AddContribution {...baseProps} />);
    expect(screen.getByText('Add Contribution')).toBeInTheDocument();
    expect(screen.getByText('(Max 20 contributions)')).toBeInTheDocument();
    expect(screen.getByAltText('Add Contribution button')).toBeInTheDocument();
  });

  it('calls onAddContribution when the add button is clicked', () => {
    render(<AddContribution {...baseProps} />);
    fireEvent.click(screen.getByText('Add Contribution'));
    expect(baseProps.onAddContribution).toHaveBeenCalled();
  });

  it('does not render the add button when disabled', () => {
    render(<AddContribution {...baseProps} disableAdd={true} />);
    expect(screen.queryByText('Add Contribution')).not.toBeInTheDocument();
    expect(screen.getByText('(Max 20 contributions)')).toBeInTheDocument();
  });
}); 