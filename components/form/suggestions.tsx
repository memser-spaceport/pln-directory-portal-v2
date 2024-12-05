import React, { use, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import SuggestionDropdown from './suggestion-dropdown';
import { getColorObject } from '@/utils/sign-up.utils';
import { formatSuggestions, getSuggestions } from '@/services/sign-up.service';
import { GROUP_TYPES } from '@/utils/constants';
import { useDebounce } from '@/hooks/useDebounce';

interface Suggestion {
  uid: string;
  name: string;
  logoURL: string;
  group: string;
}

interface SearchWithSuggestionsProps {
  addNew?: {
    enable?: boolean;
    title?: string;
    actionString?: string;
    iconURL?: string;
    placeHolderText?: string;
  };
  placeHolder?: string;
  title?: string;
  id: string;
  name: string;
}

/**
 * SearchWithSuggestions component provides a search input with suggestions dropdown.
 * It also supports an "add mode" where users can input custom text or URLs.
 *
 * @param {SearchWithSuggestionsProps} props - The props for the component.
 *
 * @returns {JSX.Element} The rendered SearchWithSuggestions component.
 *
 */
const SearchWithSuggestions = ({ addNew, placeHolder = 'Search', title, id }: SearchWithSuggestionsProps) => {

  const [inputValue, setInputValue] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [isAddMode, setAddMode] = useState(false);
  const [placeHolderText, setPlaceholderText] = useState(placeHolder);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const [enableDropdown, setDropdownStatus] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const debouncedSearchText = useDebounce(searchInputValue, 300);

  const clrObj = getColorObject(selectedSuggestion?.group || '');


  /**
   * Handles the input change event for the search input field.
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event triggered by the input field.
   * @returns {Promise<void>} - A promise that resolves when the input change handling is complete.
   * 
   * This function updates the search input value state and fetches suggestions if the input length is greater than 2.
   * It sets the filtered suggestions and displays the dropdown if suggestions are available.
   * If the input length is 2 or less, it hides the dropdown and clears the filtered suggestions.
   */
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInputValue(value);
  };

  /**
   * Handles the change event for the custom add input field and updates the input value state.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event triggered by the input field.
   * @returns {Promise<void>} A promise that resolves when the input value is updated.
   */
  const handleAddInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };

  /**
   * Handles the close button click event.
   * Resets the input values, selected suggestion, add mode, and placeholder text.
   *
   * @function
   * @name onCloseClick
   * @returns {void}
   */
  const onCloseClick = () => {
    setInputValue('');
    setSearchInputValue('');
    setSelectedSuggestion(null);
    setAddMode(false);
    setPlaceholderText(placeHolder);
  };

  /**
   * Enables the add mode for giving custom data.
   * 
   * @function
   */
  const enableAddMode = () => {
    setInputValue('');
    setAddMode(true);
    setPlaceholderText(addNew?.placeHolderText ?? 'Enter or paste URL here');
    setDropdownStatus(false);
  };

  /**
   * Handles the selection of a suggestion from the dropdown.
   * Updates the selected suggestion state and hides the dropdown.
   *
   * @param {Suggestion} suggestion - The selected suggestion object.
   * @returns {void}
   */
  const onSuggestionSelect = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setDropdownStatus(false);
    setSearchInputValue('');
  };

  const searchTextChange = async (value: string) => {
    if (value.length > 2) {
      const getSuggestion = await getSuggestions(value);
      setFilteredSuggestions(formatSuggestions(getSuggestion));
      setDropdownStatus(true);
    } else {
      setDropdownStatus(false);
      setFilteredSuggestions([]);
    }
  }

  useEffect(() => {
    searchTextChange(debouncedSearchText);
  }, [debouncedSearchText]);

  return (
    <>
      <div className="suggestions">
        {/* label for the component which is optional */}
        {title && (
          <label htmlFor={id} className={`suggestions__label`}>
            {title}
          </label>
        )}

        {/* to display the selected suggestion */}
        <div className="suggestions__input">
          {selectedSuggestion && (
            <div className="suggestions__input__selected">
              <div className="suggestions__input__selected__item">
                <Image
                  loading="lazy"
                  src={selectedSuggestion.logoURL ? selectedSuggestion.logoURL : selectedSuggestion.group === GROUP_TYPES.TEAM ? '/icons/team-default-profile.svg' : '/icons/default-project.svg'}
                  alt={selectedSuggestion.name}
                  width={20}
                  height={20}
                />
                <div>{selectedSuggestion.name}</div>
                <span style={{ color: `${clrObj.color}`, background: `${clrObj.bgColor}` }} className="suggestions__input__selected__group">
                  {selectedSuggestion.group}
                </span>
              </div>
              <div className="suggestions__input__close" onClick={onCloseClick}>
                <Image loading="lazy" src="/icons/close.svg" alt="add" width={16} height={16} />
              </div>
            </div>
          )}

          {/* when ADD mode is enabled (i.e) custom input from user either a text or url */}
          {isAddMode && (
            <>
              <div>
                <Image loading="lazy" src={addNew?.iconURL ?? '/icons/sign-up/share-with-bg.svg'} alt="add" width={20} height={20} />
              </div>
              <input type="text" value={inputValue} onChange={handleAddInputChange} className="suggestions__input__field" placeholder={placeHolderText} name="add" />
              <div className="suggestions__input__close" onClick={onCloseClick}>
                <Image loading="lazy" src="/icons/close.svg" alt="add" width={16} height={16} />
              </div>
            </>
          )}

          {/* search text input */}
            {!isAddMode && !selectedSuggestion && (
            <input
              type="text"
              tabIndex={0}
              value={searchInputValue}
              onChange={handleInputChange}
              onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
              }}
              className="suggestions__input__field"
              placeholder={placeHolderText}
              name="search"
            />
            )}
        </div>

        {/* dropdown to show suggestions */}
        {enableDropdown && <SuggestionDropdown suggestions={filteredSuggestions} addNew={addNew} enableAddMode={enableAddMode} onSelect={onSuggestionSelect} setDropdownStatus={setDropdownStatus}/>}

        {/* hidden form field */}
        <input type="hidden" value={selectedSuggestion ? JSON.stringify(selectedSuggestion) : inputValue} name={'selected-team-or-project'} />
      </div>
      <style jsx>
        {`
          .suggestions {
            display: flex;
            flex-direction: column;
            width: 100%;
          }

          .suggestions__label {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 12px;
          }

          .suggestions__input {
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

          .suggestions__input__field {
            width: 100%;
            padding: 8px 12px;
            min-height: 40px;
            font-size: 14px;
            border: none;
            border-radius: 8px;
            outline: none;
          }

          .suggestions__input__close {
            cursor: pointer;
            display: flex;
          }

          .suggestions__dropdown {
            position: relative;
            width: 100%;
            padding-top: 8px;
          }

          .suggestions__add {
            display: flex;
            border-top: 1px solid #cbd5e1;
            justify-content: space-between;
            padding: 8px;
            color: #0f172a;
            align-items: flex-end;
            padding-bottom: 0px;
          }

          .suggestions__add__action {
            display: flex;
            gap: 4px;
          }

          .suggestions__dropdown__suggestion {
            position: absolute;
            width: 100%;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px;
            background-color: white;
          }

          .suggestions__dropdown__suggestion__group__title {
            font-size: 13px;
            font-weight: 600;
            line-height: 20px;
            padding: 0px 4px;
            border-radius: 4px;
          }

          .suggestions__input:focus-visible,
          .suggestions__input:focus {
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

          .suggestions__add__action__btn {
            background: white;
            color: #156ff7;
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            display: flex;
            align-items: flex-end;
            gap: 4px;
          }

          .suggestions__add__action__btn__img {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .suggestions__input__selected {
            display: flex;
            align-items: center;
            width: 100%;
            justify-content: space-between;
            padding-right: 8px;
          }
          .suggestions__input__selected__item {
            padding: 0px 8px;
            display: flex;
            gap: 8px;
          }

          .suggestions__input__selected__group {
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

export default SearchWithSuggestions;
