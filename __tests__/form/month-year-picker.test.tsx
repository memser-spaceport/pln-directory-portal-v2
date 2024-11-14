import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MonthYearPicker from '../../components/form/month-year-picker';
import '@testing-library/jest-dom';

describe('MonthYearPicker', () => {
  const mockOnDateChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks(); // Clear previous calls to mock functions
  });

  it('renders with initial date', () => {
    render(<MonthYearPicker initialDate="2023-05-15T00:00:00.000Z" label="Select Date" name="date" id="date" onDateChange={mockOnDateChange} />);
    // Check if the label is rendered
    expect(screen.getByText('Select Date*')).toBeInTheDocument();
    // Check if the month and year are displayed correctly
    expect(screen.getByText('May')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
  });


/* 
  

  it('opens year dropdown and selects a year', () => {
    render(<MonthYearPicker label="Select Date" name="date" id="date" minYear={2024} maxYear={2025} minMonth={1} maxMonth={12} onDateChange={mockOnDateChange} />);
    fireEvent.click(screen.getByTestId('year-dropdown'));
    fireEvent.click(screen.getByTestId('year-item-2025')); // Select year 2025
    expect(mockOnDateChange).toHaveBeenCalledWith(expect.stringContaining('2025')); // Check if the correct date format is called
  });
  test('handles clicks outside dropdowns', () => {
    const { container } = render(<MonthYearPicker label="Select Date" name="date" id="date" onDateChange={mockOnDateChange} />);
    fireEvent.click(screen.getByTestId('month-dropdown')); // Open month dropdown
    expect(screen.getByText('January')).toBeInTheDocument(); // Check if dropdown is open
    fireEvent.mouseDown(container); // Click outside
    expect(screen.queryByText('January')).not.toBeInTheDocument(); // Check if dropdown is closed
  });

  test('disables dropdowns when initialDate is not provided', () => {
    render(<MonthYearPicker label="Select Date" name="date" id="date" onDateChange={mockOnDateChange} />);
    expect(screen.getByTestId('month-dropdown')).toHaveClass('dropdown--disabled');
    expect(screen.getByTestId('year-dropdown')).toHaveClass('dropdown--disabled');
  });

  test('handles invalid ISO date string', () => {
    expect(() => parseISODate('invalid-date')).toThrow('Invalid ISO date string');
  }); */

  // Additional tests for edge cases can be added here
});

