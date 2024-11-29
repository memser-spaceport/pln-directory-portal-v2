import React, { use, useEffect, useState } from 'react';
import Image from 'next/image';
import SuggestionDropdown from './suggestion-dropdown';
import { getColorObject } from '@/utils/sign-up.utils';
import { formatSuggestions, getSuggestions } from '@/services/sign-up.service';

interface Suggestion {
  uid: string;
  name: string;
  logoURL: string;
  group: string;
}

interface CategorizedSuggestionsProps {
  suggestions: {
    addSuggestion?: {
      enable?: boolean;
      title?: string;
      actionString?: string;
      iconURL?: string;
      placeHolderText?: string;
    };
  };
  placeHolder?: string;
  title?: string;
  id: string;
  name: string;
}

const Suggestions = ({ suggestions, placeHolder = 'Search', title, id }: CategorizedSuggestionsProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isAddMode, setAddMode] = useState(false);
  const [placeHolderText, setPlaceholderText] = useState(placeHolder);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const [enableDropdown, setDropdownStatus] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const clrObj = getColorObject(selectedSuggestion?.group || '');

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
   if (value.length > 2) {
      const getSuggestion = await getSuggestions(value);
      setFilteredSuggestions(formatSuggestions(getSuggestion));
      setDropdownStatus(true);
    } else if (value === '') {
      setDropdownStatus(false);
      setFilteredSuggestions([]);
    }
  };

  const handleAddInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };

  const onCloseClick = () => {
    setInputValue('');
    setSelectedSuggestion(null);
    setAddMode(false);
    setPlaceholderText(placeHolder);
  };

  const enableAddMode = () => {
    setInputValue('');
    setAddMode(true);
    setPlaceholderText(suggestions?.addSuggestion?.placeHolderText ?? 'Enter or paste URL here');
    setDropdownStatus(false);
  };

  const onSuggestionSelect = (suggestion: any) => {
    setDropdownStatus(false);
    setSelectedSuggestion(suggestion);
  };

  useEffect(() => {
    filteredSuggestions.length && !isAddMode ? setDropdownStatus(true) : setDropdownStatus(false);
  }, [filteredSuggestions]);

  return (
    <>
      <div className="cs">
        {/* Label for the component which is optional */}
        {title && (
          <label htmlFor={id} className={`cs__label`}>
            {title}
          </label>
        )}
        {/*Input element which takes in search input or data from user in case of ADD mode */}
        <div className="cs__input">
          {selectedSuggestion && (
            <div className="cs__input__selected">
              <div className="cs__input__selected__item">
                <Image loading="lazy" src={selectedSuggestion.logoURL} alt={selectedSuggestion.name} width={20} height={20} />
                <div>{selectedSuggestion.name}</div>
                <span style={{ color: `${clrObj.color}`, background: `${clrObj.bgColor}` }} className="cs__input__selected__group">
                  {selectedSuggestion.group}
                </span>
              </div>
              <div className="cs__input__close" onClick={onCloseClick}>
                <Image loading="lazy" src="/icons/close.svg" alt="add" width={16} height={16} />
              </div>
            </div>
          )}
          {isAddMode && (
            <>
              <div>
                <Image loading="lazy" src="/icons/sign-up/share-with-bg.svg" alt="add" width={20} height={20} />
              </div>
              <input type="text" value={inputValue} onChange={handleAddInputChange} className="cs__input__field" placeholder={placeHolderText} name="add" />
              <div className="cs__input__close" onClick={onCloseClick}>
                <Image loading="lazy" src="/icons/close.svg" alt="add" width={16} height={16} />
              </div>
            </>
          )}
          {!isAddMode && !selectedSuggestion && <input type="text" value={inputValue} onChange={handleInputChange} className="cs__input__field" placeholder={placeHolderText} name="search" />}
        </div>
        {/* Dropdown to show suggestions */}
        {enableDropdown && <SuggestionDropdown suggestions={filteredSuggestions} addSuggestion={suggestions.addSuggestion} enableAddMode={enableAddMode} onSelect={onSuggestionSelect} />}
        <input type="hidden" value={selectedSuggestion ? JSON.stringify(selectedSuggestion) : inputValue} name={'selected-team-or-project'} />
      </div>
      <style jsx>
        {`
          .cs {
            display: flex;
            flex-direction: column;
            width: 100%;
          }

          .cs__label {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 12px;
          }

          .cs__input {
            width: 100%;
            // padding: 8px 12px;
            border: 1px solid lightgrey;
            border-radius: 8px;
            min-height: 40px;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0px ${isAddMode ? '8' : '0'}px;
          }

          .cs__input__field {
            width: 100%;
            padding: 8px 12px;
            min-height: 40px;
            font-size: 14px;
            border: none;
            border-radius: 8px;
            outline: none;
          }

          .cs__input__close {
            cursor: pointer;
            display: flex;
          }

          .cs__dropdown {
            position: relative;
            width: 100%;
            padding-top: 8px;
          }

          .cs__add {
            display: flex;
            border-top: 1px solid #cbd5e1;
            justify-content: space-between;
            padding: 8px;
            color: #0f172a;
            align-items: flex-end;
            padding-bottom: 0px;
          }

          .cs__add__action {
            display: flex;
            gap: 4px;
          }

          .cs__dropdown__suggestion {
            position: absolute;
            width: 100%;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px;
            background-color: white;
          }

          .cs__dropdown__suggestion__group__title {
            font-size: 13px;
            font-weight: 600;
            line-height: 20px;
            padding: 0px 4px;
            border-radius: 4px;
          }

          .cs__input:focus-visible,
          .cs__input:focus {
            outline: none;
          }

          ::placeholder {
            color: #aab0b8;
          }

          .hidden {
            visibility: hidden;
            height: 0;
            width: 0;
          }

          .cs__add__action__btn {
            background: white;
            color: #156ff7;
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            display: flex;
            align-items: flex-end;
            gap: 4px;
          }

          .cs__add__action__btn__img {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .cs__input__selected {
            display: flex;
            align-items: center;
            width: 100%;
            justify-content: space-between;
            padding-right: 8px;
          }
          .cs__input__selected__item {
            padding: 0px 8px;
            display: flex;
            gap: 8px;
          }

          .cs__input__selected__group {
            display: flex;
            flex-direction: row;
            align-items: flex-end;
            padding: 0px 4px;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 600;
            line-height: 20px;
          }
        `}
      </style>
    </>
  );
};

export default Suggestions;
