import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import s from './MonthYearSelect.module.scss';
import clsx from 'clsx';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';

const getYearOptions = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => {
    const year = (start + i).toString();
    return { value: year, label: year };
  });

const yearOptions = getYearOptions(2000, new Date().getFullYear());

const monthOptions = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

interface Props {
  onChange: (isoDate: string | null) => void;
  value: string | null; // ISO string like "2025-03-01T00:00:00.000Z"
  label: string;
  disabled?: boolean;
  error?: string | undefined;
  isRequired?: boolean;
}

export const MonthYearSelect = ({ label, value, onChange, disabled, error, isRequired }: Props) => {
  const [month, setMonth] = useState<{ value: string; label: string } | null>(null);
  const [year, setYear] = useState<{ value: string; label: string } | null>(null);
  const justSynced = useRef(false);

  // Sync internal state from parent value
  useEffect(() => {
    if (!value) {
      setMonth(null);
      setYear(null);
      return;
    }

    const date = new Date(value);
    const newMonth = monthOptions.find((m) => m.value === String(date.getUTCMonth() + 1).padStart(2, '0'));
    const newYear = yearOptions.find((y) => y.value === String(date.getUTCFullYear()));

    justSynced.current = true;
    setMonth(newMonth || null);
    setYear(newYear || null);

    // Prevent firing onChange after sync
    setTimeout(() => {
      justSynced.current = false;
    }, 0);
  }, [value]);

  useScrollIntoViewOnFocus<HTMLInputElement>({ id: label });

  const emitChange = (newMonth: typeof month, newYear: typeof year) => {
    if (justSynced.current) return;
    if (newMonth && newYear) {
      const date = new Date(Date.UTC(+newYear.value, +newMonth.value - 1, 1));
      onChange(date.toISOString());
    } else {
      onChange(null);
    }
  };

  const handleMonthChange = (selected: any) => {
    setMonth(selected);
    emitChange(selected, year);
  };

  const handleYearChange = (selected: any) => {
    setYear(selected);
    emitChange(month, selected);
  };

  return (
    <div
      className={clsx(s.root, {
        [s.disabled]: disabled,
      })}
    >
      <div
        className={clsx(s.label, {
          [s.required]: isRequired,
        })}
      >
        {label}
      </div>
      <div className={s.body}>
        <Select
          menuPlacement="auto"
          placeholder="Month"
          options={monthOptions}
          value={month}
          onChange={handleMonthChange}
          isDisabled={disabled}
          inputId={label}
          styles={{
            container: (base) => ({
              ...base,
              width: '100%',
            }),
            control: (baseStyles) => ({
              ...baseStyles,
              alignItems: 'center',
              gap: '8px',
              alignSelf: 'stretch',
              borderRadius: '8px',
              border: '1px solid rgba(203, 213, 225, 0.50)',
              background: '#fff',
              outline: 'none',
              minWidth: '140px',
              width: '100%',
              borderColor: 'rgba(203, 213, 225, 0.50) !important',
              position: 'relative',
              fontSize: '16px',
              color: '#455468',
              boxShadow: 'none !important',
              '&:hover': {
                border: '1px solid #5E718D',
                boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
                borderColor: '#5E718D !important',
              },
              '&:focus-visible, &:focus': {
                borderColor: '#5E718D !important',
                boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
              },
              ...(error
                ? {
                    borderColor: 'var(--action-border-error-focus) !important',
                  }
                : {}),
            }),
            input: (baseStyles) => ({
              ...baseStyles,
              height: '42px',
              padding: 0,
              // background: 'tomato',
            }),
            option: (baseStyles) => ({
              ...baseStyles,
              fontSize: '14px',
              fontWeight: 300,
              color: '#455468',
              '&:hover': {
                background: 'rgba(27, 56, 96, 0.12)',
              },
            }),
            menu: (baseStyles) => ({
              ...baseStyles,
              outline: 'none',
              zIndex: 3,
            }),
            indicatorSeparator: (base) => ({
              display: 'none',
            }),
          }}
        />
        <Select
          menuPlacement="auto"
          placeholder="Year"
          options={yearOptions}
          value={year}
          onChange={handleYearChange}
          isDisabled={disabled}
          styles={{
            container: (base) => ({
              ...base,
              width: '100%',
            }),
            control: (baseStyles) => ({
              ...baseStyles,
              alignItems: 'center',
              gap: '8px',
              alignSelf: 'stretch',
              borderRadius: '8px',
              border: '1px solid rgba(203, 213, 225, 0.50)',
              background: '#fff',
              outline: 'none',
              minWidth: '140px',
              width: '100%',
              borderColor: 'rgba(203, 213, 225, 0.50) !important',
              position: 'relative',
              fontSize: '16px',
              color: '#455468',
              boxShadow: 'none !important',
              '&:hover': {
                border: '1px solid #5E718D',
                boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
                borderColor: '#5E718D !important',
              },
              '&:focus-visible, &:focus': {
                borderColor: '#5E718D !important',
                boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
              },
              ...(error
                ? {
                    borderColor: 'var(--action-border-error-focus) !important',
                  }
                : {}),
            }),
            input: (baseStyles) => ({
              ...baseStyles,
              height: '42px',
              padding: 0,
              // background: 'tomato',
            }),
            option: (baseStyles) => ({
              ...baseStyles,
              fontSize: '14px',
              fontWeight: 300,
              color: '#455468',
              '&:hover': {
                background: 'rgba(27, 56, 96, 0.12)',
              },
            }),
            menu: (baseStyles) => ({
              ...baseStyles,
              outline: 'none',
              zIndex: 3,
            }),
            indicatorSeparator: (base) => ({
              display: 'none',
            }),
          }}
        />
      </div>
      {error && <div className={s.errorMsg}>{error}</div>}
    </div>
  );
};
