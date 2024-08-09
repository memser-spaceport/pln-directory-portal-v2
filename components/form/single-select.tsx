'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Option {
  [key: string]: any;
}

interface SingleSelectProps {
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
  onSingleSelectClicked?: () => void;
}

const SingleSelect: React.FC<SingleSelectProps> = ({
  options,
  selectedOption,
  onItemSelect,
  uniqueKey,
  displayKey,
  placeholder = 'Select',
  isMandatory = false,
  arrowImgUrl,
  label = '',
  id,
  onSingleSelectClicked,
}) => {
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);
  const [showOptions, setShowOptions] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const defaultSelectedValue = selectedOption ? selectedOption[displayKey] : '';
  const onContainerClickHandler = onSingleSelectClicked;

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
    <>
      <div className="select">
        {label !== '' && (
          <label className="select__label" htmlFor={id}>
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
          className="select_cn"
        >
          <input
            id={id}
            className={`select__search ${isMandatory && !selectedOption?.[uniqueKey] ? 'select__search--error' : ''}`}
            ref={searchRef}
            defaultValue={defaultSelectedValue}
            onClick={onSearchFocus}
            placeholder={placeholder}
            readOnly
          />
          {arrowImgUrl && <img onClick={onSearchFocus} className="select__arrowimg" src={arrowImgUrl} width="10" height="7" alt="arrow down" />}
          {showOptions && (
            <ul className="select__options">
              {filteredOptions?.map((option) => (
                <li key={option[uniqueKey]} onClick={() => handleOptionClick(option)} className={`select__options__item ${option === selectedOption ? 'select__options__item--selected' : ''}`}>
                  {option[displayKey]}
                </li>
              ))}
              {filteredOptions.length === 0 && <p className="select__options__noresults">No results found</p>}
            </ul>
          )}
        </div>
      </div>
      <style jsx>
        {`
          .select {
            width: 100%;
            position: relative;
          }

          .select_cn {
            position: relative;
          }

          .select__label {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 12px;
            display: block;
            width: fit-content;
          }
          .select__arrowimg {
            position: absolute;
            cursor: pointer;
            top: 50%;
            transform: translateY(-50%);
            right: 12px;
          }
          .select__search {
            padding: 8px 12px;
            padding-right: 22px;
            min-height: 40px;
            width: 100%;
            font-size: 14px;
            font-weight: 500;
            border-radius: 8px;
            border: 1px solid lightgrey;
            cursor: pointer;
          }
          .select__search:focus-visible,
          .select__search:focus {
            outline: none;
          }
          .select__search--error {
            border: 1px solid red;
          }
          .select__options {
            width: 100%;
            list-style-type: none;
            border-radius: 8px;
            padding: 8px;
            box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
            z-index: 2;
            overflow-y: auto;
            max-height: 150px;
            position: absolute;
            background: white;
            border: 1px solid lightgrey;
            top: 100%;
            left: 0;
            right: 0;
          }
          .select__options__item {
            cursor: pointer;
            font-size: 14px;
            padding: 4px 8px;
          }
          .select__options__noresults {
            cursor: pointer;
            font-size: 15px;
            padding: 4px 8px;
          }
        `}
      </style>
    </>
  );
};

export default SingleSelect;
