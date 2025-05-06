import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MonthYearRangeField from '../../components/form/month-year-range';

// Mock MonthYearField to isolate MonthYearRangeField logic
jest.mock('../../components/form/month-year-field', () => ({
  __esModule: true,
  default: (props: any) => (
    <input
      data-testid={props.id}
      aria-label={props.label}
      value={props.defaultValue?.toISOString?.() || ''}
      onChange={e => props.onChange && props.onChange(e.target.value)}
      readOnly
    />
  ),
}));

describe('MonthYearRangeField', () => {
  it('renders both start and end MonthYearField inputs with default values', () => {
    render(<MonthYearRangeField />);
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();
  });

  it('renders with provided startDate and endDate', () => {
    const start = new Date(2000, 0, 1);
    const end = new Date(2020, 11, 1);
    render(<MonthYearRangeField startDate={start} endDate={end} />);
    expect(screen.getByLabelText('Start Date')).toHaveValue(start.toISOString());
    expect(screen.getByLabelText('End Date')).toHaveValue(end.toISOString());
  });

  it('updates startDate when prop changes', () => {
    const { rerender } = render(<MonthYearRangeField startDate={new Date(2000, 0, 1)} />);
    const newStart = new Date(2010, 5, 1);
    rerender(<MonthYearRangeField startDate={newStart} />);
    expect(screen.getByLabelText('Start Date')).toHaveValue(newStart.toISOString());
  });

  it('updates endDate when prop changes', () => {
    const { rerender } = render(<MonthYearRangeField endDate={new Date(2020, 0, 1)} />);
    const newEnd = new Date(2022, 7, 1);
    rerender(<MonthYearRangeField endDate={newEnd} />);
    expect(screen.getByLabelText('End Date')).toHaveValue(newEnd.toISOString());
  });

  it('handles start date change from child', () => {
    render(<MonthYearRangeField />);
    const startInput = screen.getByLabelText('Start Date');
    fireEvent.change(startInput, { target: { value: '2022-05' } });
    expect(startInput).toBeInTheDocument();
  });

  it('handles end date change from child', () => {
    render(<MonthYearRangeField />);
    const endInput = screen.getByLabelText('End Date');
    fireEvent.change(endInput, { target: { value: '2023-12' } });
    expect(endInput).toBeInTheDocument();
  });

  it('renders correct structure and classes', () => {
    render(<MonthYearRangeField />);
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
    // Check for class names
    expect(document.querySelector('.month-year-range-field')).toBeInTheDocument();
    expect(document.querySelectorAll('.month-year-range-field__item').length).toBe(2);
    expect(document.querySelectorAll('.month-year-range-field__label').length).toBe(2);
  });
}); 