import { render, screen, fireEvent } from '@testing-library/react';
import MonthYearField from '../../components/form/month-year-field';
import '@testing-library/jest-dom';
describe('MonthYearField Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<MonthYearField label="Select Date" id="date" name="date" onChange={mockOnChange} />);
    expect(screen.getByText('Select Date')).toBeInTheDocument();
    expect(screen.getByTestId('month-year-input')).toBeInTheDocument();
  });

  it('renders with default value', () => {
    render(<MonthYearField label="Select Date" id="date" name="date" value="2024-10-01" onChange={mockOnChange} />);
    expect(screen.getByTestId('month-year-input').value).not.toBeNull();
  });

  it('opens month dropdown on click', () => {
    render(<MonthYearField label="Select Date" id="date" name="date" onChange={mockOnChange} />);
    fireEvent.click(screen.getByTestId('month-dropdown'));
    expect(screen.getByText('January')).toBeInTheDocument(); // Check if January is displayed
  });

  it('selects a month', () => {
    render(<MonthYearField label="Select Date" id="date" name="date" onChange={mockOnChange} />);
    fireEvent.click(screen.getByTestId('month-dropdown'));
    fireEvent.click(screen.getByTestId('month-item-1')); // Select February
    expect(screen.getByText('February')).toBeInTheDocument();
  });

  it('opens year dropdown on click', () => {
    render(<MonthYearField label="Select Date" id="date" name="date" onChange={mockOnChange} />);
    fireEvent.click(screen.getByTestId('year-dropdown'));
    expect(screen.getByText((new Date().getFullYear() - 1).toString())).toBeInTheDocument(); // Check if current year is displayed
  });

});

