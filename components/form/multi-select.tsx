'use client';

import React, { useEffect, useRef, useState } from 'react';

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
  label = ''
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOptionsIds = [...selectedOptions].map((v) => v[uniqueKey]);
  const remainingOptions: Option[] = [...options].filter((v) => !selectedOptionsIds.includes(v[uniqueKey]));

  const handleOptionClick = (option: Option) => {
    console.log(option);
    onAdd(option);
  };

  const handleRemoveOption = (e, optionToRemove: Option) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(optionToRemove);
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
        {label !== '' && <label className='select__label'>{label}</label>}
        <div className={`select__selectedoptions ${selectedOptions.length === 0 ? 'select__selectedoptions--error': ''}`} onClick={toggleOptions}>
          {selectedOptions.length === 0 && <span className="select__placeholder">{placeholder}</span>}
          {selectedOptions.map((option) => (
            <div key={option[uniqueKey]} className="select__selectedoptions__item">
              {option[displayKey]}
              <img
                width="16"
                height="16"
                alt="close tag"
                src={closeImgUrl}
                className="select__remove-option"
                onClick={(e) => handleRemoveOption(e, option)}
              />
            </div>
          ))}
          {arrowImgUrl && <img className="select__arrowimg" src={arrowImgUrl} width="10" height="7" alt="arrow down" />}
        </div>
        {showOptions && (
          <ul className="select__options">
            {remainingOptions.map((option) => (
              <li
                key={option[uniqueKey]}
                onClick={() => handleOptionClick(option)}
                className={`select__options__item ${
                  selectedOptions.some((selectedOption) => selectedOption[uniqueKey] === option[uniqueKey])
                    ? 'select__options__item--selected'
                    : ''
                }`}
              >
                {option[displayKey]}
              </li>
            ))}
            {remainingOptions.length === 0 && <p className="select__options__noresult">No data available</p>}
          </ul>
        )}
      </div>
      <style jsx>
        {`
          .select {
            width: 100%;
            position: relative;
          }
          .select__label {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 12px;
            display: block;
          }
          .select__selectedoptions {
            display: flex;
            font-size: 14px;
            flex-wrap: wrap;
            gap: 8px;
            padding: 8px 12px;
            border: 1px solid lightgrey;
            border-radius: 8px;
            cursor: pointer;
            align-items: center;
          }
          .select__selectedoptions--error {
            border: 1px solid red;
          }
          .select__arrowimg {
            margin-left: auto;
            cursor: pointer;
          }
          .select__placeholder {
            color: grey;
          }
          .select__selectedoptions__item {
            border: 1px solid #cbd5e1;
            padding: 5px 12px;
            border-radius: 24px;
            font-size: 12px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 3px;
          }
          .select__remove-option {
            margin-left: 5px;
            cursor: pointer;
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
          }
          .select__options__item {
            cursor: pointer;
            font-size: 14px;
            padding: 4px 8px;
          }
          .select__options__item--selected {
            background-color: #e0e0e0;
          }
          .select__options__noresult {
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
