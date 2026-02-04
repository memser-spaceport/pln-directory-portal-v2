'use client';

import React, { useState, useRef, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { createPortal } from 'react-dom';
import { useMedia } from 'react-use';

import s from './DateRangePicker.module.scss';
import { AnimatePresence, motion } from 'framer-motion';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export interface DateRangePickerProps {
  label?: string;
  placeholder?: string;
  value: [Date, Date] | null;
  onChange: (range: [Date, Date] | null) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

function formatDateRange(range: [Date, Date] | null): string {
  if (!range) return '';
  const [start, end] = range;
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function DateRangePicker({
  label = 'Select date range',
  placeholder = 'Select date range',
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<Value>(value);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isMobile = useMedia('(max-width: 767px)', false);

  // Sync tempRange with value when opening
  useEffect(() => {
    if (isOpen) {
      setTempRange(value);
    }
  }, [isOpen, value]);

  // Handle click outside for desktop dropdown
  useEffect(() => {
    if (!isOpen || isMobile) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isMobile]);

  // Prevent body scroll when mobile panel is open
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

  const handleCalendarChange = (newValue: Value) => {
    setTempRange(newValue);
    // Auto-apply when both start and end dates are selected
    if (Array.isArray(newValue) && newValue[0] && newValue[1]) {
      onChange([newValue[0], newValue[1]]);
      setIsOpen(false);
    }
  };

  // const handleClose = () => {
  //   setTempRange(value);
  //   setIsOpen(false);
  // };

  const handleClear = () => {
    setTempRange(null);
    onChange(null);
  };

  const displayValue = formatDateRange(value);
  const hasSelection = Array.isArray(tempRange) ? tempRange[0] !== null : tempRange !== null;

  const toggleOpen = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const renderCalendarPanel = () => (
    <div className={s.calendarPanel}>
      <div className={s.calendarContent}>
        <div className={s.datePickerSection}>
          <div className={s.datePickerLabelRow}>
            <span className={s.datePickerLabel}>{label}</span>
            {hasSelection && (
              <button type="button" className={s.datePickerClearButton} onClick={handleClear}>
                Clear
              </button>
            )}
          </div>
          <div className={s.datePickerInput}>
            <span className={tempRange ? s.datePickerInputValue : ''}>
              {formatDateRange(
                Array.isArray(tempRange) && tempRange[0] && tempRange[1] ? [tempRange[0], tempRange[1]] : null,
              ) || placeholder}
            </span>
          </div>
        </div>
        <div className={s.calendarInline}>
          <Calendar
            onChange={handleCalendarChange}
            value={tempRange}
            selectRange
            minDate={minDate}
            maxDate={maxDate}
            showFixedNumberOfWeeks
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className={s.root}>
      {/* Toggle Button */}
      <button
        ref={triggerRef}
        type="button"
        className={`${s.toggleButton} ${disabled ? s.toggleButtonDisabled : ''}`}
        onClick={toggleOpen}
        disabled={disabled}
      >
        <span className={s.toggleLabel}>{label}</span>
        <div className={`${s.toggleInput} ${disabled ? s.toggleInputDisabled : ''}`}>
          <span className={displayValue ? s.toggleValue : s.togglePlaceholder}>{displayValue || placeholder}</span>
        </div>
      </button>

      {/* Desktop Dropdown */}
      <AnimatePresence>
        {isOpen && !isMobile && (
          <motion.div
            ref={dropdownRef}
            className={s.dropdown}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {renderCalendarPanel()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Fullscreen Panel */}
      {isOpen &&
        isMobile &&
        typeof window !== 'undefined' &&
        createPortal(
          <div className={s.mobileOverlay}>
            <div className={s.mobilePanel}>
              <div className={s.mobileHeader}>
                <span className={s.mobileTitle}>{label}</span>
                <button type="button" className={s.mobileCloseButton} onClick={() => setIsOpen(false)}>
                  <CloseIcon />
                </button>
              </div>
              {renderCalendarPanel()}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15 5L5 15M5 5L15 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
