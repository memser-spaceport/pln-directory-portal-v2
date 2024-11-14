import { useEffect, useRef, useState } from 'react';

// Interface for MonthYearField component props
interface MonthYearFieldProps {
  label: string;
  defaultValue?: Date | string;
  id: string;
  name: string;
  disabled?: boolean;
  value?: string;
  dateBoundary?: 'start' | 'end';
  onChange: (dateString: string) => void;
}

// Generate list of years
const getYears = (): number[] => {
  const currentYear = new Date().getFullYear();
  const start = currentYear - 50;
  const years = [];
  for (let year = start; year <= currentYear; year++) {
    years.push(year);
  }
  return years;
};

// Month names constant
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const MonthYearField: React.FC<MonthYearFieldProps> = ({ label, dateBoundary = 'start', value, disabled = false, name, defaultValue, onChange }: MonthYearFieldProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const monthDropdownRef = useRef<HTMLDivElement | null>(null);
  const yearDropdownRef = useRef<HTMLDivElement | null>(null);
  const yearValues = getYears();
  const defaultDateValue = defaultValue ? new Date(defaultValue) : new Date();
  const defaultYear = defaultDateValue.getFullYear();
  const defaultMonth = defaultDateValue.getMonth();
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [isMonthDpActive, setMonthDpStatus] = useState(false);
  const [isYearDpActive, setYearDpStatus] = useState(false);

  // Event handler for selecting a month
  const onMonthSelected = (e: any, index: number): void => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedMonth(index);
    setMonthDpStatus(false);
  };

  // Event handler for selecting a year
  const onYearSelected = (e: any, index: number): void => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedYear(yearValues[index]);
    setYearDpStatus(false);
  };

  const formatDate = (year: number, month: number): string => {
    const date = dateBoundary === 'start' ? new Date(Date.UTC(year, month, 1)) : new Date(Date.UTC(year, month + 1, 0));
    return date.toISOString().slice(0, 10); // ISO date string format (YYYY-MM-DD)
  };

  useEffect(() => {
    if (value && inputRef.current) {
      inputRef.current.value = value;
      const newDateValue = new Date(value);
      const newYear = newDateValue.getFullYear();
      const newMonth = newDateValue.getMonth();
      setSelectedYear(newYear);
      setSelectedMonth(newMonth);
    }
  }, [value]);

  // Effect for updating input field and parent component on change
  useEffect(() => {
    if (selectedYear && selectedMonth) {
      const formattedDate = formatDate(selectedYear, selectedMonth);
      if (inputRef.current) {
        if (disabled) {
          inputRef.current.value = '';
          onChange('');
        } else {
          inputRef.current.value = formattedDate;
          onChange(formattedDate);
        }
      }
    }
  }, [selectedYear, selectedMonth, disabled]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        monthDropdownRef.current &&
        !monthDropdownRef.current.contains(event.target as Node)
      ) {
        setMonthDpStatus(false);
      }
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(event.target as Node)
      ) {
        setYearDpStatus(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="month-year-field" data-testid="month-year-field">
      <label className={`month-year-field__label ${disabled ? 'label--disabled' : ''}`} data-testid="month-year-label">{label}</label>
      <input name={name} ref={inputRef} type="text" className="month-year-field__hidden-input" data-testid="month-year-input" />
      <div className={`month-year-field__dropdowns ${disabled ? 'month-year-field__dropdowns--disabled' : ''}`}>
        <div ref={monthDropdownRef} className={`month-year-field__dropdown month-dropdown ${disabled ? 'dropdown--disabled' : ''}`} onClick={() => !disabled && setMonthDpStatus((v) => !v)} data-testid="month-dropdown">
          {!disabled && <p className="month-year-field__dropdown-text">{monthNames[selectedMonth]}</p>}
          {disabled && <p className="month-year-field__dropdown-text">Month</p>}
          {!disabled && <img className="month-year-field__dropdown-icon" src="/icons/arrow-down.svg" alt="expand icon" />}
          {isMonthDpActive && !disabled && (
            <div className="month-year-field__dropdown-pane">
              {monthNames.map((monthName, index) => (
                <div key={`month-${index}`} className={`month-year-field__dropdown-item dropdown-item ${selectedMonth === index ? 'active' : ''}`} onClick={(e) => onMonthSelected(e, index)} data-testid={`month-item-${index}`}>
                  <p>{monthName}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div ref={yearDropdownRef} className={`month-year-field__dropdown year-dropdown ${disabled ? 'dropdown--disabled' : ''}`} onClick={() => !disabled && setYearDpStatus((v) => !v)} data-testid="year-dropdown">
          {!disabled && <p className="month-year-field__dropdown-text">{selectedYear}</p>}
          {disabled && <p className="month-year-field__dropdown-text">Year</p>}
          {!disabled && <img className="month-year-field__dropdown-icon" src="/icons/arrow-down.svg" alt="expand icon" />}
          {isYearDpActive && !disabled && (
            <div className="month-year-field__dropdown-pane">
              {yearValues.map((year, index) => (
                <div key={`year-${index}`} className={`month-year-field__dropdown-item dropdown-item ${selectedYear === year ? 'active' : ''}`} onClick={(e) => onYearSelected(e, index)} data-testid={`year-item-${index}`}>
                  <p>{year}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Styles for the component */}
      <style jsx>{`
        .month-year-field {
          /* Container styles */
        }
        .month-year-field__label {
          font-size: 14px;
          font-weight: 600;
        }

         .label--disabled {
           color: #CBD5E1;
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
         .dropdown--disbaled {
            background: #f5f5f5;
         }
        .month-year-field__dropdowns--disabled {
         
          pointer-events: none;
          color: #CBD5E1;
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
      `}</style>
    </div>
  );
};

export default MonthYearField;
