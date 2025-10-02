'use client';

import { clsx } from 'clsx';
import isEmpty from 'lodash/isEmpty';
import React, { PointerEvent, useEffect, useMemo, useRef, useState } from 'react';

import s from './MultiSelect.module.scss';

interface Option {
  [key: string]: any;
}

interface MultiSelectProps {
  options: Option[];
  selectedOptions: Option[];
  onAdd: (selectedOptions: Option) => void;
  onRemove: (selectedOptions: Option) => void;
  uniqueKey: string;
  displayKey: string;
  placeholder?: string;
  isMandatory?: boolean;
  arrowImgUrl?: string;
  closeImgUrl: string;
  label?: string;
}

function MultiSelect(props: MultiSelectProps) {
  const {
    options,
    selectedOptions,
    onAdd,
    onRemove,
    uniqueKey,
    displayKey,
    placeholder = 'Select options...',
    isMandatory = false,
    arrowImgUrl,
    closeImgUrl,
    label = '',
  } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [searchStr, setSearchStr] = useState('');

  function focusInput() {
    inputRef.current?.focus();
    setSearchStr('');
  }

  // State to manage the visibility of options
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Memoize selected option IDs for filtering
  const selectedOptionIds = useMemo(() => selectedOptions.map((option) => option[uniqueKey]), [selectedOptions]);

  // Memoize available options to prevent unnecessary recalculations
  const availableOptions = useMemo(
    () =>
      options.filter((option) => {
        const value = option[displayKey];

        const isSelected = !selectedOptionIds.includes(option[uniqueKey]);
        const matchesSearch = value.toString().toLowerCase().includes(searchStr.toLowerCase());

        return isSelected && matchesSearch;
      }),
    [options, searchStr, selectedOptionIds],
  );

  // Handle adding an option
  const handleOptionClick = (option: Option) => {
    onAdd(option);
    focusInput();
  };

  // Handle removing an option
  const handleRemoveOption = (e: PointerEvent<HTMLImageElement>, optionToRemove: Option) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(optionToRemove);
  };

  // Toggle the visibility of options
  const toggleOptionsVisibility = () => {
    setIsOptionsVisible((prev) => {
      const visible = !prev;

      if (visible) {
        focusInput();
      } else {
        setSearchStr('');
      }

      return visible;
    });
  };

  useEffect(() => {
    // Close options when clicking outside the component
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSearchStr('');
        setIsOptionsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const noSelectedOptions = isEmpty(selectedOptions);

  return (
    <div
      className={clsx(s.root, {
        [s.empty]: noSelectedOptions,
      })}
      data-testid="form-ms"
    >
      {label && <label className={s.label}>{label}</label>}
      <div className={s.content} ref={containerRef}>
        {/* Wrapper for selected options */}
        <div
          className={clsx(s.selectedOptions, {
            [s.error]: noSelectedOptions && isMandatory,
          })}
          onClick={toggleOptionsVisibility}
          data-testid="form-msselected-options"
        >
          <div className={s.optionsWrapper}>
            {selectedOptions.map((option) => (
              <div key={option[uniqueKey]} className={s.selectedOption}>
                {option[displayKey]}
                <img
                  width="16"
                  height="16"
                  alt="Remove option"
                  data-testid={`form-ms-close-icon-${option[uniqueKey]}`}
                  src={closeImgUrl}
                  className={s.removeOption}
                  onPointerDown={(e) => handleRemoveOption(e, option)}
                />
              </div>
            ))}
            <div className={s.searchWrapper}>
              <div className={s.expandLine}>{searchStr}</div>
              <input
                ref={inputRef}
                value={searchStr}
                className={clsx(s.input, {
                  [s.emptyInput]: !searchStr,
                })}
                placeholder={noSelectedOptions ? placeholder : ''}
                onChange={(e) => setSearchStr(e.target.value)}
              />
            </div>
          </div>
          {arrowImgUrl && <img className={s.arrowImg} src={arrowImgUrl} width="10" height="7" alt="Toggle options" />}
        </div>

        {/* Dropdown options list */}
        {isOptionsVisible && (
          <ul className={s.options} data-testid="form-ms-options-list">
            {availableOptions.map((option: any) => (
              <li
                key={option[uniqueKey]}
                onClick={() => handleOptionClick(option)}
                className={clsx(s.option, {
                  [s.selected]: selectedOptions.some(
                    (selectedOption) => selectedOption[uniqueKey] === option[uniqueKey],
                  ),
                })}
              >
                {option[displayKey]}
              </li>
            ))}
            {isEmpty(availableOptions) && <p className={s.noResults}>No data available</p>}
          </ul>
        )}
      </div>
    </div>
  );
}

export default MultiSelect;
