import { useEffect, useRef, useState } from 'react';

interface MonthYearFieldProps {
  label: string;
  defaultValue?: Date | string;
  id: string;
  name: string;
  disabled?: boolean;
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

const MonthYearField: React.FC<MonthYearFieldProps> = ({ label, dateBoundary = 'start', disabled = false, name, defaultValue, onChange }: MonthYearFieldProps) => {
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

  // Event handlers
  const onMonthSelected = (e:any, index: number): void => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedMonth(index);
    setMonthDpStatus(false);
  };

  const onYearSelected = (e:any, index: number): void => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedYear(yearValues[index]);
    setYearDpStatus(false);
  };

  const formatDate = (year: number, month: number): string => {
    const date = dateBoundary === 'start' ? new Date(Date.UTC(year, month, 1)) : new Date(Date.UTC(year, month + 1, 0));
    return date.toISOString().slice(0, 10); // ISO date string format (YYYY-MM-DD)
  };

  // Effect for updating input field and parent component on change
  useEffect(() => {
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
    <div className="month-year-field">
      <label className="month-year-field__label">{label}</label>
      <input name={name} ref={inputRef} type="text" className="month-year-field__hidden-input" defaultValue={formatDate(defaultYear, defaultMonth)} readOnly />
      <div className={`month-year-field__dropdowns ${disabled ? 'month-year-field__dropdowns--disabled' : ''}`}>
        <div ref={monthDropdownRef} className="month-year-field__dropdown month-dropdown" onClick={() => !disabled && setMonthDpStatus((v) => !v)}>
          {!disabled && <p className="month-year-field__dropdown-text">{monthNames[selectedMonth]}</p>}
          {disabled && <p className="month-year-field__dropdown-text">Month</p>}
          {!disabled && <img className="month-year-field__dropdown-icon" src="/icons/arrow-down.svg" alt="expand icon" />}
          {isMonthDpActive && !disabled && (
            <div className="month-year-field__dropdown-pane">
              {monthNames.map((monthName, index) => (
                <div key={`month-${index}`} className={`month-year-field__dropdown-item dropdown-item ${selectedMonth === index ? 'active' : ''}`} onClick={(e) => onMonthSelected(e, index)}>
                  <p>{monthName}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div ref={yearDropdownRef} className="month-year-field__dropdown year-dropdown" onClick={() => !disabled && setYearDpStatus((v) => !v)}>
          {!disabled && <p className="month-year-field__dropdown-text">{selectedYear}</p>}
          {disabled && <p className="month-year-field__dropdown-text">Year</p>}
          {!disabled && <img className="month-year-field__dropdown-icon" src="/icons/arrow-down.svg" alt="expand icon" />}
          {isYearDpActive && !disabled && (
            <div className="month-year-field__dropdown-pane">
              {yearValues.map((year, index) => (
                <div key={`year-${index}`} className={`month-year-field__dropdown-item dropdown-item ${selectedYear === year ? 'active' : ''}`} onClick={(e) => onYearSelected(e, index)}>
                  <p>{year}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .month-year-field {
          /* Container styles */
        }
        .month-year-field__label {
          font-size: 14px;
          font-weight: 600;
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
        .month-year-field__dropdowns--disabled {
          opacity: 0.6;
          pointer-events: none;
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
