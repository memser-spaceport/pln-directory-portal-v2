import { useState, useEffect } from 'react';
import MonthYearField from './month-year-field';
// import MonthYearField from './MonthYearField'; // Adjust path based on your project structure

interface MonthYearRangeFieldProps {
  startDate?: Date;
  endDate?: Date;
}

const MonthYearRangeField: React.FC<MonthYearRangeFieldProps> = ({
  startDate: userStartDate,
  endDate: userEndDate,
}: MonthYearRangeFieldProps) => {
  // Calculate default values
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const startYear = currentYear - 50;

  // State for start and end dates
  const [startDate, setStartDate] = useState<Date>(
    userStartDate || new Date(startYear, currentMonth)
  );
  const [endDate, setEndDate] = useState<Date>(
    userEndDate || new Date()
  );

  // Update state if user-provided props change
  useEffect(() => {
    if (userStartDate) {
      setStartDate(userStartDate);
    }
  }, [userStartDate]);

  useEffect(() => {
    if (userEndDate) {
      setEndDate(userEndDate);
    }
  }, [userEndDate]);

  const handleStartDateChange = (dateString: string): void => {
    const [year, month] = dateString.split('-').map(Number);
    setStartDate(new Date(year, month - 1));
  };

  const handleEndDateChange = (dateString: string): void => {
    const [year, month] = dateString.split('-').map(Number);
    setEndDate(new Date(year, month - 1));
  };

  return (
    <div className="month-year-range-field">
      <div className="month-year-range-field__item">
        <label className="month-year-range-field__label">Start Date</label>
        <MonthYearField
          label="Start Date"
          id="startDateMonthYear"
          name="startDateMonthYear"
          defaultValue={startDate}
          onChange={handleStartDateChange}
        />
      </div>
      <div className="month-year-range-field__item">
        <label className="month-year-range-field__label">End Date</label>
        <MonthYearField
          label="End Date"
          id="endDateMonthYear"
          name="endDateMonthYear"
          defaultValue={endDate}
          onChange={handleEndDateChange}
        />
      </div>

      <style jsx>{`
        .month-year-range-field {
          display: flex;
          gap: 20px;
        }
        .month-year-range-field__item {
          flex: 1;
        }
        .month-year-range-field__label {
          font-weight: bold;
          margin-bottom: 5px;
        }
      `}</style>
    </div>
  );
};

export default MonthYearRangeField;
