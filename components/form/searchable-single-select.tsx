'use client';

import React, { useEffect, useRef, useState, ChangeEvent, FocusEvent, PointerEventHandler } from 'react';
import { Virtuoso } from 'react-virtuoso';

interface Option {
  [key: string]: any;
}

interface SearchableSingleSelectProps {
  options: Option[];
  selectedOption: Option | null;
  onChange: (selectedOption: Option | null) => any;
  onClick?: () => void;
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
  onSearchHandler?: any;
  defaultImage?: string;
  showClear?: boolean;
  closeImgUrl?: string;
  isError?: boolean;
}

const SearchableSingleSelect: React.FC<SearchableSingleSelectProps> = ({
  options,
  selectedOption,
  onChange,
  onClick,
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
  onSearchHandler,
  defaultImage,
  showClear,
  closeImgUrl,
  isError = false,
}) => {
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);
  const [showOptions, setShowOptions] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const defaultSelectedValue = selectedOption ? selectedOption[formKey] : '';

  const handleOptionClick = (option: Option) => {
    const isAllowed = onChange(option);
    if (isAllowed === false) {
      setShowOptions(false);
      setFilteredOptions(options);
    } else {
      if (searchRef.current) {
        searchRef.current.value = option[displayKey];
      }
      setShowOptions(false);
      setFilteredOptions(options);
    }
  };

  const onInputClicked = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    setShowOptions((v) => true);
    if (onClick) {
      onClick();
    }
  };

  const onSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setShowOptions(true);
    if (showOptions) {
      if (selectedOption && selectedOption[uniqueKey] && selectedOption[displayKey]) {
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

  const onToggleOptions = () => {
    setShowOptions((v) => !v);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
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
          {iconKey && selectedOption && <img className="selected__icon" src={selectedOption[iconKey] || defaultImage} alt={selectedOption[displayKey]} />}
          <input
            id={id}
            className={`select__search ${iconKey ? 'hasDefaultImg' : ''} ${selectedOption && iconKey && selectedOption[iconKey] ? 'select__icon' : ''} ${
              (isMandatory && !selectedOption?.[uniqueKey]) || (isMandatory && searchRef.current?.value === '') ? 'select__search--error' : ''
            }`}
            ref={searchRef}
            defaultValue={selectedOption ? selectedOption[displayKey] : ''}
            onChange={onSearch}
            onClick={onInputClicked}
            onFocus={onSearchFocus}
            placeholder={placeholder}
            required={isMandatory}
            onKeyDown={onKeyDown}
            autoComplete="off"
            onBlur={(e) => {
              e.stopPropagation();
              if (selectedOption && searchRef.current) {
                searchRef.current.value = selectedOption[displayKey] ?? '';
                setFilteredOptions(options);
              }
              setShowOptions(false);
            }}
          />
          <input ref={inputRef} type="text" hidden defaultValue={defaultSelectedValue} name={name} />

          {showClear ? (
            <>
              {selectedOption && selectedOption[displayKey] ? (
                <img onClick={onClear} className="select__reset" src={closeImgUrl} width="16" height="16" alt="close" />
              ) : (
                <img onClick={onToggleOptions} className="select__arrowimg" src={arrowImgUrl} width="10" height="7" alt="arrow down" />
              )}
            </>
          ) : arrowImgUrl ? (
            <img onClick={onToggleOptions} className="select__arrowimg" src={arrowImgUrl} width="10" height="7" alt="arrow down" />
          ) : (
            ''
          )}

          {showOptions && (
            <ul className="select__options">
              {filteredOptions.length > 0 && ( 
              <Virtuoso style={{height: '150px'}} data={filteredOptions} itemContent={(_, option: any) => (
                <li
                  key={option[uniqueKey]}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleOptionClick(option);
                  }}
                  className={`select__options__item ${option[displayKey] === selectedOption?.[displayKey] ? 'select__options__item--selected' : ''}`}
                >
                  {iconKey && <img loading='eager' height={24} width={24} className="select__options__item__img" src={option[iconKey] || defaultImage} alt={option[displayKey]} />}
                  <span> {option[displayKey]}</span>
                </li>
              )} />
            )}
              {/* {filteredOptions.map((option) => (
                <li
                  key={option[uniqueKey]}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleOptionClick(option);
                  }}
                  className={`select__options__item ${option[displayKey] === selectedOption?.[displayKey] ? 'select__options__item--selected' : ''}`}
                >
                  {iconKey && <img loading='eager' height={24} width={24} className="select__options__item__img" src={option[iconKey] || defaultImage} alt={option[displayKey]} />}
                  <span> {option[displayKey]}</span>
                </li>
              ))} */}
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
            width: 24px;
            object-fit: cover;
            object-position: top;
            border-radius: 50%;
            height: 24px;
            position: absolute;
            left: 8px;
            background: lightgrey;
            top: 50%;
            transform: translateY(-50%);
          }
          .select__arrowimg {
            position: absolute;
            bottom: calc(50% - 4px);
            cursor: pointer;
            right: 8px;
          }
          .select__search {
            padding: 12px;
            padding-right: 22px;
            min-height: 40px;
            width: 100%;
            font-size: 14px;
            font-weight: 400;
            border-radius: 8px;
            border: 1px solid ${isError ? 'red' : 'lightgrey'};
          }

          .hasDefaultImg {
            padding: 12px 12px 12px 36px;
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
            text-wrap: wrap;
            word-break: break-all;
          }
          .select__options__item__img {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            object-fit: cover;
            object-position: top;
            background: lightgrey;
          }
          .select__options__noresults {
            cursor: pointer;
            font-size: 15px;
            padding: 4px 8px;
          }

          .select__reset {
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            color: #156ff7;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            right: 8px;
            display: block;
          }
        `}
      </style>
    </>
  );
};

export default SearchableSingleSelect;
