'use client';

import React, { useEffect, useRef, useState, ChangeEvent, FocusEvent } from 'react';

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
  placeholder?: string;
  isMandatory?:boolean;
  arrowImgUrl?: string;
}

const SearchableSingleSelect: React.FC<SearchableSingleSelectProps> = ({
  options,
  selectedOption,
  onChange,
  onClear,
  uniqueKey,
  displayKey,
  placeholder = 'Search....',
  isMandatory = false,
  arrowImgUrl
}) => {
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);
  const [showOptions, setShowOptions] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
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
      if(selectedOption && selectedOption[uniqueKey]) {
        onClear()
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
      <div className="select" ref={containerRef}>
        <input
          className={`select__search ${(isMandatory && !selectedOption?.[uniqueKey]) ? 'select__search--error': '' }`}
          ref={searchRef}
          defaultValue={defaultSelectedValue}
          onChange={onSearch}
          onFocus={onSearchFocus}
          placeholder={placeholder}
        />
        {arrowImgUrl && <img onClick={onSearchFocus} className='select__arrowimg' src={arrowImgUrl} width="10" height="7" alt="arrow down"/>}
        {showOptions && (
          <ul className="select__options">
            {filteredOptions.map((option) => (
              <li
                key={option[uniqueKey]}
                onClick={() => handleOptionClick(option)}
                className={`select__options__item ${option === selectedOption ? 'select__options__item--selected' : ''}`}
              >
                {option[displayKey]}
              </li>
            ))}
            {filteredOptions.length === 0 && <p className='select__options__noresults'>No Results found</p>}
          </ul>
        )}
      </div>
      <style jsx>
        {
            `
            .select {width: 100%; position: relative; }
            .select__arrowimg {position: absolute; top: 13px; cursor: pointer; right: 16px;}
            .select__search {padding: 8px 12px; width: 100%; font-size: 14px; font-weight: 500; border-radius: 8px; border: 1px solid lightgrey;}
            .select__search:focus-visible, .select__search:focus {outline:none;}
            .select__search--error {border: 1px solid red;}
            .select__options {width: 100%; list-style-type: none; border-radius: 8px; padding: 8px; box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px; z-index: 2; overflow-y: auto; max-height: 150px; position: absolute; background: white; border: 1px solid lightgrey; top: 35px;  left:0; right:0;}
            .select__options__item {cursor: pointer; font-size: 14px;  padding: 4px 8px;}
            .select__options__noresults {cursor: pointer; font-size: 15px; padding: 4px 8px;}
            `
        }
      </style>
    </>
  );
};

export default SearchableSingleSelect;
