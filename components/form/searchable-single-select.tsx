'use client';

import React, { useEffect, useRef, useState, ChangeEvent, FocusEvent, PointerEventHandler } from 'react';

interface Option {
  [key: string]: any;
}

interface SearchableSingleSelectProps {
  options: Option[];
  selectedOption: Option | null;
  onChange: (selectedOption: Option | null) => void;
  onClear: () => void;
  uniqueKey: string;
  displayKey: string;
  iconKey?: string;
  formKey: string;
  placeholder?: string;
  isMandatory?: boolean;
  arrowImgUrl?: string;
  label?: string;
  isFormElement?: boolean;
  id: string;
  name: string;
}

const SearchableSingleSelect: React.FC<SearchableSingleSelectProps> = ({
  options,
  selectedOption,
  onChange,
  onClear,
  uniqueKey,
  displayKey,
  formKey,
  placeholder = 'Search....',
  isMandatory = false,
  arrowImgUrl,
  label = '',
  isFormElement = false,
  iconKey,
  name,
  id,
}) => {
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);
  const [showOptions, setShowOptions] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const defaultSelectedValue = selectedOption ? selectedOption[displayKey] : '';

  const handleOptionClick = (option: Option) => {
    if (searchRef.current) {
      searchRef.current.value = option[displayKey];
    }
    onChange(option);
    setShowOptions(false);
    setFilteredOptions(options);
  };

  const onSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    if (showOptions) {
      if (selectedOption && selectedOption[uniqueKey]) {
        onClear();
      }
      if (searchTerm === '') {
        setFilteredOptions(options);
      } else {
        setFilteredOptions(options.filter((option) => option[displayKey].toLowerCase().includes(searchTerm.toLowerCase())));
      }
    }
  };

  const onSearchFocus = () => {
    setShowOptions(true);
  };

  useEffect(() => {
    setFilteredOptions(options);
  }, [options]);

  useEffect(() => {
    if (searchRef.current && selectedOption) {
      searchRef.current.value = selectedOption[displayKey];
    }
    if (inputRef.current && selectedOption) {
      inputRef.current.value = selectedOption[formKey];
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
        <div className="select__cn" ref={containerRef}>
          {iconKey && selectedOption && selectedOption[iconKey] && <img className="selected__icon" src={selectedOption[iconKey]} alt={selectedOption[displayKey]} />}
          <input
            id={id}
            className={`select__search ${selectedOption && iconKey && selectedOption[iconKey] ? 'select__icon' : ''} ${isMandatory && !selectedOption?.[uniqueKey] ? 'select__search--error' : ''}`}
            ref={searchRef}
            defaultValue={defaultSelectedValue}
            onChange={onSearch}
            onClick={() => setShowOptions((v) => !v)}
            //onFocus={onSearchFocus}
            placeholder={placeholder}
            autoComplete="off"
          />
          <input ref={inputRef} type="text" hidden defaultValue={defaultSelectedValue} name={name} />

          {arrowImgUrl && <img onClick={onSearchFocus} className="select__arrowimg" src={arrowImgUrl} width="10" height="7" alt="arrow down" />}
          {showOptions && (
            <ul className="select__options">
              {filteredOptions.map((option) => (
                <li key={option[uniqueKey]} onClick={() => handleOptionClick(option)} className={`select__options__item ${option === selectedOption ? 'select__options__item--selected' : ''}`}>
                  {iconKey && <img className="select__options__item__img" src={option[iconKey]} alt={option[displayKey]} />}
                  <span> {option[displayKey]}</span>
                </li>
              ))}
              {filteredOptions.length === 0 && <p className="select__options__noresults">No Results found</p>}
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

          .select__cn {
            position: relative;
            height: fit-content;
          }
          .select__label {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 12px;
            display: block;
            width: fit-content;
          }
          .selected__icon {
            width: 26px;
            object-fit: cover;
            object-position: top;
            border-radius: 8px;
            height: 26px;
            position: absolute;
            left: 8px;
            background: lightgrey;
            top: calc(50% - 13px);
          }
          .select__arrowimg {
            position: absolute;
            bottom: calc(50% - 4px);
            cursor: pointer;
            right: 8px;
          }
          .select__search {
            padding: 8px 12px;
            padding-right: 22px;
            min-height: 40px;
            width: 100%;
            font-size: 14px;
            font-weight: 400;
            border-radius: 8px;
            border: 1px solid lightgrey;
          }
          .select__icon {
            padding-left: 42px;
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
            top: 42px;
            left: 0;
            right: 0;
          }
          .select__options__item {
            cursor: pointer;
            font-size: 14px;
            padding: 4px 8px;
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .select__options__item__img {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            object-fit: cover;
            object-position: top;
             background: lightgrey;
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

export default SearchableSingleSelect;
