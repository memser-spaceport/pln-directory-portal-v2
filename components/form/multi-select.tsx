'use client';

import React, { PointerEvent, useEffect, useMemo, useRef, useState } from 'react';

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

const MultiSelect: React.FC<MultiSelectProps> = ({
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
}) => {
  // State to manage the visibility of options
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Memoize selected option IDs for filtering
  const selectedOptionIds = useMemo(() => selectedOptions.map(option => option[uniqueKey]), [selectedOptions]);

  // Memoize available options to prevent unnecessary recalculations
  const availableOptions = useMemo(() => 
    options.filter(option => !selectedOptionIds.includes(option[uniqueKey])),
    [options, selectedOptionIds]
  );

  // Handle adding an option
  const handleOptionClick = (option: Option) => {
    onAdd(option);
  };

  // Handle removing an option
  const handleRemoveOption = (e: PointerEvent<HTMLImageElement>, optionToRemove: Option) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(optionToRemove);
  };

  // Toggle the visibility of options
  const toggleOptionsVisibility = () => {
    setIsOptionsVisible(prev => !prev);
  };

  useEffect(() => {
    // Close options when clicking outside the component
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOptionsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className="multi-select" data-testid="form-ms">
        {label && <label className="multi-select__label">{label}</label>}
        <div className="multi-select__content" ref={containerRef}>
           {/* Wrapper for selected options */}
          <div className={`multi-select__selected-options ${selectedOptions.length === 0 && isMandatory ? 'multi-select__selected-options--error' : ''}`} onClick={toggleOptionsVisibility} data-testid="form-msselected-options">
            <div className="multi-select__selected-options-wrapper"> 
              {selectedOptions.length === 0 && <span className="multi-select__placeholder">{placeholder}</span>} 
              {selectedOptions.map(option => (
                <div key={option[uniqueKey]} className="multi-select__selected-option">
                  {option[displayKey]} 
                  <img width="16" height="16" alt="Remove option" data-testid={`form-ms-close-icon-${option[uniqueKey]}`} src={closeImgUrl} className="multi-select__remove-option" onPointerDown={(e) => handleRemoveOption(e, option)} /> 
                </div>
              ))}
            </div>
            {arrowImgUrl && <img className="multi-select__arrow-img" src={arrowImgUrl} width="10" height="7" alt="Toggle options" />}
          </div>

          {/* Dropdown options list */}
          {isOptionsVisible && 
            <ul className="multi-select__options" data-testid="form-ms-options-list">
              {availableOptions.map((option: any) => (
                <li
                  key={option[uniqueKey]}
                  onClick={() => handleOptionClick(option)} 
                  className={`multi-select__option ${selectedOptions.some(selectedOption => selectedOption[uniqueKey] === option[uniqueKey]) ? 'multi-select__option--selected' : ''}`}
                >
                  {option[displayKey]}
                </li>
              ))}
              {availableOptions.length === 0 && <p className="multi-select__no-results">No data available</p>}
            </ul>
          }
        </div>
      </div>
      
      {/* Styles for the multi-select component */}
      <style jsx>
        {`
          .multi-select {
            width: 100%;
            position: relative;
          }
          .multi-select__content {
            position: relative;
          }
          .multi-select__label {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 12px;
            display: block;
          }
          .multi-select__selected-options {
            display: flex;
            font-size: 14px;
            gap: 8px;
            padding: 8px 12px;
            border: 1px solid lightgrey;
            border-radius: 8px;
            cursor: pointer;
            align-items: center;
            min-height: 40px;
          }
          .multi-select__selected-options--error {
            border: 1px solid red;
          }

          .multi-select__selected-options-wrapper {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
          }
          .multi-select__arrow-img {
            margin-left: auto;
            cursor: pointer;
          }
          .multi-select__placeholder {
            color: #aab0b8;
          }
          .multi-select__selected-option {
            border: 1px solid #cbd5e1;
            padding: 5px 12px;
            border-radius: 24px;
            font-size: 12px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 3px;
          }
          .multi-select__remove-option {
            margin-left: 5px;
            cursor: pointer;
          }
          .multi-select__options {
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
          }
          .multi-select__option {
            cursor: pointer;
            font-size: 14px;
            padding: 4px 8px;
          }
          .multi-select__option--selected {
            background-color: #e0e0e0;
          }
          .multi-select__no-results {
            padding: 16px;
            font-size: 14px;
            width: 90%;
            overflow-x: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 8px;
          }
        `}
      </style>
    </>
  );
};

export default MultiSelect;