import React, { useEffect, useRef, useState } from 'react';
import SuggestionItem from './suggestion-item';
import Image from 'next/image';

interface ISuggestion {
  name: string;
  logoURL: string;
  group: string;
  uid: string;
}

interface SuggestionDropdownProps {
  suggestions: ISuggestion[];
  addNew?: {
    enable?: boolean;
    title?: string;
    actionString?: string;
    iconURL?: string;
    placeHolderText?: string;
  };
  onSelect: (suggestion: any) => void;
  enableAddMode: () => void;
  setDropdownStatus: (status: boolean) => void;
}

/**
 * SuggestionDropdown component renders a dropdown list of suggestions.
 * It also provides an option to add a new suggestion if none of the existing suggestions match.
 *
 * @component
 * @param {SuggestionDropdownProps} props - The props for the SuggestionDropdown component.
 * @param {Array<Suggestion>} props.suggestions - The list of suggestions to display.
 * @param {AddNew} props.addNew - The configuration for adding a new suggestion.
 * @param {Function} props.onSelect - The callback function to call when a suggestion is selected.
 * @param {Function} props.enableAddMode - The callback function to enable the add new suggestion mode.
 *
 * @returns {JSX.Element} The rendered SuggestionDropdown component.
 *
 * @example
 * <SuggestionDropdown
 *   suggestions={suggestions}
 *   addNew={{ enable: true, title: 'Add new suggestion', actionString: 'Add yours', iconURL: '/path/to/icon' }}
 *   onSelect={handleSelect}
 *   enableAddMode={handleEnableAddMode}
 * />
 */
const SuggestionDropdown: React.FC<SuggestionDropdownProps> = ({ suggestions, addNew, onSelect, enableAddMode,setDropdownStatus }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Close options when clicking outside the component
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownStatus(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <>
      <div className="suggestion__dropdown">
        <div className="suggestion__dropdown__suggestion"  ref={containerRef}>
          {/* list of suggestions */}
          <div className="suggestion__dropdown__suggestion__list">
            {suggestions.length > 0 &&
              suggestions.map((suggestion, index) => {
                return (
                  <div key={index} className="suggestion__dropdown__suggestion__group">
                    <div className="suggestion-item">
                      <SuggestionItem suggestion={suggestion} onSelect={onSelect} />
                    </div>
                  </div>
                );
              })}

            {/* when no suggestion available */}
            {suggestions.length === 0 && (
              <div className="suggestion__dropdown__suggestion__group__not-found">
                <div className="suggestion__dropdown__suggestion__group__not-found__txt">No suggestions found</div>
              </div>
            )}
          </div>

          {/* add new suggestion */}
          {addNew?.enable && (
            <div className="suggestion__add">
              <div>{addNew?.title ?? 'Not able to find yours ?'}</div>
              <div className="suggestion__add__action">
                <button className="suggestion__add__action__btn" onClick={enableAddMode}>
                  <div className="suggestion__add__action__btn__img">
                    <Image loading="lazy" src={addNew?.iconURL ?? '/icons/sign-up/share.svg'} alt="add" width={20} height={20} />
                  </div>
                  <div>{addNew?.actionString ?? 'Add yours'}</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .suggestion__dropdown {
          position: relative;
          width: 100%;
          padding-top: 6px;
        }

        .suggestion__add {
          display: flex;
          border-top: 1px solid #cbd5e1;
          justify-content: space-between;
          padding: 8px;
          color: #0f172a;
          align-items: flex-end;
          padding-bottom: 0px;
        }

        .suggestion__add__action {
          display: flex;
          gap: 4px;
        }

        .suggestion__dropdown__suggestion {
          position: absolute;
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 12px;
          background-color: white;
          z-index: 1;
        }

        .suggestion__dropdown__suggestion__group__title {
          font-size: 13px;
          font-weight: 600;
          line-height: 20px;
          padding: 0px 4px;
          border-radius: 4px;
        }

        ::placeholder {
          color: #aab0b8;
        }

        .suggestion__add__action__btn {
          background: white;
          color: #156ff7;
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          display: flex;
          align-items: flex-end;
          gap: 4px;
          position: relative;
          top: 1px;
        }

        .suggestion__add__action__btn__img {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .suggestion__dropdown__suggestion__group__not-found {
          display: flex;
          padding: 8px;
        }

        .suggestion__dropdown__suggestion__list {
          max-height: 165px;
          overflow-y: scroll;
          scrollbar-width: thin;
        }
      `}</style>
    </>
  );
};

export default SuggestionDropdown;
