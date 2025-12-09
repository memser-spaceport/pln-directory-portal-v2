'use client';

import clsx from 'clsx';
import isNil from 'lodash/isNil';
import isEmpty from 'lodash/isEmpty';
import React, { useEffect, useRef, useState } from 'react';

import s from './Dropdown.module.scss';

interface Option {
  [key: string]: any;
}

interface DropdownProps {
  options: Option[];
  selectedOption: any;
  onItemSelect: (selectedOption: Option | null) => void;
  uniqueKey: string;
  displayKey: string;
  placeholder?: string;
  isMandatory?: boolean;
  arrowImgUrl?: string;
  label?: string;
  id: string;
  onDropdownClicked?: () => void;
  count?: any;
  classes?: {
    label?: string;
    ddRoot?: string;
    option?: string;
    selectedOption?: string;
  };
}

export function Dropdown(props: DropdownProps) {
  const {
    options,
    selectedOption,
    onItemSelect,
    uniqueKey,
    displayKey,
    placeholder = 'Select',
    isMandatory = false,
    arrowImgUrl,
    label,
    id,
    onDropdownClicked,
    count,
    classes,
  } = props;

  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);
  const [showOptions, setShowOptions] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const defaultSelectedValue = selectedOption ? selectedOption[displayKey] : '';
  const onContainerClickHandler = onDropdownClicked;

  const handleOptionClick = (option: Option) => {
    if (searchRef.current) {
      searchRef.current.value = option[displayKey];
    }
    onItemSelect(option);
    setShowOptions(false);
    setFilteredOptions(options);
  };

  const onSearchFocus = () => {
    setShowOptions(!showOptions);
  };

  useEffect(() => {
    setFilteredOptions(options);
  }, [options]);

  useEffect(() => {
    if (searchRef.current && selectedOption && selectedOption[displayKey]) {
      searchRef.current.value = selectedOption[displayKey];
    }
  }, [selectedOption, displayKey]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={s.root}>
      {label && (
        <label className={clsx(s.label, classes?.label)} htmlFor={id}>
          {label}
        </label>
      )}
      <div
        onClick={() => {
          if (onContainerClickHandler) {
            onContainerClickHandler();
          }
        }}
        ref={containerRef}
        className={s.container}
      >
        <div
          id={id}
          className={clsx(s.select, classes?.ddRoot, {
            [s.error]: isMandatory && !selectedOption?.[uniqueKey],
          })}
          onClick={onSearchFocus}
        >
          <span className={s.value}>{defaultSelectedValue || placeholder}</span>
          {!isNil(count) && <span className={s.count}>{count}</span>}
        </div>

        {arrowImgUrl && (
          <img
            onClick={onSearchFocus}
            className={s.arrowIcon}
            src={arrowImgUrl}
            width="10"
            height="7"
            alt="arrow down"
          />
        )}
        {showOptions && (
          <ul className={s.options}>
            {filteredOptions?.map((option) => (
              <li
                key={option[uniqueKey]}
                onClick={() => handleOptionClick(option)}
                className={clsx(s.optionItem, classes?.option, {
                  [s.selected]: option === selectedOption,
                  [classes?.selectedOption || '']: option === selectedOption,
                })}
              >
                {option[displayKey]} {option.count && <span className={s.optionItemCount}>({option.count})</span>}
              </li>
            ))}
            {isEmpty(filteredOptions) && <p className={s.noResults}>No results found</p>}
          </ul>
        )}
      </div>
    </div>
  );
}
