'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Option {
  [key: string]: any;
}

interface SearchableMultiSelectProps {
  options: Option[];
  selectedOptions: Option[];
  onChange: (selectedOptions: Option[]) => void;
  onClear: () => void;
  uniqueKey: string;
  displayKey: string;
  placeholder?: string;
  isMandatory?: boolean;
  arrowImgUrl?: string;
}

const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  options,
  selectedOptions,
  onChange,
  onClear,
  uniqueKey,
  displayKey,
  placeholder = 'Select options...',
  isMandatory = false,
  arrowImgUrl
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleOptionClick = (option: Option) => {
    const alreadySelected = selectedOptions.find((selectedOption) => selectedOption[uniqueKey] === option[uniqueKey]);
    if (alreadySelected) {
      const newSelectedOptions = selectedOptions.filter((selectedOption) => selectedOption[uniqueKey] !== option[uniqueKey]);
      onChange(newSelectedOptions);
    } else {
      const newSelectedOptions = [...selectedOptions, option];
      onChange(newSelectedOptions);
    }
  };

  const handleRemoveOption = (optionToRemove: Option) => {
    const newSelectedOptions = selectedOptions.filter(option => option[uniqueKey] !== optionToRemove[uniqueKey]);
    onChange(newSelectedOptions);
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

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
        <div className="select__selected-options" onClick={toggleOptions}>
          {selectedOptions.length === 0 && <span className="select__placeholder">{placeholder}</span>}
          {selectedOptions.map((option) => (
            <div key={option[uniqueKey]} className="select__selected-option">
              {option[displayKey]}
              <span className="select__remove-option" onClick={() => handleRemoveOption(option)}>×</span>
            </div>
          ))}
          {arrowImgUrl && <img className='select__arrowimg' src={arrowImgUrl} width="10" height="7" alt="arrow down" />}
        </div>
        {showOptions && (
          <ul className="select__options">
            {options.map((option) => (
              <li
                key={option[uniqueKey]}
                onClick={() => handleOptionClick(option)}
                className={`select__options__item ${selectedOptions.some((selectedOption) => selectedOption[uniqueKey] === option[uniqueKey]) ? 'select__options__item--selected' : ''}`}
              >
                {option[displayKey]}
              </li>
            ))}
          </ul>
        )}
      </div>
      <style jsx>
        {`
          .select { width: 100%; position: relative; }
          .select__selected-options { display: flex; flex-wrap: wrap; gap: 5px; padding: 8px 12px; border: 1px solid lightgrey; border-radius: 8px; cursor: pointer; min-height: 38px; align-items: center; }
          .select__arrowimg { margin-left: auto; cursor: pointer; }
          .select__placeholder { color: grey; }
          .select__selected-option { background: lightgrey; padding: 5px 10px; border-radius: 5px; display: flex; align-items: center; }
          .select__remove-option { margin-left: 5px; cursor: pointer; }
          .select__options { width: 100%; list-style-type: none; border-radius: 8px; padding: 8px; box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px; z-index: 2; overflow-y: auto; max-height: 150px; position: absolute; background: white; border: 1px solid lightgrey; top: 100%; left: 0; }
          .select__options__item { cursor: pointer; font-size: 14px; padding: 4px 8px; }
          .select__options__item--selected { background-color: #e0e0e0; }
        `}
      </style>
    </>
  );
};

export default SearchableMultiSelect;
