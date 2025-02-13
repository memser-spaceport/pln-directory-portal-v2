import React, { use, useEffect, useRef, useState } from 'react';
import HiddenField from './hidden-field';
import useClickedOutside from '@/hooks/useClickedOutside';
import { Option } from '@/types/shared.types';

interface MultiSelectWithSearchProps {
  label: string;
  options: Option[];
  mandatory?: boolean;
  selectedOptions: Option[];
  onChange: (selected: Option[]) => void;
}

const MultiSelectWithSearch: React.FC<MultiSelectWithSearchProps> = ({ label, mandatory, options, selectedOptions, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOptionsVisible, setOptionsVisible] = useState(false);
  const [selected, setSelected] = useState(selectedOptions);
  const [hasError, setError] = useState(selectedOptions.length === 0 && mandatory);

  const searchRef: any = useRef(null);

  useClickedOutside({ callback: () => setOptionsVisible(false), ref: searchRef });

  const [filteredOptions, setFilteredOptions] = useState(options);

  const removeFromList = () => {
    filteredOptions.map((option) => {
      selected.map((selectedOption) => {
        if (option.value === selectedOption.value) {
          setFilteredOptions(filteredOptions.filter((opt) => opt.value !== option.value));
        }
      });
    });
  };

  useEffect(() => {
    if (selectedOptions.length > 0) {
      removeFromList();
    }
  }, []);

  const handleSearchChange = (e: any) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
    setFilteredOptions(options.filter((option) => option.label.toLowerCase().includes(e.target.value.toLowerCase())));
    setSearchTerm(e.target.value);
    setOptionsVisible(true);
  };

  const handleOptionClick = (option: Option) => {
    setSelected([...selected, option]);
    setFilteredOptions(filteredOptions.filter((opt) => opt.value !== option.value));
  };

  const handleOptionDelete = (option: Option) => {
    setSelected(selected.filter((selectedOption) => selectedOption.value !== option.value));
    setFilteredOptions([...filteredOptions, option].sort((a, b) => a.label.localeCompare(b.label)));
  };

  useEffect(() => {
    setError(selected.length === 0 && mandatory);
  }, [selected]);

  return (
    <>
      <div className="ms__cn">
        <div className="ms__cn__label">
          {label}
          {mandatory ? '*' : ''}
        </div>
        <div className="ms__cn__ip">
          {selected.length > 0 && (
            <div className="ms__cn__ip__cn">
              {selected.map((option) => (
                <div key={option.value} className="ms__cn__ip__cn__options-selected">
                  <div>{option.label}</div>
                  <div onClick={() => handleOptionDelete(option)}>
                    <img alt="delete" src="/icons/close-gray.svg" />
                  </div>
                  <HiddenField value={JSON.stringify(option)} defaultValue={JSON.stringify(selectedOptions)} name={`projecttags-${option.value}`} />
                </div>
              ))}
            </div>
          )}
          <input
            ref={searchRef}
            onFocus={() => setOptionsVisible(true)}
            className="ms__cn__ip__search"
            type="text"
            placeholder={`Search ${label.toLowerCase()}`}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        {isOptionsVisible && (
          <div className="ms__cn__options">
            {filteredOptions.map((option) => (
              <div key={option.value} onClick={() => handleOptionClick(option)} className="ms__cn__options__item">
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
      <style jsx>{`
        .ms__cn {
          width: 100%;
          position: relative;
          padding-top: 18px;
        }

        .ms__cn__label {
          font-weight: 600;
          font-size: 14px;
          padding-bottom: 12px;
        }

        .ms__cn__ip {
          padding: 8px 12px;
          border: 1px solid ${hasError ? 'red' : 'lightgray'};
          border-radius: 8px;
          // min-height:40px;
          font-size: 14px;
        }

        .ms__cn__ip__search {
          outline: none;
          border: none;
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          line-height: 24px;
          width: 100%;
        }

        .ms__cn__options {
          position: absolute;
          top: 100%;
          height: 150px;
          overflow: auto;
          box-shadow: 0px 2px 6px 0px #0f172a29;
          boder-radius: 8px;
          padding: 15px;
          width: 100%;
          margin: 10px 0px;
          left: 0;
          padding-bottom: 20px;
          display: flex;
          flex-direction: column;
          background-color: white;
          z-index: 99;
        }

        .ms__cn__options__item {
          cursor: pointer;
          padding: 8px;
        }

        .ms__cn__options__item:hover {
          border-radius: 8px;
          background-color: #f1f5f9;
        }

        .ms__cn__ip__cn {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding-bottom: 8px;
        }

        .ms__cn__ip__cn__options-selected {
          padding: 5px 12px 5px 12px;
          gap: 4px;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          opacity: 0px;
          display: flex;
          cursor: pointer;
        }

        .ms__cn__ip__cn__options-selected:hover {
          background-color: #f1f5f9;
        }
      `}</style>
    </>
  );
};

export default MultiSelectWithSearch;
