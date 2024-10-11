'use client';

import React, { useEffect, useRef, useState } from 'react';
import HiddenField from './hidden-field';

interface Option {
  [key: string]: any;
}

interface SingleSelectWithImageProps {
  options: Option[];
  selectedOption: any;
  onItemSelect: (selectedOption: Option | null) => void;
  uniqueKey: string;
  displayKey: string;
  defaultIcon: string;
  placeholder?: string;
  isMandatory?: boolean;
  arrowImgUrl?: string;
  iconKey?: string;
  label?: string;
  id: string;
}

const SingleSelectWithImage: React.FC<SingleSelectWithImageProps> = ({
  options,
  selectedOption,
  onItemSelect,
  uniqueKey,
  displayKey,
  placeholder = 'Select',
  isMandatory = false,
  arrowImgUrl,
  iconKey,
  defaultIcon,
  label = '',
  id,
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
    onItemSelect(option);
    setShowOptions(false);
    setFilteredOptions(options);
  };

  const onSearchFocus = () => {
    setShowOptions(!showOptions);
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
        <div ref={containerRef} className="select_cn">
          {(iconKey && selectedOption)  && (selectedOption[iconKey] || defaultIcon) && <img className="selected__icon" height={24} width={24} src={selectedOption[iconKey] || defaultIcon} alt={selectedOption[displayKey]} />}
          <input
            id={id}
            className={`select__search ${selectedOption && (iconKey && selectedOption[iconKey])  && (selectedOption[iconKey] || defaultIcon) ? 'select__icon' : ''} `}
            ref={searchRef}
            value={defaultSelectedValue}
            onClick={onSearchFocus}
            placeholder={placeholder}
            onKeyDown={onKeyDown}
            readOnly
          />
          {arrowImgUrl && <img onClick={onSearchFocus} className="select__arrowimg" src={arrowImgUrl}  alt="arrow down" />}
          {showOptions && (
            <ul className="select__options">
              {filteredOptions?.map((option) => (
                <li key={option[uniqueKey]} onClick={() => handleOptionClick(option)} className={`select__options__item ${option === selectedOption ? 'select__options__item--selected' : ''}`}>
                  {(iconKey && selectedOption) && (selectedOption[iconKey] || defaultIcon) && <img className="select__options__item__img" src={option[iconKey] || defaultIcon} alt={option[displayKey]} />}
                  <span>{option[displayKey]}</span>
                </li>
              ))}
              {filteredOptions?.length === 0 && <p className="select__options__noresults">No results found</p>}
            </ul>
          )}
        </div>
        <HiddenField value={selectedOption?.uid} defaultValue={selectedOption?.uid} name={uniqueKey} />
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

          .selected__icon {
            object-fit: cover;
            object-position: top;
            border-radius: 50px;
            position: absolute;
            left: 8px;
            background: lightgrey;
            top: calc(50% - 13px);
          }

          .select__arrowimg {
            position: absolute;
            cursor: pointer;
            top: 50%;
            transform: translateY(-50%);
            right: 12px;
          }
          .select__search {
            padding: 12px 12px 12px 36px;
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

          .select__icon {
            padding-left: 40px;
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
            display: flex;
            align-items: center;
            gap: 6px;
            text-wrap: wrap;
            word-break: break-all;
          }

          .select__options__item__img {
            width: 26px;
            height: 26px;
            border-radius: 50px;
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

export default SingleSelectWithImage;
