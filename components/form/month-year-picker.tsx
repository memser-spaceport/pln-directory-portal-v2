import React, { useState, useEffect, useRef } from 'react';

interface MonthYearPickerProps {
  initialDate?: string; // ISO datetime string
  label: string;
  minMonth?: number; // Minimum month number (1-12)
  minYear?: number; // Minimum year number
  maxMonth?: number; // Maximum month number (1-12)
  maxYear?: number; // Maximum year number
  dayValue?: 'start' | 'end'; // Whether to use start or end of month for day value
  name: string;
  id: string;
  onDateChange: (value: string) => void
}

const parseISODate = (isoDate: string) => {
  const regex = /^(\d{4})-(\d{2})/;
  const match = isoDate.match(regex);
  if (match) {
    return { year: parseInt(match[1], 10), month: parseInt(match[2], 10) };
  } else {
    throw new Error('Invalid ISO date string');
  }
};
const formatISODate = (month: number, year: number, dayValue: 'start' | 'end' = 'start') => {
  const validatedMonth = Math.max(1, Math.min(12, month));
  const validatedYear = Math.max(1, year);

  const lastDayOfMonth = new Date(validatedYear, validatedMonth, 0).getDate();

  if (dayValue === 'start') {
    return `${validatedYear}-${String(validatedMonth).padStart(2, '0')}-01T00:00:00.000Z`;
  } else {
    return `${validatedYear}-${String(validatedMonth).padStart(2, '0')}-${lastDayOfMonth}T00:00:00.000Z`;
  }
};

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  initialDate,
  label,
  minMonth = 1,
  minYear = new Date().getFullYear() - 50,
  maxMonth = 12,
  maxYear = new Date().getFullYear(),
  dayValue = 'start',
  name,
  id,
  onDateChange
}) => {
  const initialMonthYear = initialDate ? parseISODate(initialDate) : null;
  const [selectedDate, setSelectedDate] = useState(initialMonthYear);
  const [isMonthDpActive, setMonthDpStatus] = useState(false);
  const [isYearDpActive, setYearDpStatus] = useState(false);
  const monthDropdownRef = useRef<HTMLDivElement | null>(null);
  const yearDropdownRef = useRef<HTMLDivElement | null>(null);
  const disabled = !initialDate;
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
  const currentMonth = initialMonthYear?.month  ? initialMonthYear?.month - 1 : 1;


  const onMonthSelected = (e: any, index: number) => {
    e.preventDefault(); 
    e.stopPropagation();
    if(initialMonthYear?.year) {
      onDateChange(formatISODate(index, initialMonthYear?.year)); // Format and change date
    }
    setMonthDpStatus(false);
  };

  const onYearSelected = (e: any, year: number) => {
    e.preventDefault();
    e.stopPropagation();
    if(initialMonthYear?.month) {
      onDateChange(formatISODate(initialMonthYear.month, year)); // Format and change date
    }
    setYearDpStatus(false);
  };

  // Effect to handle clicks outside the dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        monthDropdownRef.current &&
        !monthDropdownRef.current.contains(event.target as Node)
      ) {
        setMonthDpStatus(false); // Close month dropdown if clicked outside
      }
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(event.target as Node)
      ) {
        setYearDpStatus(false); // Close year dropdown if clicked outside
      }
    };

    document.addEventListener('mousedown', handleClickOutside); // Add event listener
    return function(){
      document.removeEventListener('mousedown', handleClickOutside); // Cleanup listener
    };
  },[]);
 

  return <>
      <div className="month-year-field" data-testid="month-year-picker"> {/* Added data-testid */}
        <label className={`month-year-field__label ${disabled ? 'label--disabled' : ''}`}>{label}* </label>
        <div className={`month-year-field__dropdowns ${disabled ? 'month-year-field__dropdowns--disabled' : ''}`}>
          <div
            ref={monthDropdownRef}
            className={`month-year-field__dropdown month-dropdown ${disabled ? 'dropdown--disabled' : ''}`}
            onClick={() => !disabled && setMonthDpStatus((v) => !v)}
            data-testid="month-dropdown" 
          >
            {!disabled && <p className="month-year-field__dropdown-text">{monthNames[currentMonth]}</p>}
            {disabled && <p className="month-year-field__dropdown-text">Month</p>}
            {!disabled && <img className="month-year-field__dropdown-icon" src="/icons/arrow-down.svg" alt="expand icon" />}
            {isMonthDpActive && !disabled && (
              <div className="month-year-field__dropdown-pane">
                {monthNames.map((monthName, index) => (
                  <div
                    key={`month-${index}`}
                    className={`month-year-field__dropdown-item dropdown-item ${currentMonth === index ? 'active' : ''}`}
                    onClick={(e) => onMonthSelected(e, index + 1)}
                    data-testid={`month-item-${monthName}`} 
                  >
                    <p>{monthName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div
            ref={yearDropdownRef}
            className={`month-year-field__dropdown year-dropdown ${disabled ? 'dropdown--disabled' : ''}`}
            onClick={() => !disabled && setYearDpStatus((v) => !v)}
            data-testid="year-dropdown" 
          >
            {!disabled && <p className="month-year-field__dropdown-text">{initialMonthYear?.year}</p>}
            {disabled && <p className="month-year-field__dropdown-text">Year</p>}
            {!disabled && <img className="month-year-field__dropdown-icon" src="/icons/arrow-down.svg" alt="expand icon" />}
            {isYearDpActive && !disabled && (
              <div className="month-year-field__dropdown-pane">
                {years.map((year, index) => (
                  <div
                    key={`year-${index}`}
                    className={`month-year-field__dropdown-item dropdown-item ${initialMonthYear?.year === year ? 'active' : ''}`}
                    onClick={(e) => onYearSelected(e, year)}
                    data-testid={`year-item-${year}`}
                  >
                    <p>{year}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {initialMonthYear && (
          <input
            id={id}
            type="hidden"
            name={name}
            value={formatISODate(initialMonthYear.month, initialMonthYear.year, dayValue)}
            data-testid="hidden-input" 
          />
        )}
      </div>
      <style jsx>
        {`
          .month-year-field {
            /* Container styles */
          }
          .month-year-field__label {
            font-size: 14px;
            font-weight: 600;
            text-transform: capitalize;
          }
          .label--disabled {
            color: #cbd5e1;
          }
          .month-year-field__hidden-input {
            display: none;
          }
          .month-year-field__dropdowns {
            display: flex;
            gap: 8px;
            margin-top: 12px;
          }
          .month-year-field__dropdown {
            /* Dropdown container styles */
            padding: 8px 12px;
            border: 1px solid lightgrey;
            font-size: 14px;
            cursor: pointer;
            border-radius: 8px;
            display: flex;
            gap: 8px;
            justify-content: space-between;
            align-items: center;
            position: relative;
          }
          .month-dropdown {
            width: 115px;
          }
          .year-dropdown {
            width: 80px;
          }
          .dropdown--disabled {
            background: #f5f5f5;
          }
          .month-year-field__dropdowns--disabled {
            pointer-events: none;
            color: #cbd5e1;
          }
          .month-year-field__dropdown-text {
            /* Dropdown text styles */
          }
          .month-year-field__dropdown-icon {
            /* Dropdown arrow styles */
          }
          .month-year-field__dropdown-pane {
            /* Dropdown pane styles */
            padding: 8px;
            border: 1px solid grey;
            height: 100px;
            position: absolute;
            bottom: -102px;
            background: white;
            font-size: 12px;
            left: 0;
            right: 0;
            overflow-y: auto;
            overflow-x: hidden;
            z-index: 2;
          }
          .month-year-field__dropdown-item {
            /* Dropdown item styles */
            padding: 8px;
            color: black;
            border-radius: 2px;
            background: white;
          }
          .month-year-field__dropdown-item.active {
            /* Active dropdown item styles */
            color: white;
            background: #156ff7;
          }
        `}
      </style>
    </>
};

export default MonthYearPicker;
